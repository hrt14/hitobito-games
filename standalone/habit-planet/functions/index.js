const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret, defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getAppCheck } = require("firebase-admin/app-check");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("node:crypto");

const REGION = "asia-northeast1";
const FIREBASE_WEB_APP_ID = "1:1087394687147:web:241410fa3271322f052fee";
const INTEGRATION_IDENTIFIER = "habitplanet_q7m3z8pk";
const MANAGE_EXISTING_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

// Cost guardrails. Keep idle instances at zero and cap horizontal scale so an abuse spike
// cannot fan out into a large number of billable containers before the Cloud Billing
// Spend Cap reacts. gcf_gen1 restores the lower fractional CPU allocation for 256 MiB.
setGlobalOptions({
  region: REGION,
  minInstances: 0,
  maxInstances: 2,
  memory: "256MiB",
  cpu: "gcf_gen1",
  concurrency: 1,
  timeoutSeconds: 30,
});

initializeApp();
const db = getFirestore();
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const PRICE_ID = defineString("STRIPE_HABIT_PLANET_PRICE_ID", { default: "price_1UDOG913XnwPDs4e0qYRUIXo" });
const APP_ORIGIN = defineString("HABIT_PLANET_PUBLIC_ORIGIN", { default: "https://habit-planet-5bbc3.web.app" });
// Turn this on only after the Web app has been registered with Firebase App Check
// and the client site key has been configured. Keeping it parameterized avoids a lockout
// during the first deployment while still making enforcement a one-line deploy setting.
const REQUIRE_APP_CHECK = defineString("HABIT_PLANET_REQUIRE_APP_CHECK", { default: "false" });

