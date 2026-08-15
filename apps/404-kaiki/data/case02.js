// CASE 02「くねくね」 5エリア縦切り版のデータ
// 仕様: ../CASE02_SLICE.md
import { CHARS } from './chars.js';

export const WORLD = {
  length: 5600,
  bandTop: 0,      // 田の側（奥）
  bandBottom: 200, // 畦の側（手前）
};

export const SPEED = {
  walk: 178,
  run: 196,    // 逃げるのではなく、陰から陰へ渡る。CASE 01 より遅い
  anomaly: 0,  // くねくねは追ってこない
};

// この CASE だけの話者。名前を持たせない
export const SPEAKERS = {
  ...CHARS,
  kunekune: { name: '', label: '', color: '#d8d2c4', hair: '#ffffff', scale: 1.0 },
};

export const AREAS = [
  { id: 'A1', name: 'バス停',       x0: 0,    x1: 1000, bandTop: 20, bandBottom: 200 },
  { id: 'A2', name: '用水路',       x0: 1000, x1: 2100, bandTop: 10, bandBottom: 200 },
  { id: 'A3', name: 'ビニールハウス', x0: 2100, x1: 3300, bandTop: 0,  bandBottom: 200 },
  { id: 'A4', name: '田んぼの一本道', x0: 3300, x1: 4600, bandTop: 70, bandBottom: 165 },
  { id: 'A5', name: '集落',         x0: 4600, x1: 5600, bandTop: 0,  bandBottom: 200 },
];

// 開放は「文字」ではなく世界の変化で示す（SPEC §20）
export const GATES = [
  { id: 'G1', x: 1000, unlockedBy: 'Q1', opens: 'A2', kind: 'chain',  note: 'チェーンが外れる' },
  { id: 'G2', x: 2100, unlockedBy: 'Q2', opens: 'A3', kind: 'plank',  note: '用水路に板が渡る' },
  { id: 'G3', x: 3300, unlockedBy: 'Q3', opens: 'A4', kind: 'gateway',note: 'ハウスの間が通れる' },
  { id: 'G4', x: 4600, unlockedBy: 'Q4', opens: 'A5', kind: 'fence',  note: '柵の一枚が外れる' },
];

export const POINTS = [
  { id: 'Q1', area: 'A1', x: 700,  y: 70,  mark: '？', by: 'rei',     kind: 'timetable', required: true,  label: 'バス停の時刻表' },
  { id: 'R1', area: 'A1', x: 420,  y: 160, mark: '◎', by: 'shirou',  kind: 'sign',      required: false, label: '錆びた看板' },
  { id: 'Q2', area: 'A2', x: 1700, y: 150, mark: '⌕', by: 'yotsuba', kind: 'boot',      required: true,  label: '用水路の長靴' },
  { id: 'R2', area: 'A2', x: 1300, y: 55,  mark: '◎', by: 'yotsuba', kind: 'jizo',      required: false, label: '道端の地蔵' },
  // 双眼鏡。CASE 01 のドアに相当する固有装置。拾わせて、使わせて、後悔させる
  { id: 'Q3', area: 'A3', x: 2900, y: 60,  mark: '◎', by: 'shirou',  kind: 'house',     required: true,  flag: 'has_binoculars', label: 'ビニールハウスの中' },
  { id: 'H1', area: 'A3', x: 3160, y: 22,  mark: '⌕', by: 'yotsuba', kind: 'graffiti',  required: false, hidden: true, flag: 'saw_graffiti_404', label: 'ハウス裏の落書き' },
  { id: 'Q4', area: 'A4', x: 3480, y: 92,  mark: '？', by: 'yotsuba', kind: 'scarecrow', required: true,  label: '案山子' },
  { id: 'R3', area: 'A5', x: 4980, y: 108, mark: '◎', by: 'shirou',  kind: 'truck',     required: false, label: '軽トラ' },
];

// 生還地点。祖母の家の玄関
export const SAFE_ZONE = { x: 5330, y: 60, r: 110 };

