// S04 宿題を登録する
// 正確な入力は必須にしない。教科だけでも進める。

import { el, $, $$, esc } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { SUBJECTS, HOMEWORK_KINDS } from '../game/biteTemplates.js';
import { topBar } from './parts.js';

export function inputScreen(ctx) {
  const params = ctx.state().ui.params;
  const subject = params.subject || 'other';
  const subjectMeta = SUBJECTS.find((s) => s.id === subject) || SUBJECTS[5];

  let kindId = 'problem';
  let amount = null;

  const node = el(`
    <section class="screen">
      ${topBar({ back: true, title: `${subjectMeta.label}の宿題` })}
      <div class="stage" style="justify-content:flex-start;gap:16px;padding-top:6px">
        <h1 class="heading" style="width:100%">${COPY.input.heading}</h1>

        <div class="field" style="width:100%">
          <label for="hw-title">${COPY.input.titleLabel}</label>
          <input id="hw-title" type="text" maxlength="24" placeholder="${esc(COPY.input.titlePlaceholder)}" autocomplete="off">
        </div>

        <div class="field" style="width:100%">
          <label>${COPY.input.kindLabel}</label>
          <div class="card-grid">
            ${HOMEWORK_KINDS.map(
              (k) => `
              <button class="pick-card ${k.id === kindId ? 'on' : ''}" data-kind="${k.id}" type="button"
                      style="min-height:62px;font-size:17px">${esc(k.label)}</button>`,
            ).join('')}
          </div>
        </div>

        <div class="field" style="width:100%" id="amount-field">
          <label for="hw-amount">${COPY.input.amountLabel}</label>
          <div class="amount-row">
            <button class="step-btn" data-step="-1" type="button" aria-label="へらす">−</button>
            <input id="hw-amount" type="number" inputmode="numeric" min="0" max="999" placeholder="—">
            <span class="unit" id="unit-label"></span>
            <button class="step-btn" data-step="1" type="button" aria-label="ふやす">＋</button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" data-act="go" type="button">${COPY.input.cta}</button>
      </div>
    </section>`);

  const amountInput = $(node, '#hw-amount');
  const unitLabel = $(node, '#unit-label');
  const amountField = $(node, '#amount-field');

  function syncKind() {
    const kind = HOMEWORK_KINDS.find((k) => k.id === kindId);
    unitLabel.textContent = kind.unitLabel || '';
    amountField.classList.toggle('hidden', !kind.unitLabel);
  }

  $$(node, '[data-kind]').forEach((btn) => {
    btn.addEventListener('click', () => {
      kindId = btn.dataset.kind;
      $$(node, '[data-kind]').forEach((b) => b.classList.toggle('on', b === btn));
      syncKind();
      ctx.sound('tap');
    });
  });

  $$(node, '[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = Number(btn.dataset.step);
      const current = Number(amountInput.value) || 0;
      const next = Math.max(0, Math.min(999, current + step));
      amountInput.value = next ? String(next) : '';
      ctx.sound('tap');
    });
  });

  $(node, '[data-act="back"]').addEventListener('click', () => ctx.go('subject', {}));

  $(node, '[data-act="go"]').addEventListener('click', () => {
    amount = Number(amountInput.value) || null;
    const homework = ctx.actions.createHomework({
      subject,
      title: $(node, '#hw-title').value.trim(),
      kindId,
      amount,
    });
    ctx.sound('tap');
    ctx.go('chunk', { homeworkId: homework.id, first: Boolean(params.first) });
  });

  syncKind();
  return node;
}
