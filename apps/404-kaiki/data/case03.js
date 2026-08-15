// CASE 03「テケテケ」 5エリア縦切り版のデータ
// 仕様: ../CASE03_SLICE.md
import { CHARS } from './chars.js';

export const WORLD = {
  length: 6000,
  bandTop: 0,      // 奥（校舎・線路の側）
  bandBottom: 200, // 手前
};

export const SPEED = {
  walk: 178,
  run: 210,    // 走っても振り切れない。速さでは勝てない
  anomaly: 0,
};

// この CASE だけの話者。テケテケは喋らない
export const SPEAKERS = { ...CHARS };

export const AREAS = [
  { id: 'A1', name: '通学路',       x0: 0,    x1: 1000, bandTop: 20, bandBottom: 200 },
  { id: 'A2', name: '校庭',         x0: 1000, x1: 2200, bandTop: 0,  bandBottom: 200 },
  { id: 'A3', name: '校舎裏',       x0: 2200, x1: 3200, bandTop: 60, bandBottom: 150 }, // 狭い
  { id: 'A4', name: '踏切',         x0: 3200, x1: 4200, bandTop: 10, bandBottom: 200 },
  { id: 'A5', name: '線路沿いの土手', x0: 4200, x1: 6000, bandTop: 70, bandBottom: 170 },
];

// 開放は「文字」ではなく世界の変化で示す（SPEC §20）
export const GATES = [
  { id: 'G1', x: 1000, unlockedBy: 'S1', opens: 'A2', kind: 'schoolgate', note: '校門が開く' },
  { id: 'G2', x: 2200, unlockedBy: 'S2', opens: 'A3', kind: 'net',        note: '防球ネットがめくれる' },
  { id: 'G3', x: 3200, unlockedBy: 'S3', opens: 'A4', kind: 'shutter',    note: 'シャッターが上がる' },
  { id: 'G4', x: 4200, unlockedBy: 'S4', opens: 'A5', kind: 'barrier',    note: '遮断機が上がる' },
];

export const POINTS = [
  { id: 'S1', area: 'A1', x: 700,  y: 72,  mark: '？', by: 'rei',     kind: 'shoe',     required: true,  label: '片方だけの上履き' },
  { id: 'T1', area: 'A1', x: 430,  y: 172, mark: '◎', by: 'shirou',  kind: 'vending',  required: false, label: '自販機の釣り銭口' },
  { id: 'S2', area: 'A2', x: 1760, y: 58,  mark: '⌕', by: 'yotsuba', kind: 'podium',   required: true,  label: '朝礼台' },
  { id: 'T2', area: 'A2', x: 1320, y: 182, mark: '◎', by: 'shirou',  kind: 'ball',     required: false, label: '忘れられたボール' },
  // イヤホン。CASE 01 のドア／CASE 02 の双眼鏡に相当する固有装置
  { id: 'S3', area: 'A3', x: 2620, y: 96,  mark: '？', by: 'shirou',  kind: 'lostbox',  required: true,  flag: 'has_earbud', label: '落とし物箱' },
  { id: 'H1', area: 'A3', x: 3040, y: 66,  mark: '⌕', by: 'yotsuba', kind: 'graffiti', required: false, hidden: true, flag: 'saw_graffiti_404', label: '渡り廊下の落書き' },
  { id: 'S4', area: 'A4', x: 3760, y: 118, mark: '？', by: 'yotsuba', kind: 'handmark', required: true,  label: '遮断機の柱の手の跡' },
  { id: 'T3', area: 'A5', x: 4760, y: 162, mark: '◎', by: 'shirou',  kind: 'hut',      required: false, label: '保線小屋の張り紙' },
];

// 生還地点。跨線橋の上（p18 の上）
export const SAFE_ZONE = { x: 5860, y: 96, r: 110 };

export const WAYPOINTS = [
  { x: 260,  y: 130 }, { x: 640,  y: 110 }, { x: 980,  y: 120 },
  { x: 1340, y: 130 }, { x: 1740, y: 100 }, { x: 2160, y: 110 },
  { x: 2420, y: 100 }, { x: 2660, y: 105 }, { x: 3060, y: 100 },
  { x: 3420, y: 110 }, { x: 3780, y: 120 }, { x: 4160, y: 130 },
  // ここから先は台づたい。緑ラインが「どこへ上がるか」も兼ねる
  { x: 4520, y: 96  }, { x: 4980, y: 162 }, { x: 5430, y: 100 },
];

