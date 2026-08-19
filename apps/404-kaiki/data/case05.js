// CASE 05「きさらぎ駅」 5エリア縦切り版のデータ
// 仕様: ../CASE05_SLICE.md
import { CHARS } from './chars.js';

export const WORLD = {
  length: 2800,    // これが一周
  bandTop: 0,      // 線路側（奥）
  bandBottom: 200, // 壁side（手前）
};

export const SPEED = {
  walk: 178,
  run: 196,
  anomaly: 0,  // 歩き回る怪異がいない
};

// この CASE だけの話者。アナウンス
export const SPEAKERS = {
  ...CHARS,
  announce: { name: '', label: '放送', color: '#6ea8c4', hair: '#1a1614', scale: 1.0 },
};

export const AREAS = [
  { id: 'A1', name: '上りホーム',     x0: 0,    x1: 760,  bandTop: 30, bandBottom: 190 },
  { id: 'A2', name: 'ホーム端の階段', x0: 760,  x1: 1100, bandTop: 60, bandBottom: 170 },
  { id: 'A3', name: '下りホーム',     x0: 1100, x1: 1860, bandTop: 30, bandBottom: 190 },
  { id: 'A4', name: '待合室',         x0: 1860, x1: 2260, bandTop: 70, bandBottom: 180 },
  { id: 'A5', name: '地下道',         x0: 2260, x1: 2800, bandTop: 80, bandBottom: 170 }, // 一番暗い
];

// 開放は「文字」ではなく世界の変化で示す（SPEC §20）
export const GATES = [
  { id: 'G1', x: 760,  unlockedBy: 'N1', opens: 'A2', kind: 'chain',   note: '立入禁止のチェーンが外れる' },
  { id: 'G2', x: 1100, unlockedBy: 'N2', opens: 'A3', kind: 'gate',    note: '柵の扉が開く' },
  { id: 'G3', x: 1860, unlockedBy: 'N3', opens: 'A4', kind: 'door',    note: '待合室の引き戸が開く' },
  { id: 'G4', x: 2260, unlockedBy: 'N4', opens: 'A5', kind: 'shutter', note: '地下道のシャッターが上がる' },
];

export const POINTS = [
  { id: 'N1', area: 'A1', x: 430,  y: 66,  mark: '？', by: 'rei',     kind: 'timetable', required: true,  label: '時刻表' },
  { id: 'M1', area: 'A1', x: 620,  y: 168, mark: '◎', by: 'shirou',  kind: 'bench',     required: false, label: 'ベンチの忘れ物' },
  // 切符。CASE 01 のドア／02 の双眼鏡／03 のイヤホン／04 の首輪に相当
  { id: 'N2', area: 'A2', x: 960,  y: 100, mark: '？', by: 'shirou',  kind: 'ticket',    required: true,  flag: 'has_ticket', label: '券売機の下の切符' },
  { id: 'N3', area: 'A3', x: 1480, y: 60,  mark: '⌕', by: 'yotsuba', kind: 'signboard', required: true,  label: '駅名標' },
  { id: 'M2', area: 'A3', x: 1720, y: 176, mark: '◎', by: 'shirou',  kind: 'track',     required: false, label: '線路に落ちているもの' },
  { id: 'N4', area: 'A4', x: 2060, y: 106, mark: '？', by: 'rei',     kind: 'notice',    required: true,  label: '待合室の張り紙' },
  { id: 'H1', area: 'A5', x: 2520, y: 100, mark: '⌕', by: 'yotsuba', kind: 'graffiti',  required: false, hidden: true, flag: 'saw_graffiti_404', label: '地下道の壁の落書き' },
  { id: 'M3', area: 'A5', x: 2360, y: 160, mark: '◎', by: 'shirou',  kind: 'vending',   required: false, label: '地下道の自販機' },
];

// 生還地点。輪が切れたときに現れる、無かったはずの階段。
// 地下道の先ではなく**毎周たどり着いてしまう入口の側**に出す。
// 出口はずっとそこにあった、という絵にしたい（§33 §40）
export const SAFE_ZONE = { x: 470, y: 150, r: 110 };

