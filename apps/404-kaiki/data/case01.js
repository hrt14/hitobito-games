// CASE 01「口裂け女」 5エリア縦切り版のデータ
// 仕様: ../CASE01_SLICE.md

export const WORLD = {
  length: 5700,
  bandTop: 0,      // 道の奥側
  bandBottom: 200, // 道の手前側
};

export const SPEED = {
  walk: 178,
  run: 238,
  anomaly: 219, // run * 0.92
};

export const CHARS = {
  shirou: { name: '四郎', label: 'シロウ', color: '#f08a45', hair: '#1a1414', scale: 1.06 },
  rei:    { name: '零',   label: 'レイ',   color: '#5f96e0', hair: '#141018', scale: 0.94 },
  yotsuba:{ name: '四葉', label: 'ヨツバ', color: '#49c98c', hair: '#1d1512', scale: 1.0 },
};

export const AREAS = [
  { id: 'A1', name: '住宅街入口', x0: 0,    x1: 1100, bandTop: 10, bandBottom: 200 },
  { id: 'A2', name: '小さな公園', x0: 1100, x1: 2200, bandTop: 0,  bandBottom: 200 },
  { id: 'A3', name: 'コンビニ裏', x0: 2200, x1: 3300, bandTop: 10, bandBottom: 195 },
  { id: 'A4', name: '細い路地',   x0: 3300, x1: 4400, bandTop: 60, bandBottom: 150 }, // 狭い＝一列になる
  { id: 'A5', name: '神社周辺',   x0: 4400, x1: 5700, bandTop: 0,  bandBottom: 200 },
];

// エリア境界。開放時は「文字」ではなく世界の見た目が変わる（SPEC §20）
export const GATES = [
  { id: 'G1', x: 1100, unlockedBy: 'P1', opens: 'A2', kind: 'gate',   note: '公園の門が開く' },
  { id: 'G2', x: 2200, unlockedBy: 'P2', opens: 'A3', kind: 'crates', note: '積まれたカゴがどく' },
  { id: 'G3', x: 3300, unlockedBy: 'P3', opens: 'A4', kind: 'door',   note: '裏口のドアが開いたままになる' },
  { id: 'G4', x: 4400, unlockedBy: 'P4', opens: 'A5', kind: 'steps',  note: '突き当たりに石段が見つかる' },
];

export const POINTS = [
  { id: 'P1', area: 'A1', x: 850,  y: 88,  mark: '？', by: 'rei',     kind: 'poster',  required: true,  label: '電柱の貼り紙' },
  { id: 'O1', area: 'A2', x: 1460, y: 45,  mark: '◎', by: 'shirou',  kind: 'swing',   required: false, label: 'ブランコ' },
  { id: 'P2', area: 'A2', x: 1782, y: 50,  mark: '◎', by: 'shirou',  kind: 'bin',     required: true,  label: 'ベンチ横のゴミ箱' },
  { id: 'O2', area: 'A3', x: 2620, y: 165, mark: '◎', by: 'shirou',  kind: 'vending', required: false, label: '自販機' },
  { id: 'P3', area: 'A3', x: 3060, y: 40,  mark: '◎', by: 'shirou',  kind: 'door',    required: true,  label: 'コンビニ裏口のドア' },
  { id: 'H1', area: 'A4', x: 3800, y: 64,  mark: '⌕', by: 'yotsuba', kind: 'graffiti',required: false, hidden: true, label: '室外機の裏の落書き' },
  { id: 'P4', area: 'A4', x: 4180, y: 95,  mark: '⌕', by: 'yotsuba', kind: 'mirror',  required: true,  label: '路地奥の落とし物' },
  { id: 'P5', area: 'A5', x: 5250, y: 86,  mark: '◎', by: 'all',     kind: 'torii',   required: true,  label: '鳥居の前' },
];

export const SAFE_ZONE = { x: 5320, y: 26, r: 120 }; // 道ではなく境内の入口

// 緑ラインが道なりに曲がるための経路点（SPEC §16）
export const WAYPOINTS = [
  { x: 300,  y: 130 }, { x: 700,  y: 100 }, { x: 1000, y: 120 },
  { x: 1300, y: 145 }, { x: 1650, y: 120 }, { x: 2050, y: 140 },
  { x: 2400, y: 120 }, { x: 2800, y: 100 }, { x: 3150, y: 85  },
  { x: 3400, y: 105 }, { x: 3750, y: 100 }, { x: 4050, y: 95  },
  { x: 4350, y: 110 }, { x: 4700, y: 125 }, { x: 5060, y: 110 },
  { x: 5230, y: 74 }, // 道から逸れて参道へ入る
];

