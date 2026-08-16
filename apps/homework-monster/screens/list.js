// 宿題リスト — 残量はここでだけ確認できればよい（仕様 15.4）

import { el, $, $$, esc } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { SUBJECTS } from '../game/biteTemplates.js';
import { topBar } from './parts.js';

export function listScreen(ctx) {
  const state = ctx.state();
  const active = state.homework.filter((h) => h.status === 'active');

  const rowHtml = (hw) => {
    const subject = SUBJECTS.find((s) => s.id === hw.subject) || SUBJECTS[5];
    const remain =
      typeof hw.remainingAmount === 'number'
        ? `のこり ${hw.remainingAmount}${hw.unitLabel || ''}`
        : 'すきなだけ';
    return `
      <div class="stat-row" style="flex-direction:column;align-items:stretch;gap:10px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <span style="font-size:18px;font-weight:900;color:var(--ink)">${esc(hw.title || `${subject.label}の宿題`)}</span>
          <span style="font-size:14px">${esc(remain)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:8px">
          <button class="btn btn-go" data-open="${esc(hw.id)}" type="button" style="min-height:52px;font-size:17px">つづける</button>
          <button class="btn btn-secondary" data-finish="${esc(hw.id)}" type="button" style="min-height:52px;font-size:15px">ぜんぶ おわった</button>
        </div>
      </div>`;
  };

  const node = el(`
    <section class="screen" data-scroll="true">
      ${topBar({ back: true, title: COPY.home.listBtn })}
      <div class="stat-list" style="margin-top:10px">
        ${active.length ? active.map(rowHtml).join('') : '<p class="sub">まだ宿題がないよ。したの ボタンから ひとつ ふやそう。</p>'}
      </div>
      <div class="actions">
        <button class="btn btn-primary" data-act="new" type="button">あたらしい宿題</button>
        <button class="btn btn-secondary" data-act="home" type="button">${COPY.common.back}</button>
      </div>
    </section>`);

  $(node, '[data-act="back"]').addEventListener('click', () => ctx.go('home', {}));
  $(node, '[data-act="home"]').addEventListener('click', () => ctx.go('home', {}));
  $(node, '[data-act="new"]').addEventListener('click', () => ctx.go('subject', {}));

  $$(node, '[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.sound('tap');
      ctx.go('chunk', { homeworkId: btn.dataset.open });
    });
  });

  $$(node, '[data-finish]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.sound('tap');
      const session = ctx.actions.startFeast(btn.dataset.finish);
      if (session) ctx.go('feeding', { sessionId: session.id });
    });
  });

  return node;
}
