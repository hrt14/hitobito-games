// CASE 04「人面犬」 5エリア縦切り版のデータ
// 仕様: ../CASE04_SLICE.md
import { CHARS } from './chars.js';

export const WORLD = {
  length: 6800,
  bandTop: 0,      // 店側（奥）
  bandBottom: 200, // 手前
};

export const SPEED = {
  walk: 178,
  run: 205,
  anomaly: 0,  // 追ってこない
};

// この CASE だけの話者。名前は付けない。声だけがある
export const SPEAKERS = {
  ...CHARS,
  koe: { name: '', label: '', color: '#c9a24a', hair: '#1a1614', scale: 1.0 },
};

export const AREAS = [
  { id: 'A1', name: '商店街の入口', x0: 0,    x1: 900,  bandTop: 20, bandBottom: 200 },
  { id: 'A2', name: 'アーケード',   x0: 900,  x1: 2100, bandTop: 10, bandBottom: 200 },
  { id: 'A3', name: '自販機の前',   x0: 2100, x1: 3100, bandTop: 10, bandBottom: 200 },
  { id: 'A4', name: 'シャッター通り', x0: 3100, x1: 3900, bandTop: 10, bandBottom: 190 },
  // アーケードを出る。ここが山場。路地が続き、線は毎回どれかを指す
  { id: 'A5', name: '交差点',       x0: 3900, x1: 6800, bandTop: 10, bandBottom: 200 },
];

// 開放は「文字」ではなく世界の変化で示す（SPEC §20）
export const GATES = [
  { id: 'G1', x: 900,  unlockedBy: 'D1', opens: 'A2', kind: 'arcade',  note: 'アーケードの照明がつく' },
  { id: 'G2', x: 2100, unlockedBy: 'D2', opens: 'A3', kind: 'cart',    note: '荷車がどけられる' },
  { id: 'G3', x: 3100, unlockedBy: 'D3', opens: 'A4', kind: 'shutter', note: 'シャッターが半分上がる' },
  { id: 'G4', x: 3900, unlockedBy: 'D4', opens: 'A5', kind: 'cones',   note: 'カラーコーンがどく' },
];

// 路地。PHASE 0〜3 は「入ると良いことがある場所」。PHASE 4 で牙をむく
export const ALLEYS = [
  { id: 'k0', x: 420,  w: 130, deep: -110 },
  { id: 'k1', x: 1420, w: 140, deep: -120 },
  { id: 'k2', x: 2680, w: 150, deep: -130 },  // 首輪と404
  // ここから先が山場。路地ひとつが判断ひとつ
  { id: 'k3', x: 3560, w: 140, deep: -120 },
  { id: 'k4', x: 4120, w: 140, deep: -125 },
  { id: 'k5', x: 4640, w: 150, deep: -120, honest: true },  // 線が嘘をつかない回
  { id: 'k6', x: 5180, w: 140, deep: -128 },
  { id: 'k7', x: 5700, w: 145, deep: -122 },
  { id: 'k8', x: 6180, w: 140, deep: -118, honest: true },  // 最後だけ正しい
];

export const POINTS = [
  { id: 'D1', area: 'A1', x: 640,  y: 66,  mark: '？', by: 'rei',     kind: 'notice',  required: true,  label: 'シャッターの貼り紙' },
  { id: 'E1', area: 'A1', x: 420,  y: -70, mark: '◎', by: 'shirou',  kind: 'vending', required: false, label: '路地裏の自販機' },
  { id: 'D2', area: 'A2', x: 1740, y: 60,  mark: '⌕', by: 'yotsuba', kind: 'bowl',    required: true,  label: '犬用の水入れ' },
  { id: 'E2', area: 'A2', x: 1420, y: -80, mark: '◎', by: 'yotsuba', kind: 'bed',     required: false, label: '段ボールの寝床' },
  // 首輪。CASE 01 のドア／02 の双眼鏡／03 のイヤホンに相当する固有装置
  { id: 'D3', area: 'A3', x: 2680, y: -86, mark: '？', by: 'shirou',  kind: 'collar',  required: true,  flag: 'has_collar', label: '路地の奥の首輪' },
  { id: 'H1', area: 'A3', x: 2620, y: -118, mark: '⌕', by: 'yotsuba', kind: 'graffiti', required: false, hidden: true, flag: 'saw_graffiti_404', label: '路地の壁の落書き' },
  { id: 'D4', area: 'A4', x: 3400, y: 62,  mark: '？', by: 'rei',     kind: 'claw',    required: true,  label: 'シャッターの爪の跡' },
  { id: 'E3', area: 'A5', x: 6320, y: 172, mark: '◎', by: 'shirou',  kind: 'board',   required: false, label: '交番前の掲示板' },
];

