export const TREATMENT_TYPES = {
  relief: {
    id: 'relief',
    label: '今すぐ向け',
    shortLabel: '今すぐ',
    description: '30秒〜数分で、いまの状態や詰まりを少し動かすためのアプリ。',
  },
  rebuild: {
    id: 'rebuild',
    label: '体質改善',
    shortLabel: '根っこから',
    description: '同じ場面で消耗しにくい考え方・反射・習慣を繰り返し鍛えるアプリ。',
  },
  both: {
    id: 'both',
    label: '即効＋体質改善',
    shortLabel: '両方',
    description: 'いま使える一手と、繰り返すほど身につくトレーニングの両方を持つアプリ。',
  },
};

// 「今の状態を短時間で動かす」こと自体が主目的のアプリ。
const RELIEF_FIRST = new Set([
  'nukeru',
  'mou-owatta',
  'anger-first-aid',
  'kanji-warukatta',
  'levelup-mood',
  'name-it',
  'meeting-respawn',
  'asa-glide',
  'yotei-made-tsukaeru',
  'sukkiri-note',
  'nemuri-no-umi',
  'chou-tsukareta',
]);

// 「反応の癖・判断の型・習慣を反復して変える」ことが主目的のアプリ。
const REBUILD_FIRST = new Set([
  'already-90',
  'approval-off',
  'arigatou-sagashi',
  'boundary',
  'dont-change-people',
  'expect-nothing',
  'habit-raid',
  'help-me',
  'idea-lenses-40',
  'jinsei-title',
  'jinshin-shoaku',
  'kininaranai',
  'kokkara-best',
  'levelup-control',
  'levelup-smalltalk',
  'life-plus-one',
  'mada-dekinai',
  'main-character',
  'matomaru',
  'meaning-map',
  'one-thing',
  'reflex-7',
  'self-management',
  'sore-honto',
  'task-separation',
  'timecraft',
  'uchite',
  'viewpoint-exam',
  'watashi-zukan',
]);

for (const slug of RELIEF_FIRST) {
  if (REBUILD_FIRST.has(slug)) throw new Error(`LEVEL UP treatment attribute conflict: ${slug}`);
}

export function treatmentFor(slug) {
  const key = String(slug || '').trim();
  if (RELIEF_FIRST.has(key)) return 'relief';
  if (REBUILD_FIRST.has(key)) return 'rebuild';
  // 未分類＝属性なしにはしない。新作はまず「両方」として公開され、
  // 後から主目的が明確になった時だけ relief / rebuild へ寄せる。
  return 'both';
}

export function treatmentMetaFor(slug) {
  const treatment = treatmentFor(slug);
  return TREATMENT_TYPES[treatment];
}

export function validateTreatment(value) {
  return Boolean(TREATMENT_TYPES[value]);
}
