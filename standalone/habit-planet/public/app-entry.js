import * as cloud from "./firebase-client.js";
window.HP_CLOUD = cloud;

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