// 生還地点。交番の灯り
export const SAFE_ZONE = { x: 6700, y: 66, r: 110 };

export const WAYPOINTS = [
  { x: 240,  y: 130 }, { x: 620,  y: 108 }, { x: 900,  y: 120 },
  { x: 1260, y: 130 }, { x: 1720, y: 100 }, { x: 2080, y: 120 },
  { x: 2400, y: 130 }, { x: 2900, y: 120 }, { x: 3260, y: 110 },
  { x: 3440, y: 100 }, { x: 3860, y: 120 }, { x: 4300, y: 130 },
  { x: 4820, y: 120 }, { x: 5360, y: 130 }, { x: 5880, y: 120 },
  { x: 6340, y: 130 }, { x: 6600, y: 100 },
];

// 嘘のリズム。数字がそのまま「疑う時間」の設計
export const LURE = {
  near: 260,        // 路地にこれだけ近づくと線が曲がりはじめる
  past: 70,         // 通り過ぎたら線が戻る
  depth: 46,        // 路地の口からこれだけ入ると連れて行かれる
  warnDelay: 0.55,  // 仲間が否定するまで。首輪を拾うと伸びる
  warnDelayCollar: 1.6,
};

export const NINMENKEN = {
  gap: 96,      // 隣を歩く距離
  side: 48,     // 手前側にずれて歩く。仲間と重ならない距離
  follow: 2.2,  // 追いつきも離れもしない
};

export const TRIGGERS = {
  phase1AtX: 1100,   // アーケードに入る。犬の鳴き声。姿は見えない
  phase2AtX: 2200,   // 自販機の前。シャッターの隙間から見られている
  phase3AtX: 3180,   // シャッター通り。路地の奥にいる。近づくと消える
  // PHASE 4（嘘のライン開始）は D4（爪の跡）の調査で始まる
  duskByPhase: [0.1, 0.3, 0.5, 0.72, 1.0],  // アーケードの蛍光灯が死んでいく
};

const L = (who, text, dur) => ({ who, text, dur: dur || null });

