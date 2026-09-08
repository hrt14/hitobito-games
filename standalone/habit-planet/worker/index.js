import { decodeProtectedHeader, importX509, jwtVerify } from "jose";

const FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const MAX_STATE_BYTES = 1024 * 1024;
const STRIPE_TOLERANCE_SECONDS = 300;
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

const encoder = new TextEncoder();

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function error(status, message, code) {
  return Object.assign(new Error(message), { status, code });
}

function onlyMethod(request, method) {
  if (request.method !== method) throw error(405, "Method not allowed");
}

function bearerToken(request) {
  const value = request.headers.get("authorization") || "";
  if (!value.startsWith("Bearer ")) throw error(401, "Login required");
  return value.slice(7).trim();
}

function assertBodySize(request, maxBytes) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > maxBytes) throw error(413, "Request too large");
}

async function getFirebaseCerts(ctx, forceRefresh = false) {
  const cache = caches.default;
  const cacheKey = new Request(FIREBASE_CERTS_URL, { method: "GET" });
  if (forceRefresh) await cache.delete(cacheKey);
  let response = await cache.match(cacheKey);
  if (!response) {
    response = await fetch(FIREBASE_CERTS_URL, { headers: { accept: "application/json" } });
    if (!response.ok) throw error(503, "Firebase public keys unavailable");
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }
  return response.json();
}

async function verifyFirebaseIdToken(request, env, ctx) {
  const token = bearerToken(request);
  const projectId = String(env.FIREBASE_PROJECT_ID || "").trim();
  if (!projectId) throw error(500, "Firebase project is not configured");

  let protectedHeader;
  try {
    protectedHeader = decodeProtectedHeader(token);
  } catch {
    throw error(401, "Invalid login token");
  }
  if (protectedHeader.alg !== "RS256" || !protectedHeader.kid) throw error(401, "Invalid login token");

  let certs = await getFirebaseCerts(ctx, false);
  let certificate = certs?.[protectedHeader.kid];
  if (!certificate) {
    certs = await getFirebaseCerts(ctx, true);
    certificate = certs?.[protectedHeader.kid];
  }
  if (!certificate) throw error(401, "Unknown Firebase signing key");

  try {
    const key = await importX509(certificate, "RS256");
    const { payload, protectedHeader: verifiedHeader } = await jwtVerify(token, key, {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const now = Math.floor(Date.now() / 1000);
    if (verifiedHeader.alg !== "RS256" || verifiedHeader.kid !== protectedHeader.kid) throw new Error("header mismatch");
    if (!Number.isFinite(payload.exp) || payload.exp <= now) throw new Error("expired");
    if (!Number.isFinite(payload.iat) || payload.iat > now) throw new Error("iat in future");
    if (!Number.isFinite(payload.auth_time) || payload.auth_time > now) throw new Error("auth_time in future");
    if (payload.aud !== projectId) throw new Error("bad audience");
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("bad issuer");
    if (typeof payload.sub !== "string" || payload.sub.length < 1 || payload.sub.length > 128) throw new Error("bad subject");

    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      emailVerified: payload.email_verified === true,
      payload,
    };
  } catch {
    throw error(401, "Invalid login token");
  }
}

async function readState(request, env, ctx) {
  onlyMethod(request, "GET");
  const user = await verifyFirebaseIdToken(request, env, ctx);
  const row = await env.DB.prepare("SELECT state_json, updated_at FROM user_states WHERE uid = ?1").bind(user.uid).first();
  return json({ state: row ? JSON.parse(row.state_json) : null, updatedAt: row?.updated_at ?? null });
}

async function writeState(request, env, ctx) {
  onlyMethod(request, "PUT");
  assertBodySize(request, MAX_STATE_BYTES + 4096);
  const user = await verifyFirebaseIdToken(request, env, ctx);
  const raw = await request.text();
  if (encoder.encode(raw).byteLength > MAX_STATE_BYTES + 4096) throw error(413, "Request too large");
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    throw error(400, "Invalid JSON");
  }
  if (!body || typeof body.state !== "object" || Array.isArray(body.state)) throw error(400, "Invalid state");
  const stateJson = JSON.stringify(body.state);
  if (encoder.encode(stateJson).byteLength > MAX_STATE_BYTES) throw error(413, "State is too large");
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(`
    INSERT INTO user_states (uid, state_json, updated_at)
    VALUES (?1, ?2, ?3)
    ON CONFLICT(uid) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at
  `).bind(user.uid, stateJson, now).run();
  return json({ ok: true, updatedAt: now });
}

