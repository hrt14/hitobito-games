// S06 集中画面
// 表示するのは「いまのひとくち」「静かなモンスター」「3つのボタン」だけ。

import { el, $, $$, esc } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { monsterSvg } from '../ui/monster.js';
import { reviveBite } from '../game/biteEngine.js';
import { topBar, sizeBadge } from './parts.js';

const TIMER_CHOICES = [
  { seconds: 0, label: COPY.focus.timerNone },
  { seconds: 60, label: '1分' },
  { seconds: 180, label: '3分' },
  { seconds: 300, label: '5分' },
  { seconds: 600, label: '10分' },
];

export function focusScreen(ctx) {
  const state = ctx.state();
  const session = ctx.actions.findSession(state.ui.params.sessionId || state.activeSessionId);

  if (!session) {
    ctx.go('home', {});
    return el('<section class="screen"></section>');
  }

  const homework = ctx.actions.findHomework(session.homeworkId);
  const bite = reviveBite(session);

  if (session.status !== 'in_progress') ctx.actions.startBite(session.id);

  let remaining = 0;
  let timerId = null;

  const node = el(`
    <section class="screen">
      ${topBar({ back: true, title: esc(homework?.title || 'いまのひとくち') })}
      <div class="stage">
        <div class="mon-wrap small">${monsterSvg(ctx.state().monster, { expression: 'idle', anim: 'idle' })}</div>
        <div class="focus-bite">
          <span class="label">${COPY.focus.label}</span>
          <span class="value">${esc(bite.label)}</span>
          ${sizeBadge(bite.size)}
        </div>
        <p class="sub" id="focus-note">${COPY.focus.start}</p>
        <div class="timer-ring hidden" id="ring"><b>0:00</b></div>
      </div>

      <div class="timer-row" id="timer-row">
        <span class="caption">${COPY.focus.timerLabel}</span>
        ${TIMER_CHOICES.map(
          (t) => `<button data-seconds="${t.seconds}" class="${t.seconds === 0 ? 'on' : ''}" type="button">${t.label}</button>`,
        ).join('')}
      </div>

      <div class="actions">
        <button class="btn btn-go" data-act="done" type="button">${COPY.focus.done}</button>
        <button class="btn btn-secondary" data-act="big" type="button">${COPY.focus.tooBig}</button>
        <button class="btn btn-quiet" data-act="rest" type="button">${COPY.focus.rest}</button>
      </div>
    </section>`);

  const ring = $(node, '#ring');
  const note = $(node, '#focus-note');

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function paintRing(total) {
    const mm = Math.floor(remaining / 60);
    const ss = String(remaining % 60).padStart(2, '0');
    ring.innerHTML = `<b>${mm}:${ss}</b>`;
    ring.style.setProperty('--deg', `${((total - remaining) / total) * 360}deg`);
  }

  function startTimer(seconds) {
    stopTimer();
    ctx.actions.setTimer(session.id, seconds);
    if (!seconds) {
      ring.classList.add('hidden');
      return;
    }
    remaining = seconds;
    ring.classList.remove('hidden');
    paintRing(seconds);
    timerId = setInterval(() => {
      if (!node.isConnected) return stopTimer();
      remaining -= 1;
      if (remaining <= 0) {
        remaining = 0;
        paintRing(seconds);
        stopTimer();
        ctx.sound('chime');
        // 時間切れでも、できなかった扱いには決してしない
        note.textContent = COPY.focus.timerDone;
        return;
      }
      paintRing(seconds);
    }, 1000);
  }

  $$(node, '[data-seconds]').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$(node, '[data-seconds]').forEach((b) => b.classList.toggle('on', b === btn));
      ctx.sound('tap');
      startTimer(Number(btn.dataset.seconds));
    });
  });

  $(node, '[data-act="back"]').addEventListener('click', () => {
    stopTimer();
    ctx.go('home', {});
  });

  $(node, '[data-act="done"]').addEventListener('click', () => {
    stopTimer();
    ctx.sound('complete');
    ctx.actions.completeBite(session.id);
    ctx.go('feeding', { sessionId: session.id });
  });

  $(node, '[data-act="big"]').addEventListener('click', () => {
    stopTimer();
    ctx.sound('soft');
    ctx.actions.markTooBig(session.id);
    ctx.go('chunk', { homeworkId: session.homeworkId, sessionId: session.id, resized: true });
  });

  $(node, '[data-act="rest"]').addEventListener('click', () => {
    stopTimer();
    ctx.sound('rest');
    ctx.actions.startBreak(session.id);
    ctx.go('break', { sessionId: session.id });
  });

  if (session.timerSeconds) {
    const btn = $(node, `[data-seconds="${session.timerSeconds}"]`);
    if (btn) {
      $$(node, '[data-seconds]').forEach((b) => b.classList.toggle('on', b === btn));
      startTimer(session.timerSeconds);
    }
  }

  return node;
}
