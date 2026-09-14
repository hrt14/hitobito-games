const CACHE = "habit-planet-v1";
const CORE = ["/", "/styles.css", "/app-entry.js", "/app-part1.js", "/app-part2.js", "/app-part3.js", "/firebase-client.js", "/firebase-config.js", "/icon.svg", "/manifest.json"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => undefined));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return res;
  }).catch(() => caches.match(event.request).then((r) => r || caches.match("/"))));
});