export const WAYPOINTS = [
  { x: 200,  y: 130 }, { x: 430,  y: 100 }, { x: 660,  y: 130 },
  { x: 900,  y: 110 }, { x: 1060, y: 120 }, { x: 1300, y: 110 },
  { x: 1520, y: 120 }, { x: 1800, y: 130 }, { x: 2040, y: 120 },
  { x: 2300, y: 130 }, { x: 2560, y: 120 },
];

// 縫い目。地下道の一番暗いところで x を巻き戻す。
// 暗転もフェードも入れない。入れると「一周した」と教えてしまう
export const SEAM = { wrapAt: 2760, enterAt: 46 };

// 毎周ひとつだけ違うもの。もの → 人 → 名前 → 自分たち。
// 位置は周を追うごとに入口へ寄る。**おかしさが近づいてくる**
export const CHANGES = [
  { id: 'ch1', x: 1480, y: 60,  kind: 'signboard', label: '駅名標が「きさらぎ」' },
  { id: 'ch2', x: 1000, y: 100, kind: 'timetable', label: '時刻表が白紙' },
  { id: 'ch3', x: 620,  y: 168, kind: 'sitter',    label: 'ベンチに誰か座っている' },
  { id: 'ch4', x: 240,  y: 120, kind: 'shadows',   label: '影が四つある' },
];

export const LOOP = {
  radiusX: 100,   // 変化に気づく範囲。調査より少し広い
  radiusY: 74,
  hint1: 11,      // 周の頭からこれだけ経つとヨツバが気配を言う
  hint2: 22,      // さらに経つと場所を言う。同時にマークが戻る
  hint1Ticket: 15,  // 切符を拾っていると仲間の指摘が遅れる
  hint2Ticket: 30,
  maxMiss: 3,     // これだけ見落とすと連れて行かれる
};

export const TRIGGERS = {
  phase1AtX: 560,    // アナウンス。駅名のところだけ音が途切れる
  phase2AtX: 1280,   // 線路の向こうに灯りが無い。町が無い
  phase3AtX: 2000,   // 電車が来る。誰も乗らない。行ってしまう
  // PHASE 4（周回開始）は N4（張り紙）の調査で始まる
  decayByPhase: [0, 0.08, 0.18, 0.3, 0.42],
};

const L = (who, text, dur) => ({ who, text, dur: dur || null });

