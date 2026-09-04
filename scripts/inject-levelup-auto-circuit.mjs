import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const homePath = path.join(outDir, 'index.html');
const catalogPath = path.join(outDir, 'levelup-catalog.json');
const reportPath = path.join(outDir, 'reports', 'latest.json');
const circuitPath = path.join(outDir, 'reports', 'circuit.json');
const marker = 'data-levelup-auto-circuit-v1';

const thresholds = Object.freeze({
  explorationDays: 14,
  explorationSessions: 3,
  decisionSessions: 5,
  improveCompletionRate: 0.2,
  boostCount: 3,
});

for (const required of [homePath, catalogPath, reportPath]) {
  if (!fs.existsSync(required)) throw new Error(`LEVEL UP circuit input missing: ${path.relative(root, required)}`);
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const safeSlug = (value) => /^[a-z0-9-]{1,80}$/.test(String(value || '')) ? String(value) : '';
const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function jstDateLabel(compact) {
  const raw = String(compact || '');
  return /^\d{8}$/.test(raw) ? `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}` : raw;
}

function ageDays(epochSeconds, nowMs = Date.now()) {
  const epoch = number(epochSeconds);
  if (!epoch) return null;
  return Math.max(0, (nowMs - epoch * 1000) / 86400000);
}

function bySlug(day) {
  return new Map((day?.games || []).map((game) => [safeSlug(game.slug), game]).filter(([slug]) => slug));
}

const catalogPayload = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const catalog = Array.isArray(catalogPayload.games) ? catalogPayload.games : [];
const currentMap = bySlug(report.current);
const previousMap = bySlug(report.previous);
const completedSignals = number(report.current?.metrics?.completedGames) + number(report.previous?.metrics?.completedGames);
const completionTelemetryReady = completedSignals > 0;

const evaluated = catalog.map((game) => {
  const slug = safeSlug(game.slug);
  const current = currentMap.get(slug) || {};
  const previous = previousMap.get(slug) || {};
  const currentSessions = number(current.sessions);
  const previousSessions = number(previous.sessions);
  const sessions = currentSessions + previousSessions;
  const completed = number(current.completed) + number(previous.completed);
  const completionRate = sessions > 0 ? completed / sessions : null;
  const trend = currentSessions - previousSessions;
  const releasedAgeDays = ageDays(game.releasedAt);
  const isFresh = releasedAgeDays !== null && releasedAgeDays <= thresholds.explorationDays;
  const weightedSessions = currentSessions * 2 + previousSessions;
  const trendBonus = clamp(trend, -4, 4) * 0.5;
  const completionBonus = completionTelemetryReady && completionRate !== null ? completionRate * 8 : 0;
  const score = weightedSessions + trendBonus + completionBonus;

  return {
    slug,
    title: String(game.title || slug),
    description: String(game.description || ''),
    skill: String(game.skill || ''),
    href: String(game.href || `/apps/${encodeURIComponent(slug)}/`),
    releasedAt: number(game.releasedAt) || null,
    updatedAt: number(game.updatedAt) || null,
    releasedAgeDays: releasedAgeDays === null ? null : Number(releasedAgeDays.toFixed(1)),
    currentSessions,
    previousSessions,
    sessions,
    completed,
    completionRate: completionRate === null ? null : Number(completionRate.toFixed(4)),
    trend,
    score: Number(score.toFixed(3)),
    isFresh,
    status: 'hold',
    reason: 'データを蓄積',
  };
});

const explore = evaluated
  .filter((game) => game.isFresh && game.sessions < thresholds.explorationSessions)
  .sort((a, b) => a.sessions - b.sessions || number(b.releasedAt) - number(a.releasedAt) || b.score - a.score);

if (completionTelemetryReady) {
  for (const game of evaluated) {
    if (game.sessions >= thresholds.decisionSessions && game.completionRate !== null && game.completionRate < thresholds.improveCompletionRate) {
      game.status = 'improve';
      game.reason = `完了率 ${Math.round(game.completionRate * 100)}% / ${game.sessions}セッション`;
    }
  }
}

for (const game of explore) {
  game.status = 'explore';
  game.reason = `初期打席 ${game.sessions}/${thresholds.explorationSessions}セッション`;
}

const boostCandidates = evaluated
  .filter((game) => game.status === 'hold' && game.sessions >= thresholds.explorationSessions)
  .sort((a, b) => b.score - a.score || b.currentSessions - a.currentSessions || a.slug.localeCompare(b.slug));
const boosts = boostCandidates.slice(0, thresholds.boostCount);
for (const game of boosts) {
  game.status = 'boost';
  game.reason = completionTelemetryReady && game.completionRate !== null
    ? `反応スコア ${game.score.toFixed(1)} / 完了率 ${Math.round(game.completionRate * 100)}%`
    : `反応スコア ${game.score.toFixed(1)} / 直近 ${game.currentSessions}セッション`;
}

const improvements = evaluated
  .filter((game) => game.status === 'improve')
  .sort((a, b) => a.completionRate - b.completionRate || b.sessions - a.sessions);

const holds = evaluated
  .filter((game) => game.status === 'hold')
  .sort((a, b) => b.score - a.score || b.currentSessions - a.currentSessions);

const featured = explore[0] || boosts[0] || holds[0] || evaluated[0] || null;
const featuredReason = featured?.status === 'explore'
  ? '新しいアプリにまず打席を与えています'
  : featured?.status === 'boost'
    ? '直近の反応が良いアプリです'
    : 'データを集めています';

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  reportDate: report.current?.date || null,
  timezone: 'Asia/Tokyo',
  telemetry: {
    completionReady: completionTelemetryReady,
    note: completionTelemetryReady
      ? 'Completion is included in circuit scoring.'
      : 'No explicit completion signal in the two-day report yet; circuit does not penalize zero completion.',
  },
  thresholds,
  featured: featured ? {
    slug: featured.slug,
    title: featured.title,
    href: featured.href,
    status: featured.status,
    reason: featuredReason,
  } : null,
  boosts: boosts.map(({ slug, title, href, score, sessions, currentSessions, completionRate, reason }) => ({
    slug, title, href, score, sessions, currentSessions, completionRate, reason,
  })),
  explore: explore.map(({ slug, title, href, sessions, releasedAt, releasedAgeDays, reason }) => ({
    slug, title, href, sessions, releasedAt, releasedAgeDays, reason,
  })),
  improvements: improvements.map(({ slug, title, href, sessions, completionRate, reason }) => ({
    slug, title, href, sessions, completionRate, reason,
  })),
  holdCount: holds.length,
  games: [...evaluated].sort((a, b) => {
    const priority = { boost: 0, explore: 1, improve: 2, hold: 3 };
    return priority[a.status] - priority[b.status] || b.score - a.score || a.slug.localeCompare(b.slug);
  }),
  privacy: 'Aggregates only. No UID, raw search term, profile field, or visitor ID.',
};

