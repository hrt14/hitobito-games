// S05 宿題カット画面（仕様 6.3 / 7 / 15）
// 大きすぎる宿題を、プレイヤー自身が食べられる大きさに切り分ける。

import { el, $, $$, esc } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { SUBJECTS, SIZE_META, templatesFor } from '../game/biteTemplates.js';
import {
  wholeTemplate,
  defaultTemplate,
  templateForSize,
  nextSmaller,
  getSmallerBites,
  describeBite,
  customBite,
  reviveBite,
} from '../game/biteEngine.js';
import { monsterSvg } from '../ui/monster.js';
import { foodSvg, homeworkFoodSvg } from '../ui/food.js';
import { topBar, biteCard, burstSparks } from './parts.js';

export function chunkScreen(ctx) {
  const state = ctx.state();
  const params = state.ui.params;
  const homework = ctx.actions.findHomework(params.homeworkId);

  if (!homework) {
    ctx.go('home', {});
    return el('<section class="screen"></section>');
  }

  const category = homework.category || 'problem';
  const subjectMeta = SUBJECTS.find((s) => s.id === homework.subject) || SUBJECTS[5];
  const session = params.sessionId ? ctx.actions.findSession(params.sessionId) : null;

  // モード：first（初回の巨大な宿題）/ resized（まだ大きい からの切り直し）/ normal
  let mode = params.first ? 'first' : params.resized ? 'resized' : 'normal';
  let bite = params.first
    ? wholeTemplate(category)
    : params.resized && session
      ? reviveBite(session)
      : defaultTemplate(category);

  const node = el(`
    <section class="screen">
      ${topBar({ back: true, title: esc(homework.title || `${subjectMeta.label}の宿題`) })}
      <p class="lead" id="lead"></p>
      <p class="sub" id="sub"></p>
      <div class="chunk-stage">
        <div class="stage-art">
          <div class="food-wrap" id="food"></div>
          <div class="mon-side" id="mon"></div>
        </div>
        <div class="cut-flash" id="flash"></div>
      </div>
      <div id="panel"></div>
      <div class="actions" id="actions"></div>
    </section>`);

  const leadEl = $(node, '#lead');
  const subEl = $(node, '#sub');
  const foodEl = $(node, '#food');
  const monEl = $(node, '#mon');
  const panelEl = $(node, '#panel');
  const actionsEl = $(node, '#actions');

  function copyFor() {
    if (mode === 'first') return [COPY.chunk.tooBig, COPY.chunk.makeBite];
    if (mode === 'resized') return [COPY.resize.heading, COPY.resize.sub];
    if (bite.hierarchyLevel <= 1) return [COPY.chunk.heading, COPY.chunk.makeBite];
    if (bite.size === 'fragment') return [COPY.chunk.justOpen, ''];
    if (bite.size === 'bite') return [COPY.chunk.oneQuestion, ''];
    return [COPY.chunk.heading, ''];
  }

  function paintStage() {
    const info = describeBite(bite);
    const [lead, sub] = copyFor();
    leadEl.textContent = lead;
    subEl.textContent = sub;

    foodEl.className = `food-wrap size-${info.foodScale === 'giant' ? 'giant' : info.foodScale} food-float`;
    foodEl.innerHTML =
      info.foodScale === 'giant'
        ? homeworkFoodSvg(homework.subject, { label: `${subjectMeta.short}の宿題` })
        : foodSvg(homework.subject, info.foodScale);

    const expression = info.reaction === 'struggle' ? 'worried' : info.reaction === 'hopeful' ? 'hopeful' : 'happy';
    const anim = info.reaction === 'struggle' ? 'struggle' : info.reaction === 'hopeful' ? 'hopeful' : 'happy';
    monEl.innerHTML = `<div class="mon-wrap">${monsterSvg(ctx.state().monster, { expression, anim })}</div>`;
  }

  function goFocus(nextBite, { resize = false } = {}) {
    const target = resize && session
      ? ctx.actions.resizeBite(session.id, nextBite)
      : ctx.actions.selectBite(homework.id, nextBite, { sessionId: ctx.state().activeSessionId });
    ctx.go('focus', { sessionId: target.id });
  }

  function cut(nextBite, after) {
    ctx.sound('slice');
    const flash = $(node, '#flash');
    flash.classList.remove('on');
    void flash.offsetWidth;
    flash.classList.add('on');
    bite = nextBite;
    paintStage();
    if (after) setTimeout(after, 380);
  }

  // ---- パネル（現在のひとくち / 候補 / 初回の3択） ----

  function paintFirst() {
    const list = templatesFor(category);
    const primary = defaultTemplate(category);
    const light = list.find((t) => t.size === 'fragment') || list[list.length - 1];

    panelEl.innerHTML = `
      <div class="actions" style="padding-top:0">
        <button class="btn btn-go" data-pick="primary" type="button">${esc(primary.label)}　<small style="font-size:13px">おすすめ</small></button>
        <button class="btn btn-secondary" data-pick="light" type="button">${esc(light.label)}</button>
        <button class="btn btn-secondary" data-pick="smaller" type="button">${COPY.chunk.smaller}する</button>
      </div>`;
    actionsEl.innerHTML = '';

    $(panelEl, '[data-pick="primary"]').addEventListener('click', () => cut(primary, () => goFocus(primary)));
    $(panelEl, '[data-pick="light"]').addEventListener('click', () => cut(light, () => goFocus(light)));
    $(panelEl, '[data-pick="smaller"]').addEventListener('click', () => {
      const smaller = getSmallerBites(light)[0] || light;
      mode = 'normal';
      cut(smaller, paintPanel);
    });
  }

  function paintResized() {
    const current = session ? reviveBite(session) : bite;
    const candidates = getSmallerBites(current);

    panelEl.innerHTML = candidates.length
      ? `<div class="actions" style="padding-top:0">
           ${candidates
             .map(
               (c, i) => `
             <button class="btn ${i === 0 ? 'btn-go' : 'btn-secondary'}" data-cand="${c.id}" type="button">
               ${esc(c.label)}　<small style="font-size:13px;font-weight:800">${esc(SIZE_META[c.size].label)}</small>
             </button>`,
             )
             .join('')}
         </div>`
      : `<div class="field">
           <label for="own-bite">${COPY.chunk.customPrompt}</label>
           <input id="own-bite" type="text" maxlength="20" placeholder="${esc(COPY.chunk.customPlaceholder)}">
         </div>`;

    actionsEl.innerHTML = candidates.length
      ? ''
      : `<button class="btn btn-go" data-act="own-go" type="button">${COPY.chunk.confirm}</button>`;

    $$(panelEl, '[data-cand]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = candidates.find((c) => c.id === btn.dataset.cand);
        ctx.sound('sparkle');
        burstSparks(node.querySelector('.chunk-stage'), 12);
        cut(picked, () => goFocus(picked, { resize: true }));
      });
    });

    const ownGo = $(actionsEl, '[data-act="own-go"]');
    if (ownGo) {
      ownGo.addEventListener('click', () => {
        const value = $(panelEl, '#own-bite').value.trim();
        if (!value) return;
        const picked = customBite(category, value, current.hierarchyLevel);
        ctx.sound('sparkle');
        cut(picked, () => goFocus(picked, { resize: true }));
      });
    }
  }

  function paintNormal() {
    const smaller = nextSmaller(bite);
    panelEl.innerHTML = `
      ${biteCard(bite)}
      <div class="size-row" style="margin-top:10px">
        ${Object.values(SIZE_META)
          .map(
            (s) => `
          <button data-size="${s.id}" class="${bite.size === s.id ? 'on' : ''}" type="button">
            ${esc(s.label)}<small>${esc(s.hint)}</small>
          </button>`,
          )
          .join('')}
      </div>`;

    actionsEl.innerHTML = `
      <button class="btn btn-go" data-act="confirm" type="button">${COPY.chunk.confirm}</button>
      ${
        smaller
          ? `<button class="btn btn-secondary" data-act="smaller" type="button">✂ ${COPY.chunk.smaller}</button>`
          : `<p class="sub" style="margin:2px 0 0">${COPY.chunk.smallest}</p>`
      }`;

    $$(panelEl, '[data-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = templateForSize(category, btn.dataset.size);
        ctx.sound('tap');
        cut(picked, paintPanel);
      });
    });

    $(actionsEl, '[data-act="confirm"]').addEventListener('click', () => {
      ctx.sound('tap');
      goFocus(bite);
    });

    const smallerBtn = $(actionsEl, '[data-act="smaller"]');
    if (smallerBtn) {
      smallerBtn.addEventListener('click', () => {
        burstSparks(node.querySelector('.chunk-stage'), 8);
        cut(smaller, paintPanel);
      });
    }
  }

  function paintPanel() {
    paintStage();
    if (mode === 'first') paintFirst();
    else if (mode === 'resized') paintResized();
    else paintNormal();
  }

  $(node, '[data-act="back"]').addEventListener('click', () => ctx.go('home', {}));

  if (mode === 'resized') {
    // まず「大きさをはかる」演出。責める音や表情は出さない。
    paintStage();
    leadEl.textContent = COPY.resize.measuring;
    subEl.textContent = '';
    panelEl.innerHTML = '';
    actionsEl.innerHTML = '';
    setTimeout(() => {
      if (node.isConnected) paintPanel();
    }, 900);
  } else {
    paintPanel();
  }

  return node;
}
