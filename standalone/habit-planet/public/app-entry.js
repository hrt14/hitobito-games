import * as cloud from "./firebase-client.js";
window.HP_CLOUD = cloud;
for (const src of ["/app-part1.js", "/app-part2.js", "/app-part3.js"]) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
