// S09 休憩画面
// カウントダウンで急かさない。戻ってきたことを数える。

import { el, $ } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { monsterSvg } from '../ui/monster.js';

export function breakScreen(ctx) {
  const state = ctx.state();
  const sessionId = state.ui.params.sessionId || state.activeSessionId;

  const node = el(`
    <section class="screen">
      <div class="stage">
        <div class="mon-wrap">${monsterSvg(state.monster, { expression: 'sleeping', anim: 'sleep' })}</div>
        <p class="lead">${COPY.breakScreen.heading}</p>
        <p class="sub">${COPY.breakScreen.sub}</p>
      </div>
      <div class="actions">
        <button class="btn btn-primary" data-act="back" type="button">${COPY.breakScreen.back}</button>
        <button class="btn btn-secondary" data-act="finish" type="button">${COPY.breakScreen.finish}</button>
      </div>
    </section>`);

  $(node, '[data-act="back"]').addEventListener('click', () => {
    ctx.sound('tap');
    if (sessionId) {
      ctx.actions.returnFromBreak(sessionId);
      ctx.go('focus', { sessionId });
    } else {
      ctx.go('home', {});
    }
  });

  $(node, '[data-act="finish"]').addEventListener('click', () => {
    ctx.sound('tap');
    ctx.actions.endSession();
    ctx.go('end', {});
  });

  return node;
}