fs.mkdirSync(path.dirname(circuitPath), { recursive: true });
fs.writeFileSync(circuitPath, JSON.stringify(payload, null, 2) + '\n');

let html = fs.readFileSync(homePath, 'utf8');
if (html.includes(marker)) throw new Error('LEVEL UP auto circuit was already injected.');

const visibleBoosts = boosts.slice(0, 3);
const cardsMarkup = visibleBoosts.length
  ? visibleBoosts.map((game, index) => `
    <a class="lu-circuit-item" href="${escapeHtml(game.href)}?ref=circuit&utm_source=levelup&utm_medium=internal&utm_campaign=winner">
      <span class="lu-circuit-rank">${index + 1}</span>
      <span class="lu-circuit-copy"><strong>${escapeHtml(game.title)}</strong><small>${escapeHtml(game.skill || game.description || game.reason)}</small></span>
      <span class="lu-circuit-go">→</span>
    </a>`).join('')
  : '<p class="lu-circuit-empty">まだ勝者判定前です。新しいアプリへ順番に打席を与えています。</p>';

const circuitSection = `
<style id="levelup-auto-circuit-v1-style">
  .lu-circuit{margin:0 0 18px;border:1px solid rgba(216,255,91,.14);background:#0d100b;border-radius:18px;padding:14px}
  .lu-circuit-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px}
  .lu-circuit-kicker{font-size:8px;letter-spacing:.15em;font-weight:950;color:var(--lime,#d8ff5b);margin-bottom:4px}
  .lu-circuit h2{font-size:18px;line-height:1.15;letter-spacing:-.03em;margin:0}
  .lu-circuit-date{font-size:9px;color:#7f8777;white-space:nowrap}
  .lu-circuit-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .lu-circuit-item{display:grid;grid-template-columns:28px minmax(0,1fr) 16px;gap:8px;align-items:center;min-height:68px;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:#131711;color:#eef2e8;text-decoration:none}
  .lu-circuit-rank{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:rgba(216,255,91,.1);color:#d8ff5b;font-size:10px;font-weight:950}
  .lu-circuit-copy{min-width:0}.lu-circuit-copy strong{display:block;font-size:12px;line-height:1.25}.lu-circuit-copy small{display:block;font-size:9px;line-height:1.35;color:#979f90;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .lu-circuit-go{color:#d8ff5b;font-weight:950}.lu-circuit-empty{margin:0;color:#939b8c;font-size:10px;line-height:1.6}
  @media(max-width:650px){.lu-circuit-list{grid-template-columns:1fr}.lu-circuit-head{align-items:flex-start;flex-direction:column;gap:3px}}
</style>
<section class="lu-circuit" id="levelup-auto-circuit" ${marker}>
  <div class="lu-circuit-head">
    <div><div class="lu-circuit-kicker">MARKET SIGNAL / AUTO</div><h2>いま反応がいいLEVEL UP</h2></div>
    <div class="lu-circuit-date">${escapeHtml(jstDateLabel(payload.reportDate))} 集計</div>
  </div>
  <div class="lu-circuit-list">${cardsMarkup}</div>
</section>`;

