// CASE 06「八尺様」 5エリア縦切り版のデータ
// 仕様: ../CASE06_SLICE.md
import { CHARS } from './chars.js';

export const WORLD = {
  length: 5200,
  bandTop: 0,      // 田・壁の側（奥）
  bandBottom: 200, // 手前
};

export const SPEED = {
  walk: 178,
  run: 214,
  anomaly: 0,
};

// この CASE だけの話者。祖母
export const SPEAKERS = {
  ...CHARS,
  granny: { name: '祖母', label: 'ばあちゃん', color: '#b08a52', hair: '#c9c4bc', scale: 0.94 },
};

export const AREAS = [
  { id: 'A1', name: 'バス停の道', x0: 0,    x1: 1100, bandTop: 20, bandBottom: 200 },
  { id: 'A2', name: '神社の前',   x0: 1100, x1: 2200, bandTop: 10, bandBottom: 200 },
  { id: 'A3', name: '畦道',       x0: 2200, x1: 3400, bandTop: 40, bandBottom: 200 }, // 一番広い
  { id: 'A4', name: '集落の入口', x0: 3400, x1: 4300, bandTop: 10, bandBottom: 200 },
  // 急に狭くなる。5本かけて作った広い一本道を、最後に一本の廊下へ絞る
  { id: 'A5', name: '祖父母の家', x0: 4300, x1: 5200, bandTop: 92, bandBottom: 176 },
];

// 開放は「文字」ではなく世界の変化で示す（SPEC §20）
export const GATES = [
  { id: 'G1', x: 1100, unlockedBy: 'V1', opens: 'A2', kind: 'gate',   note: '獣よけの柵が開く' },
  { id: 'G2', x: 2200, unlockedBy: 'V2', opens: 'A3', kind: 'steps',  note: '石段の脇が通れる' },
  { id: 'G3', x: 3400, unlockedBy: 'V3', opens: 'A4', kind: 'plank',  note: '用水路に板が渡る' },
  { id: 'G4', x: 4300, unlockedBy: 'V4', opens: 'A5', kind: 'door',   note: '祖母が戸を開ける' },
];

// 家。この中だけが籠城の舞台
export const HOUSE = { x0: 4300, x1: 5200 };

export const POINTS = [
  { id: 'V1', area: 'A1', x: 700,  y: 70,  mark: '？', by: 'rei',     kind: 'busstop', required: true,  label: 'バス停の時刻表' },
  { id: 'U1', area: 'A1', x: 420,  y: 172, mark: '◎', by: 'shirou',  kind: 'machine', required: false, label: '氷の自販機' },
  // お守り。CASE 01 のドア／02 双眼鏡／03 イヤホン／04 首輪／05 切符に相当
  { id: 'V2', area: 'A2', x: 1720, y: 58,  mark: '？', by: 'shirou',  kind: 'charm',   required: true,  flag: 'has_charm', label: '石段に落ちていたお守り' },
  { id: 'U2', area: 'A2', x: 1400, y: 176, mark: '◎', by: 'yotsuba', kind: 'basin',   required: false, label: '手水鉢' },
  { id: 'V3', area: 'A3', x: 2900, y: 66,  mark: '⌕', by: 'yotsuba', kind: 'pole',    required: true,  label: '田の中の物干し竿' },
  { id: 'H1', area: 'A3', x: 3180, y: 178, mark: '⌕', by: 'yotsuba', kind: 'graffiti', required: false, hidden: true, flag: 'saw_graffiti_404', label: '用水路の壁の落書き' },
  { id: 'V4', area: 'A4', x: 4020, y: 96,  mark: '？', by: 'rei',     kind: 'house',   required: true,  label: '祖父母の家の玄関' },
  { id: 'U3', area: 'A4', x: 3700, y: 176, mark: '◎', by: 'shirou',  kind: 'shrine',   required: false, label: '軒下の小さな祠' },
];

// 生還地点は無い。朝が来たら終わり（CASE06_SLICE §2）
export const SAFE_ZONE = null;

