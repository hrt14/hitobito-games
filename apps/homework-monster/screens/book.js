// ずかん — どの教科のごはんを食べたことがあるか

import { el, $ } from '../ui/dom.js';
import { COPY } from '../game/copy.js';
import { SUBJECTS } from '../game/biteTemplates.js';
import { foodFor } from '../game/foodRules.js';
import { foodSvg } from '../ui/food.js';
import { topBar } from './parts.js';

export function bookScreen(ctx) {
  const { monster } = ctx.state();

  const node = el(`
    <section class="screen" data-scroll="true">
      ${topBar({ back: true, title: COPY.home.bookBtn })}
      <p class="sub" style="margin:10px 0 4px">食べたごはんが、体のもようになる。</p>
      <div class="food-collection" style="margin-top:10px">
        ${SUBJECTS.map((s) => {
          const count = monster.subjectBites[s.id] || 0;
          const food = foodFor(s.id);
          return `
            <div class="food-cell ${count ? '' : 'empty'}">
              <span class="food-wrap">${count ? foodSvg(s.id, 'medium') : '<span style="font-size:34px">？</span>'}</span>
              <small>${food.name}</small>
              <b>${count}</b>
            </div>`;
        }).join('')}
      </div>
      <div class="actions">
        <button class="btn btn-secondary" data-act="home" type="button">${COPY.common.back}</button>
      </div>
    </section>`);

  const back = () => ctx.go('home', {});
  $(node, '[data-act="back"]').addEventListener('click', back);
  $(node, '[data-act="home"]').addEventListener('click', back);

  return node;
}