const diagnosisAnchor = '<div class="lu-diagnosis"';
if (html.includes(diagnosisAnchor)) {
  html = html.replace(diagnosisAnchor, `${circuitSection}\n${diagnosisAnchor}`);
} else if (html.includes('<section id="training-games"')) {
  html = html.replace('<section id="training-games"', `${circuitSection}\n<section id="training-games"`);
} else if (html.includes('</main>')) {
  html = html.replace('</main>', `${circuitSection}\n</main>`);
} else {
  throw new Error('LEVEL UP circuit insertion anchor not found.');
}

if (featured) {
  const featuredJson = JSON.stringify({
    title: featured.title,
    description: featured.description,
    href: featured.href,
    status: featured.status,
    reason: featuredReason,
    reportDate: jstDateLabel(payload.reportDate),
  }).replaceAll('</', '<\\/');
  const clientScript = `
<script ${marker}-featured>
(() => {
  const featured = ${featuredJson};
  const apply = () => {
    const title = document.getElementById('lu-today-title');
    const copy = document.getElementById('lu-today-copy');
    const link = document.getElementById('lu-today-link');
    const meta = document.getElementById('lu-today-meta');
    if (title) title.textContent = featured.title;
    if (copy) copy.textContent = featured.description || featured.reason;
    if (link) {
      const separator = featured.href.includes('?') ? '&' : '?';
      link.href = featured.href + separator + 'ref=circuit_today&utm_source=levelup&utm_medium=internal&utm_campaign=circuit_featured';
    }
    if (meta) meta.textContent = (featured.reportDate ? featured.reportDate + ' / ' : '') + featured.reason;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  else apply();
})();
</script>`;
  html = html.replace('</body>', `${clientScript}\n</body>`);
}

fs.writeFileSync(homePath, html);

const finalHome = fs.readFileSync(homePath, 'utf8');
if (!finalHome.includes(marker)) throw new Error('LEVEL UP circuit marker missing from home.');
if (!fs.existsSync(circuitPath)) throw new Error('LEVEL UP circuit JSON missing.');

console.log(`[LEVEL UP circuit] report=${payload.reportDate || 'unknown'} completionReady=${completionTelemetryReady} featured=${featured?.slug || 'none'} boosts=${boosts.length} explore=${explore.length} improve=${improvements.length} hold=${holds.length}`);
