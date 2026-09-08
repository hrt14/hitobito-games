import * as cloud from "./firebase-client.js";
window.HP_CLOUD = cloud;

// UI modules stay storage-provider agnostic. firebase-client.js now uses
// Firebase Authentication only and talks to the same-origin Cloudflare Worker API
// for D1 state, entitlement, Checkout and Portal access.
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
