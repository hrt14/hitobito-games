// 宿題モンスター — モンスターのSVG（仕様 8.5 / 12.2）
//
// 丸くて小さく、抱きしめたくなるシルエット。大きな目、短い口、表情が明確。
// 進化差分は「体色 / つの・みみ・はっぱ / 模様 / しっぽ」で作る。

import { colorById, dominantSubject, patternFor } from '../game/growthRules.js';

const DARK = '#3b2f36';

function eyes(expression) {
  const closedHappy = `
    <path d="M68 114 q12 -14 24 0" fill="none" stroke="${DARK}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M108 114 q12 -14 24 0" fill="none" stroke="${DARK}" stroke-width="4.5" stroke-linecap="round"/>`;
  const closedSleep = `
    <path d="M68 110 q12 12 24 0" fill="none" stroke="${DARK}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M108 110 q12 12 24 0" fill="none" stroke="${DARK}" stroke-width="4.5" stroke-linecap="round"/>`;

  if (expression === 'happy' || expression === 'eating' || expression === 'cheer') return closedHappy;
  if (expression === 'sleeping') return closedSleep;

  const big = expression === 'hopeful';
  const rx = big ? 16.5 : 15;
  const ry = big ? 18 : 16.5;
  const sparkle = big
    ? `<circle cx="76" cy="118" r="2.6" fill="#fff" opacity=".9"/>
       <circle cx="116" cy="118" r="2.6" fill="#fff" opacity=".9"/>`
    : '';

  return `
    <g class="hm-eyes">
      <ellipse cx="80" cy="111" rx="${rx}" ry="${ry}" fill="#fffdf8"/>
      <ellipse cx="120" cy="111" rx="${rx}" ry="${ry}" fill="#fffdf8"/>
      <circle cx="82" cy="113" r="8.6" fill="${DARK}"/>
      <circle cx="122" cy="113" r="8.6" fill="${DARK}"/>
      <circle cx="85.5" cy="108.5" r="3.8" fill="#fff"/>
      <circle cx="125.5" cy="108.5" r="3.8" fill="#fff"/>
      ${sparkle}
    </g>`;
}

function brows(expression) {
  if (expression !== 'worried') return '';
  return `
    <path d="M64 90 q12 4 22 10" fill="none" stroke="${DARK}" stroke-width="4" stroke-linecap="round" opacity=".85"/>
    <path d="M136 90 q-12 4 -22 10" fill="none" stroke="${DARK}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`;
}

function mouth(expression) {
  switch (expression) {
    case 'happy':
    case 'cheer':
      return `<path d="M86 140 a14 13 0 0 0 28 0 z" fill="#6b4048"/>
              <ellipse cx="100" cy="150" rx="7" ry="4.2" fill="#ff93a8"/>`;
    case 'eating':
      return `<g class="hm-mouth-eat">
                <path d="M84 138 a16 15 0 0 0 32 0 z" fill="#6b4048"/>
                <ellipse cx="100" cy="150" rx="8" ry="4.6" fill="#ff93a8"/>
              </g>`;
    case 'hopeful':
      return `<ellipse cx="100" cy="146" rx="7.5" ry="8.5" fill="#6b4048"/>`;
    case 'worried':
      return `<path d="M89 150 q11 -9 22 0" fill="none" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>`;
    case 'sleeping':
      return `<path d="M92 144 q8 7 16 0" fill="none" stroke="${DARK}" stroke-width="3.6" stroke-linecap="round"/>`;
    default:
      return `<path d="M91 142 q9 9 18 0" fill="none" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>`;
  }
}

