// 設定 — 音、動き、ふりがな、データの書き出しとやり直し（仕様 14.2 / 17）

import { el, $, $$, downloadJson, toast } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { exportEventsJson } from '../game/events.js';
import { topBar } from './parts.js';

const TOGGLES = [
  ['sfx', COPY.settings.sfx],
  ['bgm', COPY.settings.bgm],
  ['reducedMotion', COPY.settings.reducedMotion],
  ['furigana', COPY.settings.furigana],
];

export function settingsScreen(ctx) {
  const settings = ctx.state().settings;

  const node = el(`
    <section class="screen" data-scroll="true">
      ${topBar({ back: true, title: COPY.settings.heading })}

      <div class="stat-list" style="margin-top:10px">
        ${TOGGLES.map(
          ([key, label]) => `
          <div class="toggle-row">
            <span>${label}</span>
            <button class="toggle" data-toggle="${key}" type="button" aria-pressed="${settings[key] ? 'true' : 'false'}">
              ${settings[key] ? 'ON' : 'OFF'}
            </button>
          </div>`,
        ).join('')}
      </div>

      <h2 class="section-title">データ</h2>
      <div class="actions" style="padding-top:0">
        <button class="btn btn-secondary" data-act="export" type="button">${COPY.settings.exportData}</button>
        <button class="btn btn-secondary" data-act="export-events" type="button">${COPY.settings.exportEvents}</button>
        <button class="btn btn-quiet" data-act="reset" type="button">${COPY.settings.reset}</button>
      </div>

      <div class="unlock-card hidden" id="reset-box" style="border-color:var(--primary);margin-top:12px">
        <p>${COPY.settings.resetConfirm}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <button class="btn btn-secondary" data-act="reset-no" type="button" style="min-height:52px">${COPY.settings.resetNo}</button>
          <button class="btn btn-primary" data-act="reset-yes" type="button" style="min-height:52px">${COPY.settings.resetYes}</button>
        </div>
      </div>

      <p class="note">記録は この端末の中だけに 保存される。だれにも 送られない。</p>

      <div class="actions">
        <button class="btn btn-secondary" data-act="home" type="button">${COPY.settings.back}</button>
      </div>
    </section>`);

  $$(node, '[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggle;
      const next = !ctx.state().settings[key];
      ctx.actions.updateSettings({ [key]: next });
      btn.setAttribute('aria-pressed', next ? 'true' : 'false');
      btn.textContent = next ? 'ON' : 'OFF';
      ctx.syncAudio();
      ctx.syncApp();
      if (key === 'furigana') ctx.rerender();
      else ctx.sound('tap');
    });
  });

  $(node, '[data-act="export"]').addEventListener('click', () => {
    downloadJson('homework-monster-save.json', ctx.store.exportJson());
    toast('データを書き出したよ');
  });

  $(node, '[data-act="export-events"]').addEventListener('click', () => {
    downloadJson('homework-monster-events.json', exportEventsJson(ctx.store));
    toast('テスト記録を書き出したよ');
  });

  const box = $(node, '#reset-box');
  $(node, '[data-act="reset"]').addEventListener('click', () => box.classList.remove('hidden'));
  $(node, '[data-act="reset-no"]').addEventListener('click', () => box.classList.add('hidden'));
  $(node, '[data-act="reset-yes"]').addEventListener('click', () => {
    // 初期化の前に、必ずバックアップを書き出す
    downloadJson('homework-monster-backup.json', ctx.store.exportJson());
    ctx.store.reset();
    ctx.syncApp();
    ctx.go('opening', {});
  });

  const back = () => ctx.go('home', {});
  $(node, '[data-act="back"]').addEventListener('click', back);
  $(node, '[data-act="home"]').addEventListener('click', back);

  return node;
}
