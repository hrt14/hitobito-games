// 画面で共通に使う小さな部品

import { esc } from '../ui/dom.js';
import { SIZE_META } from '../game/biteTemplates.js';

export function topBar({ back = false, title = '', right = '' } = {}) {
  return `
    <div class="topbar">
      ${back ? '<button class="icon-btn" data-act="back" type="button" aria-label="戻る">←</button>' : '<span></span>'}
      <span class="title">${esc(title)}</span>
      ${right || '<span style="min-width:46px"></span>'}
    </div>`;
}

export function sizeBadge(size) {
  const meta = SIZE_META[size] || SIZE_META.bite;
  return `<span class="size-badge ${meta.id}">${esc(meta.label)}</span>`;
}

export function biteCard(bite, { label = 'いまのひとくち' } = {}) {
  return `
    <div class="bite-card">
      <span class="label">${esc(label)}</span>
      <span class="value">${esc(bite.label)}</span>
      ${sizeBadge(bite.size)}
    </div>`;
}

/** キラキラの粒を飛ばす（小さくできたとき・成長したとき） */
export function burstSparks(host, count = 10) {
  const wrap = document.createElement('div');
  wrap.className = 'spark-burst';
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const dist = 42 + Math.random() * 34;
    const dot = document.createElement('i');
    dot.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    dot.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    dot.style.animationDelay = `${Math.random() * 0.12}s`;
    wrap.appendChild(dot);
  }
  host.appendChild(wrap);
  setTimeout(() => wrap.remove(), 900);
}

/** 画面が消えたあとにタイマーが走り続けないようにする */
export function safeTimeout(node, fn, ms) {
  const id = setTimeout(() => {
    if (node.isConnected) fn();
  }, ms);
  return () => clearTimeout(id);
}
