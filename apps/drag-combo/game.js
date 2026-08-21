const ROWS = 5;
const COLS = 6;
const MOVE_TIME = 5000;
const TYPES = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
const TYPE_LABEL = {
  fire: 'FIRE', water: 'WATER', wood: 'WOOD', light: 'LIGHT', dark: 'DARK', heart: 'HEART',
};

const ENEMIES = [
  { name: 'EMBER WHELP', hp: 150, attack: 22, turn: 3, weakness: 'water', stageClass: '' },
  { name: 'TIDE WYRM', hp: 310, attack: 30, turn: 2, weakness: 'wood', stageClass: 'stage2' },
  { name: 'VOID DRAGON', hp: 620, attack: 42, turn: 2, weakness: 'light', stageClass: 'stage3' },
];

const els = {
  board: document.querySelector('#board'),
  boardWrap: document.querySelector('#boardWrap'),
  timer: document.querySelector('.timer'),
  timerBar: document.querySelector('#timerBar'),
  message: document.querySelector('#message'),
  enemy: document.querySelector('#enemy'),
  enemyName: document.querySelector('#enemyName'),
  enemyHpBar: document.querySelector('#enemyHpBar'),
  weaknessLabel: document.querySelector('#weaknessLabel'),
  enemyTurn: document.querySelector('#enemyTurn'),
  playerHpBar: document.querySelector('#playerHpBar'),
  playerHpText: document.querySelector('#playerHpText'),
  stageLabel: document.querySelector('#stageLabel'),
  bestLabel: document.querySelector('#bestLabel'),
  breakChip: document.querySelector('#breakChip'),
  comboPop: document.querySelector('#comboPop'),
  damageBurst: document.querySelector('#damageBurst'),
  soundButton: document.querySelector('#soundButton'),
  startOverlay: document.querySelector('#startOverlay'),
  resultOverlay: document.querySelector('#resultOverlay'),
  startButton: document.querySelector('#startButton'),
  retryButton: document.querySelector('#retryButton'),
  resultEyebrow: document.querySelector('#resultEyebrow'),
  resultTitle: document.querySelector('#resultTitle'),
  resultScore: document.querySelector('#resultScore'),
  resultCombo: document.querySelector('#resultCombo'),
  resultBest: document.querySelector('#resultBest'),
  resultNote: document.querySelector('#resultNote'),
};

const state = {
  board: [],
  tiles: [],
  dragging: false,
  resolving: false,
  pointerId: null,
  selectedIndex: -1,
  moveStartedAt: 0,
  timerFrame: null,
  stage: 0,
  enemyHp: 0,
  enemyTurn: 0,
  hp: 100,
  maxHp: 100,
  score: 0,
  maxCombo: 0,
  turns: 0,
  sound: true,
  audio: null,
  lastAction: '',
};

function randomType() {
  const r = Math.random();
  if (r < 0.14) return 'heart';
  return TYPES[Math.floor(Math.random() * 5)];
}

function createsImmediateMatch(board, index, type) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  if (col >= 2 && board[index - 1] === type && board[index - 2] === type) return true;
  if (row >= 2 && board[index - COLS] === type && board[index - COLS * 2] === type) return true;
  return false;
}

function freshBoard() {
  const board = [];
  for (let i = 0; i < ROWS * COLS; i += 1) {
    let type = randomType();
    let guard = 0;
    while (createsImmediateMatch(board, i, type) && guard < 20) {
      type = randomType();
      guard += 1;
    }
    board.push(type);
  }
  return board;
}

function createTiles() {
  els.board.innerHTML = '';
  state.tiles = [];
  for (let i = 0; i < ROWS * COLS; i += 1) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.index = String(i);
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', `宝珠 ${i + 1}`);
    els.board.appendChild(tile);
    state.tiles.push(tile);
  }
}

function updateBoardDom({ drop = false } = {}) {
  state.tiles.forEach((tile, i) => {
    const type = state.board[i];
    tile.dataset.type = type || 'dark';
    tile.style.opacity = type ? '1' : '0';
    tile.classList.toggle('dragging', state.dragging && i === state.selectedIndex);
    tile.classList.remove('preview-match', 'swap-pop', 'matched');
    if (drop && type) {
      tile.classList.remove('drop-in');
      void tile.offsetWidth;
      tile.classList.add('drop-in');
    } else {
      tile.classList.remove('drop-in');
    }
  });
  previewMatches();
}

