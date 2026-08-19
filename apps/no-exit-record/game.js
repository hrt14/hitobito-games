const scene = document.querySelector('#scene');
const ticketDock = document.querySelector('#ticketDock');
const dockTicket = document.querySelector('#ticket');
const ticketFrom = document.querySelector('#ticketFrom');
const ticketTo = document.querySelector('#ticketTo');
const ticketCode = document.querySelector('#ticketCode');
const ticketStamps = document.querySelector('#ticketStamps');
const ticketHint = document.querySelector('#ticketHint');
const modal = document.querySelector('#modal');
const modalClose = document.querySelector('#modalClose');
const modalEyebrow = document.querySelector('#modalEyebrow');
const modalTitle = document.querySelector('#modalTitle');
const modalBody = document.querySelector('#modalBody');
const modalAction = document.querySelector('#modalAction');
const toast = document.querySelector('#toast');
const soundBtn = document.querySelector('#soundBtn');
const resetBtn = document.querySelector('#resetBtn');
const homeBtn = document.querySelector('#homeBtn');

const SAVE_KEY = 'no-exit-record-v1';

const defaultState = () => ({
  chapter: 0,
  loops: 0,
  stamps: [],
  seenPlatform: [],
  sound: true,
  ended: false,
});

let state = loadState();
let audio = null;
let modalActionHandler = null;
let toastTimer = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return { ...defaultState(), ...(saved || {}) };
  } catch {
    return defaultState();
  }
}

function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}

function haptic(pattern = 18) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

function ensureAudio() {
  if (!state.sound) return null;
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audio = new AC();
  }
  if (audio?.state === 'suspended') audio.resume().catch(() => {});
  return audio;
}

function beep(kind = 'ok') {
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const cfg = {
    ok: [740, .07, .045],
    gate: [920, .12, .055],
    wrong: [155, .18, .055],
    clue: [520, .08, .035],
    end: [660, .45, .04],
  }[kind] || [500, .08, .04];
  osc.type = kind === 'wrong' ? 'sawtooth' : 'sine';
  osc.frequency.setValueAtTime(cfg[0], now);
  if (kind === 'gate') osc.frequency.exponentialRampToValueAtTime(1240, now + cfg[1]);
  if (kind === 'end') osc.frequency.exponentialRampToValueAtTime(880, now + cfg[1]);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(cfg[2], now + .01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg[1]);
  osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + cfg[1] + .02);
}

function showToast(message, ms = 1500) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove('hidden');
  toastTimer = setTimeout(() => toast.classList.add('hidden'), ms);
}

