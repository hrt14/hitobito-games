// S10 記録画面
// 連続日数は表示しない。減る数字も作らない。

import { el, $ } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { SUBJECTS } from '../game/biteTemplates.js';
import { foodFor } from '../game/foodRules.js';
import { topBar } from './parts.js';

export function recordsScreen(ctx) {
  const state = ctx.state();
  const { monster, stats } = state;

  const rows = [
    [COPY.records.bites, monster.totalBites],
    [COPY.records.starts, stats.totalStarts],
    [COPY.records.resizes, stats.totalResizes],
    [COPY.records.returns, stats.returnedAfterBreak],
  ];

  const node = el(`
    <section class="screen" data-scroll="true">
      ${topBar({ back: true, title: COPY.records.heading })}
      <div class="stat-list" style="margin-top:10px">
        ${rows
          .map(([label, value]) => `<div class="stat-row"><span>${label}</span><b>${value}</b></div>`)
          .join('')}
      </div>

      <h2 class="section-title">${COPY.records.subjectHeading}</h2>
      <div class="food-collection">
        ${SUBJECTS.map((s) => {
          const count = monster.subjectBites[s.id] || 0;
          return `
            <div class="food-cell ${count ? '' : 'empty'}">
              <small>${foodFor(s.id).name}</small>
              <b>${count}</b>
            </div>`;
        }).join('')}
      </div>

      <p class="note">${COPY.records.footer}</p>
      <div class="actions">
        <button class="btn btn-secondary" data-act="home" type="button">${COPY.records.back}</button>
      </div>
    </section>`);

  const back = () => ctx.go('home', {});
  $(node, '[data-act="back"]').addEventListener('click', back);
  $(node, '[data-act="home"]').addEventListener('click', back);

  return node;
}