function previewMatches() {
  state.tiles.forEach((tile) => tile.classList.remove('preview-match'));
  if (!state.dragging) return;
  const { matched } = findMatches();
  matched.forEach((index) => state.tiles[index]?.classList.add('preview-match'));
}

function setMessage(text, hot = false) {
  els.message.textContent = text;
  els.message.classList.toggle('hot', hot);
}

function currentEnemy() {
  return ENEMIES[state.stage];
}

function updateHud() {
  const enemy = currentEnemy();
  const enemyPct = Math.max(0, state.enemyHp / enemy.hp) * 100;
  const hpPct = Math.max(0, state.hp / state.maxHp) * 100;
  els.enemyHpBar.style.width = `${enemyPct}%`;
  els.playerHpBar.style.width = `${hpPct}%`;
  els.playerHpText.textContent = `${Math.max(0, state.hp)} / ${state.maxHp}`;
  els.stageLabel.textContent = `${state.stage + 1} / ${ENEMIES.length}`;
  els.enemyTurn.querySelector('b').textContent = String(state.enemyTurn);
  els.enemyTurn.classList.toggle('danger', state.enemyTurn <= 1);
  els.bestLabel.textContent = `BEST ${getBest()}`;
}

function applyEnemyVisual() {
  const enemy = currentEnemy();
  els.enemy.className = `enemy ${enemy.stageClass}`.trim();
  els.enemyName.textContent = enemy.name;
  els.weaknessLabel.innerHTML = `弱点 <b>${TYPE_LABEL[enemy.weakness]}</b>`;
}

function getBest() {
  return Number(localStorage.getItem('dragComboBest') || 0);
}

function setBest(value) {
  if (value > getBest()) localStorage.setItem('dragComboBest', String(value));
}

function resetRun() {
  state.board = freshBoard();
  state.stage = 0;
  state.hp = state.maxHp;
  state.score = 0;
  state.maxCombo = 0;
  state.turns = 0;
  state.lastAction = '';
  state.dragging = false;
  state.resolving = false;
  state.selectedIndex = -1;
  state.enemyHp = ENEMIES[0].hp;
  state.enemyTurn = ENEMIES[0].turn;
  applyEnemyVisual();
  updateBoardDom();
  updateHud();
  setMessage('宝珠を1個つかんで、5秒だけ自由に動かせ');
  els.breakChip.classList.remove('ready');
}

function startGame() {
  resetRun();
  els.startOverlay.classList.add('hidden');
  els.resultOverlay.classList.add('hidden');
  tone(280, 0.05, 'triangle', 0.025);
  setTimeout(() => tone(420, 0.07, 'triangle', 0.025), 70);
}

function indexFromPoint(clientX, clientY) {
  const rect = els.board.getBoundingClientRect();
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return -1;
  const col = Math.min(COLS - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * COLS)));
  const row = Math.min(ROWS - 1, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * ROWS)));
  return row * COLS + col;
}

function stepToward(from, to) {
  const fr = Math.floor(from / COLS);
  const fc = from % COLS;
  const tr = Math.floor(to / COLS);
  const tc = to % COLS;
  if (fr === tr && fc === tc) return from;
  const dr = tr - fr;
  const dc = tc - fc;
  if (Math.abs(dc) >= Math.abs(dr) && dc !== 0) return fr * COLS + fc + Math.sign(dc);
  return (fr + Math.sign(dr)) * COLS + fc;
}

function swap(a, b) {
  [state.board[a], state.board[b]] = [state.board[b], state.board[a]];
  state.tiles[b]?.classList.remove('swap-pop');
  void state.tiles[b]?.offsetWidth;
  state.tiles[b]?.classList.add('swap-pop');
}

function moveSelectionTo(targetIndex) {
  if (targetIndex < 0 || targetIndex === state.selectedIndex) return;
  let guard = 0;
  while (state.selectedIndex !== targetIndex && guard < 12) {
    const next = stepToward(state.selectedIndex, targetIndex);
    if (next === state.selectedIndex || next < 0 || next >= ROWS * COLS) break;
    swap(state.selectedIndex, next);
    state.selectedIndex = next;
    guard += 1;
  }
  updateBoardDom();
  haptic(5);
  tone(190 + (state.selectedIndex % COLS) * 16, 0.02, 'sine', 0.008);
}