function openModal({ eyebrow = '', title = '', body = '', action = '', onAction = null }) {
  modalEyebrow.textContent = eyebrow;
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  modalAction.textContent = action;
  modalAction.classList.toggle('hidden', !action);
  modalActionHandler = onAction;
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  modalActionHandler = null;
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
modalAction.addEventListener('click', () => { if (modalActionHandler) modalActionHandler(); });

soundBtn.addEventListener('click', () => {
  state.sound = !state.sound;
  soundBtn.textContent = state.sound ? '♪' : '×';
  saveState();
  if (state.sound) beep('ok');
});

resetBtn.addEventListener('click', () => {
  openModal({
    eyebrow: 'RESET',
    title: '最初から乗り直す？',
    body: '乗車記録と刻印を消して、最初の改札へ戻ります。',
    action: '最初から',
    onAction: () => {
      state = defaultState();
      saveState();
      closeModal();
      render();
    },
  });
});

homeBtn.addEventListener('click', () => { location.href = '/'; });

dockTicket.addEventListener('click', () => {
  const clue = ticketClue();
  openModal({
    eyebrow: `TICKET / ${state.stamps.length} STAMP${state.stamps.length === 1 ? '' : 'S'}`,
    title: clue.title,
    body: clue.body,
  });
  beep('clue');
});

function ticketClue() {
  if (state.chapter <= 1) return {
    title: '裏面に薄い文字がある',
    body: '光に傾けると読める。<span class="mono">STATION − TIME = PLATFORM</span>',
  };
  if (state.chapter === 2) return {
    title: '二つ目の注意書き',
    body: '車内灯に透かすと、別の一文が浮かぶ。<span class="mono">WINDOW IS TRUE.<br>READ IT BACKWARD.</span>',
  };
  if (state.chapter === 3) return {
    title: '刻印が式になっている',
    body: `今の刻印は <strong>${state.stamps.join(' / ')}</strong>。<span class="mono">FIRST + SECOND = LOCKER</span>`,
  };
  return {
    title: '券面の最後の空白',
    body: '指でなぞった跡に文字が残っている。<span class="mono">EXIT RECORD : NONE<br>HOLDER : ______</span>',
  };
}

function updateTicket() {
  ticketDock.classList.toggle('hidden', state.chapter === 0 || state.ended);
  ticketFrom.textContent = state.chapter >= 4 ? '00-13' : 'K-17';
  ticketTo.textContent = state.ended ? 'OUT' : state.chapter >= 4 ? 'EXIT' : '???';
  ticketCode.textContent = state.chapter >= 4 ? 'NO EXIT RECORD' : 'NO RECORD';
  ticketStamps.innerHTML = state.stamps.map((s) => `<span class="stamp">${s}</span>`).join('');
  ticketHint.textContent = state.chapter === 1 ? 'TAP FOR HINT' : state.chapter === 2 ? 'TURN THE CLUE OVER' : 'TAP TICKET';
  soundBtn.textContent = state.sound ? '♪' : '×';
}

function render() {
  closeModal();
  updateTicket();
  scene.className = 'scene enter';
  if (state.ended || state.chapter === 5) return renderEnding();
  if (state.chapter === 0) return renderOpening();
  if (state.chapter === 1) return renderPlatform();
  if (state.chapter === 2) return renderTrain();
  if (state.chapter === 3) return renderLockers();
  return renderFinalGate();
}

function shell(chapter, title, copy, inner, choices = '') {
  return `
    <div class="stage-shell">
      <div class="chapter-line"><span class="chapter">${chapter}</span><span class="loop">LOOP ${String(state.loops).padStart(2,'0')}</span></div>
      <h1 class="stage-title">${title}</h1>
      <p class="stage-copy">${copy}</p>
      ${inner}
      ${choices}
    </div>`;
}

function renderOpening() {
  ticketDock.classList.add('hidden');
  scene.innerHTML = `
    <div class="stage-shell opening">
      <div class="chapter">00 / FOUND TICKET</div>
      <h1 class="stage-title">未出場</h1>
      <p class="stage-copy">終電後の改札。床に一枚だけ、黒い乗車券が落ちている。<br><strong>「この乗車券には、出場記録がありません」</strong></p>
      <div class="opening-ticket-wrap">
        <div class="gate-slot"></div>
        <div class="swipe-arrow">↑</div>
        <button id="openingTicket" class="ticket swipe-ticket" type="button" aria-label="乗車券を上へスワイプ">
          <span class="ticket-cut ticket-cut-a"></span><span class="ticket-cut ticket-cut-b"></span>
          <span class="ticket-label">CITY UNDERGROUND</span>
          <span class="ticket-route"><b>K-17</b><i>→</i><b>???</b></span>
          <span class="ticket-code">PASSENGER / NO RECORD</span>
        </button>
      </div>
      <div class="tiny">SWIPE THE TICKET THROUGH THE GATE</div>
    </div>`;
  bindOpeningSwipe();
}

function bindOpeningSwipe() {
  const t = document.querySelector('#openingTicket');
  let startY = 0;
  let dy = 0;
  let active = false;
  const start = (y) => { active = true; startY = y; dy = 0; t.classList.add('dragging'); ensureAudio(); };
  const move = (y) => {
    if (!active) return;
    dy = Math.min(0, y - startY);
    t.style.transform = `translateY(${dy}px)`;
    if (dy < -45) t.style.boxShadow = '0 0 0 1px #ff3c74,0 0 34px rgba(255,60,116,.35)';
  };
  const end = () => {
    if (!active) return;
    active = false; t.classList.remove('dragging');
    if (dy < -72) {
      t.style.transform = 'translateY(-105px) scale(.92)';
      t.style.opacity = '.1';
      beep('gate'); haptic([18,28,18]);
      setTimeout(() => { state.chapter = 1; saveState(); render(); }, 420);
    } else {
      t.style.transform = ''; t.style.boxShadow = '';
    }
  };
  t.addEventListener('pointerdown', (e) => { t.setPointerCapture?.(e.pointerId); start(e.clientY); });
  t.addEventListener('pointermove', (e) => move(e.clientY));
  t.addEventListener('pointerup', end);
  t.addEventListener('pointercancel', end);
}

function renderPlatform() {
  const seen = new Set(state.seenPlatform);
  scene.innerHTML = shell(
    '01 / KASUMICHO',
    '終電後の霞町',
    '改札の向こうに、電車が一編成だけ停まっている。どの番線に乗ればいい？ まずホームの違和感を調べる。',
    `<div class="platform-art">
      <div class="station-sign"><span class="code">K17</span><small>CITY UNDERGROUND</small><strong>霞町</strong><small>KASUMICHO</small></div>
      <div class="platform-clock">00:07</div>
      <div class="lost-tag"><span>拾得物タグ</span><b>K-17</b><span>00:07 / platform ?</span></div>
      <div class="track-tunnel"></div><div class="tunnel-eye"></div>
      <button class="hotspot ${seen.has('sign')?'seen':''}" data-clue="sign" style="left:51%;top:25%;width:36px;height:36px" aria-label="駅名標を調べる"></button>
      <button class="hotspot ${seen.has('clock')?'seen':''}" data-clue="clock" style="right:7%;top:31%;width:38px;height:38px" aria-label="時計を調べる"></button>
      <button class="hotspot ${seen.has('tag')?'seen':''}" data-clue="tag" style="left:29%;bottom:29%;width:38px;height:38px" aria-label="拾得物タグを調べる"></button>
    </div>`,
    `<div class="choice-row" id="platformChoices">
      ${['08','10','12'].map(n=>`<button class="choice-btn ${seen.size>=2?'available':''}" data-platform="${n}" ${seen.size<2?'disabled':''}><b>${n}番線</b><span>LAST TRAIN / 00:13</span></button>`).join('')}
    </div>`
  );

  document.querySelectorAll('[data-clue]').forEach((btn) => btn.addEventListener('click', () => revealPlatformClue(btn.dataset.clue)));
  document.querySelectorAll('[data-platform]').forEach((btn) => btn.addEventListener('click', () => choosePlatform(btn)));
}

function revealPlatformClue(id) {
  if (!state.seenPlatform.includes(id)) state.seenPlatform.push(id);
  saveState(); beep('clue'); haptic(12);
  const clues = {
    sign: ['駅名標', '駅番号は <strong>17</strong>。誰かが赤い丸を二重になぞっている。'],
    clock: ['止まった時計', '秒針は動かない。時刻は <strong>00:07</strong> で固定されている。'],
    tag: ['拾得物タグ', '裏に鉛筆書きがある。<span class="mono">STATION − TIME = PLATFORM</span>'],
  };
  const [title, body] = clues[id];
  openModal({ eyebrow:'CLUE FOUND', title, body });
  setTimeout(() => renderPlatform(), 50);
}

function choosePlatform(btn) {
  const value = btn.dataset.platform;
  if (value === '10') {
    btn.classList.add('correct');
    beep('gate'); haptic([12,18,12]);
    addStamp('10');
    state.chapter = 2; saveState();
    showToast('10番線 — 終電が入ります', 1000);
    setTimeout(render, 760);
  } else {
    btn.classList.add('wrong');
    wrongLoop('その番線には、さっき降りたはずの自分が立っている。');
  }
}

function renderTrain() {
  scene.innerHTML = shell(
    '02 / LAST CAR',
    '窓の中だけが正しい',
    '車内には誰もいない。次の駅で三つのドアが開くらしい。券面の注意書きと、窓に映る数字を照らし合わせる。',
    `<div class="train-art" id="trainArt">
      <div class="car-ad">NO EXIT RECORD / CASE 013</div>
      <div class="train-led">NEXT · 00:13 · UNKNOWN</div>
      <div class="train-window">
        <button class="door" data-door="N-03" aria-label="N-03のドア"><span class="door-code">N-03</span></button>
        <button class="door" data-door="N-30" aria-label="N-30のドア"><span class="door-code reflection">N-30</span></button>
        <button class="door" data-door="N-13" aria-label="N-13のドア"><span class="door-code">N-13</span></button>
      </div>
      <div class="train-floor-lines"></div>
    </div>`,
    `<div class="choice-row">
      <button class="choice-btn available" data-door-choice="N-03"><b>左のドア</b><span>N-03</span></button>
      <button class="choice-btn available" data-door-choice="N-30"><b>中央のドア</b><span>REFLECTION</span></button>
      <button class="choice-btn available" data-door-choice="N-13"><b>右のドア</b><span>N-13</span></button>
    </div>`
  );
  document.querySelectorAll('[data-door-choice], .door').forEach((btn) => btn.addEventListener('click', () => chooseDoor(btn.dataset.doorChoice || btn.dataset.door)));
}

function chooseDoor(value) {
  const art = document.querySelector('#trainArt');
  art?.classList.add('rumble');
  if (value === 'N-30') {
    beep('gate'); haptic([14,20,14]);
    addStamp('03');
    state.chapter = 3; saveState();
    showToast('反転すると N-03', 1100);
    setTimeout(render, 760);
  } else {
    wrongLoop('ドアの向こうは同じ車両だった。あなたは一両も進んでいない。');
  }
}

function renderLockers() {
  scene.innerHTML = shell(
    '03 / LOST & FOUND',
    '忘れもの保管室',
    '終点の忘れもの保管室。ロッカーは三つ。切符の二つの刻印が、開ける番号を示している。',
    `<div class="locker-art">
      <div class="lockers">
        <button class="locker" data-locker="11" aria-label="11番ロッカー"><b>11</b></button>
        <button class="locker" data-locker="13" aria-label="13番ロッカー"><b>13</b></button>
        <button class="locker" data-locker="16" aria-label="16番ロッカー"><b>16</b></button>
      </div>
      <div class="poster-strip">LOST PROPERTY / STORAGE B2 / OPEN WITH YOUR RECORD</div>
    </div>`,
    `<div class="choice-row">
      <button class="choice-btn available" data-locker-choice="11"><b>11</b><span>LOCKER</span></button>
      <button class="choice-btn available" data-locker-choice="13"><b>13</b><span>LOCKER</span></button>
      <button class="choice-btn available" data-locker-choice="16"><b>16</b><span>LOCKER</span></button>
    </div>`
  );
  document.querySelectorAll('[data-locker], [data-locker-choice]').forEach((btn) => btn.addEventListener('click', () => chooseLocker(btn.dataset.locker || btn.dataset.lockerChoice)));
}

function chooseLocker(value) {
  if (value === '13') {
    document.querySelector('[data-locker="13"]')?.classList.add('open','correct');
    beep('gate'); haptic([20,20,35]);
    addStamp('13');
    openModal({
      eyebrow:'ARCHIVE / CASE 013',
      title:'古い「未出場記録」',
      body:'ロッカーの中には、折れた駅員日誌が一枚だけ。<span class="mono">00:13　最終列車<br>乗客 1 名　入場<br>出場記録　なし<br>遺失物　黒色乗車券 1 枚</span>',
      action:'最後の改札へ',
      onAction: () => {
        state.chapter = 4; saveState(); closeModal(); render();
      },
    });
  } else {
    wrongLoop('空のはずのロッカーから、改札音だけが鳴った。');
  }
}

function renderFinalGate() {
  scene.innerHTML = shell(
    '04 / EXIT GATE',
    'この乗車券の持ち主は？',
    '地上へ続く改札は一つだけ。「持ち主を確認してください」と表示されている。ここまで持ってきた記録を思い出す。',
    `<div class="gate-art" id="gateArt">
      <div class="dawn" id="dawn"></div>
      <div class="gates">
        <div class="gate-unit"></div>
        <div class="gate-unit" id="finalGate"><div class="gate-readout">HOLDER ?<br>EXIT RECORD : NONE</div></div>
        <div class="gate-unit"></div>
      </div>
    </div>`,
    `<div class="choice-row" id="holderChoices">
      <button class="choice-btn available" data-holder="station"><b>駅員</b><span>STAFF</span></button>
      <button class="choice-btn available" data-holder="missing"><b>行方不明者</b><span>PASSENGER 013</span></button>
      <button class="choice-btn available" data-holder="you"><b>あなた</b><span>THE ONE HOLDING IT</span></button>
    </div>`
  );
  document.querySelectorAll('[data-holder]').forEach((btn) => btn.addEventListener('click', () => chooseHolder(btn)));
}

function chooseHolder(btn) {
  if (btn.dataset.holder === 'you') {
    btn.classList.add('correct');
    const gate = document.querySelector('#finalGate');
    gate?.classList.add('open');
    beep('end'); haptic([20,45,20,80,20]);
    ticketTo.textContent = 'OUT';
    showToast('出場処理を開始します', 1000);
    setTimeout(() => {
      state.chapter = 5; state.ended = true; saveState(); renderEnding();
    }, 1050);
  } else {
    btn.classList.add('wrong');
    const message = btn.dataset.holder === 'station'
      ? '駅員の乗車記録は存在しない。切符は、いま誰の手にある？'
      : '記録に名前はない。「行方不明者」は、まだ誰か分かっていない。';
    wrongLoop(message, false);
  }
}

function renderEnding() {
  ticketDock.classList.add('hidden');
  scene.innerHTML = `
    <div class="stage-shell">
      <div class="chapter-line"><span class="chapter">EXIT / 00:14</span><span class="loop">LOOP ${String(state.loops).padStart(2,'0')}</span></div>
      <div class="gate-art" style="flex:1">
        <div class="dawn show"></div>
        <div class="end-copy show">
          <b>出場しました。</b>
          <p>七年前の最終列車で、改札を出られなかった乗客は<strong>あなた</strong>だった。<br>切符は行き先ではなく、帰る場所を覚えていた。</p>
          <button id="afterReset" type="button">もう一度、乗る</button>
        </div>
      </div>
    </div>`;
  document.querySelector('#afterReset')?.addEventListener('click', () => {
    state = defaultState(); saveState(); render();
  });
}

function addStamp(value) {
  if (!state.stamps.includes(value)) state.stamps.push(value);
}

function wrongLoop(message, autoRender = true) {
  state.loops += 1;
  saveState();
  beep('wrong'); haptic([35,30,35]);
  scene.classList.remove('glitch');
  void scene.offsetWidth;
  scene.classList.add('glitch');
  const extra = state.loops >= 3 ? '　切符をタップするとヒントを確認できる。' : '';
  showToast(message + extra, state.loops >= 3 ? 2600 : 1900);
  if (autoRender) setTimeout(() => {
    scene.classList.remove('glitch');
  }, 480);
}

if (state.ended) state.chapter = 5;
render();
