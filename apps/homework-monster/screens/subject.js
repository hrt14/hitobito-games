// S03 宿題の種類を選ぶ

import { el, $, $$, esc } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { SUBJECTS } from '../game/biteTemplates.js';
import { foodSvg } from '../ui/food.js';
import { foodFor } from '../game/foodRules.js';
import { topBar } from './parts.js';

export function subjectScreen(ctx) {
  const state = ctx.state();
  const last = [...state.homework].reverse().find((h) => h.status === 'active');

  const continueCard = last
    ? `<button class="pick-card pick-wide" data-continue="${esc(last.id)}" type="button">
         <span class="tag">${COPY.subject.continueLabel}</span>
         <span>${esc(last.title || SUBJECTS.find((s) => s.id === last.subject)?.label || '宿題')}</span>
         <span>→</span>
       </button>`
    : '';

  const node = el(`
    <section class="screen">
      ${topBar({ back: true, title: COPY.subject.heading })}
      <div class="stage" style="justify-content:center;padding:8px 0">
        <div class="card-grid" style="width:100%">
          ${continueCard}
          ${SUBJECTS.map(
            (s) => `
            <button class="pick-card" data-subject="${s.id}" type="button">
              <span class="food-wrap" style="width:48px">${foodSvg(s.id, 'small')}</span>
              <span>${esc(s.label)}</span>
              <small style="font-size:12px;font-weight:700;color:var(--muted)">${esc(foodFor(s.id).name)}</small>
            </button>`,
          ).join('')}
        </div>
      </div>
    </section>`);

  $(node, '[data-act="back"]').addEventListener('click', () => ctx.go('home', {}));

  const cont = $(node, '[data-continue]');
  if (cont) {
    cont.addEventListener('click', () => {
      ctx.sound('tap');
      ctx.go('chunk', { homeworkId: last.id });
    });
  }

  $$(node, '[data-subject]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.sound('tap');
      ctx.go('input', { subject: btn.dataset.subject, first: ctx.state().ui.params.first });
    });
  });

  return node;
}