export const WAYPOINTS = [
  { x: 250,  y: 140 }, { x: 620,  y: 110 }, { x: 980,  y: 130 },
  { x: 1320, y: 120 }, { x: 1680, y: 145 }, { x: 2060, y: 125 },
  { x: 2420, y: 110 }, { x: 2860, y: 95  }, { x: 3260, y: 110 },
  { x: 3480, y: 118 }, { x: 3760, y: 96  }, { x: 4180, y: 100 },
  { x: 4620, y: 94  }, { x: 4980, y: 104 }, { x: 5230, y: 88  },
];

// 遮蔽物。この陰に入ると視線が切れる（core/sight.js）
// x を中心に w の幅、y より手前（y が大きい側）が陰になる
// 遮蔽物。この陰に入ると視線が切れる（core/sight.js）
// 日は田の向こうに沈むので、影は手前（y が大きい側）へ伸びる。
// reach = 影の届く長さ。A4 以降はこれを短くしてあり、
// 隠れるには「田に近いほう」＝一番よく見える側へ寄らないといけない
export const COVERS = [
  { id: 'c1',  x: 250,  y: 48, w: 150, reach: 150, kind: 'shelter' },  // バス停の待合小屋
  { id: 'c2',  x: 1180, y: 40, w: 90,  reach: 150, kind: 'jizo' },
  { id: 'c3',  x: 1620, y: 34, w: 220, reach: 160, kind: 'bank' },     // 用水路の土手
  { id: 'c4',  x: 2320, y: 44, w: 260, reach: 155, kind: 'greenhouse' },
  { id: 'c5',  x: 2760, y: 44, w: 260, reach: 155, kind: 'greenhouse' },
  { id: 'c6',  x: 3180, y: 44, w: 260, reach: 155, kind: 'greenhouse' },
  // ここから先が山場。数が減り、影も短い
  { id: 'c7',  x: 3760, y: 40, w: 100, reach: 82, kind: 'hasa' },      // 稲架
  { id: 'c8',  x: 4180, y: 44, w: 100, reach: 80, kind: 'hasa' },
  { id: 'c9',  x: 4620, y: 36, w: 120, reach: 86, kind: 'hasa' },      // ここまでが一番遠い
  { id: 'c10', x: 4980, y: 46, w: 170, reach: 92, kind: 'truck' },     // 軽トラ
  { id: 'c11', x: 5230, y: 32, w: 200, reach: 96, kind: 'wall' },      // 家の塀
];

// くねくねは追わない。田の向こうを平行にゆっくり動く
export const KUNEKUNE = {
  y: -60,              // 田の向こう。歩ける帯（0..200）の外
  ahead: 210,          // 出てくる位置。画面に収まる範囲でないと発見できない
  driftSpeed: 24,      // プレイヤーへ寄る速度。ゆっくり
  minGap: 170,         // これ以上は近づかない
  fillRate: 0.27,      // 見えている間の理解度の上がり（毎秒）
  fadeRate: 0.42,      // 遮蔽の陰にいる間の下がり（毎秒）
  nearBoost: 1.5,      // 近いほど速く上がる
  peek: 0.42,          // 双眼鏡で覗いてしまった分
  carry: 0.24,         // 覗いた分のうち、帰り道の開始時に残っている量
};

export const TRIGGERS = {
  phase1AtX: 1250,   // A2 到達。田の向こうで白いものが揺れる
  phase2AtX: 2400,   // A3。案山子は別の場所にあった
  phase3AtX: 3380,   // A4 に入る。四郎が双眼鏡で覗いてしまう
  // PHASE 4（理解度システム開始）は Q4（案山子）の調査で始まる
  duskByPhase: [0.05, 0.26, 0.46, 0.68, 0.88],
};

const L = (who, text, dur) => ({ who, text, dur: dur || null });

