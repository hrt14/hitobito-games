// S08 成長リザルト
// 文章は自動で消さない。ユーザーが読んで進める。

import { el, $, $$, esc } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { monsterSvg } from '../ui/monster.js';
import { MILESTONES, EXTRA_MILESTONES, COLOR_CHOICES, PART_CHOICES } from '../game/growthRules.js';
import { SUBJECTS } from '../game/biteTemplates.js';
import { achievementLine } from '../game/foodRules.js';

const ALL = [...MILESTONES, ...EXTRA_MILESTONES];

export function resultScreen(ctx) {
  const state = ctx.state();
  const last = state.lastResult;
  const pending = state.pendingMilestone;

  if (!last) {
    ctx.go('home', {});
    return el('<section class="screen"></section>');
  }

  const milestone = ALL.find((m) => m.id === last.milestoneId) || null;
  const subjectMeta = SUBJECTS.find((s) => s.id === last.subject) || SUBJECTS[5];
  const grew = milestone && !pending;

  const node = el(`
    <section class="screen">
      <div class="stage">
        ${milestone ? '<div class="result-burst"></div>' : ''}
        <div class="mon-wrap">${monsterSvg(state.monster, {
          expression: 'happy',
          anim: milestone ? 'grow' : 'happy',
        })}</div>
        ${
          milestone
            ? `<div class="unlock-card">
                 <span class="kicker">${COPY.result.grewLabel}</span>
                 <b>${esc(milestone.title)}</b>
                 <p>${esc(milestone.line)}</p>
               </div>`
            : `<div class="hm-bubble">${esc(COPY.result.heading)}</div>`
        }
        ${
          last.feast
            ? `<div class="unlock-card" style="border-color:var(--primary)">
                 <span class="kicker">ごちそう</span>
                 <b>宿題ぜんぶ、たべおわった！</b>
               </div>`
            : ''
        }
      </div>

      <p class="did-line">${esc(achievementLine(subjectMeta.short, last.biteLabel))}</p>

      <div class="actions" id="actions"></div>
    </section>`);

  const actions = $(node, '#actions');

  function paintCta() {
    actions.innerHTML = `
      <button class="btn btn-primary" data-act="more" type="button">${COPY.result.more}</button>
      <button class="btn btn-secondary" data-act="finish" type="button">${COPY.result.finish}</button>`;

    $(actions, '[data-act="more"]').addEventListener('click', () => {
      ctx.sound('tap');
      // 宿題そのものが終わっていたら、次はどの宿題にするかから選ぶ
      const homework = ctx.actions.findHomework(last.homeworkId);
      if (!homework || homework.status !== 'active') ctx.go('subject', {});
      else ctx.go('chunk', { homeworkId: last.homeworkId });
    });
    $(actions, '[data-act="finish"]').addEventListener('click', () => {
      ctx.sound('tap');
      ctx.actions.endSession();
      ctx.go('end', {});
    });
  }

  function paintInteraction() {
    if (pending.id === 'color') {
      actions.innerHTML = `
        <p class="sub">${COPY.result.colorPrompt}</p>
        <div class="choice-row">
          ${COLOR_CHOICES.map(
            (c) => `<button class="color-swatch" data-color="${c.id}" type="button"
                      style="background:${c.body}">${esc(c.label)}</button>`,
          ).join('')}
        </div>`;
      $$(actions, '[data-color]').forEach((btn) => {
        btn.addEventListener('click', () => {
          ctx.sound('sparkle');
          ctx.actions.applyMilestoneChoice('color', btn.dataset.color);
          ctx.rerender();
        });
      });
      return;
    }

    if (pending.id === 'part') {
      actions.innerHTML = `
        <p class="sub">${esc(milestone?.line || '')}</p>
        <div class="choice-row">
          ${PART_CHOICES.map(
            (p) => `<button class="btn btn-secondary" data-part="${p.id}" type="button" style="min-height:64px">${esc(p.label)}</button>`,
          ).join('')}
        </div>`;
      $$(actions, '[data-part]').forEach((btn) => {
        btn.addEventListener('click', () => {
          ctx.sound('sparkle');
          ctx.actions.applyMilestoneChoice('part', btn.dataset.part);
          ctx.rerender();
        });
      });
      return;
    }

    // 名前をつける
    actions.innerHTML = `
      <div class="field">
        <label for="mon-name">${COPY.result.namePrompt}</label>
        <input id="mon-name" type="text" maxlength="12" placeholder="${esc(COPY.result.namePlaceholder)}" autocomplete="off">
      </div>
      <button class="btn btn-primary" data-act="name-go" type="button">${COPY.result.nameConfirm}</button>
      <button class="btn btn-quiet" data-act="name-skip" type="button">${COPY.result.nameSkip}</button>`;

    $(actions, '[data-act="name-go"]').addEventListener('click', () => {
      const value = $(actions, '#mon-name').value.trim();
      ctx.sound('sparkle');
      ctx.actions.applyMilestoneChoice('name', value);
      ctx.rerender();
    });
    $(actions, '[data-act="name-skip"]').addEventListener('click', () => {
      ctx.actions.clearPendingMilestone();
      ctx.rerender();
    });
  }

  if (pending) paintInteraction();
  else paintCta();

  if (grew) ctx.sound('growth');
  else ctx.sound('complete');

  return node;
}
