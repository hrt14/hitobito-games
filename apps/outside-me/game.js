(() => {
  'use strict';

  const STORAGE_KEY = 'hitobito.outside-me.memory.v1';
  const $ = (id) => document.getElementById(id);

  const startScreen = $('startScreen');
  const gameScreen = $('gameScreen');
  const endingScreen = $('endingScreen');
  const memoryLine = $('memoryLine');
  const storyText = $('storyText');
  const speaker = $('speaker');
  const choicesEl = $('choices');
  const tapHint = $('tapHint');
  const novelPanel = $('novelPanel');
  const sceneEl = $('scene');
  const clockLabel = $('clockLabel');
  const weatherLabel = $('weatherLabel');
  const approachDots = [...$('approachDots').querySelectorAll('i')];
  const soundToggle = $('soundToggle');
  const flash = $('flash');
  const glitch = $('glitch');
  const doorSlab = document.querySelector('.door-slab');
  const outsideSelf = document.querySelector('.outside-self');
  const mirrorObject = document.querySelector('.mirror-object');
  const cameraStamp = $('cameraStamp');

  const clueLabels = {
    mirror: '洗面所の鏡',
    phone: 'スマホの下書き',
    bed: '寝室の濡れた足跡',
    closet: '物置のスペアキー',
    backdoor: '勝手口',
  };

  const clueDescriptions = {
    mirror: '鏡の中の自分だけ、二秒遅れて動いた。',
    phone: '15分後の時刻で「家の中にいる方を外へ出せ」と下書きされていた。',
    bed: '濡れた足跡は玄関からではなく、ベッドの脇から始まっていた。',
    closet: '玄関のスペアキーが一本だけ消えていた。',
    backdoor: '勝手口はドアホンのカメラに一度も映らない。',
  };

  let memory = loadMemory();
  let state = freshState();
  let activeScene = null;
  let activeLines = [];
  let lineIndex = 0;
  let typing = false;
  let typingTimer = null;
  let fullLine = '';
  let audio = null;
  let muted = false;

  function loadMemory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        runs: Number(parsed.runs || 0),
        endings: Array.isArray(parsed.endings) ? parsed.endings : [],
        lastEnding: parsed.lastEnding || null,
      };
    } catch {
      return { runs: 0, endings: [], lastEnding: null };
    }
  }

  function saveMemory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }

  function freshState() {
    return {
      evidence: new Set(),
      approach: 0,
      rounds: 0,
      trustOutside: 0,
      heardOutside: false,
      watchedCamera: false,
      rewound: false,
      ended: false,
      currentScene: 'door',
    };
  }

  function setScreen(name) {
    [startScreen, gameScreen, endingScreen].forEach((screen) => screen.classList.remove('is-visible'));
    if (name === 'start') startScreen.classList.add('is-visible');
    if (name === 'game') gameScreen.classList.add('is-visible');
    if (name === 'ending') endingScreen.classList.add('is-visible');
  }

  function updateStartMemory() {
    if (!memory.runs) {
      memoryLine.hidden = true;
      return;
    }
    const last = memory.lastEnding ? `前回の結末「${memory.lastEnding}」` : '前回の夜';
    memoryLine.hidden = false;
    memoryLine.textContent = `${last}を、この家は覚えている。あなたも、少しだけ覚えている。`;
  }

  function initAudio() {
    if (audio) return audio;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);

    const rainBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = rainBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.22;
    const rain = ctx.createBufferSource();
    const rainFilter = ctx.createBiquadFilter();
    const rainGain = ctx.createGain();
    rain.buffer = rainBuffer;
    rain.loop = true;
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 1600;
    rainGain.gain.value = 0.16;
    rain.connect(rainFilter).connect(rainGain).connect(master);
    rain.start();

    const drone = ctx.createOscillator();
    const drone2 = ctx.createOscillator();
    const droneGain = ctx.createGain();
    const droneFilter = ctx.createBiquadFilter();
    drone.type = 'sine';
    drone2.type = 'triangle';
    drone.frequency.value = 48;
    drone2.frequency.value = 71.2;
    droneGain.gain.value = 0.025;
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 180;
    drone.connect(droneGain);
    drone2.connect(droneGain);
    droneGain.connect(droneFilter).connect(master);
    drone.start();
    drone2.start();

    audio = { ctx, master, rainGain, droneGain };
    return audio;
  }

  function setMuted(value) {
    muted = value;
    soundToggle.textContent = muted ? '音 OFF' : '音 ON';
    if (audio) {
      const now = audio.ctx.currentTime;
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.linearRampToValueAtTime(muted ? 0 : 0.6, now + 0.12);
    }
  }

  function ping(freq = 260, duration = 0.12, volume = 0.08, type = 'sine') {
    if (!audio || muted) return;
    const { ctx, master } = audio;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(master);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  function knock() {
    ping(92, 0.09, 0.18, 'triangle');
    setTimeout(() => ping(76, 0.11, 0.16, 'triangle'), 140);
    vibrate([28, 60, 34]);
  }

  function bell() {
    ping(740, 0.22, 0.055, 'sine');
    setTimeout(() => ping(554, 0.28, 0.04, 'sine'), 170);
    vibrate(18);
  }

  function sting() {
    ping(84, 0.42, 0.16, 'sawtooth');
    ping(118, 0.38, 0.08, 'square');
    fireGlitch();
    vibrate([25, 40, 55]);
  }

  function vibrate(pattern) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }

  function fireFlash() {
    flash.classList.remove('fire');
    void flash.offsetWidth;
    flash.classList.add('fire');
  }

  function fireGlitch() {
    glitch.classList.remove('fire');
    void glitch.offsetWidth;
    glitch.classList.add('fire');
  }

  function setVisual(scene, { blackout = false } = {}) {
    state.currentScene = scene;
    sceneEl.dataset.scene = scene;
    sceneEl.classList.toggle('blackout', blackout);
    mirrorObject.classList.toggle('reveal', state.evidence.has('mirror'));
    doorSlab.classList.remove('open');
    outsideSelf.classList.toggle('visible', state.approach > 0 || scene === 'camera');
    outsideSelf.classList.toggle('close', state.approach >= 3);
    cameraStamp.textContent = `00:${String(13 + Math.min(state.rounds, 9)).padStart(2, '0')}:${String(8 + state.approach * 7).padStart(2, '0')}`;
  }

  function updateHud() {
    const minute = 13 + Math.min(state.rounds, 7);
    clockLabel.textContent = `00:${String(minute).padStart(2, '0')}`;
    weatherLabel.textContent = state.approach >= 3 ? '雨 / 至近' : '雨';
    approachDots.forEach((dot, index) => {
      dot.classList.toggle('on', index < state.approach);
      dot.classList.toggle('danger', state.approach >= 3 && index < state.approach);
    });
  }

  function typeLine(text) {
    clearInterval(typingTimer);
    fullLine = text;
    storyText.textContent = '';
    typing = true;
    const chars = Array.from(text);
    let i = 0;
    const speed = text.length > 70 ? 18 : 24;
    typingTimer = setInterval(() => {
      i += 1;
      storyText.textContent = chars.slice(0, i).join('');
      if (i >= chars.length) finishTyping();
    }, speed);
  }

  function finishTyping() {
    clearInterval(typingTimer);
    typing = false;
    storyText.textContent = fullLine;
  }

  function advance() {
    if (!activeScene || state.ended) return;
    if (typing) {
      finishTyping();
      return;
    }
    if (lineIndex < activeLines.length - 1) {
      lineIndex += 1;
      if (activeScene.onLine) activeScene.onLine(lineIndex, state);
      typeLine(activeLines[lineIndex]);
      return;
    }
    showChoices();
  }

  function resolveLines(scene) {
    return typeof scene.lines === 'function' ? scene.lines(state) : scene.lines;
  }

  function resolveChoices(scene) {
    return typeof scene.choices === 'function' ? scene.choices(state) : (scene.choices || []);
  }

  function playScene(id) {
    const scene = scenes[id];
    if (!scene) throw new Error(`Unknown scene: ${id}`);
    activeScene = scene;
    lineIndex = 0;
    choicesEl.innerHTML = '';
    novelPanel.classList.remove('has-choices');
    tapHint.hidden = false;
    speaker.hidden = true;
    speaker.textContent = '';
    if (scene.speaker) {
      speaker.hidden = false;
      speaker.textContent = typeof scene.speaker === 'function' ? scene.speaker(state) : scene.speaker;
    }
    setVisual(scene.visual || 'door', { blackout: Boolean(scene.blackout) });
    updateHud();
    if (scene.onEnter) scene.onEnter(state);
    activeLines = resolveLines(scene);
    if (!activeLines.length) activeLines = ['……'];
    typeLine(activeLines[0]);
  }

  function showChoices() {
    if (typing) finishTyping();
    const options = resolveChoices(activeScene).filter((choice) => !choice.requires || choice.requires(state));
    if (!options.length) return;
    tapHint.hidden = true;
    novelPanel.classList.add('has-choices');
    choicesEl.innerHTML = '';
    options.forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `choice-button${choice.secret ? ' secret' : ''}${choice.danger ? ' danger' : ''}`;
      button.innerHTML = `
        <span class="choice-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="choice-copy"><strong>${choice.label}</strong>${choice.note ? `<small>${choice.note}</small>` : ''}</span>
      `;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        ping(210 + index * 36, 0.09, 0.05, 'triangle');
        vibrate(10);
        if (choice.effect) choice.effect(state);
        if (choice.action) choice.action(state);
        else if (choice.next) playScene(typeof choice.next === 'function' ? choice.next(state) : choice.next);
      });
      choicesEl.appendChild(button);
    });
  }

  function visitClue(key) {
    state.evidence.add(key);
    state.rounds += 1;
    state.approach = Math.min(4, state.approach + 1);
    updateHud();
    bell();
    playScene(`clue-${key}`);
  }

  function returnFromClue() {
    if (state.rounds >= 3) playScene('blackout');
    else playScene('search-hub');
  }

  function evidenceSummary() {
    if (!state.evidence.size) return '手掛かりを持たないまま、あなたは決めた。';
    return [...state.evidence].map((key) => clueDescriptions[key]).join(' ');
  }

  function hasTrueRoute() {
    return state.evidence.has('mirror') && state.evidence.has('phone') && state.evidence.has('backdoor') && state.rewound;
  }

  function ending(id, title, text) {
    state.ended = true;
    const labelMap = {
      swap: 'ENDING 01',
      stay: 'ENDING 02',
      corridor: 'ENDING 03',
      key: 'ENDING 04',
      dawn: 'TRUE ENDING',
      remembered: 'ENDING 05',
    };
    memory.runs += 1;
    if (!memory.endings.includes(id)) memory.endings.push(id);
    memory.lastEnding = title;
    saveMemory();

    $('endingLabel').textContent = labelMap[id] || 'ENDING';
    $('endingTitle').textContent = title;
    $('endingText').textContent = text;
    $('endingClues').innerHTML = [...state.evidence]
      .map((key) => `<span class="clue-chip">${clueLabels[key]}</span>`)
      .join('');
    setScreen('ending');
    sting();
  }

  const scenes = {
    wake: {
      visual: 'door',
      lines: (s) => {
        const repeat = memory.runs > 0 ? 'また、午前0時13分だった。時計だけが、前回と同じ場所で止まっている。' : '午前0時13分。山沿いの古い家で、あなたは一人で目を覚ました。';
        return [
          repeat,
          '寝落ちする前、雨は降っていなかった。なのに今は、屋根を叩く音がうるさい。',
          'ピンポーン。',
          'こんな時間に、玄関のチャイムが鳴った。',
        ];
      },
      onLine(index) {
        if (index === 2) bell();
      },
      choices: [
        { label: 'ドアホンを見る', note: '画面だけなら、玄関を開けずに確認できる', next: 'intercom' },
        { label: '息を殺して無視する', note: '相手が帰るまで待つ', next: 'ignore' },
      ],
    },

    ignore: {
      visual: 'door',
      lines: [
        'あなたは布団の上で息を止めた。',
        '十秒。二十秒。チャイムは鳴らない。',
        '代わりに、玄関のドアを二回だけ叩く音がした。',
        'コン。　　　コン。',
        'そしてドアホンが、自動で点灯した。',
      ],
      onEnter(s) { s.approach = Math.max(1, s.approach); updateHud(); },
      onLine(index) { if (index === 3) knock(); },
      choices: [
        { label: '画面を見る', note: 'もう、見ないふりはできない', next: 'intercom' },
      ],
    },

    intercom: {
      visual: 'camera',
      onEnter(s) { s.watchedCamera = true; },
      lines: (s) => [
        '白黒のドアホン映像に、ひとり立っている。',
        'パーカー。濡れた髪。右の頬の小さな傷。',
        'あなたと同じ顔だった。',
        s.approach ? 'さっきより、カメラに近い。' : '外のあなたは、カメラではなく、その向こうのあなたを見ている。',
        'スピーカーが、ざらついた音を吐いた。',
      ],
      onLine(index) { if (index === 2) sting(); },
      choices: [
        { label: '「誰？」と話しかける', note: '外の自分の声を聞く', next: 'outside-voice', effect(s) { s.trustOutside += 1; } },
        { label: '玄関から離れて家を調べる', note: '顔より、証拠を見る', next: 'search-intro' },
      ],
    },

    'outside-voice': {
      visual: 'camera',
      speaker: '玄関の外のあなた',
      onEnter(s) { s.heardOutside = true; },
      lines: (s) => [
        '「お願い。まだ開けないで」',
        '声まで、あなたと同じだった。',
        '「今そこにいる“私”は、玄関から入ってない」',
        '「寝室を見れば分かる。濡れてるはずだから」',
        memory.runs > 0 ? '一拍置いて、外のあなたが続けた。「……前にも、ここで話したよね」' : '外のあなたは振り返った。暗い道には、誰もいない。',
      ],
      choices: [
        { label: '家の中を調べる', note: '三か所だけ確かめる', next: 'search-intro' },
        { label: '今すぐ開ける', note: '同じ顔を、これ以上待たせない', danger: true, next: 'open-early' },
      ],
    },

    'open-early': {
      visual: 'door',
      lines: [
        'チェーンに指をかける。',
        '外のあなたが、画面の向こうで首を振った。',
        '「まだ。中を見てから――」',
        'あなたはチェーンを外した。',
        'ドアノブが、外から先に回った。',
      ],
      onLine(index) { if (index === 4) { doorSlab.classList.add('open'); sting(); } },
      choices: [{
        label: 'ドアを開ける',
        danger: true,
        action() {
          ending('swap', '交代', '冷たい雨が顔に当たった。気づけば、あなたは玄関の外に立っている。閉じたドアの向こうで、あなたの声が「誰？」と聞いた。ドアホンの赤いランプだけが、また点いた。');
        },
      }],
    },

    'search-intro': {
      visual: 'door',
      lines: [
        '玄関を開ける前に、家の中で確かめられることがある。',
        'ただし、チャイムが鳴るたび外の自分は少しずつドアへ近づいてくる。',
        '全部は見られない。三か所だけ選ぶ。',
      ],
      choices: [{ label: '調べる場所を選ぶ', note: '見なかった場所も、結末になる', next: 'search-hub' }],
    },

    'search-hub': {
      visual: 'door',
      lines: (s) => [
        s.rounds === 0 ? '家は静かだ。玄関の向こうだけに雨音がある。' : `あと${3 - s.rounds}か所。ドアホンの中の自分が、さっきより大きく見える。`,
        s.rounds === 2 ? '次に見るものが、最後の手掛かりになる。' : 'どこから確かめる？',
      ],
      choices: (s) => [
        { label: '洗面所の鏡', note: '寝起きの自分の顔を確かめる', requires: () => !s.evidence.has('mirror'), action: () => visitClue('mirror') },
        { label: 'スマホ', note: '最後に触った記録を見る', requires: () => !s.evidence.has('phone'), action: () => visitClue('phone') },
        { label: '寝室', note: '外の自分が「見ろ」と言った場所', requires: () => !s.evidence.has('bed'), action: () => visitClue('bed') },
        { label: '物置のスペアキー', note: '玄関を開けられるのは誰か', requires: () => !s.evidence.has('closet'), action: () => visitClue('closet') },
        { label: '勝手口', note: '玄関以外の出口を確かめる', requires: () => !s.evidence.has('backdoor'), action: () => visitClue('backdoor') },
      ],
    },

    'clue-mirror': {
      visual: 'mirror',
      lines: (s) => [
        '洗面所の鏡に、自分が映っている。',
        '右手を上げる。鏡も右手を上げる。',
        '手を下ろす。',
        '鏡の中の自分だけ、二秒遅れて手を下ろした。',
        '口だけが動く。声はない。',
        memory.runs > 0 ? '「また　いれかわる」' : '「だ　す　な」',
      ],
      onLine(index) { if (index === 3 || index === 5) sting(); },
      choices: [{ label: '玄関へ戻る', note: '鏡から目を離す', action: returnFromClue }],
    },

    'clue-phone': {
      visual: 'phone',
      lines: [
        '枕元のスマホ。ロックは、いつもの指で開いた。',
        'メモアプリに、保存した覚えのない下書きが一件ある。',
        '作成時刻　00:28。',
        '今より十五分後だ。',
        '「家の中にいる方を外へ出せ。」',
        'その一行だけが、すでに入力されている。',
      ],
      onLine(index) { if (index === 2) fireGlitch(); },
      choices: [{ label: '玄関へ戻る', note: '00:28になる前に決める', action: returnFromClue }],
    },

    'clue-bed': {
      visual: 'bed',
      lines: [
        '寝室の床が濡れている。',
        '裸足の足跡が、点々と玄関の方へ続いている。',
        '玄関から来た足跡ではない。',
        '最初の一歩は、ベッドの脇から始まっていた。',
        'あなたの足の裏を見る。',
        '濡れている。',
      ],
      onLine(index) { if (index === 5) sting(); },
      choices: [{ label: '玄関へ戻る', note: '自分がどこから来たのか考えない', action: returnFromClue }],
    },

    'clue-closet': {
      visual: 'closet',
      lines: [
        '物置の壁に、玄関のスペアキーを二本掛けていた。',
        '一本しかない。',
        '家族にも、合鍵は渡していない。',
        'もし外にいるのが本当に自分なら――',
        'あいつは、あなたに開けてもらう必要がない。',
      ],
      onLine(index) { if (index === 4) ping(110, 0.35, 0.12, 'sawtooth'); },
      choices: [{ label: '玄関へ戻る', note: '鍵を持っているか聞ける', action: returnFromClue }],
    },

    'clue-backdoor': {
      visual: 'backdoor',
      lines: [
        '台所の奥にある勝手口。チェーンは内側から掛かっている。',
        '小窓からは裏庭しか見えない。人影はない。',
        'この家のドアホンは玄関だけを撮る。',
        '勝手口なら、カメラにも鏡にも自分の姿を映さず外へ出られる。',
        'ドアの下から、冷たい雨の匂いがした。',
      ],
      choices: [{ label: '玄関へ戻る', note: 'もう一つの出口を覚えておく', action: returnFromClue }],
    },

    blackout: {
      visual: 'door',
      blackout: true,
      onEnter(s) { s.approach = 4; updateHud(); },
      lines: (s) => [
        '三つ目の手掛かりを見終えた瞬間、家じゅうの電気が落ちた。',
        'ドアホンだけが、内蔵電池で青白く光っている。',
        '玄関の外の自分は、もう画面いっぱいに立っていた。',
        s.heardOutside ? 'スピーカーから小さな声。「時間がない。今度は、そっちが決めて」' : 'スピーカーは切っているはずなのに、あなたの声で「時間がない」と聞こえた。',
        'コン。　　　コン。',
      ],
      onLine(index) { if (index === 4) knock(); },
      choices: (s) => [
        { label: 'ドアホンをもう一度見る', note: '最後に映像を確かめる', next: 'camera-twist' },
        { label: '玄関を二重ロックする', note: '外の自分を朝まで入れない', next: 'lock-final' },
        { label: '勝手口へ走る', note: s.evidence.has('backdoor') ? 'カメラに映らず外へ出られる' : '暗い家の裏へ逃げる', next: 'backdoor-final' },
      ],
    },

    'camera-twist': {
      visual: 'camera',
      onEnter(s) { s.approach = 4; updateHud(); },
      lines: [
        'ドアホンの画面を見る。外の自分は、いない。',
        '雨の玄関だけが映っている。',
        '安心しかけたとき、画面の下から人影が入ってきた。',
        '自分の背中だった。',
        'あなたは今、玄関から三メートル離れて画面を見ている。',
        'それなのにカメラは、その背中を「家の内側」から映している。',
      ],
      onLine(index) { if (index === 3) { fireFlash(); sting(); } },
      choices: (s) => [
        { label: '録画を30秒巻き戻す', note: '何が先に家へ入ったか確認する', secret: true, requires: () => s.evidence.has('phone') || s.evidence.has('mirror'), next: 'rewind' },
        { label: '「スペアキーを見せて」と言う', note: '外の自分なら持っているはず', secret: true, requires: () => s.evidence.has('closet'), next: 'key-test' },
        { label: 'チェーンだけ残して少し開ける', note: '顔を直接見る', next: 'chain-peek' },
        { label: '全部無視して鍵を閉める', note: '朝になれば終わるはず', next: 'lock-final' },
      ],
    },

    rewind: {
      visual: 'camera',
      onEnter(s) { s.rewound = true; },
      lines: [
        '録画を30秒戻す。',
        '00:12:41。雨の中から、あなたが玄関へ走ってくる。',
        'ポケットから鍵を出し、自分でドアを開けて入った。',
        '00:12:42。',
        'たった一秒後。',
        '閉じた玄関の内側から、もう一人のあなたがドアホンを覗き込んだ。',
        '先にいたのは、どっちだ。',
      ],
      onLine(index) { if (index === 5) fireGlitch(); },
      choices: (s) => [
        { label: 'ブレーカーを落とし、勝手口から出る', note: '外の自分には玄関から出てもらう。二人ともカメラに映らない瞬間を作る', secret: true, requires: hasTrueRoute, next: 'true-route' },
        { label: 'ドアを開ける', note: '外にいた自分と入れ替わる', danger: true, next: 'open-final' },
        { label: 'ドアを開けない', note: '今ここにいる自分を選ぶ', next: 'lock-final' },
      ],
    },

    'key-test': {
      visual: 'camera',
      speaker: 'あなた',
      lines: (s) => [
        '「そこにいるなら、スペアキー持ってるよね」',
        '画面の外で、外のあなたがポケットを探る。',
        s.evidence.has('closet') ? '数秒後。見覚えのある銀色の鍵を、カメラに見せた。' : '外のあなたは、何も見せない。',
        s.evidence.has('closet') ? '「だから、開けてもらう必要はない。でも勝手に入ったら、また同じになる」' : '「……鍵のこと、覚えてない」',
        memory.runs > 0 ? `外のあなたが言う。「前回は『${memory.lastEnding || 'あの結末'}』だった。今度は違う方を選んで」` : 'スピーカーの向こうで、あなたと同じ呼吸音がする。',
      ],
      choices: (s) => [
        { label: '自分で鍵を使わせる', note: 'こちらからは玄関に触れない', secret: true, requires: () => s.evidence.has('closet'), next: 'key-ending' },
        { label: '信用しない', note: '鍵が本物でも、顔は同じだ', next: 'lock-final' },
      ],
    },

    'chain-peek': {
      visual: 'door',
      lines: [
        'チェーンを掛けたまま、ドアを数センチだけ開ける。',
        '雨の匂いが、細い隙間から入ってくる。',
        '隙間の向こうに、自分の片目がある。',
        '同時に、あなたの背後でドアチェーンが鳴った。',
        '今触っているチェーンではない。',
      ],
      onLine(index) { if (index === 3) { doorSlab.classList.add('open'); knock(); } },
      choices: [
        { label: '勢いよく閉める', next: 'lock-final' },
        { label: 'そのまま開ける', danger: true, next: 'open-final' },
      ],
    },

    'open-final': {
      visual: 'door',
      lines: [
        'あなたは鍵を外す。',
        '外のあなたは、笑わない。泣かない。ただ、ほっとした顔をした。',
        '「ありがとう。次は、そっちの番」',
        'ドアを開けた。',
      ],
      onLine(index) { if (index === 3) { doorSlab.classList.add('open'); fireFlash(); } },
      choices: [{
        label: '光の向こうへ',
        danger: true,
        action() {
          ending('swap', '交代', `冷たい雨が頬に当たった。あなたは玄関の外に立っている。家の中で、もう一人のあなたが鍵を掛ける音がした。${evidenceSummary()}`);
        },
      }],
    },

    'lock-final': {
      visual: 'door',
      blackout: true,
      lines: [
        '上の鍵。下の鍵。チェーン。全部掛けた。',
        '外の自分は、もう叩かない。',
        '午前4時。雨が止んだ。',
        '午前6時。玄関の外には誰もいない。',
        '洗面所で顔を洗う。',
        '鏡だけが、空の洗面所を映している。',
      ],
      onLine(index) { if (index === 5) sting(); },
      choices: [{
        label: '朝を迎える',
        action() {
          ending('stay', '居残り', `家には、あなたが残った。それが「元からいた方」だったのかは、もう確かめられない。鏡に映らないことだけが、朝になっても変わらなかった。${evidenceSummary()}`);
        },
      }],
    },

    'backdoor-final': {
      visual: 'backdoor',
      lines: (s) => s.evidence.has('backdoor') ? [
        '暗い台所を抜け、勝手口のチェーンを外す。',
        'ここなら、玄関のカメラに映らない。',
        'ドアを開けると、裏庭に雨が落ちている。',
        '一歩、外へ出た。',
        '背後で勝手口が閉まる。',
        '目の前に、同じ勝手口がある。',
      ] : [
        '暗い台所を手探りで走る。',
        '勝手口らしいドアを見つけ、チェーンを外す。',
        '開けた先は、さっきまでいた玄関の廊下だった。',
        'ドアホンが鳴る。',
      ],
      onLine(index) { if (index === 5 || index === 3) sting(); },
      choices: [{
        label: 'もう一度ドアを見る',
        action() {
          ending('corridor', '同じ廊下', '玄関を避ければ逃げられると思った。けれど家の外側は、もう家の内側につながっている。次にチャイムを押したのが誰なのか、あなたには見えなかった。');
        },
      }],
    },

    'key-ending': {
      visual: 'door',
      lines: [
        'あなたは玄関から三歩離れた。',
        '外で、鍵が差し込まれる。',
        'カチ。',
        'ドアは開かない。',
        '鍵は回ったのに、ドアの向こうから「入れない」とあなたの声がする。',
        'その瞬間、あなたのポケットの中で、同じスペアキーが鳴った。',
      ],
      onLine(index) { if (index === 5) sting(); },
      choices: (s) => [
        { label: '勝手口へ走る', note: '鍵が二本あるなら、出口も二つ使う', secret: true, requires: () => s.evidence.has('backdoor') && s.evidence.has('mirror'), next: 'true-route' },
        { label: '玄関を開ける', danger: true, next: 'open-final' },
        { label: '鍵ごと放って朝を待つ', next: 'lock-final' },
      ],
    },

    'true-route': {
      visual: 'backdoor',
      blackout: true,
      lines: [
        'あなたはブレーカーを落とした。ドアホンも、鏡も、画面も、全部暗くなる。',
        '自分の姿を映すものが、家から消えた。',
        '勝手口のチェーンを外す。',
        '玄関の向こうへ叫ぶ。「私はこっちから出る。そっちは玄関から離れて」',
        '返事はない。',
        'ただ、玄関から遠ざかる足音と、裏庭へ回ってくる足音が二つ聞こえた。',
        'あなたは振り返らず、勝手口から雨の中へ出た。',
        '朝日が出るまで、自分の顔を一度も見なかった。',
      ],
      onLine(index) { if (index === 0) { fireFlash(); setMuted(true); } },
      choices: [{
        label: '朝まで振り返らない',
        secret: true,
        action() {
          ending('dawn', 'ふたりのいない家', '午前6時12分。雨が止んだ。振り返ると、家の玄関も勝手口も開いたままだった。中には誰もいない。あなたは自分がどちらだったかを決めるのをやめ、その家を二度と振り返らなかった。');
        },
      }],
    },
  };

  function begin({ sound }) {
    state = freshState();
    state.ended = false;
    if (sound) {
      muted = false;
      const a = initAudio();
      if (a?.ctx.state === 'suspended') a.ctx.resume();
      setMuted(false);
    } else {
      initAudio();
      setMuted(true);
    }
    setScreen('game');
    playScene('wake');
  }

  $('startSound').addEventListener('click', () => begin({ sound: true }));
  $('startSilent').addEventListener('click', () => begin({ sound: false }));
  soundToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!audio) initAudio();
    if (audio?.ctx.state === 'suspended') audio.ctx.resume();
    setMuted(!muted);
  });

  novelPanel.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    advance();
  });
  sceneEl.addEventListener('click', () => advance());

  $('retryButton').addEventListener('click', () => {
    setMuted(false);
    updateStartMemory();
    setScreen('start');
  });
  $('forgetButton').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    memory = loadMemory();
    updateStartMemory();
    setMuted(false);
    setScreen('start');
  });

  updateStartMemory();
  setScreen('start');
})();
