// S01 オープニング（仕様 6.1）
// 暗い部屋 → 卵の鳴き声 → 2行のテキスト → CTA。長い説明はしない。

import { el, $ } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { monsterSvg } from '../ui/monster.js';
import { safeTimeout } from './parts.js';

export function openingScreen(ctx) {
  const monster = ctx.state().monster;

  const node = el(`
    <section class="screen">
      <div class="topbar">
        <span></span>
        <span class="title">${COPY.title}</span>
        <span style="min-width:46px"></span>
      </div>
      <div class="stage opening-stage">
        <div class="hm-bubble" id="cry" style="opacity:0">${COPY.opening.cry}</div>
        <div class="mon-wrap">${monsterSvg(monster, { expression: 'idle', anim: 'idle' })}</div>
        <div class="opening-lines">
          <p id="l1">${COPY.opening.line1}</p>
          <p id="l2">${COPY.opening.line2}</p>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" id="go" type="button" style="opacity:0;pointer-events:none">${COPY.opening.cta}</button>
        <p class="sub" style="font-size:14px">${COPY.tagline}</p>
      </div>
    </section>`);

  const reveal = () => {
    $(node, '#cry').style.opacity = '1';
    $(node, '#l1').classList.add('on');
    $(node, '#l2').classList.add('on');
    const go = $(node, '#go');
    go.style.opacity = '1';
    go.style.pointerEvents = 'auto';
  };

  safeTimeout(node, () => {
    $(node, '#cry').style.opacity = '1';
    ctx.sound('soft');
  }, 500);
  safeTimeout(node, () => $(node, '#l1').classList.add('on'), 1100);
  safeTimeout(node, () => $(node, '#l2').classList.add('on'), 1900);
  safeTimeout(node, reveal, 2500);

  // 待てない子のために、画面タップで即スキップできる
  node.addEventListener('click', (event) => {
    if (event.target.closest('#go')) return;
    reveal();
  });

  $(node, '#go').addEventListener('click', () => {
    ctx.sound('tap');
    ctx.actions.completeOnboarding();
    ctx.go('subject', { first: true });
  });

  return node;
}