export const DIALOGUE = {
  intro: [
    L('shirou', 'あと十二分'),
    L('rei', 'さっきも十二分って言ってた'),
    L('yotsuba', '言ってない'),
    L('shirou', '言った'),
  ],
  N1: [
    L('rei', '時刻表。終電、二十三時四十分'),
    L('yotsuba', 'いま何時？'),
    L('rei', '……二十三時四十分'),
  ],
  M1: [
    L('shirou', 'ベンチに傘。畳んである'),
    L('yotsuba', '雨降ってないよ'),
    L('rei', '降ってた日のかもな'),
  ],
  N2: [
    L('shirou', '券売機の下。切符落ちてる'),
    L('rei', '日付、今日だ'),
    L('shirou', '降りる駅んとこ、空白'),
    L('yotsuba', '……戻しときなよ'),
  ],
  N3: [
    L('yotsuba', '駅名標。向かいのホームの'),
    L('rei', '隣の駅の名前、両方とも知らない'),
    L('yotsuba', 'この駅の名前は？'),
    L('rei', '……読める。読めるけど、出てこない'),
  ],
  M2: [
    L('shirou', '線路に何か落ちてる'),
    L('rei', '軍手。片方'),
    L('yotsuba', 'また片方だ'),
  ],
  N4: [
    L('rei', '張り紙。「終電後は地下道をご利用ください」'),
    L('shirou', 'じゃあ地下道行こ'),
    L('yotsuba', '……終電、まだ来てないよ'),
  ],
  H1: [
    L('yotsuba', '壁。404'),
    L('rei', '五か所目'),
    L('yotsuba', '住宅街、田んぼ、学校、商店街、ここ'),
    L('rei', '……この駅、町のどこにある？'),
    L('shirou', '（誰も答えない）'),
  ],
  M3: [
    L('shirou', '自販機。全部売り切れ'),
    L('rei', '電源は入ってる'),
  ],
  phase1: [
    L('announce', 'まもなく、二番線に、────ゆき'),
    L('shirou', 'いま駅名のとこ聞こえた？'),
    L('rei', '聞こえなかった'),
  ],
  phase2: [
    L('yotsuba', '線路の向こう、真っ暗'),
    L('rei', '町の灯りが無い'),
    L('shirou', '停電？'),
    L('rei', '……駅は点いてる'),
  ],
  phase3: [
    L('rei', '来た'),
    L('yotsuba', '誰も降りてこない'),
    L('shirou', '乗る？'),
    L('rei', 'やめとけ'),
    L('yotsuba', '……行っちゃった'),
  ],
  // 改札を出たはずが、またホームにいる
  phase4: [
    L('shirou', '出口こっちだろ'),
    L('rei', '……ホームだ'),
    L('yotsuba', 'さっきのベンチ。同じ傘'),
    L('rei', 'もう一周する。今度は見ろ'),
    L('yotsuba', '何かひとつ、絶対に変わってる'),
  ],
  // 周の頭。一周したことを伝える
  lapTop: [
    [L('rei', 'またここだ')],
    [L('yotsuba', '三周目')],
    [L('rei', '……戻ってきた')],
    [L('shirou', 'また同じベンチ')],
  ],
  // ヨツバの気配（hint1）
  hint1: [
    [L('yotsuba', '……なんか、変わってない？')],
    [L('yotsuba', 'さっきと違う。どこか')],
    [L('rei', '前の周と、何かひとつ違う')],
  ],
  // 気づいたとき（変化ごとに差し替える）
  ch1: [
    L('yotsuba', '駅名標。「きさらぎ」って書いてある'),
    L('shirou', 'そんな駅ある？'),
    L('rei', '……無い'),
  ],
  ch2: [
    L('rei', '時刻表'),
    L('yotsuba', '白紙。さっきまで数字あった'),
    L('shirou', '書いてあったよな。二十三時四十分'),
  ],
  ch3: [
    L('yotsuba', 'ベンチ。……座ってる'),
    L('shirou', '傘、持ってる'),
    L('yotsuba', '見ないで。行こう'),
  ],
  ch4: [
    L('yotsuba', '待って。足元'),
    L('shirou', '……影、四つある'),
    L('rei', '階段。そこ。さっきまで無かった'),
  ],
  // 気づかずに一周した
  miss: [
    [L('rei', '……また戻った'), L('yotsuba', '見落とした')],
    [L('yotsuba', '電気、減ってる'), L('rei', '駅が悪くなってる')],
  ],
  banter: {
    A1: [
      [L('shirou', 'ホーム広いな'), L('yotsuba', '人がいないからだよ')],
      [L('rei', '虫の音しないな'), L('shirou', '秋だし'), L('yotsuba', '秋はするよ')],
    ],
    A2: [
      [L('shirou', '階段の電気、一本だけ'), L('rei', '踊り場が一番暗い')],
    ],
    A3: [
      [L('yotsuba', '向かいのホーム、こっちと同じ形'), L('rei', '鏡みたいだ')],
      [L('shirou', '電車、まだ来ないの'), L('rei', 'あと十二分')],
    ],
    A4: [
      [L('rei', '待合室、暖房入ってる'), L('yotsuba', '誰かいたのかな')],
    ],
    A5: [
      [L('shirou', '地下道って何であんな怖いんだろ'), L('rei', '音が返るからだよ')],
    ],
  },
  survive: [
    L('yotsuba', '階段！　さっき無かった！'),
    L('rei', '上がれ'),
    L('shirou', '……'),
    L('rei', 'シロウ、切符'),
    L('shirou', '（線路に落とした）'),
  ],
  // 気づかないまま三周した
  caught: [
    L('announce', 'まもなく、二番線に'),
    L('yotsuba', 'シロウ、どこ行くの'),
  ],
  epilogue: [
    L('rei', 'あの駅、調べたけど出てこない'),
    L('yotsuba', '無いってこと？'),
    L('rei', 'エラーですらない。何も出ない'),
    L('shirou', '……乗らなくてよかった'),
    L('yotsuba', 'うん'),
  ],
};