async function readEntitlement(request, env, ctx) {
  onlyMethod(request, "GET");
  const user = await verifyFirebaseIdToken(request, env, ctx);
  const row = await env.DB.prepare(`
    SELECT status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, updated_at
    FROM entitlements WHERE uid = ?1
  `).bind(user.uid).first();
  if (!row) return json({ entitlement: null });
  return json({
    entitlement: {
      product: "habit_planet",
      plan: "pro_monthly",
      status: row.status,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      currentPeriodEnd: row.current_period_end,
      cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
      updatedAt: row.updated_at,
    },
  });
}

async function stripeRequest(env, path, params = {}, { method = "POST", idempotencyKey = "" } = {}) {
  const headers = { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };
  let body;
  if (method !== "GET") {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(params).toString();
  }
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(`https://api.stripe.com${path}`, { method, headers, body });
  const data = await response.json();
  if (!response.ok) throw error(response.status >= 500 ? 502 : response.status, data?.error?.message || "Stripe request failed");
  return data;
}

async function checkout(request, env, ctx) {
  onlyMethod(request, "POST");
  assertBodySize(request, 32 * 1024);
  const user = await verifyFirebaseIdToken(request, env, ctx);
  if (!user.email) throw error(400, "Google account email is required");

  const current = await env.DB.prepare("SELECT status, stripe_customer_id FROM entitlements WHERE uid = ?1").bind(user.uid).first();
  if (current?.stripe_customer_id && ACTIVE_SUBSCRIPTION_STATUSES.has(String(current.status || ""))) {
    return json({ error: "既存のサブスクリプションがあります。管理画面から状態を確認してください。", code: "existing_subscription" }, 409);
  }

  const origin = String(env.PUBLIC_ORIGIN || new URL(request.url).origin).replace(/\/$/, "");
  const params = {
    mode: "subscription",
    "line_items[0][price]": env.STRIPE_PRICE_ID,
    "line_items[0][quantity]": "1",
    client_reference_id: user.uid,
    success_url: `${origin}/?pro=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?pro=cancel`,
    "metadata[firebase_uid]": user.uid,
    "metadata[product_key]": "habit_planet",
    "subscription_data[metadata][firebase_uid]": user.uid,
    "subscription_data[metadata][product_key]": "habit_planet",
  };
  if (current?.stripe_customer_id) params.customer = current.stripe_customer_id;
  else params.customer_email = user.email;

  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  const session = await stripeRequest(env, "/v1/checkout/sessions", params, {
    idempotencyKey: `habit-planet-checkout:${user.uid}:${bucket}`,
  });
  return json({ url: session.url });
}

