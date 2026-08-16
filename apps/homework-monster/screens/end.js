// 今日はここまで。終わり方も肯定で閉じる。

import { el, $ } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { monsterSvg } from '../ui/monster.js';

export function endScreen(ctx) {
  const state = ctx.state();

  const node = el(`
    <section class="screen">
      <div class="stage">
        <div class="mon-wrap">${monsterSvg(state.monster, { expression: 'happy', anim: 'happy' })}</div>
        <p class="lead">${COPY.end.heading}</p>
        <div class="bites-chip">${COPY.home.bitesLabel}<br><b>${state.monster.totalBites}</b></div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" data-act="home" type="button">${COPY.end.back}</button>
      </div>
    </section>`);

  $(node, '[data-act="home"]').addEventListener('click', () => {
    ctx.sound('tap');
    ctx.go('home', {});
  });

  return node;
}