export const DIALOGUE = {
  intro: [
    L('rei', 'ばあちゃんち、この道の先だっけ'),
    L('shirou', 'あっつ。麦茶'),
    L('yotsuba', 'さっき飲んだでしょ'),
    L('rei', 'この辺コンビニ無いよ'),
    L('shirou', 'は？'),
  ],
  Q1: [
    L('rei', '時刻表、一日四本'),
    L('yotsuba', '次、三時間後'),
    L('shirou', '歩くしかないじゃん'),
  ],
  R1: [
    L('shirou', '字が消えてて読めない'),
    L('rei', '「ふるさと」までは読める'),
    L('yotsuba', '後半が大事なやつだ'),
  ],
  Q2: [
    L('yotsuba', '長靴。片方だけ'),
    L('rei', '水路に落ちたのかな'),
    L('yotsuba', 'これ、子どものサイズだよ'),
  ],
  R2: [
    L('yotsuba', 'お地蔵さん。前掛け新しい'),
    L('rei', '誰か手入れしてる'),
    L('shirou', 'この辺、人いたっけ'),
  ],
  Q3: [
    L('shirou', 'うわ、あっつい。……あ、双眼鏡'),
    L('rei', 'なんでこんな所に'),
    L('shirou', 'もらっとこ'),
    L('yotsuba', 'よくない気がする'),
  ],
  H1: [
    L('yotsuba', '……ここにも書いてある。404'),
    L('rei', 'あの落書きと同じ字だ'),
    L('yotsuba', '住宅街とここ、離れてるよね'),
  ],
  Q4: [
    L('yotsuba', '案山子。……あれ'),
    L('rei', 'どうした'),
    L('yotsuba', 'さっき見たとき、こっち側にあった'),
  ],
  R3: [
    L('shirou', '鍵挿しっぱなし'),
    L('rei', '田舎だから'),
    L('yotsuba', '乗らないよ'),
  ],
  phase1: [
    L('rei', '……なんか、揺れてる'),
    L('shirou', '案山子だろ'),
  ],
  phase2: [
    L('yotsuba', '案山子、あっちにあるよ'),
    L('rei', 'じゃあ、あれは'),
  ],
  // 双眼鏡を覗いてしまう。四郎が黙る
  phase3: [
    L('shirou', 'ちょっと見てみるわ'),
    L('yotsuba', 'やめなよ'),
    L('shirou', '……'),
    L('rei', 'シロウ？'),
    L('shirou', '……なあ、あれ'),
  ],
  // 理解度システム開始
  phase4: [
    L('yotsuba', '見ないで'),
    L('yotsuba', '目、逸らして。ぜったい見ないで'),
    L('rei', '影に入れ。何かの陰に入るんだ'),
  ],
  // 理解度が上がっている間の警告（重複しないよう間引く）
  warn: [
    [L('yotsuba', '見ないでって！')],
    [L('rei', '陰に入れ')],
    [L('shirou', '……読めそう')],
    [L('yotsuba', 'シロウ、こっち向いて')],
  ],
  // 陰に入って理解度が下がったとき
  safe: [
    [L('rei', 'ここなら見えない')],
    [L('yotsuba', '……いま、なんて考えてた？')],
    [L('shirou', '（首を振る）')],
  ],
  banter: {
    A1: [
      [L('shirou', 'セミうるさ'), L('yotsuba', '夏だからね'), L('rei', 'ヒグラシはまだ早い')],
      [L('rei', 'ばあちゃん、迎え来るって言ってなかった？'), L('shirou', '言ってた'), L('yotsuba', 'いないね')],
    ],
    A2: [
      [L('yotsuba', '水、思ったより速い'), L('rei', '用水路は毎年ニュースになる'), L('shirou', '入んないって')],
      [L('shirou', 'ザリガニいる'), L('yotsuba', '触らないで'), L('shirou', 'もう触った')],
    ],
    A3: [
      [L('rei', 'ハウスの中って何度あるんだろ'), L('shirou', '五十度'), L('yotsuba', '適当だ')],
      [L('yotsuba', 'ビニール、内側から曇ってる'), L('rei', '……人がいる時の曇り方だよ、それ')],
    ],
    A4: [
      [L('shirou', '道、まっすぐすぎ'), L('rei', '田んぼだからね'), L('yotsuba', '隠れるとこ無いね')],
      [L('rei', '影がのびてきた'), L('shirou', 'もうすぐ暗くなるな')],
    ],
    A5: [
      [L('shirou', '見えた。あれだろ'), L('yotsuba', '灯りついてる'), L('rei', 'よかった')],
    ],
  },
  survive: [
    L('yotsuba', '入って。早く'),
    L('rei', '……閉めた'),
    L('shirou', '……'),
    L('yotsuba', 'シロウ、何が見えたの'),
    L('shirou', '言わない'),
  ],
  // 理解してしまった
  caught: [
    L('shirou', '……あ'),
    L('shirou', 'わかった'),
  ],
  epilogue: [
    L('rei', '結局あれ、なんだったんだ'),
    L('yotsuba', '調べない方がいいと思う'),
    L('rei', '珍しいね、ヨツバがそう言うの'),
    L('yotsuba', 'シロウがまだ喋らないから'),
  ],
};

