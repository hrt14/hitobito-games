// S07 食べ物変換・給餌画面
// ドラッグでもタップでも進める。キーボードだけでも完了できる。

import { el, $, esc } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { monsterSvg } from '../ui/monster.js';
import { foodSvg } from '../ui/food.js';
import { foodFor, feedingLine } from '../game/foodRules.js';
import { reviveBite } from '../game/biteEngine.js';
import { topBar, biteCard, burstSparks } from './parts.js';

const SCALE_BY_SIZE = { fragment: 'small', bite: 'medium', solid_bite: 'large' };

export function feedingScreen(ctx) {
  const state = ctx.state();
  const session = ctx.actions.findSession(state.ui.params.sessionId || state.activeSessionId);

  if (!session) {
    ctx.go('home', {});
    return el('<section class="screen"></section>');
  }

  const homework = ctx.actions.findHomework(session.homeworkId);
  const bite = reviveBite(session);
  const subject = homework?.subject || 'other';
  const food = foodFor(subject);
  const scale = session.feast ? 'feast' : SCALE_BY_SIZE[session.size] || 'medium';
  let done = false;

  const node = el(`
    <section class="screen">
      ${topBar({ title: esc(food.name) })}
      <div class="feed-stage">
        <p class="lead" id="lead">${COPY.feeding.transform}</p>

        <div class="feed-target" id="target">
          <div class="transform-glow" id="glow"></div>
          <div class="mon-wrap" id="mon">${monsterSvg(ctx.state().monster, { expression: 'hopeful', anim: 'hopeful' })}</div>
        </div>

        <div class="feed-arrow hidden" id="arrow">▲</div>

        <div id="food-slot" style="min-height:150px;display:grid;place-items:center;width:100%">
          <div id="card-slot" style="width:100%">${biteCard(bite, { label: 'できたひとくち' })}</div>
        </div>
        <p class="sub" id="hint">${COPY.feeding.hint}</p>
      </div>
    </section>`);

  const glow = $(node, '#glow');
  const cardSlot = $(node, '#card-slot');
  const foodSlot = $(node, '#food-slot');
  const monWrap = $(node, '#mon');
  const target = $(node, '#target');
  const lead = $(node, '#lead');

  // 1) 宿題カードが光って、食べ物に変わる
  setTimeout(() => {
    if (!node.isConnected) return;
    glow.classList.add('on');
    ctx.sound('sparkle');
    cardSlot.style.transition = 'opacity .3s ease, transform .3s ease';
    cardSlot.style.opacity = '0';
    cardSlot.style.transform = 'scale(.8)';
  }, 480);

  // 2) 食べ物が出てくる。ここから給餌できる。
  setTimeout(() => {
    if (!node.isConnected) return;
    lead.textContent = COPY.feeding.give;
    target.classList.add('ready');
    $(node, '#arrow').classList.remove('hidden');
    foodSlot.innerHTML = `
      <button class="feed-food" id="food" type="button" aria-label="${esc(food.name)}をモンスターにあげる">
        <span class="food-wrap size-${scale} food-float">${foodSvg(subject, scale)}</span>
      </button>`;
    wireFood($(node, '#food'));
  }, 900);

  function wireFood(foodBtn) {
    let startX = 0;
    let startY = 0;
    let moved = 0;
    let dragging = false;

    const reset = () => {
      foodBtn.style.transform = '';
      foodBtn.classList.remove('dragging');
    };

    foodBtn.addEventListener('pointerdown', (event) => {
      if (done) return;
      dragging = true;
      moved = 0;
      startX = event.clientX;
      startY = event.clientY;
      foodBtn.setPointerCapture(event.pointerId);
      foodBtn.classList.add('dragging');
    });

    foodBtn.addEventListener('pointermove', (event) => {
      if (!dragging || done) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      moved = Math.hypot(dx, dy);
      foodBtn.style.transform = `translate(${dx}px, ${dy}px)`;

      const rect = target.getBoundingClientRect();
      const near =
        Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2)) <
        rect.width * 0.65;
      target.classList.toggle('ready', !near);
      foodBtn.style.filter = near ? 'drop-shadow(0 0 14px rgba(255,196,90,.9))' : '';
    });

    foodBtn.addEventListener('pointerup', (event) => {
      if (!dragging || done) return;
      dragging = false;
      const rect = target.getBoundingClientRect();
      const near =
        Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2)) <
        rect.width * 0.65;

      if (near || moved < 10) {
        feed(foodBtn);
      } else {
        reset();
      }
    });

    foodBtn.addEventListener('pointercancel', () => {
      dragging = false;
      reset();
    });

    // キーボードだけでも食べさせられる
    foodBtn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        feed(foodBtn);
      }
    });
  }

  function feed(foodBtn) {
    if (done) return;
    done = true;

    const foodRect = foodBtn.getBoundingClientRect();
    const monRect = monWrap.getBoundingClientRect();
    const dx = monRect.left + monRect.width / 2 - (foodRect.left + foodRect.width / 2);
    const dy = monRect.top + monRect.height * 0.62 - (foodRect.top + foodRect.height / 2);

    foodBtn.classList.add('flying');
    foodBtn.style.transform = `translate(${dx}px, ${dy}px) scale(.35)`;
    foodBtn.style.opacity = '0';
    target.classList.remove('ready');
    $(node, '#arrow').classList.add('hidden');
    $(node, '#hint').textContent = '';

    // 最初のひとくちで、部屋に色が戻る
    if (ctx.state().monster.totalBites === 0) {
      document.getElementById('app')?.classList.remove('is-dark');
    }

    setTimeout(() => {
      if (!node.isConnected) return;
      ctx.sound('feed');
      lead.textContent = COPY.feeding.eating;
      monWrap.innerHTML = monsterSvg(ctx.state().monster, { expression: 'eating', anim: 'eat' });
      burstSparks(target, 12);
    }, 380);

    setTimeout(() => {
      if (!node.isConnected) return;
      lead.textContent = feedingLine(session.feast ? 'feast' : session.size);
      monWrap.innerHTML = monsterSvg(ctx.state().monster, { expression: 'happy', anim: 'happy' });
    }, 1250);

    setTimeout(() => {
      if (!node.isConnected) return;
      ctx.actions.feedMonster(session.id);
      ctx.go('result', {});
    }, 2000);
  }

  return node;
}
