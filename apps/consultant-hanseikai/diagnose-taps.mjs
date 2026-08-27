import { chromium } from 'playwright';

const url = process.env.CONSULTANT_HANSEIKAI_URL || 'http://127.0.0.1:4173/apps/consultant-hanseikai/?test=1';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '3分で終わらせる' }).click();
const sizes = await page.evaluate(() => Array.from(document.querySelectorAll('button')).filter((b) => {
  const r = b.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}).map((b) => {
  const r = b.getBoundingClientRect();
  const s = getComputedStyle(b);
  return { text: (b.textContent || '').trim().replace(/\s+/g,' ').slice(0,40), width: r.width, height: r.height, minWidth: s.minWidth, minHeight: s.minHeight, className: b.className };
}));
console.log(JSON.stringify(sizes, null, 2));
await browser.close();
