// 宿題モンスター — 食べ物ルール（仕様 8.2 / 8.3）

export const FOODS = {
  math: {
    subject: 'math',
    name: '数字クッキー',
    kind: 'cookie',
    color: '#4b8dff',
    color2: '#2a5fd0',
    accent: '#eaf2ff',
  },
  japanese: {
    subject: 'japanese',
    name: 'ことばの実',
    kind: 'fruit',
    color: '#ff6b6b',
    color2: '#d63f4a',
    accent: '#ffe0e0',
  },
  english: {
    subject: 'english',
    name: 'アルファベットキャンディ',
    kind: 'candy',
    color: '#a56bff',
    color2: '#7440d0',
    accent: '#f0e6ff',
  },
  science: {
    subject: 'science',
    name: '発光キノコ',
    kind: 'mushroom',
    color: '#48c98a',
    color2: '#2c9a64',
    accent: '#e2fbee',
  },
  social: {
    subject: 'social',
    name: '世界のかけら',
    kind: 'shard',
    color: '#ffc53d',
    color2: '#d99a12',
    accent: '#fff4d6',
  },
  other: {
    subject: 'other',
    name: 'なぞのごはん',
    kind: 'mystery',
    color: '#ff9ad5',
    color2: '#7ad4ff',
    accent: '#fff0fb',
  },
};

export const FOOD_SIZE = {
  small: { id: 'small', scale: 0.55, label: 'ひとかけら' },
  medium: { id: 'medium', scale: 0.85, label: 'ひとくち' },
  large: { id: 'large', scale: 1.15, label: 'しっかり一口' },
  giant: { id: 'giant', scale: 2.1, label: '宿題まるごと' },
  feast: { id: 'feast', scale: 1.4, label: 'ごちそう' },
};

export function foodFor(subject) {
  return FOODS[subject] || FOODS.other;
}

/** 給餌時のリアクション文。ひとかけらも必ず喜ぶ（仕様 8.3） */
export function feedingLine(size) {
  switch (size) {
    case 'fragment':
      return '小さいけど、いちばん うれしそうに食べた！';
    case 'solid_bite':
      return 'おおきい！ おなかいっぱいの かお をしている。';
    case 'feast':
      return 'ごちそうだ！ とびはねて よろこんでいる！';
    default:
      return 'もぐもぐ。おいしそうに食べた！';
  }
}

/** 完了した行動の言い換え（例：算数を1問できた！） */
export function achievementLine(subjectLabel, biteLabel) {
  return `${subjectLabel}の「${biteLabel}」ができた！`;
}