function headPart(variant, palette) {
  if (variant === 'horn') {
    return `<path d="M100 44 L111 74 L89 74 Z" fill="${palette.shade}" stroke="rgba(0,0,0,.06)"/>
            <path d="M100 52 L106 74 L96 74 Z" fill="rgba(255,255,255,.35)"/>`;
  }
  if (variant === 'ear') {
    return `
      <g>
        <ellipse cx="66" cy="70" rx="14" ry="22" fill="${palette.shade}" transform="rotate(-26 66 70)"/>
        <ellipse cx="66" cy="72" rx="7" ry="13" fill="${palette.belly}" transform="rotate(-26 66 72)"/>
        <ellipse cx="134" cy="70" rx="14" ry="22" fill="${palette.shade}" transform="rotate(26 134 70)"/>
        <ellipse cx="134" cy="72" rx="7" ry="13" fill="${palette.belly}" transform="rotate(26 134 72)"/>
      </g>`;
  }
  if (variant === 'leaf') {
    return `
      <g>
        <path d="M100 76 C99 58 108 44 124 40 C127 58 117 72 100 76 Z" fill="#8fd472"/>
        <path d="M100 76 C104 62 112 50 122 44" fill="none" stroke="#5fae4a" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M100 76 q-3 -10 -8 -14" fill="none" stroke="#5fae4a" stroke-width="4" stroke-linecap="round"/>
      </g>`;
  }
  return '';
}

