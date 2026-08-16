// 宿題モンスター — ひとくちテンプレート（仕様 7.2 / 15）
//
// hierarchyLevel は「数字が大きいほど小さい行動」。
// reduces は「宿題の残量を減らせる行動か」。着手行動（見る・開く）では減らさない。

export const SUBJECTS = [
  { id: 'math', label: '算数・数学', short: '算数', icon: '➕' },
  { id: 'japanese', label: '国語', short: '国語', icon: '✍️' },
  { id: 'english', label: '英語', short: '英語', icon: 'A' },
  { id: 'science', label: '理科', short: '理科', icon: '🔬' },
  { id: 'social', label: '社会', short: '社会', icon: '🗺️' },
  { id: 'other', label: 'その他', short: 'その他', icon: '⭐' },
];

// 「おおまかな宿題量」の選択肢（仕様 6.2）。カテゴリと単位に対応させる。
export const HOMEWORK_KINDS = [
  { id: 'problem', label: '問題がある', category: 'problem', unit: 'question', unitLabel: '問' },
  { id: 'page', label: 'ページがある', category: 'problem', unit: 'page', unitLabel: 'ページ' },
  { id: 'reading', label: '読む宿題', category: 'reading', unit: 'page', unitLabel: 'ページ' },
  { id: 'writing', label: '書く宿題', category: 'writing', unit: 'line', unitLabel: '行' },
  { id: 'memorizing', label: '覚える宿題', category: 'memorizing', unit: 'custom', unitLabel: '個' },
  { id: 'custom', label: '自分で入力', category: 'generic', unit: 'custom', unitLabel: '' },
];

export const SIZE_META = {
  fragment: { id: 'fragment', label: 'ひとかけら', hint: '開く、見る、持つ', growth: 1 },
  bite: { id: 'bite', label: 'ひとくち', hint: '1問、1行、1分', growth: 2 },
  solid_bite: { id: 'solid_bite', label: 'しっかり一口', hint: '2〜5問、1ページ、5分', growth: 3 },
};

const t = (id, category, label, size, level, seconds, reduces) => ({
  id,
  subjectCategory: category,
  label,
  size,
  hierarchyLevel: level,
  estimatedSeconds: seconds,
  reduces: reduces || null,
});

export const BITE_TEMPLATES = [
  // 問題を解く宿題
  t('p1', 'problem', '宿題を全部やる', 'solid_bite', 1, 1800, { unit: 'all' }),
  t('p2', 'problem', '1ページやる', 'solid_bite', 2, 600, { unit: 'page', amount: 1 }),
  t('p3', 'problem', '3問やる', 'solid_bite', 3, 300, { unit: 'question', amount: 3 }),
  t('p4', 'problem', '1問やる', 'bite', 4, 90, { unit: 'question', amount: 1 }),
  t('p5', 'problem', '問題文を読む', 'bite', 5, 30, null),
  t('p6', 'problem', '問題を見る', 'fragment', 6, 10, null),
  t('p7', 'problem', 'ノートを開く', 'fragment', 7, 10, null),
  t('p8', 'problem', '教材を机に置く', 'fragment', 8, 10, null),
  t('p9', 'problem', '机に座る', 'fragment', 9, 5, null),

  // 読む宿題
  t('r1', 'reading', '全部読む', 'solid_bite', 1, 1800, { unit: 'all' }),
  t('r2', 'reading', '1章読む', 'solid_bite', 2, 900, null),
  t('r3', 'reading', '1ページ読む', 'solid_bite', 3, 300, { unit: 'page', amount: 1 }),
  t('r4', 'reading', '1段落読む', 'bite', 4, 60, null),
  t('r5', 'reading', '1行読む', 'bite', 5, 20, { unit: 'line', amount: 1 }),
  t('r6', 'reading', '本を開く', 'fragment', 6, 10, null),
  t('r7', 'reading', '本を持ってくる', 'fragment', 7, 15, null),

  // 書く宿題
  t('w1', 'writing', '全部書く', 'solid_bite', 1, 1800, { unit: 'all' }),
  t('w2', 'writing', '1ページ書く', 'solid_bite', 2, 900, { unit: 'page', amount: 1 }),
  t('w3', 'writing', '3行書く', 'solid_bite', 3, 240, { unit: 'line', amount: 3 }),
  t('w4', 'writing', '1行書く', 'bite', 4, 80, { unit: 'line', amount: 1 }),
  t('w5', 'writing', '最初の1文字を書く', 'bite', 5, 20, null),
  t('w6', 'writing', '日付を書く', 'fragment', 6, 15, null),
  t('w7', 'writing', 'ノートを開く', 'fragment', 7, 10, null),
  t('w8', 'writing', '鉛筆を持つ', 'fragment', 8, 5, null),

  // 暗記・練習
  t('m1', 'memorizing', '全部覚える', 'solid_bite', 1, 1800, { unit: 'all' }),
  t('m2', 'memorizing', '5個見る', 'solid_bite', 2, 180, { unit: 'custom', amount: 5 }),
  t('m3', 'memorizing', '1個覚える', 'bite', 3, 60, { unit: 'custom', amount: 1 }),
  t('m4', 'memorizing', '1個声に出す', 'bite', 4, 20, null),
  t('m5', 'memorizing', '1個見る', 'fragment', 5, 10, null),
  t('m6', 'memorizing', '教材を開く', 'fragment', 6, 10, null),

  // その他（自由入力の宿題）
  t('g1', 'generic', '宿題を全部やる', 'solid_bite', 1, 1800, { unit: 'all' }),
  t('g2', 'generic', '半分だけやる', 'solid_bite', 2, 900, null),
  t('g3', 'generic', '5分だけやる', 'solid_bite', 3, 300, null),
  t('g4', 'generic', '1分だけやる', 'bite', 4, 60, null),
  t('g5', 'generic', 'ひとつだけやる', 'bite', 5, 45, { unit: 'custom', amount: 1 }),
  t('g6', 'generic', '道具を出す', 'fragment', 6, 15, null),
  t('g7', 'generic', '机に座る', 'fragment', 7, 5, null),
];

export function templatesFor(category) {
  return BITE_TEMPLATES.filter((tpl) => tpl.subjectCategory === category).sort(
    (a, b) => a.hierarchyLevel - b.hierarchyLevel,
  );
}

export function templateById(id) {
  return BITE_TEMPLATES.find((tpl) => tpl.id === id) || null;
}