export const EVIDENCE = {
  N1: '時刻表（終電二十三時四十分。時計も二十三時四十分のまま）',
  N2: '使用済みの切符。日付は今日、降車駅の欄が空白',
  N3: '駅名標。隣の駅の名前を誰も知らない',
  N4: '「終電後は地下道をご利用ください」の張り紙',
  M1: 'ベンチに畳んで置かれた傘',
  M2: '線路の軍手。片方',
  M3: '全部売り切れの自販機（電源は入っている）',
  H1: '地下道の壁の落書き「404」',
};

export const RECORD = {
  case: 'CASE 05 / きさらぎ駅',
  rumor: '終電を待っていると、駅から出られなくなる',
  places: ['上りホーム', 'ホーム端の階段', '下りホーム', '待合室', '地下道'],
  encounter: 'なし。歩いているものはいなかった。駅そのものが変わっていった',
  notes: [
    ['レイ', '姿が無いものは、記録の取りようがない'],
    ['ヨツバ', '毎周ひとつだけ違った。四回とも違うものだった'],
    ['シロウ', '影は四つあった'],
  ],
  unresolved: [
    '切符の降車駅はどこだったのか',
    'ベンチに座っていたのは誰か',
    '駅の名前は、本当は何だったのか',
  ],
  unresolvedIf: {
    saw_graffiti_404: '住宅街・田んぼ・学校・商店街・駅。五か所に同じ「404」がある。ただしこの駅が町のどこにあるのかは誰も言えない',
  },
};

// ホーム・柱・蛍光灯。固定シードで毎回同じ駅にする
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function buildScenery() {
  const r = rng(50505);
  const pillars = [];
  const lights = [];
  const clutter = [];
  for (let x = 60; x < WORLD.length; x += 210) pillars.push({ x });
  // 蛍光灯。悪化すると端から落ちていく
  for (let x = 100; x < WORLD.length; x += 170) {
    lights.push({ x, order: r() });
  }
  for (let x = 140; x < WORLD.length; x += 170 + r() * 220) {
    const k = r();
    clutter.push({ x: Math.round(x), kind: k < 0.4 ? 'bin' : k < 0.7 ? 'bench' : 'sign' });
  }
  return { pillars, lights, clutter, lamps: [] };
}

export const SCENERY = buildScenery();

export const PROPS = [
  { kind: 'rails',    x: 0,    y: -40, w: 2800 },
  { kind: 'roof',     x: 0,    y: 0,   w: 2260 },  // ホームの屋根。A5 は地下
  { kind: 'gatehall', x: 700,  y: 20 },
  { kind: 'waiting',  x: 2080, y: 40 },
  { kind: 'tunnel',   x: 2260, y: 0,   w: 540 },
  { kind: 'exit',     x: 470,  y: 96 },            // 輪が切れると現れる階段
];

export const CASE05 = {
  id: 'case05',
  title: 'CASE 05 / きさらぎ駅',
  no: 'CASE 05',
  name: 'きさらぎ駅',
  mode: 'loop',             // 生還の型。01 chase / 02 sight / 03 pass / 04 voice
  renderer: 'station',
  WORLD, SPEED, CHARS, SPEAKERS, AREAS, GATES, POINTS, SAFE_ZONE, WAYPOINTS,
  SEAM, CHANGES, LOOP, TRIGGERS, DIALOGUE, SCENERY, PROPS, EVIDENCE, RECORD,
};