export const EVIDENCE = {
  Q1: 'バス停の時刻表（一日四本）',
  Q2: '用水路の長靴。子どものサイズ、片方だけ',
  Q3: 'ビニールハウスに置かれていた双眼鏡',
  Q4: '案山子。位置が変わっている',
  R1: '読めない看板（「ふるさと」まで）',
  R2: '前掛けの新しい地蔵',
  R3: '鍵の挿さった軽トラ',
  H1: 'ハウス裏の落書き「404」',
};

export const RECORD = {
  case: 'CASE 02 / くねくね',
  rumor: '田の向こうに白いものがいる。見て分かってしまうと戻れない',
  places: ['バス停', '用水路', 'ビニールハウス', '田んぼの一本道', '集落'],
  encounter: 'あり。動かなかった。追ってこなかった',
  notes: [
    ['レイ', '追ってこないものが一番こわい'],
    ['ヨツバ', '案山子は誰かが動かしている'],
    ['シロウ', '（記入なし）'],
  ],
  unresolved: [
    '四郎は双眼鏡で何を見たのか',
    '長靴の片方は誰のものか',
    '案山子を動かしたのは誰か',
  ],
  unresolvedIf: {
    saw_graffiti_404: '住宅街と田んぼ。離れた二か所に同じ「404」がある',
  },
};

// 田・電柱・稲架など。固定シードで毎回同じ土地にする
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function buildScenery() {
  const r = rng(20402);
  const poles = [];
  const paddies = [];
  const clutter = [];
  for (let x = 60; x < WORLD.length; x += 340) poles.push({ x, h: 150 + ((x * 7) % 46) });
  // 奥へ広がる田の区画。一枚の緑ではなく、一枚ずつ色の違う田にする
  for (let i = 0; i < 90; i++) {
    const near = -8 - r() * 46;
    paddies.push({
      x: -400 + i * 250 + r() * 90,
      depth: near,                 // 手前の畦
      span: 22 + r() * 34,         // 奥行き
      w: 200 + r() * 190,
      tone: 0.84 + r() * 0.34,
      water: r() < 0.22,           // 水を張ったまま。夕日を映す
    });
  }
  for (let x = 120; x < WORLD.length; x += 150 + r() * 220) {
    const k = r();
    clutter.push({ x: Math.round(x), kind: k < 0.4 ? 'weed' : k < 0.7 ? 'post' : 'rock' });
  }
  return { poles, paddies, clutter, lamps: [] };
}

export const SCENERY = buildScenery();

export const PROPS = [
  { kind: 'busstop',   x: 250,  y: 48 },
  { kind: 'canal',     x: 1000, y: 0,  w: 1100 },
  { kind: 'greenhouses', x: 2200, y: 44, w: 1150 },
  { kind: 'scarecrow', x: 3480, y: 8 },
  { kind: 'village',   x: 4900, y: -12, w: 700 },
];

export const CASE02 = {
  id: 'case02',
  title: 'CASE 02 / くねくね',
  no: 'CASE 02',
  name: 'くねくね',
  mode: 'sight',            // 生還の型。CASE 01 は 'chase'
  renderer: 'field',
  WORLD, SPEED, CHARS, SPEAKERS, AREAS, GATES, POINTS, SAFE_ZONE, WAYPOINTS,
  COVERS, KUNEKUNE, TRIGGERS, DIALOGUE, SCENERY, PROPS, EVIDENCE, RECORD,
  SPAWNS: { phase2: [], phase3: [] },  // このCASEはスポーン抽選を使わない
};