function beginDrag(index, pointerId) {
  if (state.dragging || state.resolving || index < 0) return;
  state.dragging = true;
  state.pointerId = pointerId;
  state.selectedIndex = index;
  state.moveStartedAt = performance.now();
  state.turns += 1;
  els.board.setPointerCapture?.(pointerId);
  els.timer.classList.add('active');
  updateBoardDom();
  setMessage('5秒。欲張るか、確実に作るか。', true);
  tone(310, 0.035, 'sine', 0.015);
  tickTimer();
}

function tickTimer() {
  cancelAnimationFrame(state.timerFrame);
  const frame = (now) => {
    if (!state.dragging) return;
    const ratio = Math.max(0, 1 - (now - state.moveStartedAt) / MOVE_TIME);
    els.timerBar.style.transform = `scaleX(${ratio})`;
    if (ratio <= 0) {
      finishDrag();
      return;
    }
    state.timerFrame = requestAnimationFrame(frame);
  };
  state.timerFrame = requestAnimationFrame(frame);
}

async function finishDrag() {
  if (!state.dragging) return;
  state.dragging = false;
  cancelAnimationFrame(state.timerFrame);
  els.timer.classList.remove('active');
  els.timerBar.style.transform = 'scaleX(1)';
  state.tiles.forEach((tile) => tile.classList.remove('dragging', 'preview-match'));
  try { els.board.releasePointerCapture?.(state.pointerId); } catch {}
  state.pointerId = null;
  await resolveTurn();
}

