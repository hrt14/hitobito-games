#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import Stripe from "stripe";

const execFileAsync = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = path.resolve(scriptDirectory, "../provisioning.json");
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const confirmed = args.includes("--yes");
const configFlag = args.indexOf("--config");
const configPath = configFlag >= 0 ? path.resolve(args[configFlag + 1]) : defaultConfigPath;
const config = JSON.parse(await readFile(configPath, "utf8"));
const appDirectory = path.resolve(path.dirname(configPath), config.cloudflare.appDirectory || ".");
const wranglerPath = path.resolve(appDirectory, config.cloudflare.wranglerConfig || "wrangler.jsonc");

function required(value, label) {
  if (value === undefined || value === null || value === "") throw new Error(`Missing configuration: ${label}`);
  return value;
}

function validate() {
  if (config.version !== 1) throw new Error("Unsupported provisioning config version");
  for (const [value, label] of [
    [config.app?.key, "app.key"], [config.app?.planKey, "app.planKey"], [config.app?.name, "app.name"],
    [config.app?.publicOrigin, "app.publicOrigin"], [config.cloudflare?.workerName, "cloudflare.workerName"],
    [config.cloudflare?.d1DatabaseName, "cloudflare.d1DatabaseName"], [config.firebase?.projectId, "firebase.projectId"],
    [config.stripe?.productName, "stripe.productName"], [config.stripe?.currency, "stripe.currency"],
    [config.stripe?.unitAmount, "stripe.unitAmount"], [config.stripe?.interval, "stripe.interval"],
    [config.stripe?.integrationIdentifier, "stripe.integrationIdentifier"], [config.stripe?.webhookUrl, "stripe.webhookUrl"],
  ]) required(value, label);
  if (!/^https:\/\//.test(config.app.publicOrigin)) throw new Error("app.publicOrigin must use HTTPS");
  if (!Number.isInteger(config.stripe.unitAmount) || config.stripe.unitAmount < 1) throw new Error("stripe.unitAmount must be a positive integer");
  if (!Array.isArray(config.firebase.authorizedDomains) || !config.firebase.authorizedDomains.length) throw new Error("firebase.authorizedDomains is required");
  if (!Array.isArray(config.stripe.webhookEvents) || !config.stripe.webhookEvents.length) throw new Error("stripe.webhookEvents is required");
  if (!/_[a-z]{8}$/.test(config.stripe.integrationIdentifier)) throw new Error("stripe.integrationIdentifier must end in an 8-letter random suffix");
  for (const key of Object.keys(config)) {
    if (/secret|token|password/i.test(key)) throw new Error(`Secrets must not be stored in config (${key})`);
  }
}

function logPlan() {
  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    app: config.app,
    operations: {
      stripe: "verify or create Product, recurring Price, dedicated Customer Portal configuration, and webhook",
      cloudflare: "verify/create D1, apply migrations, set runtime Stripe secrets, and deploy Worker",
      firebase: `add authorized domains: ${config.firebase.authorizedDomains.join(", ")}`,
      vercel: config.vercel?.enabled ? "verify/create proxy project, deploy rewrite, and attach custom domain" : "disabled",
    },
  }, null, 2));
}

function requireApplyConfirmation() {
  if (apply && !confirmed) throw new Error("--apply changes production resources; add --yes after reviewing the dry-run plan");
}

function assertStripeMode(key) {
  const live = key.startsWith("sk_live_");
  const test = key.startsWith("sk_test_");
  if (!live && !test) throw new Error("STRIPE_ADMIN_SECRET_KEY must be a standard Stripe secret key");
  if (Boolean(config.stripe.livemode) !== live) throw new Error("Stripe key mode does not match stripe.livemode");
}