export const WAYPOINTS = [
  { x: 240,  y: 130 }, { x: 640,  y: 100 }, { x: 1040, y: 120 },
  { x: 1360, y: 130 }, { x: 1740, y: 90  }, { x: 2140, y: 120 },
  { x: 2520, y: 130 }, { x: 2920, y: 100 }, { x: 3340, y: 120 },
  { x: 3720, y: 130 }, { x: 4060, y: 110 }, { x: 4280, y: 130 },
];

// 窓と戸。五つ。家の中の壁側に並ぶ
export const WARDS = [
  { id: 'w1', x: 4420, y: 60, kind: 'window' },
  { id: 'w2', x: 4600, y: 60, kind: 'door' },
  { id: 'w3', x: 4780, y: 60, kind: 'window' },
  { id: 'w4', x: 4960, y: 60, kind: 'window' },
  { id: 'w5', x: 5130, y: 60, kind: 'door' },
];

// 籠城の数値。ここがそのまま「手が足りない」の設計
// 籠城の数値。ここがそのまま「手が足りない」の設計。
// 収支で決めてある：需要 = decayNear + 4×decayFar = 0.312/s、
// 供給 = repair × 実働7.5割 = 0.465/s。倍率1.5。
// これを1.1まで詰めると「手が足りない」ではなく「間に合わない」になる
export const VIGIL = {
  night: 76,        // 夜の長さ（秒）
  decayNear: 0.24,  // 彼女が正面にいる札。4.2秒で落ちる
  decayFar: 0.018,  // その他の四枚。56秒で落ちる＝夜のうちに一度は行かされる
  repair: 0.62,     // 貼り直し（その場にいる間）。正面でも差し引き +0.38
  nearX: 130,       // 彼女が「正面にいる」と見なす幅
  reachX: 68,       // 貼り直せる範囲
  reachY: 62,
  maxTorn: 2,       // 二枚破れたら入ってくる
  floorAfterTear: 0.2, // 一枚目で残りを底上げ。二枚目が同時に来ないように
  retry: 0.55,      // 失敗したとき、夜の残りをこの割合から再開する
  warnAt: 0.32,     // これを割ると仲間が言う
};

export const YASHIKI = {
  outY: -70,        // 外にいる時。田の向こう
  wallY: -34,       // 家の周りを回っている時。壁の向こう
  lead: 250,        // どこまで歩いても保たれる距離
  circleSpeed: 44,  // 家の周りを回る速さ
  quicken: 0.85,    // 夜が更けるほど速くなる
  scale: 1.7,       // 3人の1.7倍。塀より高く、家より低い
};

export const TRIGGERS = {
  phase1AtX: 1350,   // 田の向こうに人が立っている。高すぎる
  phase2AtX: 2600,   // どこまで歩いても同じ距離にいる
  phase3AtX: 3900,   // 声。祖母が飛び出してくる
  // PHASE 4（籠城開始）は V4（玄関）の調査で始まる
  lightByPhase: [1, 0.86, 0.66, 0.42, 0.1],  // 真昼 → 日が傾く → 夜
};

const L = (who, text, dur) => ({ who, text, dur: dur || null });

