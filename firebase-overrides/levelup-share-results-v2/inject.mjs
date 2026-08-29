import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const appsDir = path.join(outDir, 'apps');
const assetsDir = path.join(outDir, 'assets');
const imagePath = path.join(assetsDir, 'levelup-share.png');
const imageUrl = 'https://levelup.hitobito.jp/assets/levelup-share.png';
const marker = 'data-levelup-share-result-v2';

if (!fs.existsSync(homePath) || !fs.existsSync(appsDir)) {
  throw new Error('LEVEL UP Firebase bundle not found. Run this after the main LEVEL UP build.');
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

const glyphs = {
  A:['01110','10001','10001','11111','10001','10001','10001'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','10101','01010'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
};

function createShareImage() {
  const width = 1200;
  const height = 630;
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  const bg = [11, 14, 9];
  const lime = [216, 255, 91];
  const cream = [246, 242, 232];
  const muted = [126, 135, 116];

  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = y * stride + 1 + x * 3;
      raw[offset] = bg[0];
      raw[offset + 1] = bg[1];
      raw[offset + 2] = bg[2];
    }
  }

  const fillRect = (x, y, w, h, color) => {
    const left = Math.max(0, Math.floor(x));
    const top = Math.max(0, Math.floor(y));
    const right = Math.min(width, Math.ceil(x + w));
    const bottom = Math.min(height, Math.ceil(y + h));
    for (let yy = top; yy < bottom; yy += 1) {
      for (let xx = left; xx < right; xx += 1) {
        const offset = yy * stride + 1 + xx * 3;
        raw[offset] = color[0];
        raw[offset + 1] = color[1];
        raw[offset + 2] = color[2];
      }
    }
  };

  const drawText = (text, x, y, scale, color) => {
    let cursor = x;
    for (const char of text) {
      if (char === ' ') {
        cursor += scale * 4;
        continue;
      }
      const glyph = glyphs[char];
      if (!glyph) {
        cursor += scale * 6;
        continue;
      }
      for (let row = 0; row < glyph.length; row += 1) {
        for (let col = 0; col < glyph[row].length; col += 1) {
          if (glyph[row][col] === '1') fillRect(cursor + col * scale, y + row * scale, scale, scale, color);
        }
      }
      cursor += scale * 6;
    }
  };

  fillRect(0, 0, width, 18, lime);
  fillRect(84, 86, 22, 458, lime);
  fillRect(1040, 86, 76, 76, lime);
  fillRect(960, 166, 156, 76, lime);
  fillRect(880, 246, 236, 76, lime);
  fillRect(800, 326, 316, 76, lime);
  fillRect(720, 406, 396, 76, lime);
  fillRect(640, 486, 476, 58, lime);

  drawText('LEVEL UP', 154, 176, 18, cream);
  drawText('PLAY THINK SWITCH', 158, 364, 8, muted);
  fillRect(158, 498, 320, 10, lime);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.mkdirSync(assetsDir, { recursive: true });
  fs.writeFileSync(imagePath, png);
}