// 怪異出現候補地点（SPEC §26/§27）。プレイヤーから最低 400px 離れた地点のみ選ぶ
export const SPAWNS = {
  phase2: [
    { x: 4380, y: 30, at: '路地の突き当たり' },
    { x: 3120, y: 10, at: 'コンビニ二階の窓', high: true },
    { x: 2140, y: 15, at: '公園の奥のフェンス際' },
  ],
  phase3: [
    { x: 4980, y: 25, at: '参道の端' },
    { x: 3980, y: 55, at: '曲がり角' },
    { x: 3040, y: 12, at: 'コンビニの窓の中', high: true },
    { x: 1180, y: 30, at: '道の奥' },
    { x: 2280, y: 20, at: '団地前の暗がり' },
  ],
};

export const TRIGGERS = {
  phase1AtX: 1180,       // A2 到達
  phase3FromX: [4300, 3400, 2500], // 帰り道での接近（3回まで）
  phase4AtX: 1500,       // 完全出現。ここから鳥居まで逃げ戻る
  cutAheadAtX: [2650, 4150], // 逃走中に先回りして道をふさぐ地点
};

const L = (who, text, dur) => ({ who, text, dur: dur || null });

export const DIALOGUE = {
  intro: [
    L('rei', 'この先の住宅街、深夜にマスクの女が出るって書き込みが三つある'),
    L('shirou', '三つもあれば本物だろ'),
    L('yotsuba', '一つでも嘘なら、全部嘘だと思うけど'),
    L('shirou', 'じゃあ確かめに行くしかないな'),
  ],
  P1: [
    L('rei', '……これ、掲示板に貼られてた写真と同じ貼り紙だ'),
    L('yotsuba', '本当にあるんだ'),
    L('shirou', '公園の門、開いたぞ'),
  ],
  O1: [
    L('shirou', '乗る？'),
    L('yotsuba', '乗らない'),
    L('rei', '（漕いでる）'),
  ],
  P2: [
    L('shirou', 'うわ、マスクだらけ'),
    L('rei', '新品もある。捨ててるんじゃなくて、置いてる'),
    L('yotsuba', '……誰が？'),
  ],
  O2: [
    L('shirou', '肉まん買って帰ろうぜ'),
    L('rei', 'コンビニは逆方向'),
    L('yotsuba', 'じゃあ帰りにすれば？'),
    L('shirou', '怪異より肉まんが先だろ'),
  ],
  P3: [
    L('shirou', '……誰もいない'),
    L('yotsuba', '今、ノブ動いたよね'),
    L('rei', '風だろ。たぶん'),
  ],
  H1: [
    L('yotsuba', '……ここ、404って書いてある'),
    L('rei', '誰かが先に来てる'),
  ],
  P4: [
    L('yotsuba', '手鏡。割れてる'),
    L('rei', '口裂け女は、鏡を見せると逃げるって話がある'),
    L('yotsuba', '……ねえ。'),
  ],
  P5: [
    L('yotsuba', 'ここだけ静かだね。'),
    L('rei', '昔から神社の中には入ってこないって話はある。'),
    L('shirou', 'じゃあ怪異出たらここ集合な。'),
    L('yotsuba', '出る前提なの？'),
  ],
  phase1: [ L('rei', '今の、聞こえた？') ],
  phase2: [ L('shirou', '……人、だろ') ],
  goHome: [ L('shirou', 'よし、帰ろうぜ'), L('yotsuba', '肉まん買うんでしょ') ],
  phase3: [
    [ L('shirou', 'い、いや別に普通の人だろ') ],
    [ L('yotsuba', 'さっきより近い') ],
    [ L('rei', '三回目。同じ人だ') ],
  ],
  phase4: [
    L('yotsuba', '走って'),
    L('shirou', '鳥居！鳥居まで走れ！'),
  ],
  // 近づくと消える。無反応だと緊張感が消えるので必ず何か起こす
  vanish: [
    [L('shirou', '……いない')],
    [L('yotsuba', '消えた')],
    [L('rei', '今の、絶対いたよね')],
    [L('shirou', 'え、どこ行った')],
    [L('yotsuba', '見間違い、じゃないよね')],
  ],
  // 歩いている間に流れる雑談。エリアごとに用意する（SPEC §9）
  banter: {
    A1: [
      [L('shirou', 'この辺、来たことある？'), L('yotsuba', '通学路の逆'), L('rei', 'だから誰も来ない')],
      [L('rei', '書き込み、全部この時間帯なんだよな'), L('yotsuba', 'もう過ぎてるけど'), L('shirou', 'じゃあ今じゃん')],
      [L('yotsuba', '街灯、一個おきに切れてる'), L('shirou', '節電だろ'), L('rei', 'この町、そんな余裕ない')],
    ],
    A2: [
      [L('shirou', '公園って夜だと別物だな'), L('yotsuba', 'ブランコ、動いてない？'), L('rei', '風'), L('yotsuba', '無風だけど')],
      [L('rei', '昔ここで撮られた写真があるらしい'), L('shirou', '見せて'), L('rei', '消えた')],
      [L('yotsuba', '砂場に足跡ある'), L('shirou', '子どもだろ'), L('yotsuba', 'こんな時間に？')],
    ],
    A3: [
      [L('shirou', '肉まん'), L('yotsuba', 'まだ言ってる')],
      [L('yotsuba', '店員さん、さっきからこっち見てない？'), L('rei', '見てない'), L('yotsuba', '……そう')],
      [L('rei', 'コンビニの明かりって安心する'), L('shirou', 'わかる'), L('yotsuba', '珍しく意見合ってる')],
    ],
    A4: [
      [L('yotsuba', 'ここ、通らないとダメ？'), L('shirou', '近道だろ'), L('rei', '遠回りだよ'), L('shirou', '……')],
      [L('rei', '路地の怪談は多い'), L('yotsuba', '今は言わないで')],
      [L('shirou', '室外機うるさいな'), L('yotsuba', 'さっきから止まってるよ'), L('shirou', 'は？')],
    ],
    A5: [
      [L('shirou', '意外と綺麗にしてあるな'), L('rei', '誰かが掃除してる'), L('yotsuba', 'こんな時間に？')],
      [L('yotsuba', '石段、何段あるんだろ'), L('rei', '数えると増えるらしい'), L('yotsuba', '数えない')],
      [L('rei', '鳥居の内側は、別の場所って考え方がある'), L('shirou', 'じゃあ安全だな'), L('yotsuba', '軽い')],
    ],
  },
  cutAhead: [ L('rei', '前！前にいる！') ],
  survive: [
    L('rei', '……止まった'),
    L('yotsuba', '振り返らないで'),
    L('shirou', '……肉まん、買えなかったな'),
  ],
  caught: [ L('yotsuba', '——') ],
  epilogue: [
    L('shirou', '昨日のやつさ'),
    L('yotsuba', 'もう行かないからね。'),
    L('rei', '次なんだけど。'),
    L('yotsuba', '聞いてた？'),
  ],
};

