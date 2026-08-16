// S02 モンスターの部屋（ホーム）
// 今日やっていなくても警告は出さない。いつでも「ひとくち」から始められる。

import { el, $, esc } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { monsterSvg } from '../ui/monster.js';
import { nextMilestone } from '../game/growthRules.js';

export function homeScreen(ctx) {
  const state = ctx.state();
  const { monster } = state;
  const active = state.homework.filter((h) => h.status === 'active');
  const returning = monster.totalBites > 0;
  const next = nextMilestone(monster.totalBites);
  const remain = next ? next.bites - monster.totalBites : 0;

  const room = monster.roomUnlocked
    ? `<div class="room">
         <div class="window"></div>
         <div class="lamp"></div>
       </div>`
    : '';

  const node = el(`
    <section class="screen">
      <div class="home-head">
        <div class="mon-name">
          ${esc(monster.name || 'なまえ まだ')}
          <small>${monster.stage === 'evolved' ? 'しんかした すがた' : monster.stage === 'baby' ? 'ベビー' : 'たまご'}</small>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div class="bites-chip">${COPY.home.bitesLabel}<br><b>${monster.totalBites}</b></div>
          <button class="icon-btn" data-act="settings" type="button" aria-label="${COPY.settings.heading}">⚙</button>
        </div>
      </div>

      <div class="stage">
        ${room}
        <div class="hm-bubble">${returning ? COPY.home.welcomeBack : COPY.home.greeting}</div>
        <div class="mon-wrap">${monsterSvg(monster, {
          expression: 'idle',
          anim: monster.unlockedReactions.includes('play') ? 'play' : 'idle',
        })}</div>
        ${monster.roomUnlocked ? `<div class="mon-plate ${monster.bigPlate ? 'big' : ''}"></div>` : ''}
        ${next ? `<p class="next-hint">つぎの へんか まで あと ${remain} くち</p>` : ''}
      </div>

      <div class="actions">
        <button class="btn btn-primary" data-act="start" type="button">${
          active.length ? COPY.home.startAgain : COPY.home.startFirst
        }</button>
      </div>
      <div class="home-sub">
        <button data-act="list" type="button">${COPY.home.listBtn}</button>
        <button data-act="book" type="button">${COPY.home.bookBtn}</button>
        <button data-act="records" type="button">${COPY.home.recordBtn}</button>
      </div>
    </section>`);

  $(node, '[data-act="start"]').addEventListener('click', () => {
    ctx.sound('tap');
    ctx.go('subject', {});
  });
  $(node, '[data-act="list"]').addEventListener('click', () => ctx.go('list', {}));
  $(node, '[data-act="book"]').addEventListener('click', () => ctx.go('book', {}));
  $(node, '[data-act="records"]').addEventListener('click', () => ctx.go('records', {}));
  $(node, '[data-act="settings"]').addEventListener('click', () => ctx.go('settings', {}));

  return node;
}