async function portal(request, env, ctx) {
  onlyMethod(request, "POST");
  assertBodySize(request, 32 * 1024);
  const user = await verifyFirebaseIdToken(request, env, ctx);
  const current = await env.DB.prepare("SELECT stripe_customer_id FROM entitlements WHERE uid = ?1").bind(user.uid).first();
  if (!current?.stripe_customer_id) throw error(404, "No Stripe customer found");
  const origin = String(env.PUBLIC_ORIGIN || new URL(request.url).origin).replace(/\/$/, "");
  const session = await stripeRequest(env, "/v1/billing_portal/sessions", {
    customer: current.stripe_customer_id,
    return_url: `${origin}/`,
  });
  return json({ url: session.url });
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function constantTimeHexEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) throw error(400, "Missing stripe-signature");
  const pieces = signatureHeader.split(",").map((part) => part.split("=", 2));
  const timestamp = Number(pieces.find(([name]) => name === "t")?.[1]);
  const signatures = pieces.filter(([name, value]) => name === "v1" && value).map(([, value]) => value);
  if (!timestamp || !signatures.length) throw error(400, "Invalid stripe-signature");
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > STRIPE_TOLERANCE_SECONDS) throw error(400, "Stale stripe-signature");

  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${rawBody}`));
  const expected = hex(digest);
  if (!signatures.some((candidate) => constantTimeHexEqual(candidate, expected))) throw error(400, "Invalid stripe-signature");
}

function subscriptionPeriodEnd(subscription) {
  const values = (subscription?.items?.data || []).map((item) => Number(item.current_period_end || 0)).filter(Boolean);
  return values.length ? Math.max(...values) : null;
}

async function upsertEntitlement(env, subscription) {
  const uid = String(subscription?.metadata?.firebase_uid || subscription?.metadata?.uid || "");
  if (!uid) return;
  const customer = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null;
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(`
    INSERT INTO entitlements (
      uid, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, updated_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    ON CONFLICT(uid) DO UPDATE SET
      status = excluded.status,
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end,
      updated_at = excluded.updated_at
  `).bind(
    uid,
    String(subscription.status || "inactive"),
    customer,
    subscription.id || null,
    subscriptionPeriodEnd(subscription),
    subscription.cancel_at_period_end ? 1 : 0,
    now,
  ).run();
}

async function stripeWebhook(request, env) {
  onlyMethod(request, "POST");
  assertBodySize(request, 1024 * 1024);
  const raw = await request.text();
  if (encoder.encode(raw).byteLength > 1024 * 1024) throw error(413, "Request too large");
  await verifyStripeSignature(raw, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    throw error(400, "Invalid JSON");
  }
  if (!event?.id) throw error(400, "Missing event id");
  const seen = await env.DB.prepare("SELECT event_id FROM stripe_events WHERE event_id = ?1").bind(event.id).first();
  if (seen) return json({ received: true, duplicate: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object || {};
    if (session.subscription) {
      const subscription = await stripeRequest(env, `/v1/subscriptions/${encodeURIComponent(session.subscription)}?expand[]=items.data`, {}, { method: "GET" });
      if (!subscription.metadata?.firebase_uid && session.client_reference_id) {
        subscription.metadata = { ...(subscription.metadata || {}), firebase_uid: session.client_reference_id };
      }
      await upsertEntitlement(env, subscription);
    }
  } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    await upsertEntitlement(env, event.data?.object || {});
  }

  await env.DB.prepare("INSERT INTO stripe_events (event_id, event_type, processed_at) VALUES (?1, ?2, ?3)")
    .bind(event.id, String(event.type || "unknown"), Math.floor(Date.now() / 1000)).run();
  return json({ received: true });
}

async function routeApi(request, env, ctx) {
  const path = new URL(request.url).pathname;
  if (path === "/api/state") return request.method === "GET" ? readState(request, env, ctx) : writeState(request, env, ctx);
  if (path === "/api/entitlement") return readEntitlement(request, env, ctx);
  if (path === "/api/checkout") return checkout(request, env, ctx);
  if (path === "/api/portal") return portal(request, env, ctx);
  if (path === "/api/stripe-webhook") return stripeWebhook(request, env);
  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const response = url.pathname.startsWith("/api/")
        ? await routeApi(request, env, ctx)
        : await env.ASSETS.fetch(request);
      return withSecurityHeaders(response);
    } catch (cause) {
      console.error("Habit Planet Worker", cause?.message || cause);
      return withSecurityHeaders(json({ error: cause?.message || "Internal error", code: cause?.code }, cause?.status || 500));
    }
  },
};