// 台。footprint（x±w/2, y..y+d）へ歩いて入ると h まで上がる。
// h が TEKETEKE.reach 以下のものは「台に見えるのに助からない」罠
export const PLATFORMS = [
  // A1 通学路
  { id: 'p1',  x: 300,  y: 26,  w: 220, d: 26, h: 44, kind: 'wall' },
  { id: 'p2',  x: 640,  y: 150, w: 44,  d: 24, h: 18, kind: 'bollard' },   // 罠
  // A2 校庭。ここで「上がる」を体で覚えさせる
  { id: 'p3',  x: 1240, y: 168, w: 130, d: 26, h: 20, kind: 'planter' },   // 罠
  { id: 'p4',  x: 1450, y: 118, w: 64,  d: 40, h: 52, kind: 'vault' },
  { id: 'p5',  x: 1760, y: 40,  w: 150, d: 58, h: 48, kind: 'podium' },
  { id: 'p6',  x: 1980, y: 146, w: 112, d: 22, h: 56, kind: 'bar' },
  { id: 'p7',  x: 2090, y: 46,  w: 120, d: 58, h: 74, kind: 'jungle' },
  // A3 校舎裏。台は多いが道が狭い
  { id: 'p8',  x: 2380, y: 66,  w: 74,  d: 34, h: 46, kind: 'aircon' },
  { id: 'p9',  x: 2620, y: 104, w: 92,  d: 36, h: 44, kind: 'cart' },
  { id: 'p10', x: 2900, y: 64,  w: 112, d: 40, h: 64, kind: 'stairs' },
  { id: 'p11', x: 3080, y: 128, w: 160, d: 20, h: 16, kind: 'curb' },      // 罠
  // A4 踏切
  { id: 'p12', x: 3400, y: 48,  w: 122, d: 44, h: 58, kind: 'hut' },
  { id: 'p13', x: 3760, y: 56,  w: 58,  d: 26, h: 42, kind: 'base' },
  { id: 'p14', x: 4040, y: 148, w: 104, d: 40, h: 50, kind: 'stack' },
  // A5 山場。台が減り、間が開く
  { id: 'p15', x: 4520, y: 74,  w: 110, d: 40, h: 54, kind: 'shed' },
  { id: 'p16', x: 4980, y: 140, w: 62,  d: 28, h: 44, kind: 'signal' },
  { id: 'p17', x: 5430, y: 78,  w: 92,  d: 34, h: 40, kind: 'sleepers' },
  { id: 'p18', x: 5860, y: 74,  w: 140, d: 58, h: 96, kind: 'bridge' },    // 跨線橋＝生還
];

// 通過のリズム。数字がそのまま緊張の設計
export const PASS = {
  warn: 3.2,        // 踏切が鳴ってから来るまで。上がるための時間
  cross: 1.7,       // 横切っている時間
  firstQuiet: 2.6,  // PHASE 4 開始から1回目まで
  quiet: 6.5,       // 通常の静寂
  quietByArea: { A5: 2.6 },  // 線路沿いは息をつく間がほとんど無い
  quicken: 0.22,    // 回を追うごとに短くなる
  minQuiet: 1.2,
};

export const TEKETEKE = {
  reach: 26,   // 手が届く高さ。これ以下の台では助からない
  speed: 730,  // プレイヤーの走り（210）の3.5倍。速さでは勝てない
  span: 620,   // 画面外から画面外まで
};

export const TRIGGERS = {
  phase1AtX: 1150,   // 校庭に入る。遠くで踏切が鳴っている。電車は来ない
  phase2AtX: 1980,   // 校庭。何かが低く速く横切る
  phase3AtX: 2860,   // 校舎裏。手のひらの跡。足跡は無い
  // PHASE 4（通過システム開始）は S4（手の跡）の調査で始まる
  duskByPhase: [0.05, 0.24, 0.44, 0.66, 0.9],
};