// 家・電柱などの背景物。乱数は固定シードで毎回同じ町にする
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function buildScenery() {
  const r = rng(40404);
  const houses = [];
  const poles = [];
  const lamps = [];

  for (let x = -100; x < WORLD.length + 200; x += 150 + r() * 90) {
    const area = AREAS.find(a => x >= a.x0 && x < a.x1);
    const id = area ? area.id : 'A1';
    if (id === 'A2' && x > 1200 && x < 2050) continue; // 公園
    if (id === 'A5' && x > 4700) continue;             // 参道
    houses.push({
      x: Math.round(x),
      w: 130 + r() * 105,
      h: 150 + r() * 150,
      roof: r() < 0.5 ? 'gable' : 'flat',
      lit: r() < 0.42,
      windows: 2 + Math.floor(r() * 3),
      tone: 0.7 + r() * 0.5,
      side: 'far',
    });
  }
  for (let x = 120; x < WORLD.length; x += 300) {
    poles.push({ x, h: 168 + ((x * 7) % 40) });
  }
  for (let x = 200; x < WORLD.length; x += 430) {
    lamps.push({ x, y: 14, on: true });
  }
  // 塀ぎわの自転車・植木・ゴミ袋。道端の生活感を出す
  const clutter = [];
  for (let x = 90; x < WORLD.length; x += 90 + r() * 140) {
    const area = AREAS.find(a => x >= a.x0 && x < a.x1);
    if (area && area.id === 'A5' && x > 4700) continue;
    const k = r();
    clutter.push({
      x: Math.round(x),
      kind: k < 0.34 ? 'bike' : k < 0.62 ? 'plant' : k < 0.82 ? 'bin' : 'sign',
      flip: r() < 0.5,
    });
  }
  return { houses, poles, lamps, clutter };
}

export const SCENERY = buildScenery();

export const PROPS = [
  { kind: 'danchi',   x: 620,  y: -220, w: 300, h: 250 },
  { kind: 'watertower', x: 1900, y: -260, w: 90, h: 220 },
  { kind: 'park',     x: 1300, y: 30,  w: 760 },
  { kind: 'bench',    x: 1715, y: 44 },
  { kind: 'store',    x: 2820, y: -10, w: 380, h: 200 },
  { kind: 'alleywall',x: 3300, y: 0,   w: 1100 },
  { kind: 'aircon',   x: 3760, y: 52 },
  { kind: 'aircon',   x: 3980, y: 52 },
  { kind: 'shrine',   x: 5150, y: 60,  w: 500 },
];