function findMatches() {
  const matched = new Set();
  for (let row = 0; row < ROWS; row += 1) {
    let runStart = 0;
    for (let col = 1; col <= COLS; col += 1) {
      const prev = state.board[row * COLS + col - 1];
      const cur = col < COLS ? state.board[row * COLS + col] : null;
      if (cur !== prev) {
        const len = col - runStart;
        if (prev && len >= 3) {
          for (let c = runStart; c < col; c += 1) matched.add(row * COLS + c);
        }
        runStart = col;
      }
    }
  }
  for (let col = 0; col < COLS; col += 1) {
    let runStart = 0;
    for (let row = 1; row <= ROWS; row += 1) {
      const prev = state.board[(row - 1) * COLS + col];
      const cur = row < ROWS ? state.board[row * COLS + col] : null;
      if (cur !== prev) {
        const len = row - runStart;
        if (prev && len >= 3) {
          for (let r = runStart; r < row; r += 1) matched.add(r * COLS + col);
        }
        runStart = row;
      }
    }
  }

  const groups = [];
  const seen = new Set();
  for (const start of matched) {
    if (seen.has(start)) continue;
    const type = state.board[start];
    const queue = [start];
    const cells = [];
    seen.add(start);
    while (queue.length) {
      const current = queue.shift();
      cells.push(current);
      const r = Math.floor(current / COLS);
      const c = current % COLS;
      const neighbors = [];
      if (r > 0) neighbors.push(current - COLS);
      if (r < ROWS - 1) neighbors.push(current + COLS);
      if (c > 0) neighbors.push(current - 1);
      if (c < COLS - 1) neighbors.push(current + 1);
      for (const n of neighbors) {
        if (matched.has(n) && !seen.has(n) && state.board[n] === type) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    groups.push({ type, cells });
  }
  return { matched, groups };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showCombo(value) {
  els.comboPop.innerHTML = `${value}<small>COMBO</small>`;
  els.comboPop.classList.remove('show');
  void els.comboPop.offsetWidth;
  els.comboPop.classList.add('show');
}

function collapseAndRefill(matched) {
  for (let col = 0; col < COLS; col += 1) {
    const kept = [];
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const index = row * COLS + col;
      if (!matched.has(index) && state.board[index]) kept.push(state.board[index]);
    }
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const index = row * COLS + col;
      state.board[index] = kept[ROWS - 1 - row] || randomType();
    }
  }
}

async function resolveTurn() {
  state.resolving = true;
  els.board.classList.add('busy');
  let combo = 0;
  let hearts = 0;
  const attackByType = { fire: 0, water: 0, wood: 0, light: 0, dark: 0 };
  let cascade = 0;

  while (cascade < 8) {
    const { matched, groups } = findMatches();
    if (!matched.size) break;
    cascade += 1;
    groups.forEach((group) => {
      combo += 1;
      if (group.type === 'heart') hearts += group.cells.length;
      else attackByType[group.type] += group.cells.length + Math.max(0, group.cells.length - 3) * 0.8;
    });
    showCombo(combo);
    matched.forEach((index) => state.tiles[index]?.classList.add('matched'));
    tone(380 + combo * 34, 0.07, 'triangle', Math.min(.035, .014 + combo * .002));
    if (combo >= 4) haptic(12);
    await wait(260);
    matched.forEach((index) => { state.board[index] = null; });
    collapseAndRefill(matched);
    updateBoardDom({ drop: true });
    await wait(190);
  }

  if (combo === 0) {
    setMessage('消えない。次は3個を一直線に。');
    state.lastAction = 'no-match';
    tone(105, 0.12, 'sawtooth', 0.012);
    await enemyStep(false);
    endResolution();
    return;
  }

  state.maxCombo = Math.max(state.maxCombo, combo);
  const comboMult = 1 + Math.max(0, combo - 1) * 0.34;
  const enemy = currentEnemy();
  let damage = 0;
  let weakDamage = 0;
  Object.entries(attackByType).forEach(([type, orbs]) => {
    if (!orbs) return;
    let dealt = orbs * 11 * comboMult;
    if (type === enemy.weakness) {
      dealt *= 2.05;
      weakDamage += dealt;
    }
    damage += dealt;
  });
  damage = Math.round(damage);

  const heal = Math.round(hearts * 4.8 * (1 + Math.max(0, combo - 1) * .12));
  if (heal > 0) {
    state.hp = Math.min(state.maxHp, state.hp + heal);
    els.playerHpBar.style.filter = 'brightness(1.8)';
    setTimeout(() => { els.playerHpBar.style.filter = ''; }, 260);
  }

  const didBreak = combo >= 4;
  if (didBreak) {
    state.enemyTurn += 1;
    els.breakChip.classList.add('ready');
    els.enemy.classList.add('break');
    setTimeout(() => els.enemy.classList.remove('break'), 480);
  } else {
    els.breakChip.classList.remove('ready');
  }

  state.enemyHp = Math.max(0, state.enemyHp - damage);
  state.score += damage + combo * 80 + (didBreak ? 250 : 0) + (weakDamage > 0 ? 120 : 0);
  updateHud();

  if (damage > 0) {
    els.enemy.classList.add('hit');
    showDamage(damage, weakDamage > 0);
    screenFlash(weakDamage > 0 ? .14 : .07);
    haptic(weakDamage > 0 ? [18, 20, 25] : 18);
    tone(weakDamage > 0 ? 150 : 120, .08, 'square', .02);
    setTimeout(() => els.enemy.classList.remove('hit'), 300);
  }

  if (didBreak && heal > 0) setMessage(`${combo} COMBO！ 回復 +${heal} / BREAK`, true);
  else if (didBreak) setMessage(`${combo} COMBO！ BREAKで反撃を遅らせた`, true);
  else if (heal > 0) setMessage(`${combo} COMBO / 回復 +${heal}`);
  else setMessage(`${combo} COMBO / ${damage} DAMAGE`);

  state.lastAction = combo >= 6 ? 'big-combo' : didBreak ? 'break' : heal > 0 ? 'heal' : 'attack';

  if (state.enemyHp <= 0) {
    await defeatEnemy();
    endResolution();
    return;
  }

  await wait(420);
  await enemyStep(didBreak);
  endResolution();
}

function endResolution() {
  state.resolving = false;
  els.board.classList.remove('busy');
  updateBoardDom();
  updateHud();
}

function showDamage(damage, weak) {
  els.damageBurst.textContent = weak ? `${damage} WEAK!` : String(damage);
  els.damageBurst.className = `damage-burst show${weak ? ' weak' : ''}`;
  setTimeout(() => { els.damageBurst.className = 'damage-burst'; }, 720);
}

function screenFlash(opacity = .1) {
  const flash = document.createElement('div');
  flash.className = 'screen-flash';
  flash.style.background = `rgba(255,255,255,${opacity})`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 300);
}