export const DIALOGUE = {
  intro: [
    L('shirou', 'あっつ。死ぬ'),
    L('yotsuba', 'さっきも言ってた'),
    L('rei', 'ばあちゃんち、あと十分'),
    L('shirou', '十分は無理'),
  ],
  V1: [
    L('rei', 'バス停。一日三本'),
    L('yotsuba', '朝と昼と夕方'),
    L('shirou', '夕方逃したら終わりじゃん'),
  ],
  U1: [
    L('shirou', '氷の自販機。動いてる'),
    L('yotsuba', '誰が買うんだろ'),
    L('rei', '祭りの時な'),
  ],
  V2: [
    L('shirou', '石段にお守り落ちてる'),
    L('rei', '新しいな。今年のだ'),
    L('shirou', '（拾う）持っとく'),
    L('yotsuba', '……落とし物は置いとこうよ'),
  ],
  U2: [
    L('yotsuba', '手水、水が張ってある'),
    L('rei', '誰か来てるんだ'),
    L('yotsuba', '柄杓、六本ある'),
  ],
  V3: [
    L('yotsuba', '田んぼの真ん中に物干し竿'),
    L('rei', '洗濯物、干す場所じゃないだろ'),
    L('yotsuba', '……あれ、竿じゃないかも'),
  ],
  H1: [
    L('yotsuba', '用水路の壁。404'),
    L('rei', '六か所目'),
    L('yotsuba', '住宅街、田んぼ、学校、商店街、駅、ここ'),
    L('rei', '六つ。……あと一個で、七つになる'),
    L('shirou', '何の話だよ'),
  ],
  V4: [
    L('rei', 'ばあちゃんち。着いた'),
    L('yotsuba', '……戸、開いてる'),
    L('rei', 'ばあちゃん？'),
  ],
  U3: [
    L('shirou', '軒下に祠。小さい'),
    L('yotsuba', '中、空っぽだ'),
    L('rei', '出したのか、盗られたのか'),
  ],
  phase1: [
    L('yotsuba', '田んぼの向こう。人いる'),
    L('shirou', 'いるね'),
    L('rei', '……高くない？'),
  ],
  phase2: [
    L('shirou', 'まだいる'),
    L('yotsuba', 'さっきと同じ距離'),
    L('rei', 'こっちが歩いた分、向こうも動いてる'),
    L('shirou', '追いかけてくるってこと？'),
    L('rei', '違う。**離れてない**'),
  ],
  phase3: [
    L('yotsuba', '……声、した'),
    L('shirou', 'ぽ、ぽ、って'),
    L('granny', 'レイ！　入りな！　早く！'),
    L('rei', 'ばあちゃん'),
    L('granny', '見るんじゃない。入りな'),
  ],
  // 籠城開始
  phase4: [
    L('granny', '窓と戸。五つある'),
    L('granny', 'この札が落ちたら、そこから入ってくる'),
    L('yotsuba', '五つ。三人で？'),
    L('granny', '一人でやりな。二人は仏間から出るんじゃない'),
    L('rei', '朝までだね'),
    L('granny', '朝までだ'),
  ],
  // 札が弱っている
  warn: [
    [L('rei', '札、剥がれかけてる')],
    [L('yotsuba', 'そっち！　弱ってる')],
    [L('granny', '端から押さえな')],
    [L('rei', '向こう側にいる')],
  ],
  // 一枚破れた
  tear: [
    L('yotsuba', '破れた'),
    L('granny', 'そこはもう駄目だ。残りを守りな'),
  ],
  // 貼り直した
  fixed: [
    [L('granny', 'それでいい')],
    [L('rei', '……戻った')],
    [L('yotsuba', '次、来る')],
  ],
  banter: {
    A1: [
      [L('shirou', 'セミの声、壁みたい'), L('yotsuba', '壁？'), L('shirou', '厚い')],
      [L('rei', 'この道、舗装されたの去年'), L('yotsuba', 'それまで土？')],
    ],
    A2: [
      [L('yotsuba', '鳥居、あの神社のと同じ形'), L('rei', '同じ町だからな'), L('shirou', 'この辺も町なんだ')],
      [L('shirou', '石段、何段あるんだろ'), L('rei', '数えると増えるらしいぞ'), L('yotsuba', 'やめて')],
    ],
    A3: [
      [L('rei', '田んぼ広いな'), L('shirou', '去年もこれ見た'), L('yotsuba', '去年は夕方だったよ')],
      [L('yotsuba', '影、濃い'), L('rei', '真上だからな')],
    ],
    A4: [
      [L('shirou', '人いないね'), L('yotsuba', 'お昼だからかな'), L('rei', '……昼は普通いるよ')],
    ],
    A5: [
      [L('rei', '仏間、線香の匂いする'), L('yotsuba', 'さっき点けたんだ')],
    ],
  },
  survive: [
    L('granny', '……明るくなった'),
    L('rei', '朝'),
    L('yotsuba', 'いなくなった？'),
    L('granny', '行ったよ'),
    L('shirou', 'どこに'),
    L('granny', '（答えない）'),
  ],
  // 二枚破れた
  caught: [
    L('granny', '入ってきた'),
    L('yotsuba', '仏間！'),
  ],
  epilogue: [
    L('rei', 'ばあちゃん、札の貼り方知ってた'),
    L('yotsuba', '前にもあったってことだよね'),
    L('rei', '聞いたけど、答えなかった'),
    L('shirou', '……お守り、返してくればよかった'),
    L('yotsuba', 'まだ持ってるの'),
  ],
};