const L = (who, text, dur) => ({ who, text, dur: dur || null });

export const DIALOGUE = {
  intro: [
    L('shirou', '腹減った'),
    L('yotsuba', 'さっきパン食べてたよね'),
    L('rei', '二個目な'),
    L('shirou', '一個目は昼'),
  ],
  S1: [
    L('rei', '上履き。片方だけ落ちてる'),
    L('yotsuba', '名前のとこ、消してある'),
    L('rei', '……消したんじゃなくて、擦れてる'),
  ],
  T1: [
    L('shirou', '釣り銭口、見るだけ見る'),
    L('yotsuba', 'やめなよ'),
    L('shirou', '十円あった'),
  ],
  S2: [
    L('yotsuba', '朝礼台の上、何か置いてある'),
    L('rei', '……上履き。もう片方だ'),
    L('shirou', '誰が運んだんだよ'),
  ],
  T2: [
    L('shirou', 'ボール。空気抜けてる'),
    L('rei', '何年置いてあるんだこれ'),
  ],
  S3: [
    L('shirou', '落とし物箱。……イヤホン、片方だけ'),
    L('rei', 'また片方だ'),
    L('shirou', '（耳に入れる）誰の曲だろ'),
    L('yotsuba', 'シロウ。それ返しな'),
  ],
  H1: [
    L('yotsuba', '……壁。404 って書いてある'),
    L('rei', '三か所目だ'),
    L('yotsuba', '住宅街、田んぼ、学校'),
  ],
  S4: [
    L('yotsuba', '柱に跡がついてる'),
    L('rei', '手のひらだ。並んでる'),
    L('yotsuba', '……レイ。足跡が無いよ'),
  ],
  T3: [
    L('shirou', '張り紙。「通行止 復旧未定」'),
    L('rei', '日付、去年'),
  ],
  phase1: [
    L('rei', '踏切、鳴ってる'),
    L('shirou', '電車来んの？'),
    L('rei', '……来ないな'),
  ],
  phase2: [
    L('yotsuba', 'いま、なんか通った'),
    L('shirou', '犬でしょ'),
    L('yotsuba', '低かった。速かった'),
  ],
  phase3: [
    L('rei', 'まだ鳴ってる'),
    L('yotsuba', 'さっきからずっと'),
    L('shirou', '（聞こえていない）ん？'),
  ],
  // 通過システム開始
  phase4: [
    L('rei', '来る'),
    L('yotsuba', '地面にいたらだめ！'),
    L('rei', '高いところ！　上がれ！'),
  ],
  // 踏切が鳴っている間（イヤホンで四郎に聞こえないので二人が叫ぶ）
  warn: [
    [L('rei', '鳴った！')],
    [L('yotsuba', '上がって！')],
    [L('rei', 'シロウ、耳！')],
    [L('yotsuba', 'そこ低い！')],
  ],
  // 上がりきった時
  safe: [
    [L('rei', '……行った')],
    [L('yotsuba', '手、伸ばしてた')],
    [L('shirou', '（イヤホンを外す）')],
  ],
  // 低い台に乗ってしまった時
  tooLow: [
    [L('rei', 'そこじゃ届く！')],
    [L('yotsuba', 'もっと高いとこ！')],
  ],
  banter: {
    A1: [
      [L('shirou', 'カラスうるさ'), L('rei', '秋だからね'), L('yotsuba', '関係ある？')],
      [L('yotsuba', '日、短くなったね'), L('rei', 'もう五時')],
    ],
    A2: [
      [L('shirou', '校庭って放課後だと広く見える'), L('yotsuba', '人がいないからだよ')],
      [L('rei', '部活の声、しないな'), L('shirou', '今日休みだっけ'), L('yotsuba', '水曜は普通あるよ')],
    ],
    A3: [
      [L('rei', 'ここ通っていいんだっけ'), L('shirou', '通ってる時点で答え出てる')],
      [L('yotsuba', '渡り廊下、電気ついてない'), L('rei', '誰か消したんだ')],
    ],
    A4: [
      [L('shirou', '遮断機、下りっぱなし'), L('rei', '故障かな'), L('yotsuba', '……音、止まらないね')],
    ],
    A5: [
      [L('rei', '線路沿い、隠れるとこ無いな'), L('yotsuba', '隠れなくていい。上がるの')],
    ],
  },
  survive: [
    L('yotsuba', '上まで！　止まらないで！'),
    L('rei', '……通った。下'),
    L('shirou', '……'),
    L('yotsuba', 'シロウ、イヤホン'),
    L('shirou', '（捨てた）'),
  ],
  // 地面にいた
  caught: [
    L('yotsuba', 'シロウ！'),
    L('rei', '地面！'),
  ],
  epilogue: [
    L('rei', '踏切、今日も鳴ってた'),
    L('yotsuba', '電車は？'),
    L('rei', '来てない'),
    L('shirou', '……もう片方、どこ行ったんだろうな'),
  ],
};