async function enemyStep(wasBreak) {
  state.enemyTurn -= 1;
  updateHud();
  if (state.enemyTurn > 0) {
    if (wasBreak) await wait(220);
    return;
  }

  const enemy = currentEnemy();
  els.enemy.classList.add('attack');
  setMessage(`${enemy.name} の反撃！`, false);
  tone(72, .22, 'sawtooth', .03);
  haptic([30, 30, 45]);
  await wait(240);
  state.hp = Math.max(0, state.hp - enemy.attack);
  updateHud();
  screenFlash(.11);
  els.enemy.classList.remove('attack');
  state.enemyTurn = enemy.turn;
  updateHud();

  if (state.hp <= 0) {
    await wait(500);
    finishRun(false);
  }
}

async function defeatEnemy() {
  const enemy = currentEnemy();
  els.enemy.classList.add('dead');
  state.score += 600 + state.stage * 350;
  tone(220, .08, 'triangle', .025);
  setTimeout(() => tone(330, .09, 'triangle', .025), 80);
  setTimeout(() => tone(520, .12, 'triangle', .02), 160);
  setMessage(`${enemy.name} 撃破`, true);
  await wait(720);

  if (state.stage >= ENEMIES.length - 1) {
    finishRun(true);
    return;
  }

  state.stage += 1;
  const next = currentEnemy();
  state.enemyHp = next.hp;
  state.enemyTurn = next.turn;
  applyEnemyVisual();
  updateHud();
  state.board = freshBoard();
  updateBoardDom({ drop: true });
  setMessage(`${next.name} 出現。弱点は ${TYPE_LABEL[next.weakness]}`, true);
  await wait(320);
}

function finishRun(clear) {
  state.dragging = false;
  state.resolving = true;
  setBest(state.score);
  const best = getBest();
  els.resultEyebrow.textContent = clear ? 'RUN CLEAR' : 'RUN FAILED';
  els.resultTitle.textContent = clear ? '竜を倒した。' : 'あと一手だった。';
  els.resultScore.textContent = String(state.score);
  els.resultCombo.textContent = String(state.maxCombo);
  els.resultBest.textContent = String(best);

  let note = '次は弱点色だけでなく、4コンボBREAKを混ぜると反撃を減らせる。';
  if (state.lastAction === 'no-match') note = '最後に消せなかった。短い確定ルートを先に作ってから欲張ると安定する。';
  else if (state.maxCombo >= 7) note = '大連鎖は作れている。次はハートを残しながら同じ火力を出せるか。';
  else if (state.lastAction === 'heal') note = '回復判断は成功。次は回復と弱点色を同じ5秒で組むと一気に強くなる。';
  else if (clear) note = 'クリア済み。次は被弾を減らし、5秒の移動距離をもっと火力へ変えられる。';
  els.resultNote.textContent = note;
  els.resultOverlay.classList.remove('hidden');
}

function tone(freq, duration = .05, type = 'sine', volume = .02) {
  if (!state.sound) return;
  try {
    if (!state.audio) state.audio = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = state.audio;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function haptic(pattern) {
  try { navigator.vibrate?.(pattern); } catch {}
}

els.board.addEventListener('pointerdown', (event) => {
  const tile = event.target.closest('.tile');
  if (!tile) return;
  event.preventDefault();
  beginDrag(Number(tile.dataset.index), event.pointerId);
});

els.board.addEventListener('pointermove', (event) => {
  if (!state.dragging || event.pointerId !== state.pointerId) return;
  event.preventDefault();
  const index = indexFromPoint(event.clientX, event.clientY);
  moveSelectionTo(index);
});

els.board.addEventListener('pointerup', (event) => {
  if (event.pointerId !== state.pointerId) return;
  event.preventDefault();
  finishDrag();
});

els.board.addEventListener('pointercancel', (event) => {
  if (event.pointerId === state.pointerId) finishDrag();
});

els.soundButton.addEventListener('click', () => {
  state.sound = !state.sound;
  els.soundButton.classList.toggle('off', !state.sound);
  if (state.sound) tone(420, .06, 'triangle', .02);
});

els.startButton.addEventListener('click', startGame);
els.retryButton.addEventListener('click', startGame);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.dragging) finishDrag();
});

createTiles();
resetRun();
els.startOverlay.classList.remove('hidden');