export const DIALOGUE = {
  intro: [
    L('shirou', 'たい焼き屋、閉まってる'),
    L('yotsuba', '九時だからね'),
    L('rei', '開いてても金無いだろ'),
    L('shirou', '見るのは無料'),
  ],
  D1: [
    L('rei', '貼り紙。「犬をお探しの方へ」'),
    L('yotsuba', '写真のとこ、破られてる'),
    L('rei', '……日付、先週'),
  ],
  E1: [
    L('shirou', '自販機。この路地だけ明るい'),
    L('yotsuba', 'あったかい方、売り切れ'),
    L('shirou', '夏に補充したきりだな'),
  ],
  D2: [
    L('yotsuba', '水入れ。まだ濡れてる'),
    L('rei', '誰かが置いてる'),
    L('yotsuba', '……この深さ、犬用じゃなくない？'),
  ],
  E2: [
    L('yotsuba', '段ボール。人が寝る大きさ'),
    L('rei', '犬の毛がついてる'),
    L('shirou', 'どっちなんだよ'),
  ],
  D3: [
    L('shirou', '首輪。落ちてた'),
    L('rei', '名札、擦れて読めない'),
    L('shirou', '（拾う）持っとくわ'),
    L('yotsuba', '……置いてった方がいい気がする'),
  ],
  H1: [
    L('yotsuba', 'ここにも。404'),
    L('rei', '四か所目'),
    L('yotsuba', '住宅街、田んぼ、学校、商店街'),
  ],
  D4: [
    L('rei', 'シャッターに跡がついてる'),
    L('yotsuba', '爪。……高い'),
    L('rei', '犬が立って掻いた高さだ'),
  ],
  E3: [
    L('shirou', '掲示板。指名手配と、迷い犬'),
    L('rei', '同じ紙に貼ってある'),
  ],
  phase1: [
    L('rei', '犬の声'),
    L('shirou', 'どこ？'),
    L('yotsuba', '……上から聞こえた'),
  ],
  phase2: [
    L('yotsuba', 'シャッターの隙間。見られてる'),
    L('rei', '目の高さ、低くないな'),
    L('shirou', '見んなって'),
  ],
  phase3: [
    L('rei', '路地の奥にいる'),
    L('shirou', '犬じゃん。普通の'),
    L('yotsuba', '……いなくなった'),
    L('rei', '顔。どんな顔だった？'),
    L('shirou', '……思い出せない'),
  ],
  // 隣を歩きはじめる。ここから線が嘘をつく
  phase4: [
    L('koe', 'こんばんは'),
    L('yotsuba', 'えっ'),
    L('koe', 'どこ行くの'),
    L('rei', '答えるな。歩け'),
    L('yotsuba', '交番。交番の灯り見て'),
  ],
  // 嘘をついている間に人面犬が言うこと（名前は首輪を拾うと付く）
  lure: [
    [L('koe', 'そっち、近道だよ')],
    [L('koe', 'こっちのほうが早いよ')],
    [L('koe', '大丈夫だって')],
    [L('koe', 'まだ開いてる店あるよ')],
    [L('koe', 'ついてきなよ')],
  ],
  lureNamed: [
    [L('koe', 'シロウくん。そっち')],
    [L('koe', 'ヨツバちゃん、こっち')],
    [L('koe', 'レイくんは知ってるよね')],
    [L('koe', '三人とも、こっち')],
  ],
  // 嘘のときに仲間が否定する。これが唯一の確実な合図
  deny: [
    [L('rei', 'その道じゃない')],
    [L('yotsuba', 'さっきそこ通った')],
    [L('rei', '線、見るな。灯り見ろ')],
    [L('yotsuba', '曲がらないで')],
  ],
  // 正しい線に戻ったとき
  clear: [
    [L('rei', '……いまのは合ってる')],
    [L('yotsuba', 'まっすぐ')],
  ],
  banter: {
    A1: [
      [L('shirou', 'シャッター街って言うなよな'), L('rei', '事実だろ'), L('yotsuba', '昼は開いてるよ')],
      [L('yotsuba', '猫いた'), L('shirou', 'どこ'), L('yotsuba', 'もういない')],
    ],
    A2: [
      [L('rei', 'アーケードって雨の日いいよな'), L('shirou', '今日晴れ'), L('rei', '知ってる')],
      [L('yotsuba', '天井の電気、何本か切れてる'), L('rei', '直す人いないんだよ')],
    ],
    A3: [
      [L('shirou', '自販機の音、うるさ'), L('yotsuba', '静かだからだよ')],
      [L('rei', 'ここだけ明るいな'), L('shirou', '虫来るぞ'), L('yotsuba', '秋だってば')],
    ],
    A4: [
      [L('shirou', '暗っ'), L('rei', '電気、ここから切れてる'), L('yotsuba', '足元見て')],
    ],
    A5: [
      [L('rei', '交番、灯りついてる'), L('yotsuba', '人いるかな'), L('shirou', 'いてくれ')],
    ],
  },
  survive: [
    L('yotsuba', '灯り！　そこ！'),
    L('rei', '……入った'),
    L('shirou', '……'),
    L('rei', 'シロウ、首輪'),
    L('shirou', '（ポケットに入れたまま何も言わない）'),
  ],
  // ついて行ってしまった
  caught: [
    L('koe', 'こっちだよ'),
    L('shirou', '……うん'),
  ],
  epilogue: [
    L('yotsuba', 'あの顔、思い出せる？'),
    L('rei', '思い出せない'),
    L('yotsuba', 'わたしも'),
    L('shirou', '……名前は覚えてる'),
    L('rei', '誰の'),
  ],
};