const rateBuckets = new Map();

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
function json(res, status, body) {
  res.status(status)
    .set("content-type", "application/json; charset=utf-8")
    .set("cache-control", "no-store")
    .send(JSON.stringify(body));
}
function onlyPost(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return false;
  }
  return true;
}
function enforceRequestSize(req, maxBytes) {
  const declared = Number(req.headers["content-length"] || 0);
  const actual = Buffer.isBuffer(req.rawBody) ? req.rawBody.length : 0;
  if ((Number.isFinite(declared) && declared > maxBytes) || actual > maxBytes) {
    throw httpError(413, "Request too large");
  }
}
function rateLimit(scope, key, limit, windowMs) {
  const now = Date.now();
  if (rateBuckets.size > 1000) {
    for (const [bucketKey, value] of rateBuckets) {
      if (value.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
  const bucketKey = `${scope}:${key}`;
  let bucket = rateBuckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
  if (bucket.count >= limit) throw httpError(429, "Too many requests. Please try again later.");
  bucket.count += 1;
  rateBuckets.set(bucketKey, bucket);
}
async function requireUser(req) {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Bearer ")) throw httpError(401, "Login required");
  try {
    return await getAuth().verifyIdToken(header.slice(7));
  } catch {
    throw httpError(401, "Invalid login token");
  }
}
async function requireAppCheckIfEnabled(req) {
  if (REQUIRE_APP_CHECK.value().toLowerCase() !== "true") return;
  const token = String(req.headers["x-firebase-appcheck"] || "");
  if (!token) throw httpError(401, "App Check required");
  try {
    const claims = await getAppCheck().verifyToken(token);
    if (claims.app_id && claims.app_id !== FIREBASE_WEB_APP_ID) throw new Error("Wrong app id");
  } catch {
    throw httpError(401, "Invalid App Check token");
  }
}
async function stripeRequest(path, body, key, method = "POST", extraHeaders = {}) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...extraHeaders,
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw httpError(response.status, data?.error?.message || "Stripe request failed");
  return data;
}
async function stripeGet(path, key) {
  const response = await fetch(`https://api.stripe.com${path}`, { headers: { Authorization: `Bearer ${key}` } });
  const data = await response.json();
  if (!response.ok) throw httpError(response.status, data?.error?.message || "Stripe request failed");
  return data;
}
function periodEnd(subscription) {
  const values = (subscription?.items?.data || []).map((item) => Number(item.current_period_end || 0)).filter(Boolean);
  return values.length ? Math.max(...values) : null;
}
async function upsertEntitlement(subscription) {
  const uid = String(subscription?.metadata?.firebase_uid || subscription?.metadata?.uid || "");
  if (!uid) return;
  const customer = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null;
  await db.doc(`entitlements/${uid}`).set({
    product: "habit_planet",
    plan: "pro_monthly",
    status: String(subscription.status || "inactive"),
    stripeCustomerId: customer,
    stripeSubscriptionId: subscription.id || null,
    currentPeriodEnd: periodEnd(subscription),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}
function verifyStripe(rawBody, signature, secret) {
  if (!signature) throw httpError(400, "Missing stripe-signature");
  const fields = String(signature).split(",").map((part) => part.split("=", 2));
  const timestamp = Number(fields.find(([key]) => key === "t")?.[1]);
  const signatures = fields.filter(([key, value]) => key === "v1" && value).map(([, value]) => value);
  if (!timestamp || !signatures.length) throw httpError(400, "Invalid stripe-signature");
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) throw httpError(400, "Stale stripe-signature");
  const digest = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex");
  const expected = Buffer.from(digest, "hex");
  const valid = signatures.some((candidate) => {
    try {
      const provided = Buffer.from(candidate, "hex");
      return provided.length === expected.length && crypto.timingSafeEqual(expected, provided);
    } catch {
      return false;
    }
  });
  if (!valid) throw httpError(400, "Invalid stripe-signature");
}

exports.checkout = onRequest({ secrets: [STRIPE_SECRET_KEY] }, async (req, res) => {
  if (!onlyPost(req, res)) return;
  try {
    enforceRequestSize(req, 32 * 1024);
    await requireAppCheckIfEnabled(req);
    const decoded = await requireUser(req);
    rateLimit("checkout", decoded.uid, 5, 10 * 60 * 1000);
    const email = decoded.email;
    if (!email) throw httpError(400, "Google account email is required");

    const entitlementSnap = await db.doc(`entitlements/${decoded.uid}`).get();
    const existing = entitlementSnap.exists ? entitlementSnap.data() || {} : {};
    const existingStatus = String(existing.status || "");
    if (existing.stripeCustomerId && MANAGE_EXISTING_STATUSES.has(existingStatus)) {
      json(res, 409, {
        error: "既存のサブスクリプションがあります。管理画面から状態を確認してください。",
        code: "existing_subscription",
      });
      return;
    }

    const origin = APP_ORIGIN.value().replace(/\/$/, "");
    const body = {
      mode: "subscription",
      "line_items[0][price]": PRICE_ID.value(),
      "line_items[0][quantity]": "1",
      client_reference_id: decoded.uid,
      success_url: `${origin}/?pro=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?pro=cancel`,
      "metadata[firebase_uid]": decoded.uid,
      "metadata[product_key]": "habit_planet",
      "subscription_data[metadata][firebase_uid]": decoded.uid,
      "subscription_data[metadata][product_key]": "habit_planet",
      integration_identifier: INTEGRATION_IDENTIFIER,
    };
    if (existing.stripeCustomerId) body.customer = existing.stripeCustomerId;
    else body.customer_email = email;

    // Repeated clicks/retries from the same user during the same 10-minute window
    // resolve to the same Checkout Session instead of creating parallel subscriptions.
    const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
    const idempotencyKey = `habitplanet-checkout-${decoded.uid}-${bucket}`;
    const session = await stripeRequest(
      "/v1/checkout/sessions",
      body,
      STRIPE_SECRET_KEY.value(),
      "POST",
      { "Idempotency-Key": idempotencyKey },
    );
    json(res, 200, { url: session.url });
  } catch (error) {
    console.error("checkout", error?.message || error);
    json(res, error.status || 500, { error: error.message || "Checkout failed" });
  }
});

exports.portal = onRequest({ secrets: [STRIPE_SECRET_KEY] }, async (req, res) => {
  if (!onlyPost(req, res)) return;
  try {
    enforceRequestSize(req, 32 * 1024);
    await requireAppCheckIfEnabled(req);
    const decoded = await requireUser(req);
    rateLimit("portal", decoded.uid, 10, 10 * 60 * 1000);
    const snap = await db.doc(`entitlements/${decoded.uid}`).get();
    const customer = snap.data()?.stripeCustomerId;
    if (!customer) throw httpError(404, "No Stripe customer found");
    const session = await stripeRequest("/v1/billing_portal/sessions", {
      customer,
      return_url: APP_ORIGIN.value().replace(/\/$/, "") + "/",
    }, STRIPE_SECRET_KEY.value());
    json(res, 200, { url: session.url });
  } catch (error) {
    console.error("portal", error?.message || error);
    json(res, error.status || 500, { error: error.message || "Portal failed" });
  }
});

exports.stripeWebhook = onRequest({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  if (!onlyPost(req, res)) return;
  try {
    enforceRequestSize(req, 1024 * 1024);
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    verifyStripe(raw, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET.value());
    const event = JSON.parse(raw.toString("utf8"));
    if (!event.id) throw httpError(400, "Missing event id");

    const marker = db.doc(`stripeEvents/${event.id}`);
    if ((await marker.get()).exists) {
      json(res, 200, { received: true, duplicate: true });
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object || {};
      if (session.subscription) {
        const subscription = await stripeGet(`/v1/subscriptions/${encodeURIComponent(session.subscription)}?expand[]=items.data`, STRIPE_SECRET_KEY.value());
        if (!subscription.metadata?.firebase_uid && session.client_reference_id) {
          subscription.metadata = { ...(subscription.metadata || {}), firebase_uid: session.client_reference_id };
        }
        await upsertEntitlement(subscription);
      }
    } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await upsertEntitlement(event.data?.object || {});
    }

    // Mark processed only after all side effects succeed so Stripe retries can recover
    // from transient Stripe/Firestore failures instead of being incorrectly suppressed.
    await marker.set({ processedAt: FieldValue.serverTimestamp(), type: event.type });
    json(res, 200, { received: true });
  } catch (error) {
    console.error("stripeWebhook", error?.message || error);
    json(res, error.status || 500, { error: error.message || "Webhook failed" });
  }
});