export const EVIDENCE = {
  V1: 'バス停の時刻表（一日三本）',
  V2: '石段に落ちていた今年のお守り',
  V3: '田の中に立てられた物干し竿。洗濯物は干されていない',
  V4: '開いたままの玄関',
  U1: '動いている氷の自販機',
  U2: '水の張られた手水鉢。柄杓が六本',
  U3: '軒下の空の祠',
  H1: '用水路の壁の落書き「404」',
};

export const RECORD = {
  case: 'CASE 06 / 八尺様',
  rumor: '背の高い女に見られると、その家から出られなくなる',
  places: ['バス停の道', '神社の前', '畦道', '集落の入口', '祖父母の家'],
  encounter: 'あり。真昼。ずっと同じ距離にいた。追ってはこなかった',
  notes: [
    ['レイ', 'ばあちゃんは札の貼り方を知っていた'],
    ['ヨツバ', '柄杓が六本あった。六人ぶん'],
    ['シロウ', 'お守りはまだ持っている'],
  ],
  unresolved: [
    '神社に落ちていたお守りは誰のものか',
    '祖母はなぜ札の貼り方を知っていたのか',
    '朝、彼女はどこへ行ったのか',
  ],
  unresolvedIf: {
    saw_graffiti_404: '住宅街・田んぼ・学校・商店街・駅・集落。六か所に同じ「404」がある。あと一つで七つになる',
  },
};

// 田・家・電柱。固定シードで毎回同じ集落にする
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function buildScenery() {
  const r = rng(60606);
  const poles = [];
  const houses = [];
  const paddies = [];
  const clutter = [];
  for (let x = 80; x < WORLD.length; x += 330) poles.push({ x, h: 140 + ((x * 13) % 44) });
  for (let x = 3380; x < 5200; x += 210 + r() * 90) {
    houses.push({ x: Math.round(x), w: 150 + r() * 60, h: 96 + r() * 34, tone: 0.86 + r() * 0.28 });
  }
  for (let i = 0; i < 70; i++) {
    paddies.push({
      x: -300 + i * 220 + r() * 80,
      depth: -10 - r() * 44,
      span: 20 + r() * 30,
      w: 190 + r() * 170,
      tone: 0.86 + r() * 0.3,
    });
  }
  for (let x = 130; x < WORLD.length; x += 150 + r() * 200) {
    const k = r();
    clutter.push({ x: Math.round(x), kind: k < 0.42 ? 'weed' : k < 0.72 ? 'stone' : 'post' });
  }
  return { poles, houses, paddies, clutter, lamps: [] };
}

export const SCENERY = buildScenery();

export const PROPS = [
  { kind: 'shrine',  x: 1720, y: 30 },
  { kind: 'canal',   x: 3000, y: 0, w: 700 },
  // 家の中。ここだけ絵が変わる。
  // 廊下（4300..5200）より広く取って、端でも画面の外まで壁が続くようにする
  { kind: 'interior', x: 3900, y: 0, w: 1800 },
];

export const CASE06 = {
  id: 'case06',
  title: 'CASE 06 / 八尺様',
  no: 'CASE 06',
  name: '八尺様',
  mode: 'vigil',            // 生還の型。01 chase / 02 sight / 03 pass / 04 voice / 05 loop
  renderer: 'village',
  WORLD, SPEED, CHARS, SPEAKERS, AREAS, GATES, POINTS, SAFE_ZONE, WAYPOINTS,
  HOUSE, WARDS, VIGIL, YASHIKI, TRIGGERS, DIALOGUE, SCENERY, PROPS, EVIDENCE, RECORD,
};
