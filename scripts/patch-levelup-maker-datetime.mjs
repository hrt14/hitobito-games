import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const assetPath = path.join(outDir, 'levelup-maker.js');
const indexPath = path.join(outDir, 'index.html');

if (!fs.existsSync(assetPath) || !fs.existsSync(indexPath)) {
  throw new Error('LEVEL UP maker output not found. Run inject-levelup-maker.mjs first.');
}

let source = fs.readFileSync(assetPath, 'utf8');

const oldFormatter = `  function formatDate(value) {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(date);
  }`;

const newFormatter = `  function formatDate(value) {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return '';
    const monthDay = (date.getMonth() + 1) + '/' + date.getDate();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return monthDay + ' ' + hour + ':' + minute;
  }`;

if (!source.includes("String(date.getMinutes()).padStart(2, '0')")) {
  if (!source.includes(oldFormatter)) throw new Error('Could not find LEVEL UP maker date formatter.');
  source = source.replace(oldFormatter, newFormatter);
}

const titleFunction = `  function requestTitle(request) {
    return request.appTitle || request.problem || '制作依頼';
  }`;

const previousPurposeFunction = `  function requestTitle(request) {
    return request.appTitle || request.problem || '制作依頼';
  }

  function requestPurpose(request) {
    if (!request.appTitle) return '';
    const savedPurpose = String(request.appSummaryJa || request.goalDetail || request.problem || '').trim();
    if (!savedPurpose || savedPurpose === String(request.appTitle || '').trim()) return '';
    return savedPurpose;
  }`;

const purposeFunction = `  function requestTitle(request) {
    return request.appTitle || request.problem || '制作依頼';
  }

  function requestPurpose(request) {
    if (!request.appTitle) return '';
    const knownPurpose = {
      'rhythm-anchor': '生活リズムを整えるアプリ',
      'one-thing-room': '頭がいっぱいな時に「今やる1つ」を決めるアプリ',
      'influence-rings': '自分で変えられることに集中するアプリ',
      'pulse-start': '動けない時に身体から行動スイッチを入れるアプリ',
    }[String(request.appSlug || '')];
    const savedPurpose = String(request.appPurposeJa || request.appSummaryJa || knownPurpose || '').trim();
    if (!savedPurpose || savedPurpose === String(request.appTitle || '').trim()) return '';
    return savedPurpose;
  }`;

if (!source.includes('request.appPurposeJa || request.appSummaryJa')) {
  if (source.includes(previousPurposeFunction)) source = source.replace(previousPurposeFunction, purposeFunction);
  else if (source.includes(titleFunction)) source = source.replace(titleFunction, purposeFunction);
  else throw new Error('Could not find LEVEL UP maker request purpose function.');
}

const oldCardCss = '.request-title{font-size:11px;font-weight:900;line-height:1.45}.request-meta{font-size:9px;color:#899281;margin-top:4px}';
const newCardCss = '.request-title{font-size:11px;font-weight:900;line-height:1.45}.request-purpose{margin-top:5px;color:#dce4d2;font-size:10px;font-weight:800;line-height:1.55}.request-meta{font-size:9px;color:#899281;margin-top:5px}';
if (!source.includes('.request-purpose{')) {
  if (!source.includes(oldCardCss)) throw new Error('Could not find LEVEL UP maker request card styles.');
  source = source.replace(oldCardCss, newCardCss);
}

const oldCardRender = 'return `<div class="request"><div><div class="request-title">${escapeHtml(requestTitle(request))}</div><div class="request-meta">${escapeHtml(formatDate(request.createdAt))} · ${escapeHtml(labelFor(modes, request.solutionType))}</div></div><span class="status">${escapeHtml(statusLabel(request.status))}</span>${appPath ? `<div class="request-actions"><a class="mini" href="${escapeHtml(appPath)}">遊ぶ ↗</a><button class="mini" type="button" data-share="${escapeHtml(appPath)}" data-title="${escapeHtml(requestTitle(request))}">シェア</button></div>` : \'\'}</div>`;';
const newCardRender = 'const purpose = requestPurpose(request);\n      return `<div class="request"><div><div class="request-title">${escapeHtml(requestTitle(request))}</div>${purpose ? `<div class="request-purpose">${escapeHtml(purpose)}</div>` : \'\'}<div class="request-meta">${escapeHtml(formatDate(request.createdAt))} · ${escapeHtml(labelFor(modes, request.solutionType))}</div></div><span class="status">${escapeHtml(statusLabel(request.status))}</span>${appPath ? `<div class="request-actions"><a class="mini" href="${escapeHtml(appPath)}">遊ぶ ↗</a><button class="mini" type="button" data-share="${escapeHtml(appPath)}" data-title="${escapeHtml(requestTitle(request))}">シェア</button></div>` : \'\'}</div>`;';
if (!source.includes('const purpose = requestPurpose(request);')) {
  if (!source.includes(oldCardRender)) throw new Error('Could not find LEVEL UP maker request card renderer.');
  source = source.replace(oldCardRender, newCardRender);
}

fs.writeFileSync(assetPath, source);

const version = createHash('sha256').update(source).digest('hex').slice(0, 12);
let html = fs.readFileSync(indexPath, 'utf8');
const scriptPattern = /src="\/levelup-maker\.js(?:\?v=[^"]*)?"/g;
if (!scriptPattern.test(html)) throw new Error('Could not find LEVEL UP maker script tag.');
html = html.replace(scriptPattern, `src="/levelup-maker.js?v=${version}"`);
fs.writeFileSync(indexPath, html);

if (!source.includes("return monthDay + ' ' + hour + ':' + minute;")) throw new Error('LEVEL UP maker date/time formatter was not applied.');
if (!source.includes('request.appPurposeJa || request.appSummaryJa') || !source.includes("'rhythm-anchor': '生活リズムを整えるアプリ'")) {
  throw new Error('LEVEL UP maker concise Japanese purpose labels were not applied.');
}
if (!source.includes('class="request-purpose"')) throw new Error('LEVEL UP maker Japanese app purpose is not rendered in My Apps cards.');
if (!html.includes(`/levelup-maker.js?v=${version}`)) throw new Error('LEVEL UP maker cache-busting version was not updated.');

console.log(`[Firebase] LEVEL UP maker date/time + concise Japanese purpose patched; maker=${version}`);