async function provisionStripe() {
  const adminKey = required(process.env.STRIPE_ADMIN_SECRET_KEY, "environment STRIPE_ADMIN_SECRET_KEY");
  assertStripeMode(adminKey);
  const stripe = new Stripe(adminKey, { apiVersion: "2026-07-29.dahlia", maxNetworkRetries: 2 });

  let product = config.stripe.productId ? await stripe.products.retrieve(config.stripe.productId) : null;
  if (!product || product.deleted) {
    const products = await stripe.products.list({ active: true, limit: 100 });
    product = products.data.find((candidate) => candidate.metadata?.app_key === config.app.key) || null;
  }
  if (!product) {
    product = await stripe.products.create({
      name: config.stripe.productName,
      default_tax_code: config.stripe.taxCode || undefined,
      metadata: { app_key: config.app.key },
    }, { idempotencyKey: `paid-app:${config.app.key}:product:v1` });
  }

  let price = config.stripe.priceId ? await stripe.prices.retrieve(config.stripe.priceId) : null;
  if (!price) {
    const prices = await stripe.prices.list({ product: product.id, active: true, type: "recurring", limit: 100 });
    price = prices.data.find((candidate) =>
      candidate.currency === config.stripe.currency &&
      candidate.unit_amount === config.stripe.unitAmount &&
      candidate.recurring?.interval === config.stripe.interval &&
      candidate.tax_behavior === config.stripe.taxBehavior
    ) || null;
  }
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: config.stripe.currency,
      unit_amount: config.stripe.unitAmount,
      recurring: { interval: config.stripe.interval },
      tax_behavior: config.stripe.taxBehavior,
      lookup_key: `${config.app.key}_${config.app.planKey}_${config.stripe.currency}_${config.stripe.unitAmount}`,
      metadata: { app_key: config.app.key, plan_key: config.app.planKey },
    }, { idempotencyKey: `paid-app:${config.app.key}:price:v1` });
  }
  if (price.product !== product.id) throw new Error("Configured Stripe Price belongs to another Product");
  if (Boolean(price.livemode) !== Boolean(config.stripe.livemode)) throw new Error("Configured Stripe Price is in the wrong mode");

  const portalParams = {
    active: true,
    name: config.app.name,
    metadata: { app_key: config.app.key },
    default_return_url: `${config.app.publicOrigin}/`,
    business_profile: {
      headline: `${config.app.name}のサブスクリプション管理`,
      privacy_policy_url: config.stripe.privacyPolicyUrl,
      terms_of_service_url: config.stripe.termsOfServiceUrl,
    },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: config.stripe.cancelMode || "at_period_end" },
      subscription_update: { enabled: false },
    },
    login_page: { enabled: false },
  };
  let portalId = config.stripe.portalConfigurationId;
  if (!portalId) {
    const portals = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
    portalId = portals.data.find((candidate) => candidate.metadata?.app_key === config.app.key)?.id || "";
  }
  const portal = portalId
    ? await stripe.billingPortal.configurations.update(portalId, portalParams)
    : await stripe.billingPortal.configurations.create(portalParams);

  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  let endpoint = endpoints.data.find((candidate) => candidate.url === config.stripe.webhookUrl) || null;
  let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (endpoint) {
    endpoint = await stripe.webhookEndpoints.update(endpoint.id, {
      enabled_events: config.stripe.webhookEvents,
      description: `${config.app.name} entitlement sync`,
    });
  } else {
    endpoint = await stripe.webhookEndpoints.create({
      url: config.stripe.webhookUrl,
      enabled_events: config.stripe.webhookEvents,
      description: `${config.app.name} entitlement sync`,
    });
    webhookSecret = endpoint.secret || "";
  }
  if (!webhookSecret.startsWith("whsec_")) throw new Error("Set STRIPE_WEBHOOK_SECRET for an existing webhook; Stripe reveals it only when created");

  config.stripe.productId = product.id;
  config.stripe.priceId = price.id;
  config.stripe.portalConfigurationId = portal.id;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  console.log(`Stripe ready: product=${product.id} price=${price.id} portal=${portal.id} webhook=${endpoint.id}`);
  return { priceId: price.id, portalId: portal.id, webhookSecret };
}

function replaceWranglerValue(source, name, value) {
  const expression = new RegExp(`(\\"${name}\\"\\s*:\\s*)\\"[^\\"]*\\"`);
  if (!expression.test(source)) throw new Error(`wrangler config is missing ${name}`);
  return source.replace(expression, `$1${JSON.stringify(String(value))}`);
}