function patternMarks(kind) {
  const spots = [
    [60, 100],
    [140, 100],
    [64, 152],
    [136, 152],
  ];
  const white = 'rgba(255,255,255,.8)';

  if (kind === 'number' || kind === 'alphabet') {
    const glyphs = kind === 'number' ? ['1', '+', '3', '='] : ['A', 'b', 'C', 'e'];
    return spots
      .map(
        ([x, y], i) =>
          `<text x="${x}" y="${y}" font-size="17" font-weight="800" fill="${white}" text-anchor="middle" dominant-baseline="central">${glyphs[i]}</text>`,
      )
      .join('');
  }
  if (kind === 'spark') {
    return spots
      .map(
        ([x, y]) =>
          `<path d="M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z" fill="${white}"/>`,
      )
      .join('');
  }
  if (kind === 'circle') {
    return spots
      .map(
        ([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="7.5" fill="none" stroke="${white}" stroke-width="3"/>`,
      )
      .join('');
  }
  if (kind === 'rainbow') {
    const colors = ['#ff9ad5', '#7ad4ff', '#ffe066', '#9df5a0'];
    return spots
      .map(
        ([x, y], i) =>
          `<path d="M${x - 8} ${y + 4} a8 8 0 0 1 16 0" fill="none" stroke="${colors[i]}" stroke-width="4" stroke-linecap="round"/>`,
      )
      .join('');
  }
  return spots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${white}"/>`).join('');
}

function eggBody(cracked) {
  const cracks = cracked
    ? `
      <ellipse cx="100" cy="128" rx="32" ry="22" fill="rgba(66,48,54,.22)"/>
      <g class="hm-peek">
        <ellipse cx="88" cy="126" rx="10.5" ry="11.5" fill="#fffdf8"/>
        <ellipse cx="112" cy="126" rx="10.5" ry="11.5" fill="#fffdf8"/>
        <circle cx="89" cy="128" r="6" fill="${DARK}"/>
        <circle cx="113" cy="128" r="6" fill="${DARK}"/>
        <circle cx="91.5" cy="124.5" r="2.6" fill="#fff"/>
        <circle cx="115.5" cy="124.5" r="2.6" fill="#fff"/>
      </g>
      <path d="M62 102 L76 93 L88 105 L100 92 L112 105 L125 94 L138 101"
            fill="none" stroke="#c2a97f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M100 92 L105 78 L97 68" fill="none" stroke="#c2a97f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`
    : '';

  return `
    <g class="hm-egg">
      <ellipse cx="100" cy="116" rx="54" ry="66" fill="#fdf7ea"/>
      <ellipse cx="86" cy="98" rx="22" ry="28" fill="#fffefb" opacity=".7"/>
      <ellipse cx="76" cy="140" rx="7" ry="5" fill="#efe2c6"/>
      <ellipse cx="120" cy="152" rx="9" ry="6" fill="#efe2c6"/>
      <ellipse cx="122" cy="86" rx="6" ry="4.5" fill="#efe2c6"/>
      ${cracks}
    </g>`;
}

/**
 * モンスターのSVGを返す。
 * @param {object} monster
 * @param {{expression?:string, anim?:string, className?:string}} options
 */
export function monsterSvg(monster, options = {}) {
  const { expression = 'idle', anim = 'idle', className = '' } = options;
  const palette = colorById(monster.color);
  const evolved = monster.stage === 'evolved';
  const scale = evolved ? 1.06 : 1;

  const shadow = `<ellipse cx="100" cy="182" rx="${evolved ? 52 : 46}" ry="9" fill="rgba(90,68,45,.16)"/>`;

  if (monster.stage === 'egg' || monster.stage === 'hatching') {
    return `
      <svg class="hm-mon anim-${anim} ${className}" viewBox="0 0 200 200" role="img" aria-label="モンスターのたまご" xmlns="http://www.w3.org/2000/svg">
        ${shadow}
        <g class="hm-body">${eggBody(monster.stage === 'hatching')}</g>
      </svg>`;
  }

  const tail = evolved
    ? `<path class="hm-tail" d="M142 148 C168 146 186 154 194 174 C172 176 152 168 138 158 Z" fill="${palette.shade}"/>`
    : '';

  const pattern = monster.patternUnlocked
    ? `<g class="hm-pattern" opacity=".85">${patternMarks(patternFor(dominantSubject(monster.subjectBites)))}</g>`
    : '';

  const crown = monster.crown
    ? `<path d="M80 ${monster.partVariant ? 34 : 56} l6 -16 14 11 14 -11 6 16 z" transform="translate(0,0)" fill="#ffd35c" stroke="#e0a828" stroke-width="2" stroke-linejoin="round"/>`
    : '';

  const sparkle = monster.sparkle
    ? `<g class="hm-sparkle">
         <circle cx="42" cy="72" r="3.4" fill="#ffe98a"/>
         <circle cx="162" cy="88" r="3" fill="#9ee8ff"/>
         <circle cx="150" cy="46" r="2.6" fill="#ffb8e6"/>
       </g>`
    : '';

  return `
    <svg class="hm-mon anim-${anim} ${className}" viewBox="0 0 200 200" role="img" aria-label="モンスター" xmlns="http://www.w3.org/2000/svg">
      ${shadow}
      ${tail}
      <g class="hm-body" style="--hm-scale:${scale}">
        <ellipse cx="76" cy="172" rx="17" ry="10" fill="${palette.shade}"/>
        <ellipse cx="124" cy="172" rx="17" ry="10" fill="${palette.shade}"/>
        <ellipse class="hm-arm hm-arm-l" cx="46" cy="130" rx="13" ry="17" fill="${palette.shade}"/>
        <ellipse class="hm-arm hm-arm-r" cx="154" cy="130" rx="13" ry="17" fill="${palette.shade}"/>
        <ellipse cx="100" cy="122" rx="57" ry="53" fill="${palette.body}"/>
        <ellipse cx="100" cy="138" rx="35" ry="31" fill="${palette.belly}" opacity=".92"/>
        ${pattern}
        ${headPart(monster.partVariant, palette)}
        ${crown}
        <ellipse cx="62" cy="133" rx="9.5" ry="6" fill="rgba(255,105,140,.35)"/>
        <ellipse cx="138" cy="133" rx="9.5" ry="6" fill="rgba(255,105,140,.35)"/>
        ${brows(expression)}
        ${eyes(expression)}
        ${mouth(expression)}
      </g>
      ${sparkle}
    </svg>`;
}

/** ふきだし付きで鳴き声を出したいときに使う小さな吹き出し */
export function speechBubble(text) {
  return `<div class="hm-bubble">${text}</div>`;
}
