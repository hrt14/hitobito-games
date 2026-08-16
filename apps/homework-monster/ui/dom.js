// 宿題モンスター — DOMヘルパーとふりがな

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

/** HTML文字列から要素を作る */
export function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export function $(root, selector) {
  return root.querySelector(selector);
}

export function $$(root, selector) {
  return Array.from(root.querySelectorAll(selector));
}

export function on(root, selector, handler) {
  const node = root.querySelector(selector);
  if (node) node.addEventListener('click', handler);
  return node;
}

/**
 * ふりがな辞書。読みが一意に決まる語だけを入れる。
 * 設定で ON のときだけ <ruby> に置き換える（仕様 17）。
 */
const FURIGANA = [
  ['宿題', 'しゅくだい'],
  ['問題文', 'もんだいぶん'],
  ['問題', 'もんだい'],
  ['教科書', 'きょうかしょ'],
  ['教材', 'きょうざい'],
  ['算数', 'さんすう'],
  ['数学', 'すうがく'],
  ['国語', 'こくご'],
  ['英語', 'えいご'],
  ['理科', 'りか'],
  ['社会', 'しゃかい'],
  ['名前', 'なまえ'],
  ['鉛筆', 'えんぴつ'],
  ['日付', 'ひづけ'],
  ['段落', 'だんらく'],
  ['部屋', 'へや'],
  ['模様', 'もよう'],
  ['成長', 'せいちょう'],
  ['進化', 'しんか'],
  ['記録', 'きろく'],
  ['設定', 'せってい'],
  ['全部', 'ぜんぶ'],
  ['半分', 'はんぶん'],
  ['道具', 'どうぐ'],
  ['最初', 'さいしょ'],
  ['文字', 'もじ'],
  ['一口', 'ひとくち'],
  ['大', 'おお'],
  ['小', 'ちい'],
  ['机', 'つくえ'],
  ['本', 'ほん'],
  ['声', 'こえ'],
  ['色', 'いろ'],
  ['体', 'からだ'],
  ['数', 'かず'],
  ['音', 'おと'],
  ['頭', 'あたま'],
  ['今日', 'きょう'],
  ['前回', 'ぜんかい'],
  ['今回', 'こんかい'],
  ['回数', 'かいすう'],
];

const FURIGANA_RE = new RegExp(FURIGANA.map(([word]) => word).join('|'), 'g');
const READINGS = new Map(FURIGANA);

/** テキストノードを走査して、辞書にある語だけルビにする */
export function applyFurigana(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('ruby, input, textarea, svg, .no-ruby')) return NodeFilter.FILTER_REJECT;
      return FURIGANA_RE.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const targets = [];
  while (walker.nextNode()) targets.push(walker.currentNode);

  for (const node of targets) {
    const html = esc(node.nodeValue).replace(
      FURIGANA_RE,
      (word) => `<ruby>${word}<rt>${READINGS.get(word)}</rt></ruby>`,
    );
    const holder = document.createElement('span');
    holder.innerHTML = html;
    node.replaceWith(holder);
  }
}

/** JSONをファイルとして書き出す */
export function downloadJson(filename, json) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 画面上に短いお知らせを出す */
export function toast(message) {
  const host = document.getElementById('toast');
  if (!host) return;
  host.textContent = message;
  host.classList.add('show');
  clearTimeout(host._timer);
  host._timer = setTimeout(() => host.classList.remove('show'), 2400);
}
