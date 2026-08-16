// 宿題モンスター — 育成ルール（仕様 8）
//
// 原則A：最初の10口は、1口ごとに必ず新しい変化を起こす。
// 原則D：成長してもノルマは増えない。開放条件は「累計ひとくち数」だけ。

import { SIZE_META } from './biteTemplates.js';

export const COLOR_CHOICES = [
  { id: 'sakura', label: 'さくら', body: '#ffb3c7', shade: '#f4849f', belly: '#ffe3ec' },
  { id: 'sora', label: 'そら', body: '#8fc9ff', shade: '#5fa4e8', belly: '#dceeff' },
  { id: 'wakaba', label: 'わかば', body: '#a9e08a', shade: '#79bd63', belly: '#e6f7d8' },
];

export const PART_CHOICES = [
  { id: 'horn', label: 'つの' },
  { id: 'ear', label: 'みみ' },
  { id: 'leaf', label: 'はっぱ' },
];

export const DEFAULT_COLOR = COLOR_CHOICES[0];

export const SUBJECT_PATTERN = {
  math: 'number',
  japanese: 'dot',
  english: 'alphabet',
  science: 'spark',
  social: 'circle',
  other: 'rainbow',
};

/** 行動サイズ別の成長値（仕様 8.4） */
export function growthFor(size) {
  return SIZE_META[size]?.growth || 1;
}

/**
 * 最初の10口の必須変化（仕様 8.1）。
 * interaction が付くものは、リザルト画面でプレイヤーが選ぶ。
 */
export const MILESTONES = [
  {
    bites: 1,
    id: 'crack',
    title: '最初のひとくち！',
    line: 'たまごに、大きなヒビが入った。中から目が見えた！',
    apply: (m) => ({ ...m, stage: 'hatching' }),
  },
  {
    bites: 2,
    id: 'hatch',
    title: 'たまごから 生まれた！',
    line: 'からを割って、モンスターが出てきた。',
    apply: (m) => ({ ...m, stage: 'baby' }),
  },
  {
    bites: 3,
    id: 'color',
    title: '体の色が えらべる！',
    line: '好きな色をえらんであげよう。',
    interaction: 'color',
  },
  {
    bites: 4,
    id: 'name',
    title: '名前を つけられる！',
    line: 'この子の名前をきめてあげよう。',
    interaction: 'name',
  },
  {
    bites: 5,
    id: 'reaction',
    title: 'はじめての わざ！',
    line: 'うれしいとき、ぷるぷる ふるえるようになった。',
    apply: (m) => ({ ...m, unlockedReactions: addOnce(m.unlockedReactions, 'wiggle') }),
  },
  {
    bites: 6,
    id: 'part',
    title: '頭に なにか 生えてきた！',
    line: 'つの・みみ・はっぱ。どれにする？',
    interaction: 'part',
  },
  {
    bites: 7,
    id: 'room',
    title: 'モンスターの部屋が ひらいた！',
    line: 'まどと、あかりと、ごはんのおさらが ふえた。',
    apply: (m) => ({ ...m, roomUnlocked: true }),
  },
  {
    bites: 8,
    id: 'pattern',
    title: '体に もようが うかんだ！',
    line: 'いちばん たくさん食べた ごはんの もようだ。',
    apply: (m) => ({ ...m, patternUnlocked: true }),
  },
  {
    bites: 9,
    id: 'play',
    title: 'あそぶように なった！',
    line: 'ひとりで ぴょんぴょん はねている。',
    apply: (m) => ({ ...m, unlockedReactions: addOnce(m.unlockedReactions, 'play') }),
  },
  {
    bites: 10,
    id: 'evolve',
    title: 'はじめての しんか！',
    line: 'すこし大きくなって、しっぽが はえた。',
    apply: (m) => ({ ...m, stage: 'evolved', unlockedReactions: addOnce(m.unlockedReactions, 'spin') }),
  },
];

/** 10口より先も、たまに新しい変化を出す（ノルマは増やさない） */
export const EXTRA_MILESTONES = [
  {
    bites: 15,
    id: 'sparkle',
    title: 'もようが ひかりだした！',
    line: '食べたごはんの色が、体の中で ちらちら光る。',
    apply: (m) => ({ ...m, sparkle: true }),
  },
  {
    bites: 20,
    id: 'friend',
    title: 'おさらが ふえた！',
    line: '部屋に、大きなごはんのおさらが とどいた。',
    apply: (m) => ({ ...m, bigPlate: true }),
  },
  {
    bites: 30,
    id: 'crown',
    title: 'ひとくち王 の かんむり！',
    line: '30回のひとくちが、小さなかんむりになった。',
    apply: (m) => ({ ...m, crown: true }),
  },
];

const ALL_MILESTONES = [...MILESTONES, ...EXTRA_MILESTONES];

function addOnce(list, value) {
  const arr = Array.isArray(list) ? list : [];
  return arr.includes(value) ? arr : [...arr, value];
}

/** 累計ひとくち数に対応する変化（なければ null） */
export function milestoneFor(totalBites) {
  return ALL_MILESTONES.find((m) => m.bites === totalBites) || null;
}

/** まだ見ていない次の変化（「次も見たい」を作るための予告用） */
export function nextMilestone(totalBites) {
  return ALL_MILESTONES.find((m) => m.bites > totalBites) || null;
}

export function stageForBites(totalBites) {
  if (totalBites <= 0) return 'egg';
  if (totalBites === 1) return 'hatching';
  if (totalBites < 10) return 'baby';
  return 'evolved';
}

/** いちばん多く食べた教科 */
export function dominantSubject(subjectBites) {
  const entries = Object.entries(subjectBites || {});
  if (!entries.length) return 'other';
  return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best), entries[0])[0];
}

export function patternFor(subject) {
  return SUBJECT_PATTERN[subject] || 'rainbow';
}

export function colorById(id) {
  return COLOR_CHOICES.find((c) => c.id === id) || DEFAULT_COLOR;
}