async function runWrangler(arguments_, input) {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  return execFileAsync(command, ["wrangler", ...arguments_], {
    cwd: appDirectory,
    input,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function provisionCloudflare(stripeState) {
  let wrangler = await readFile(wranglerPath, "utf8");
  wrangler = replaceWranglerValue(wrangler, "PRODUCT_KEY", config.app.key);
  wrangler = replaceWranglerValue(wrangler, "PLAN_KEY", config.app.planKey);
  wrangler = replaceWranglerValue(wrangler, "FIREBASE_PROJECT_ID", config.firebase.projectId);
  wrangler = replaceWranglerValue(wrangler, "STRIPE_PRICE_ID", stripeState.priceId);
  wrangler = replaceWranglerValue(wrangler, "STRIPE_LIVEMODE", String(Boolean(config.stripe.livemode)));
  wrangler = replaceWranglerValue(wrangler, "STRIPE_PORTAL_CONFIGURATION_ID", stripeState.portalId);
  wrangler = replaceWranglerValue(wrangler, "STRIPE_INTEGRATION_IDENTIFIER", config.stripe.integrationIdentifier);
  wrangler = replaceWranglerValue(wrangler, "PUBLIC_ORIGIN", config.app.publicOrigin);
  await writeFile(wranglerPath, wrangler);

  if (/"database_id"\s*:\s*"0{8}-0{4}-0{4}-0{4}-0{12}"/.test(wrangler)) {
    const created = await runWrangler(["d1", "create", config.cloudflare.d1DatabaseName]);
    const databaseId = `${created.stdout || ""}\n${created.stderr || ""}`.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
    if (!databaseId) throw new Error("D1 was created but its database ID could not be parsed");
    wrangler = wrangler.replace(/("database_id"\s*:\s*)"0{8}-0{4}-0{4}-0{4}-0{12}"/, `$1"${databaseId}"`);
    await writeFile(wranglerPath, wrangler);
  }

  const runtimeKey = required(process.env.STRIPE_RUNTIME_SECRET_KEY, "environment STRIPE_RUNTIME_SECRET_KEY");
  assertStripeMode(runtimeKey.replace(/^rk_/, "sk_"));
  await runWrangler(["secret", "put", "STRIPE_SECRET_KEY", "--config", wranglerPath], `${runtimeKey}\n`);
  await runWrangler(["secret", "put", "STRIPE_WEBHOOK_SECRET", "--config", wranglerPath], `${stripeState.webhookSecret}\n`);
  await runWrangler(["d1", "migrations", "apply", config.cloudflare.d1DatabaseName, "--remote", "--config", wranglerPath]);
  await runWrangler(["deploy", "--config", wranglerPath]);
  console.log(`Cloudflare ready: worker=${config.cloudflare.workerName} D1=${config.cloudflare.d1DatabaseName}`);
}

async function provisionFirebase() {
  const token = required(process.env.GOOGLE_OAUTH_ACCESS_TOKEN, "environment GOOGLE_OAUTH_ACCESS_TOKEN");
  const endpoint = `https://identitytoolkit.googleapis.com/admin/v2/projects/${encodeURIComponent(config.firebase.projectId)}/config`;
  const currentResponse = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` } });
  if (!currentResponse.ok) throw new Error(`Firebase config read failed: ${currentResponse.status} ${await currentResponse.text()}`);
  const current = await currentResponse.json();
  const authorizedDomains = [...new Set([...(current.authorizedDomains || []), ...config.firebase.authorizedDomains])].sort();
  const updateResponse = await fetch(`${endpoint}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ authorizedDomains }),
  });
  if (!updateResponse.ok) throw new Error(`Firebase config update failed: ${updateResponse.status} ${await updateResponse.text()}`);
  console.log(`Firebase ready: ${config.firebase.projectId} authorizedDomains=${authorizedDomains.join(",")}`);
}

async function vercelRequest(pathname, options = {}) {
  const token = required(process.env.VERCEL_TOKEN, "environment VERCEL_TOKEN");
  const separator = pathname.includes("?") ? "&" : "?";
  const response = await fetch(`https://api.vercel.com${pathname}${separator}teamId=${encodeURIComponent(config.vercel.teamId)}`, {
    ...options,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`Vercel API failed: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

async function provisionVercel() {
  if (!config.vercel?.enabled) return;
  let project;
  try {
    project = await vercelRequest(`/v9/projects/${encodeURIComponent(config.vercel.projectName)}`);
  } catch (cause) {
    if (!String(cause.message).includes("404")) throw cause;
    project = await vercelRequest("/v10/projects", { method: "POST", body: JSON.stringify({ name: config.vercel.projectName, framework: null }) });
  }
  const vercelConfig = JSON.stringify({
    $schema: "https://openapi.vercel.sh/vercel.json",
    routes: [{ src: "/(.*)", dest: `${config.vercel.workerOrigin}/$1` }],
  }, null, 2);
  const deployment = await vercelRequest("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: config.vercel.projectName,
      project: project.id,
      target: "production",
      files: [{ file: "vercel.json", data: vercelConfig }],
      projectSettings: { framework: null },
    }),
  });
  try {
    await vercelRequest(`/v10/projects/${encodeURIComponent(project.id)}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: config.vercel.customDomain }),
    });
  } catch (cause) {
    if (!/409|already/i.test(String(cause.message))) throw cause;
  }
  console.log(`Vercel ready: project=${project.id} deployment=${deployment.id} domain=${config.vercel.customDomain}`);
}

validate();
logPlan();
requireApplyConfirmation();
if (!apply) process.exit(0);

const stripeState = await provisionStripe();
await provisionCloudflare(stripeState);
await provisionFirebase();
await provisionVercel();
console.log("Paid app provisioning completed.");