function addSocialPreview(html, title) {
  const safeTitle = String(title || 'LEVEL UP').replace(/["<>]/g, '').trim() || 'LEVEL UP';
  if (/<meta[^>]+name=["']twitter:card["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta[^>]+name=["']twitter:card["'][^>]*>/i, '<meta name="twitter:card" content="summary_large_image" />');
  } else {
    html = html.replace('</head>', '  <meta name="twitter:card" content="summary_large_image" />\n</head>');
  }
  const pieces = [];
  if (!/<meta[^>]+property=["']og:image["']/i.test(html)) pieces.push(`<meta property="og:image" content="${imageUrl}" />`);
  if (!/<meta[^>]+property=["']og:image:width["']/i.test(html)) pieces.push('<meta property="og:image:width" content="1200" />');
  if (!/<meta[^>]+property=["']og:image:height["']/i.test(html)) pieces.push('<meta property="og:image:height" content="630" />');
  if (!/<meta[^>]+property=["']og:image:alt["']/i.test(html)) pieces.push(`<meta property="og:image:alt" content="${safeTitle} | LEVEL UP" />`);
  if (!/<meta[^>]+name=["']twitter:image["']/i.test(html)) pieces.push(`<meta name="twitter:image" content="${imageUrl}" />`);
  if (pieces.length) html = html.replace('</head>', `  ${pieces.join('\n  ')}\n</head>`);
  return html;
}

function extractPageTitle(html, fallback = 'LEVEL UP') {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  if (og) return og.replace(/\s*[|｜—-]\s*LEVEL\s*UP.*$/i, '').trim() || fallback;
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return title?.replace(/\s*[|｜—-]\s*LEVEL\s*UP.*$/i, '').trim() || fallback;
}

const enhancementStyle = `<style ${marker}>
  .lu-result-main{margin:10px 0 6px;font-size:22px;line-height:1.25;font-weight:950;letter-spacing:-.02em;color:#f6f8f1}
  .lu-result-card[data-lu-personalized="true"]{border-color:rgba(216,255,91,.52)}
</style>`;

function enhancementScript(slug, title) {
  return `<script ${marker} data-game-slug="${String(slug).replace(/["<>]/g, '')}">
(() => {
  const slug = ${JSON.stringify(slug)};
  const gameTitle = ${JSON.stringify(title)};
  let interactionCount = 0;
  let lastSnapshot = null;
  const ignoreSelector = '.lu-share-sheet,.lu-complete-fab,[data-lu-toast],[data-lu-share-result-v2],nav,header,.levelup-account,.levelup-app-menu,.levelup-feedback';

  const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
  const isVisible = (element) => {
    if (!(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
  };
  const privateInputs = () => [...document.querySelectorAll('input[type="text"],input:not([type]),textarea,[contenteditable="true"]')]
    .map((node) => normalize(node.value ?? node.textContent))
    .filter((value) => value.length >= 3 && value.length <= 120);
  const containsPrivateInput = (text) => privateInputs().some((value) => text.includes(value));

  const textFor = (node) => {
    if (node instanceof HTMLProgressElement || node instanceof HTMLMeterElement) {
      const max = Number(node.max || 0);
      const value = Number(node.value || 0);
      if (Number.isFinite(value) && max > 0) return '進捗 ' + Math.round((value / max) * 100) + '%';
    }
    return normalize(node.textContent);
  };

  const resultCandidates = () => {
    const selector = '[data-result],[data-score],[data-summary],[data-outcome],[data-final],.result,.results,.score,.summary,.outcome,.final-result,.result-card,#result,#score,#summary,output,meter,progress';
    const keywords = /(結果|スコア|score|達成|完了|レベル|level|点|%|％|回|秒|分|個|ステップ|ランク|rank)/i;
    const seen = new Set();
    const candidates = [];
    for (const node of document.querySelectorAll(selector)) {
      if (!isVisible(node) || node.closest('.lu-share-sheet') || node.closest('[data-levelup-share-result-v2]')) continue;
      const text = textFor(node);
      if (!text || text.length < 2 || text.length > 100 || seen.has(text) || containsPrivateInput(text)) continue;
      if (node.querySelector?.('input,textarea,[contenteditable="true"]')) continue;
      seen.add(text);
      let score = 0;
      if (node.matches('[data-result],[data-score],[data-summary],[data-outcome],[data-final],#result,#score,#summary,output,meter,progress')) score += 8;
      if (keywords.test(text)) score += 6;
      if (/\\d/.test(text)) score += 4;
      if (text.length <= 48) score += 2;
      if (/^(結果|スコア|完了|result|score)$/i.test(text)) score -= 8;
      candidates.push({ text, score });
    }
    return candidates.sort((a, b) => b.score - a.score || a.text.length - b.text.length);
  };

  const snapshot = () => {
    const candidates = resultCandidates();
    if (candidates[0] && candidates[0].score >= 6) {
      return {
        main: candidates[0].text,
        detail: candidates[1]?.score >= 6 ? candidates[1].text : 'プレイ中に表示された結果をそのまま記録しました。',
        source: 'dom_result',
      };
    }
    if (interactionCount > 0) {
      return {
        main: '今日のプレイ：' + interactionCount + 'アクション',
        detail: '今日も1回、実際にプレイしてトレーニングを完了。',
        source: 'interaction_count',
      };
    }
    return {
      main: 'トレーニング完了',
      detail: '今日も1回、考え方と行動の反射を鍛えた。',
      source: 'complete',
    };
  };

  const render = () => {
    const card = document.querySelector('.lu-result-card');
    if (!card) return snapshot();
    const small = card.querySelector('small');
    const grid = card.querySelector('.lu-result-grid');
    const detail = card.querySelector('p');
    let main = card.querySelector('[data-lu-result-main]');
    if (!main) {
      main = document.createElement('div');
      main.className = 'lu-result-main';
      main.setAttribute('data-lu-result-main', '');
      if (grid) card.insertBefore(main, grid); else card.append(main);
    }
    if (small) small.textContent = "LEVEL UP / TODAY'S RESULT";
    const data = snapshot();
    main.textContent = data.main;
    if (detail) detail.textContent = data.detail;
    card.dataset.luPersonalized = 'true';
    lastSnapshot = data;
    return data;
  };

  const trackInteraction = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest(ignoreSelector)) return;
    if (event.type === 'click' && target.closest('a[href]')) return;
    interactionCount = Math.min(99, interactionCount + 1);
  };
  document.addEventListener('click', trackInteraction, true);
  document.addEventListener('change', trackInteraction, true);

  const complete = document.querySelector('[data-lu-complete]');
  complete?.addEventListener('click', () => {
    const data = render();
    try {
      localStorage.setItem('hitobito-levelup-result-v2:' + slug, JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch {}
    window.dataLayer?.push({ event: 'levelup_result_personalized', game_slug: slug, result_source: data.source });
  }, true);

  const share = document.querySelector('[data-lu-share]');
  share?.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const data = render();
    const canonical = document.querySelector('link[rel="canonical"]')?.href || (location.origin + location.pathname);
    const shareUrl = canonical + (canonical.includes('?') ? '&' : '?') + 'ref=share&utm_source=share&utm_medium=earned&utm_campaign=levelup_result_v2';
    const lines = [gameTitle, data.main];
    if (data.detail && data.detail !== 'プレイ中に表示された結果をそのまま記録しました。') lines.push(data.detail);
    lines.push('🟩🟩🟩🟩🟩', '#LEVELUP');
    const text = lines.join('\\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: gameTitle + ' | LEVEL UP', text, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text + '\\n' + shareUrl);
        const toast = document.querySelector('[data-lu-toast]');
        if (toast) {
          toast.classList.add('is-on');
          setTimeout(() => toast.classList.remove('is-on'), 1600);
        }
      }
      window.dataLayer?.push({ event: 'levelup_share_v2', game_slug: slug, result_source: data.source });
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('[LEVEL UP share v2]', error);
    }
  }, true);

  const sheet = document.querySelector('[data-lu-sheet]');
  if (sheet) new MutationObserver(() => { if (sheet.classList.contains('is-open')) render(); }).observe(sheet, { attributes: true, attributeFilter: ['class'] });
})();
</script>`;
}

createShareImage();

let home = fs.readFileSync(homePath, 'utf8');
home = addSocialPreview(home, extractPageTitle(home, 'LEVEL UP'));
fs.writeFileSync(homePath, home);

let personalized = 0;
let previewed = 1;
for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(appsDir, entry.name, 'index.html');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('data-levelup-growth-loop-v1')) continue;
  const title = extractPageTitle(html, entry.name);
  html = addSocialPreview(html, title);
  previewed += 1;
  if (!html.includes(marker)) {
    html = html.replace('</head>', `${enhancementStyle}\n</head>`);
    html = html.replace('</body>', `${enhancementScript(entry.name, title)}\n</body>`);
    personalized += 1;
  }
  fs.writeFileSync(file, html);
}

if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size < 1000) {
  throw new Error('LEVEL UP social preview image was not generated correctly.');
}
if (personalized < 50) {
  throw new Error(`LEVEL UP share result v2 coverage unexpectedly low: ${personalized}`);
}

console.log(`[Firebase] LEVEL UP share result v2 ready: ${personalized} app pages personalized; ${previewed} pages have large social previews.`);
