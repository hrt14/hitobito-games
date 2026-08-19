(() => {
  'use strict';

  const rooms = {
    '101': { title: '仕立て屋の跡', backdrop: 'room-101', items: [
      { x: 24, y: 64, title: '家賃袋', text: '昭和の古い家賃袋。\n「203　真鍋」とだけ墨で書かれている。', clue: true },
      { x: 73, y: 36, title: '糸切りばさみ', text: '赤錆のはさみ。刃の間に、髪の毛が一本だけ挟まっている。' },
      { x: 56, y: 76, title: '畳の焦げ', text: '丸い焦げ跡。火事なら、もっと広がっているはずだ。' }
    ]},
    '102': { title: '夕飯の途中', backdrop: 'room-102', items: [
      { x: 70, y: 69, title: '八月のカレンダー', text: '8月20日だけ赤丸。\n余白に「203を開ける日」と鉛筆書きされている。', clue: true },
      { x: 24, y: 42, title: '鍋', text: '中身は空。なのに、蓋の裏だけがまだ濡れている。' },
      { x: 49, y: 31, title: '冷蔵庫のメモ', text: '買い物メモの最後だけ筆圧が強い。\n「塩、牛乳、ろうそく」' }
    ]},
    '103': { title: '管理人室', backdrop: 'room-103', items: [
      { x: 68, y: 38, title: '見取り図', text: '建築当時の図面。\n203号室だけ、壁の内側にさらに小さな四角が描かれている。', clue: true },
      { x: 24, y: 70, title: '鍵束', text: '101、102、103、201、202。\n203だけがない。' },
      { x: 42, y: 49, title: '管理日誌', text: '最後の一行。\n「今夜も二階を歩く音。入居者は全員退去済み。」' }
    ]},
    '201': { title: '子どもの部屋', backdrop: 'room-201', items: [
      { x: 27, y: 39, title: '集合写真', text: '夕凪荘の前に6人。\n203号室の窓だけ、内側から手のひらが写っている。', clue: true },
      { x: 71, y: 71, title: '赤いビー玉', text: '光を当てると、ビー玉の中に廊下の景色が逆さに映る。今の廊下だ。' },
      { x: 49, y: 57, title: '落書き', text: '柱に子どもの字。\n「にかいは 6へやある」\n――見える扉は3つしかない。' }
    ]},
    '202': { title: '空室', backdrop: 'room-202', items: [
      { x: 69, y: 30, title: '解体通知', text: '取り壊し予定日は明日。\nただし書類の作成日は、28年前になっている。', clue: true },
      { x: 31, y: 62, title: '壁の数字', text: '鉛筆で何度も「203」と書かれ、その上から白く塗りつぶされている。' },
      { x: 54, y: 77, title: '足跡', text: '埃の上に新しい足跡。部屋の中央で始まり、扉へ向かっている。' }
    ]},
    '203': { title: '開けてはいけない部屋', backdrop: 'room-203', items: [] }
  };

  const state = { clues: new Set(), found: new Set(), currentRoom: null, presence: 0, panic: false, sound: true, audio: null, hum: null, activePointer: false, lastMoveAt: 0, started: false };

  const el = {
    intro: document.querySelector('#intro'), startBtn: document.querySelector('#startBtn'), corridor: document.querySelector('#corridor'), roomView: document.querySelector('#roomView'), roomStage: document.querySelector('#roomStage'), roomBackdrop: document.querySelector('#roomBackdrop'), roomNumber: document.querySelector('#roomNumber'), roomTitle: document.querySelector('#roomTitle'), hotspotLayer: document.querySelector('#hotspotLayer'), flashlight: document.querySelector('#flashlight'), backBtn: document.querySelector('#backBtn'), clueCount: document.querySelector('#clueCount'), presenceBar: document.querySelector('#presenceBar'), presenceBarRoom: document.querySelector('#presenceBarRoom'), corridorHint: document.querySelector('#corridorHint'), chapterText: document.querySelector('#chapterText'), storyCard: document.querySelector('#storyCard'), storyLabel: document.querySelector('#storyLabel'), storyTitle: document.querySelector('#storyTitle'), storyText: document.querySelector('#storyText'), storyClose: document.querySelector('#storyClose'), panic: document.querySelector('#panic'), panicCount: document.querySelector('#panicCount'), ending: document.querySelector('#ending'), endingText: document.querySelector('#endingText'), endingOpen: document.querySelector('#endingOpen'), finale: document.querySelector('#finale'), replayBtn: document.querySelector('#replayBtn'), soundBtn: document.querySelector('#soundBtn')
  };

  function ensureAudio() {
    if (!state.sound || state.audio) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx(); const gain = ctx.createGain(); gain.gain.value = 0.025; const osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 54; osc.connect(gain).connect(ctx.destination); osc.start();
    state.audio = ctx; state.hum = { osc, gain };
  }

  function tone(freq = 180, duration = 0.08, volume = 0.04) {
    if (!state.sound) return; ensureAudio(); if (!state.audio) return;
    const osc = state.audio.createOscillator(); const gain = state.audio.createGain(); const now = state.audio.currentTime;
    osc.frequency.value = freq; osc.type = 'triangle'; gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(state.audio.destination); osc.start(now); osc.stop(now + duration);
  }

  function vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }

  function updatePresence(delta) {
    if (state.panic || !state.started) return;
    state.presence = Math.max(0, Math.min(100, state.presence + delta));
    const width = `${state.presence}%`; el.presenceBar.style.width = width; el.presenceBarRoom.style.width = width;
    if (state.presence >= 96 && state.currentRoom) triggerPanic();
  }

  function showStory(item, roomId, index) {
    const key = `${roomId}-${index}`; state.found.add(key);
    const hotspot = el.hotspotLayer.querySelector(`[data-key="${key}"]`); if (hotspot) hotspot.classList.add('found');
    if (item.clue && !state.clues.has(roomId)) { state.clues.add(roomId); el.storyLabel.textContent = '手がかりを見つけた'; tone(320, 0.16, 0.055); vibrate([15, 30, 20]); }
    else { el.storyLabel.textContent = '調べた'; tone(150, 0.07, 0.035); }
    el.storyTitle.textContent = item.title; el.storyText.textContent = item.text; el.storyCard.classList.add('show'); el.storyCard.setAttribute('aria-hidden', 'false'); updateClues();
  }

  function updateClues() {
    el.clueCount.textContent = `${state.clues.size} / 5`;
    const door203 = document.querySelector('.door-203');
    if (state.clues.size >= 5) { door203.classList.add('unlocked'); door203.querySelector('.nameplate').textContent = '開く'; door203.querySelector('.seal').textContent = '203'; el.corridorHint.textContent = '203号室が開けられる。赤い缶を取りに行く。'; el.chapterText.textContent = '取り壊し前夜 / 19:26'; }
  }

  function renderRoom(roomId) {
    const room = rooms[roomId]; if (!room) return;
    if (roomId === '203') {
      if (state.clues.size < 5) { tone(82, 0.12, 0.06); vibrate(25); el.storyLabel.textContent = '鍵がかかっている'; el.storyTitle.textContent = '203号室'; el.storyText.textContent = '鍵穴はある。\nでも、鍵そのものが見つからない。\nほかの部屋を調べる必要がありそうだ。'; el.storyCard.classList.add('show'); el.storyCard.setAttribute('aria-hidden', 'false'); return; }
      showEnding(); return;
    }
    state.currentRoom = roomId; state.presence = Math.max(0, state.presence - 18); updatePresence(0); el.roomNumber.textContent = roomId; el.roomTitle.textContent = room.title; el.roomBackdrop.className = `room-backdrop ${room.backdrop}`; el.hotspotLayer.innerHTML = '';
    room.items.forEach((item, index) => {
      const btn = document.createElement('button'); const key = `${roomId}-${index}`; btn.type = 'button'; btn.className = 'hotspot'; btn.dataset.key = key; btn.dataset.x = String(item.x); btn.dataset.y = String(item.y); btn.style.left = `${item.x}%`; btn.style.top = `${item.y}%`; btn.setAttribute('aria-label', item.title); if (state.found.has(key)) btn.classList.add('found');
      btn.addEventListener('click', (event) => { event.stopPropagation(); if (!btn.classList.contains('lit')) return; showStory(item, roomId, index); }); el.hotspotLayer.appendChild(btn);
    });
    el.corridor.classList.remove('active'); el.roomView.classList.add('active'); el.flashlight.style.left = '50%'; el.flashlight.style.top = '58%'; illuminate(50, 58); tone(105, 0.12, 0.045);
  }

  function illuminate(xPct, yPct) { el.hotspotLayer.querySelectorAll('.hotspot').forEach((spot) => { const dx = Number(spot.dataset.x) - xPct; const dy = Number(spot.dataset.y) - yPct; spot.classList.toggle('lit', Math.hypot(dx, dy) < 15); }); }

  function moveFlashlight(clientX, clientY) {
    if (state.panic || !state.currentRoom) return;
    const rect = el.roomStage.getBoundingClientRect(); const x = Math.max(0, Math.min(rect.width, clientX - rect.left)); const y = Math.max(0, Math.min(rect.height, clientY - rect.top)); const xPct = (x / rect.width) * 100; const yPct = (y / rect.height) * 100;
    el.flashlight.style.left = `${x}px`; el.flashlight.style.top = `${y}px`; illuminate(xPct, yPct);
    const now = performance.now(); if (now - state.lastMoveAt > 80) { updatePresence(0.65); state.lastMoveAt = now; }
  }

  function backToCorridor() { if (state.panic) return; state.currentRoom = null; el.roomView.classList.remove('active'); el.corridor.classList.add('active'); updatePresence(-14); tone(92, 0.1, 0.035); }

  function triggerPanic() {
    if (state.panic) return; state.panic = true; state.activePointer = false; el.panic.classList.add('show'); el.panic.setAttribute('aria-hidden', 'false'); tone(61, 0.55, 0.08); vibrate([40, 70, 40]);
    let left = 3; el.panicCount.textContent = String(left);
    const timer = setInterval(() => { left -= 1; el.panicCount.textContent = String(Math.max(0, left)); tone(76, 0.05, 0.025); if (left <= 0) { clearInterval(timer); state.panic = false; state.presence = 24; updatePresence(0); el.panic.classList.remove('show'); el.panic.setAttribute('aria-hidden', 'true'); } }, 1000);
  }

  function punishPanicTouch() { if (!state.panic) return; el.panicCount.textContent = '!'; tone(42, 0.24, 0.11); vibrate([60, 40, 60]); }

  function showEnding() {
    state.currentRoom = null;
    el.endingText.textContent = state.found.size >= 12 ? 'ここまで見つけたものが、全部ひとつの部屋を指していた。なのに、この部屋だけ生活の痕跡がない。' : '鍵は見つからなかった。けれど、5つの手がかりを集めた瞬間、扉は内側から少しだけ開いていた。';
    el.ending.classList.add('show'); el.ending.setAttribute('aria-hidden', 'false'); tone(72, 0.8, 0.05);
  }

  function resetGame() {
    state.clues.clear(); state.found.clear(); state.currentRoom = null; state.presence = 0; state.panic = false; state.started = true; el.ending.classList.remove('show'); el.finale.classList.remove('show'); el.roomView.classList.remove('active'); el.corridor.classList.add('active');
    const door203 = document.querySelector('.door-203'); door203.classList.remove('unlocked'); door203.querySelector('.nameplate').textContent = '鍵'; door203.querySelector('.seal').textContent = '立入禁止'; el.corridorHint.textContent = '部屋を調べて、203号室の鍵の手がかりを探す。'; el.chapterText.textContent = '取り壊し前夜 / 18:47'; updateClues(); updatePresence(0);
  }

  document.querySelectorAll('.door').forEach((door) => { door.addEventListener('click', () => { ensureAudio(); renderRoom(door.dataset.room); }); });
  el.startBtn.addEventListener('click', () => { state.started = true; ensureAudio(); el.intro.classList.add('hide'); tone(110, 0.14, 0.045); setTimeout(() => el.intro.remove(), 600); });
  el.backBtn.addEventListener('click', backToCorridor);
  el.storyClose.addEventListener('click', () => { el.storyCard.classList.remove('show'); el.storyCard.setAttribute('aria-hidden', 'true'); if (state.clues.size >= 5 && state.currentRoom) updatePresence(-8); });
  el.roomStage.addEventListener('pointerdown', (event) => { if (state.panic) return; state.activePointer = true; moveFlashlight(event.clientX, event.clientY); });
  el.roomStage.addEventListener('pointermove', (event) => { if (event.pointerType === 'mouse' || state.activePointer) moveFlashlight(event.clientX, event.clientY); });
  window.addEventListener('pointerup', () => { state.activePointer = false; }); el.panic.addEventListener('pointerdown', punishPanicTouch);
  el.endingOpen.addEventListener('click', () => { el.ending.classList.remove('show'); el.ending.setAttribute('aria-hidden', 'true'); el.finale.classList.add('show'); el.finale.setAttribute('aria-hidden', 'false'); tone(48, 0.9, 0.07); });
  el.replayBtn.addEventListener('click', resetGame);
  el.soundBtn.addEventListener('click', () => { state.sound = !state.sound; el.soundBtn.textContent = state.sound ? '音 ON' : '音 OFF'; if (state.sound) { ensureAudio(); if (state.hum) state.hum.gain.gain.value = 0.025; } else if (state.hum) state.hum.gain.gain.value = 0; });
  const decay = setInterval(() => { if (!state.currentRoom || state.panic || el.storyCard.classList.contains('show')) return; if (!state.activePointer) updatePresence(-0.5); }, 180); window.addEventListener('beforeunload', () => clearInterval(decay));
  updateClues(); updatePresence(0);
})();