export const EVIDENCE = {
  S1: '片方だけの上履き（名前が擦れている）',
  S2: '朝礼台の上に置かれたもう片方の上履き',
  S3: '落とし物箱の中の、片方だけのイヤホン',
  S4: '遮断機の柱の手のひらの跡。足跡は無い',
  T1: '自販機の釣り銭口の十円',
  T2: '空気の抜けたボール',
  T3: '保線小屋の張り紙「通行止 復旧未定」（去年の日付）',
  H1: '渡り廊下の落書き「404」',
};

export const RECORD = {
  case: 'CASE 03 / テケテケ',
  rumor: '誰もいない踏切が鳴る。地面にいると持っていかれる',
  places: ['通学路', '校庭', '校舎裏', '踏切', '線路沿いの土手'],
  encounter: 'あり。速かった。止まらなかった。追ってはこなかった',
  notes: [
    ['レイ', '足跡が無い。腕だけで進んでいる'],
    ['ヨツバ', '片方だけのものが、三つあった'],
    ['シロウ', '曲は入っていなかった'],
  ],
  unresolved: [
    '誰もいない踏切は、なぜ鳴っていたのか',
    'イヤホンのもう片方はどこにあるのか',
    '手のひらの跡は、どこから来てどこへ行ったのか',
  ],
  unresolvedIf: {
    saw_graffiti_404: '住宅街・田んぼ・学校。三か所に同じ「404」がある',
  },
};

// 校舎・電柱・線路など。固定シードで毎回同じ町にする
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function buildScenery() {
  const r = rng(30403);
  const poles = [];
  const clutter = [];
  const sleepers = [];
  for (let x = 80; x < WORLD.length; x += 320) poles.push({ x, h: 140 + ((x * 11) % 52) });
  for (let x = 140; x < WORLD.length; x += 150 + r() * 210) {
    const k = r();
    clutter.push({ x: Math.round(x), kind: k < 0.34 ? 'weed' : k < 0.62 ? 'cone' : 'stone' });
  }
  // 線路の枕木。A4 以降にだけ敷く
  for (let x = 3200; x < WORLD.length + 200; x += 34) sleepers.push({ x });
  return { poles, clutter, sleepers, lamps: [] };
}

export const SCENERY = buildScenery();

export const PROPS = [
  { kind: 'houses',    x: 0,    y: -14, w: 1000 },
  { kind: 'school',    x: 1000, y: -20, w: 2200 },
  { kind: 'corridor',  x: 2200, y: -8,  w: 1000 },
  { kind: 'crossing',  x: 3620, y: 0 },
  { kind: 'rails',     x: 3200, y: -30, w: 2800 },
  { kind: 'overpass',  x: 5860, y: 74 },
];

export const CASE03 = {
  id: 'case03',
  title: 'CASE 03 / テケテケ',
  no: 'CASE 03',
  name: 'テケテケ',
  mode: 'pass',             // 生還の型。01 は 'chase'、02 は 'sight'
  renderer: 'school',
  WORLD, SPEED, CHARS, SPEAKERS, AREAS, GATES, POINTS, SAFE_ZONE, WAYPOINTS,
  PLATFORMS, PASS, TEKETEKE, TRIGGERS, DIALOGUE, SCENERY, PROPS, EVIDENCE, RECORD,
};
