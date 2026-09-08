const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const crypto = require("node:crypto");

initializeApp();
const db = getFirestore();
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const PRICE_ID = defineString("STRIPE_HABIT_PLANET_PRICE_ID", { default: "price_1UDOG913XnwPDs4e0qYRUIXo" });
const APP_ORIGIN = defineString("HABIT_PLANET_PUBLIC_ORIGIN", { default: "https://habit-planet-5bbc3.web.app" });
const REGION = "asia-northeast1";
const INTEGRATION_IDENTIFIER = "habitplanet_q7m3z8pk";
const MANAGE_EXISTING_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

function json(res, status, body) {
  res.status(status).set("content-type", "application/json; charset=utf-8").send(JSON.stringify(body));
}
function onlyPost(req, res) {
  if (req.method !== "POST") { json(res, 405, { error: "Method not allowed" }); return false; }
  return true;
}
async function requireUser(req) {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Bearer ")) throw Object.assign(new Error("Login required"), { status: 401 });
  return getAuth().verifyIdToken(header.slice(7));
}
async function stripeRequest(path, body, key, method = "POST") {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Stripe request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}
async function stripeGet(path, key) {
  const response = await fetch(`https://api.stripe.com${path}`, { headers: { Authorization: `Bearer ${key}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Stripe request failed");
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
  if (!signature) throw new Error("Missing stripe-signature");
  const fields = String(signature).split(",").map((part) => part.split("=", 2));
  const timestamp = Number(fields.find(([key]) => key === "t")?.[1]);
  const signatures = fields.filter(([key, value]) => key === "v1" && value).map(([, value]) => value);
  if (!timestamp || !signatures.length) throw new Error("Invalid stripe-signature");
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) throw new Error("Stale stripe-signature");
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
  if (!valid) throw new Error("Invalid stripe-signature");
}

exports.checkout = onRequest({ region: REGION, secrets: [STRIPE_SECRET_KEY] }, async (req, res) => {
  if (!onlyPost(req, res)) return;
  try {
    const decoded = await requireUser(req);
    const email = decoded.email;
    if (!email) throw Object.assign(new Error("Google account email is required"), { status: 400 });

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

    const session = await stripeRequest("/v1/checkout/sessions", body, STRIPE_SECRET_KEY.value());
    json(res, 200, { url: session.url });
  } catch (error) {
    console.error("checkout", error);
    json(res, error.status || 500, { error: error.message || "Checkout failed" });
  }
});

exports.portal = onRequest({ region: REGION, secrets: [STRIPE_SECRET_KEY] }, async (req, res) => {
  if (!onlyPost(req, res)) return;
  try {
    const decoded = await requireUser(req);
    const snap = await db.doc(`entitlements/${decoded.uid}`).get();
    const customer = snap.data()?.stripeCustomerId;
    if (!customer) throw Object.assign(new Error("No Stripe customer found"), { status: 404 });
    const session = await stripeRequest("/v1/billing_portal/sessions", {
      customer,
      return_url: APP_ORIGIN.value().replace(/\/$/, "") + "/",
    }, STRIPE_SECRET_KEY.value());
    json(res, 200, { url: session.url });
  } catch (error) {
    console.error("portal", error);
    json(res, error.status || 500, { error: error.message || "Portal failed" });
  }
});

exports.stripeWebhook = onRequest({ region: REGION, secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  if (!onlyPost(req, res)) return;
  try {
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    verifyStripe(raw, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET.value());
    const event = JSON.parse(raw.toString("utf8"));
    if (!event.id) throw new Error("Missing event id");

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

    await marker.set({ processedAt: FieldValue.serverTimestamp(), type: event.type });
    json(res, 200, { received: true });
  } catch (error) {
    console.error("stripeWebhook", error);
    json(res, 400, { error: error.message || "Webhook failed" });
  }
});