export const EVIDENCE = {
  D1: '「犬をお探しの方へ」の貼り紙（写真が破られている・先週の日付）',
  D2: '犬用にしては深い水入れ。まだ濡れていた',
  D3: '路地の奥に落ちていた首輪。名札は読めない',
  D4: 'シャッターの爪の跡。立って掻いた高さ',
  E1: '路地裏の自販機（あたたかい方は売り切れ）',
  E2: '人が寝る大きさの段ボール。犬の毛つき',
  E3: '指名手配と迷い犬が同じ紙に貼られた掲示板',
  H1: '路地の壁の落書き「404」',
};

export const RECORD = {
  case: 'CASE 04 / 人面犬',
  rumor: '夜の商店街で声をかけられる。ついて行くと戻れない',
  places: ['商店街の入口', 'アーケード', '自販機の前', 'シャッター通り', '交差点'],
  encounter: 'あり。追ってこなかった。ずっと隣を歩いていた',
  notes: [
    ['レイ', '道を教えてくるものは、道を知っている'],
    ['ヨツバ', '三人とも名前を呼ばれた。教えていない'],
    ['シロウ', '顔だけ思い出せない'],
  ],
  unresolved: [
    '首輪の名札には何と書いてあったのか',
    'なぜ三人の名前を知っていたのか',
    '顔を、三人とも思い出せない',
  ],
  unresolvedIf: {
    saw_graffiti_404: '住宅街・田んぼ・学校・商店街。四か所に同じ「404」がある',
  },
};

// 店・天井・看板。固定シードで毎回同じ商店街にする
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function buildScenery() {
  const r = rng(40404);
  const shops = [];
  const lights = [];
  const clutter = [];
  const KINDS = ['shutter', 'shutter', 'shutter', 'glass', 'awning'];
  for (let x = 40; x < WORLD.length; x += 150 + r() * 60) {
    shops.push({
      x: Math.round(x),
      w: 130 + r() * 40,
      kind: KINDS[Math.floor(r() * KINDS.length)],
      tone: 0.82 + r() * 0.34,
      sign: r() < 0.5,
    });
  }
  // アーケードの蛍光灯。奥へ行くほど死んでいる
  for (let x = 950; x < 3900; x += 180) {
    lights.push({ x, dead: x > 3000 && ((x / 180) | 0) % 2 === 0 });
  }
  for (let x = 120; x < WORLD.length; x += 130 + r() * 190) {
    const k = r();
    clutter.push({ x: Math.round(x), kind: k < 0.36 ? 'bin' : k < 0.68 ? 'crate' : 'bike' });
  }
  return { shops, lights, clutter, lamps: [] };
}

export const SCENERY = buildScenery();

export const PROPS = [
  { kind: 'arcade',  x: 900,  y: 0, w: 3000 },   // 天井のある区間。A5 で切れて夜空が戻る
  { kind: 'vending', x: 2380, y: 40 },
  { kind: 'koban',   x: 6700, y: 40 },
];

export const CASE04 = {
  id: 'case04',
  title: 'CASE 04 / 人面犬',
  no: 'CASE 04',
  name: '人面犬',
  mode: 'voice',            // 生還の型。01 chase / 02 sight / 03 pass
  renderer: 'arcade',
  WORLD, SPEED, CHARS, SPEAKERS, AREAS, GATES, POINTS, SAFE_ZONE, WAYPOINTS,
  ALLEYS, LURE, NINMENKEN, TRIGGERS, DIALOGUE, SCENERY, PROPS, EVIDENCE, RECORD,
};
