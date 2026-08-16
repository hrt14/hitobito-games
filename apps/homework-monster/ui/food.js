// 宿題モンスター — 食べ物のSVG（仕様 8.2 / 8.3）

import { foodFor, FOOD_SIZE } from '../game/foodRules.js';
import { esc } from './dom.js';

let uidCounter = 0;
const uid = () => `hmf${(uidCounter += 1)}`;

function shape(kind, food, id) {
  switch (kind) {
    case 'cookie':
      return `
        <circle cx="60" cy="62" r="42" fill="${food.color2}"/>
        <circle cx="60" cy="58" r="42" fill="${food.color}"/>
        <circle cx="46" cy="46" r="6" fill="${food.color2}"/>
        <circle cx="76" cy="42" r="5" fill="${food.color2}"/>
        <circle cx="72" cy="76" r="6.5" fill="${food.color2}"/>
        <circle cx="42" cy="72" r="4.5" fill="${food.color2}"/>
        <text x="60" y="60" font-size="30" font-weight="900" fill="${food.accent}" text-anchor="middle" dominant-baseline="central">7</text>`;
    case 'fruit':
      return `
        <ellipse cx="60" cy="66" rx="40" ry="38" fill="${food.color2}"/>
        <ellipse cx="60" cy="63" rx="40" ry="37" fill="${food.color}"/>
        <ellipse cx="46" cy="48" rx="12" ry="9" fill="${food.accent}" opacity=".55" transform="rotate(-24 46 48)"/>
        <path d="M60 26 C60 12 74 6 84 6 C84 20 74 26 60 28 Z" fill="#7fc75f"/>
        <path d="M60 28 q-2 -10 -6 -14" fill="none" stroke="#5c9c43" stroke-width="4" stroke-linecap="round"/>
        <text x="60" y="70" font-size="26" font-weight="900" fill="${food.accent}" text-anchor="middle" dominant-baseline="central">あ</text>`;
    case 'candy':
      return `
        <path d="M14 62 l16 -14 v28 z" fill="${food.color2}"/>
        <path d="M106 62 l-16 -14 v28 z" fill="${food.color2}"/>
        <ellipse cx="60" cy="62" rx="34" ry="32" fill="${food.color2}"/>
        <ellipse cx="60" cy="59" rx="34" ry="31" fill="${food.color}"/>
        <ellipse cx="48" cy="46" rx="10" ry="7" fill="${food.accent}" opacity=".6" transform="rotate(-22 48 46)"/>
        <text x="60" y="62" font-size="28" font-weight="900" fill="${food.accent}" text-anchor="middle" dominant-baseline="central">A</text>`;
    case 'mushroom':
      return `
        <rect x="49" y="62" width="22" height="40" rx="11" fill="#f6efd8"/>
        <path d="M18 64 a42 36 0 0 1 84 0 z" fill="${food.color2}"/>
        <path d="M18 62 a42 34 0 0 1 84 0 z" fill="${food.color}"/>
        <circle cx="42" cy="44" r="7" fill="${food.accent}"/>
        <circle cx="72" cy="38" r="5.5" fill="${food.accent}"/>
        <circle cx="84" cy="54" r="4.5" fill="${food.accent}"/>
        <circle cx="60" cy="84" r="3.4" fill="${food.color}" opacity=".7"/>`;
    case 'shard':
      return `
        <path d="M60 16 L102 44 L88 98 L32 98 L18 44 Z" fill="${food.color2}"/>
        <path d="M60 20 L98 46 L85 94 L35 94 L22 46 Z" fill="${food.color}"/>
        <path d="M40 52 q12 -8 22 2 q-4 12 -16 10 q-8 -2 -6 -12 Z" fill="${food.accent}" opacity=".85"/>
        <path d="M72 66 q10 -4 12 6 q-6 8 -14 2 Z" fill="${food.accent}" opacity=".85"/>
        <circle cx="66" cy="36" r="4" fill="${food.accent}" opacity=".8"/>`;
    default:
      return `
        <defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ff9ad5"/>
            <stop offset="45%" stop-color="#ffe066"/>
            <stop offset="100%" stop-color="#7ad4ff"/>
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="64" rx="40" ry="38" fill="url(#${id})"/>
        <ellipse cx="46" cy="48" rx="11" ry="8" fill="#fff" opacity=".65" transform="rotate(-24 46 48)"/>
        <text x="60" y="68" font-size="30" font-weight="900" fill="#fff" text-anchor="middle" dominant-baseline="central">?</text>`;
  }
}

/**
 * 教科とサイズから食べ物のSVGを作る。
 * @param {string} subject
 * @param {'small'|'medium'|'large'|'giant'|'feast'} sizeId
 */
export function foodSvg(subject, sizeId = 'medium', options = {}) {
  const food = foodFor(subject);
  const size = FOOD_SIZE[sizeId] || FOOD_SIZE.medium;
  const id = uid();
  const feast = sizeId === 'feast';

  const shine = feast
    ? `<g class="hm-food-shine">
         <circle cx="16" cy="24" r="4" fill="#fff3a8"/>
         <circle cx="104" cy="34" r="3.4" fill="#fff3a8"/>
         <circle cx="96" cy="102" r="3" fill="#fff3a8"/>
       </g>`
    : '';

  return `
    <svg class="hm-food size-${size.id} ${options.className || ''}" viewBox="0 0 120 120"
         role="img" aria-label="${esc(food.name)}" xmlns="http://www.w3.org/2000/svg">
      ${shape(food.kind, food, id)}
      ${shine}
    </svg>`;
}

/**
 * 切り分ける前の「宿題まるごと」。同じ食べ物が山盛りになっていて、
 * ひとくちには大きすぎることが文章なしでも分かる形にする。
 */
export function homeworkFoodSvg(subject, options = {}) {
  const food = foodFor(subject);

  return `
    <svg class="hm-food size-giant ${options.className || ''}" viewBox="0 0 200 200"
         role="img" aria-label="大きすぎる${esc(food.name)}の山" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="188" rx="88" ry="11" fill="rgba(90,68,45,.16)"/>
      <g opacity=".82" transform="translate(-6,74) scale(.74)">${shape(food.kind, food, uid())}</g>
      <g opacity=".82" transform="translate(104,68) scale(.78)">${shape(food.kind, food, uid())}</g>
      <g transform="translate(28,36) scale(1.18)">${shape(food.kind, food, uid())}</g>
      <g>
        <rect x="34" y="2" width="132" height="32" rx="16" fill="#fffaf0" stroke="rgba(120,95,60,.25)" stroke-width="2"/>
        <text x="100" y="19" font-size="17" font-weight="900" fill="#7a6a52" text-anchor="middle" dominant-baseline="central">${esc(options.label || '宿題まるごと')}</text>
      </g>
    </svg>`;
}
