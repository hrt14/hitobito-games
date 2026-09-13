import * as cloud from "./firebase-client.js";
window.HP_CLOUD = cloud;

// The existing UI uses fetch() directly for the two user-initiated billing APIs.
// When App Check is configured, attach its token automatically without changing
// the large generated UI modules. Stripe's webhook endpoint is intentionally excluded.
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  try {
    const url = new URL(typeof input === "string" ? input : input?.url || "", location.href);
    if (url.origin === location.origin && ["/api/checkout", "/api/portal"].includes(url.pathname)) {
      const appCheck = await cloud.appCheckToken();
      if (appCheck) {
        const headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined));
        headers.set("X-Firebase-AppCheck", appCheck);
        init = { ...init, headers };
      }
    }
  } catch (error) {
    console.warn("App Check header setup failed", error);
  }
  return nativeFetch(input, init);
};

for (const src of [
  "/app-part1.js",
  "/app-part2.js",
  "/app-part3.js",
  "/app-part4.js",
  "/app-part5.js",
]) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}
