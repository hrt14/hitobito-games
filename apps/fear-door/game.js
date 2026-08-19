(() => {
  'use strict';

  const TOTAL_DOORS = 13;
  const SWIPE_THRESHOLD = 74;
  const PEEK_THRESHOLD = 16;
  const MAX_DRAG = 150;
  const THREAT_MS = 1500;

  const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };
  const ICON = { left: '←', right: '→', up: '↑', down: '↓' };

  const NODES = [
    {
      plate:'B-01', wing:'RESEARCH WING B', clue:'床に、濡れた足跡が続いている。右側の壁だけ新しい傷がある。',
      line:'「……まだ動いているのか。」',
      outcomes:{left:'advance',right:'danger',up:'dead',down:'advance'},
      previews:{left:['safe','非常灯だけが点いている','▥'],right:['danger','何かが扉のすぐ後ろにいる','••'],up:['dead','コンクリート壁','▦'],down:['safe','階段が下へ続く','⌄']}
    },
    {
      plate:'B-07', wing:'BIO STORAGE', clue:'カードリーダーが近づく前から緑に変わった。',
      line:'「認証は生きてる。」',
      story:['SYSTEM','ADMIN ACCESS / LEVEL 5 — ACCEPTED'],
      outcomes:{left:'dead',right:'advance',up:'advance',down:'danger'},
      previews:{left:['dead','塞がれた保管室','×'],right:['safe','白い廊下が見える','│'],up:['safe','配管室。風が流れている','≈'],down:['danger','床を這う音','⋯']}
    },
    {
      plate:'C-02', wing:'ARCHIVE C', clue:'ドアの下から紙片。「主任は完全に狂っている。実験を止めろ」',
      line:'「……余計なものを残したな。」',
      story:['MEMO','“主任は完全に狂っている。これ以上、実験を続けさせてはいけない。”'],
      outcomes:{left:'advance',right:'dead',up:'danger',down:'advance'},
      previews:{left:['safe','古い記録棚','≡'],right:['dead','崩落している','▧'],up:['danger','爪が金属を擦る音','⌁'],down:['safe','資料搬送路','↘']}
    },
    {
      plate:'S-27', wing:'SUBJECT BLOCK', clue:'プレートの横に「SUBJECT 27」。内側から三回、ゆっくり叩く音。',
      line:'「27番か。まだ動けるんだな。」',
      outcomes:{left:'danger',right:'advance',up:'dead',down:'advance'},
      previews:{left:['danger','白い腕が一瞬見えた','╱'],right:['safe','無人の処置室','+'],up:['dead','天井裏は行き止まり','▤'],down:['safe','排水路。血はない','≈']}
    },
    {
      plate:'A-11', wing:'CONTROL ACCESS', clue:'指を触れていないのに、掌紋センサーが待機状態になった。',
      line:'「ここは手間が省ける。」',
      story:['SYSTEM','WELCOME BACK, CHIEF. BIOMETRIC PROFILE READY.'],
      outcomes:{left:'advance',right:'danger',up:'advance',down:'dead'},
      previews:{left:['safe','制御盤の青い光','▥'],right:['danger','人影が壁に揺れる','♙'],up:['safe','上階へ続く梯子','↑'],down:['dead','水没している','≈']}
    },
    {
      plate:'D-04', wing:'AUDIO LOG', clue:'インターホンが壊れた音声を繰り返す。「先生……もう……」',
      line:'「まだ記録が残っていたか。」',
      story:['AUDIO 04','“先生、もうやめてください。あれは治療じゃない。”'],
      outcomes:{left:'dead',right:'advance',up:'danger',down:'advance'},
      previews:{left:['dead','焼けた配線だけ','╳'],right:['safe','録音室。誰もいない','◉'],up:['danger','呼吸音が近い','••'],down:['safe','サービス通路','┊']}
    },
    {
      plate:'E-09', wing:'OBSERVATION', clue:'観察窓の向こうに拘束椅子。壁には同じ筆跡で「返して」と何十回も書かれている。',
      line:'「反応は予想より強かった。」',
      outcomes:{left:'advance',right:'dead',up:'advance',down:'danger'},
      previews:{left:['safe','観察ブース','▣'],right:['dead','施錠された薬品庫','▧'],up:['safe','非常階段','↑'],down:['danger','机の下で何かが動く','…']}
    },
    {
      plate:'P-00', wing:'PROJECT OFFICE', clue:'割れた写真立て。「主任研究員」の顔だけ、黒く塗りつぶされている。',
      line:'「くだらない。」',
      story:['PHOTO','PROJECT DOOR / CHIEF RESEARCHER — 顔写真は黒く塗り潰されている。'],
      outcomes:{left:'danger',right:'advance',up:'dead',down:'advance'},
      previews:{left:['danger','白衣の影','♟'],right:['safe','主任室へ続く通路','→'],up:['dead','換気口は狭すぎる','▤'],down:['safe','資料庫の床下','⌄']}
    },
    {
      plate:'L-03', wing:'LOWER LAB', clue:'扉の奥から、擦れた声。「……せん、せい……」',
      line:'「喋れるのか。」',
      outcomes:{left:'advance',right:'danger',up:'advance',down:'dead'},
      previews:{left:['safe','培養槽の青い光','◌'],right:['danger','こちらを見ている','●'],up:['safe','監視デッキ','⌃'],down:['dead','配管が崩れている','╳']}
    },
    {
      plate:'CORE', wing:'PRIMARY CONTROL', clue:'端末に触れると、パスワード入力を飛ばして管理者画面が開いた。',
      line:'「当然だ。」',
      story:['TERMINAL','PROJECT DOOR / PRIMARY INVESTIGATOR / AUTHORITY: FULL'],
      outcomes:{left:'dead',right:'advance',up:'danger',down:'advance'},
      previews:{left:['dead','非常扉は溶接済み','▥'],right:['safe','最終区画への標識','→'],up:['danger','天井から液体が落ちる','…'],down:['safe','中枢へ降りる階段','⌄']}
    },
    {
      plate:'LAB-1', wing:'INNER SECTOR', clue:'ドアの向こうから、生きた人間の声がする。「……まさか」',
      line:'',
      story:['VOICE','「博士……？」'],
      outcomes:{left:'advance',right:'danger',up:'dead',down:'advance'},
      previews:{left:['safe','誰かが立っている','♙'],right:['danger','複数の足音','•••'],up:['dead','隔離壁','▦'],down:['safe','研究員用通路','┊']},
      revealLine:'研究員「博士……まだ続けるつもりなんですか？」\n主人公「そのために来た。」'
    },
    {
      plate:'LAB-0', wing:'FINAL SECTOR', clue:'出口表示はない。あるのは「LAB 00 →」だけ。主人公は迷わずその方を見る。',
      line:'「あと一つだ。」',
      outcomes:{left:'danger',right:'advance',up:'advance',down:'dead'},
      previews:{left:['danger','何体もの影','♟'],right:['safe','白い最終扉','□'],up:['safe','制御室を経由できる','⌃'],down:['dead','焼却炉','×']}
    },
    {
      plate:'00', wing:'LAB 00', clue:'扉には外へ出る印はない。「PROJECT DOOR — CHIEF ONLY」',
      line:'「ようやく戻ってこられた。」',
      story:['SYSTEM','CHIEF BIOMETRIC CONFIRMED / WELCOME BACK, DR. KUROSE'],
      outcomes:{left:'final',right:'final',up:'final',down:'final'},
      previews:{left:['safe','巨大な培養槽の光','◉'],right:['safe','実験装置が起動している','⌁'],up:['safe','観察窓の向こうに人影','♙'],down:['safe','床下から機械音','≋']}
    }
  ];

  const els = {
    game: document.getElementById('game'), door: document.getElementById('door'),
    doorCount: document.getElementById('doorCount'), wingLabel: document.getElementById('wingLabel'), doorPlate: document.getElementById('doorPlate'),
    clueText: document.getElementById('clueText'), protagonistLine: document.getElementById('protagonistLine'), storyCard: document.getElementById('storyCard'),
    storyKind: document.getElementById('storyKind'), storyText: document.getElementById('storyText'), peekRoom: document.getElementById('peekRoom'),
    peekSymbol: document.getElementById('peekSymbol'), peekCaption: document.getElementById('peekCaption'), gestureHint: document.getElementById('gestureHint'),
    bloodMark: document.getElementById('bloodMark'), intro: document.getElementById('intro'), startBtn: document.getElementById('startBtn'), threat: document.getElementById('threat'),
    threatHint: document.getElementById('threatHint'), threatBar: document.getElementById('threatBar'), ending: document.getElementById('ending'), restartBtn: document.getElementById('restartBtn'),
    gameOver: document.getElementById('gameOver'), gameOverText: document.getElementById('gameOverText'), retryBtn: document.getElementById('retryBtn'), flash: document.getElementById('flash')
  };

  let depth = 0;
  let dragging = false;
  let startX = 0, startY = 0, dx = 0, dy = 0;
  let locked = true;
  let threatState = null;
  let threatTimeout = null;
  let threatRAF = null;
  let storyTimer = null;
  let lineTimer = null;
  let hasMoved = false;

  const audio = createAudio();

  function createAudio() {
    let ctx = null;
    const ensure = () => {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    const tone = (freq, duration=.08, type='sine', gain=.035) => {
      try {
        const c = ensure(), o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.value = freq; g.gain.value = gain;
        o.connect(g); g.connect(c.destination); const t = c.currentTime;
        g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(.0001,t+duration);
        o.start(t); o.stop(t+duration);
      } catch (_) {}
    };
    return {
      unlock: () => { try { ensure(); } catch (_) {} },
      creak: () => { tone(72,.18,'sawtooth',.018); setTimeout(()=>tone(51,.22,'triangle',.025),70); },
      slam: () => { tone(42,.12,'square',.055); },
      sting: () => { tone(168,.14,'sawtooth',.04); setTimeout(()=>tone(83,.22,'square',.035),55); }
    };
  }

  function node() { return NODES[depth]; }
  function pad(n) { return String(n).padStart(2,'0'); }

  function renderNode({announce=true}={}) {
    const n = node();
    els.doorCount.textContent = `DOOR ${pad(depth+1)} / ${TOTAL_DOORS}`;
    els.wingLabel.textContent = n.wing;
    els.doorPlate.textContent = n.plate;
    els.clueText.textContent = n.clue;
    els.bloodMark.classList.toggle('show', n.clue.includes('血') || n.plate === 'S-27');
    els.door.style.transition = 'none';
    els.door.style.transform = '';
    els.door.style.opacity = '1';
    els.door.style.filter = '';
    resetPeek();
    locked = false;
    if (announce && n.line) showLine(n.line, depth === 0 ? 750 : 350);
    if (n.story) showStory(n.story[0], n.story[1], 650);
  }

  function showLine(text, delay=0, hold=2200) {
    clearTimeout(lineTimer);
    els.protagonistLine.classList.remove('show');
    els.protagonistLine.textContent = '';
    lineTimer = setTimeout(() => {
      els.protagonistLine.textContent = text;
      els.protagonistLine.classList.add('show');
      lineTimer = setTimeout(()=>els.protagonistLine.classList.remove('show'), hold);
    }, delay);
  }

  function showStory(kind, text, delay=0, hold=2600) {
    clearTimeout(storyTimer);
    storyTimer = setTimeout(() => {
      els.storyKind.textContent = kind;
      els.storyText.textContent = text;
      els.storyCard.hidden = false;
      storyTimer = setTimeout(()=>{ els.storyCard.hidden = true; }, hold);
    }, delay);
  }

  function resetPeek() {
    els.peekRoom.className = 'peek-room';
    els.peekSymbol.textContent = '';
    els.peekCaption.textContent = '';
  }

  function dominantDirection(x, y) {
    if (Math.abs(x) > Math.abs(y)) return x < 0 ? 'left' : 'right';
    return y < 0 ? 'up' : 'down';
  }

  function setPeek(dir, amount) {
    const data = node().previews[dir];
    if (!data) return;
    els.peekRoom.className = `peek-room ${data[0]}`;
    els.peekCaption.textContent = amount > 34 ? data[1] : '';
    els.peekSymbol.textContent = amount > 22 ? data[2] : '';
  }

  function doorTransform(x, y) {
    const cx = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, x));
    const cy = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, y));
    const horizontal = Math.abs(cx) >= Math.abs(cy);
    const rotateY = horizontal ? cx / 7.2 : cx / 20;
    const rotateX = horizontal ? -cy / 20 : -cy / 7.2;
    return `perspective(920px) translate(${cx*.16}px,${cy*.16}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
  }

  function pointerDown(e) {
    if (locked || !els.intro.hidden || !els.ending.hidden || !els.gameOver.hidden) return;
    dragging = true;
    startX = e.clientX; startY = e.clientY; dx = 0; dy = 0;
    els.door.setPointerCapture?.(e.pointerId);
    els.door.style.transition = 'none';
    audio.unlock();
  }

  function pointerMove(e) {
    if (!dragging) return;
    dx = e.clientX - startX; dy = e.clientY - startY;
    const amount = Math.hypot(dx,dy);
    if (!hasMoved && amount > 8) { hasMoved = true; els.gestureHint.classList.add('used'); }
    const dir = dominantDirection(dx,dy);
    if (amount > PEEK_THRESHOLD) setPeek(dir, amount);
    els.door.style.transform = doorTransform(dx,dy);
  }

  function pointerUp() {
    if (!dragging) return;
    dragging = false;
    const amount = Math.hypot(dx,dy);
    if (amount >= SWIPE_THRESHOLD) {
      commitDirection(dominantDirection(dx,dy));
    } else {
      els.door.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1)';
      els.door.style.transform = '';
      setTimeout(resetPeek, 220);
    }
  }

  function commitDirection(dir) {
    locked = true;
    audio.creak();
    const x = dir === 'left' ? -440 : dir === 'right' ? 440 : 0;
    const y = dir === 'up' ? -700 : dir === 'down' ? 700 : 0;
    const ry = dir === 'left' ? -72 : dir === 'right' ? 72 : 0;
    const rx = dir === 'up' ? 72 : dir === 'down' ? -72 : 0;
    els.door.style.transition = 'transform .42s cubic-bezier(.15,.8,.18,1), opacity .38s ease';
    els.door.style.transform = `perspective(900px) translate(${x}px,${y}px) rotateY(${ry}deg) rotateX(${rx}deg)`;
    els.door.style.opacity = '.18';
    setTimeout(() => resolveOutcome(dir, node().outcomes[dir]), 330);
  }

  function resolveOutcome(dir, outcome) {
    if (outcome === 'danger') return beginThreat(dir);
    if (outcome === 'dead') return deadEnd();
    if (outcome === 'final') return finishGame();
    if (outcome === 'advance') return advance();
  }

  function deadEnd() {
    flash();
    audio.slam();
    showStory('DEAD END','壁だ。ここではない。',20,950);
    setTimeout(() => {
      els.door.style.transition = 'none';
      els.door.style.transform = '';
      els.door.style.opacity = '1';
      resetPeek();
      locked = false;
    }, 820);
  }

  function advance() {
    audio.slam();
    flash();
    const prev = node();
    if (prev.revealLine) showStory('VOICE', prev.revealLine, 120, 3200);
    depth += 1;
    if (depth >= TOTAL_DOORS) return finishGame();
    setTimeout(() => renderNode(), 500);
  }

  function beginThreat(openDir) {
    threatState = { openDir, start: performance.now(), closeDir: OPPOSITE[openDir], down:false, sx:0, sy:0 };
    els.threat.hidden = false;
    els.threatHint.textContent = `${ICON[OPPOSITE[openDir]]} 逆方向へスワイプして閉めろ`;
    els.threatBar.style.transform = 'scaleX(1)';
    audio.sting();
    els.game.classList.remove('shake'); void els.game.offsetWidth; els.game.classList.add('shake');
    locked = true;
    const animate = (now) => {
      if (!threatState) return;
      const p = Math.max(0, 1 - (now - threatState.start)/THREAT_MS);
      els.threatBar.style.transform = `scaleX(${p})`;
      if (p <= 0) return threatFail();
      threatRAF = requestAnimationFrame(animate);
    };
    threatRAF = requestAnimationFrame(animate);
    clearTimeout(threatTimeout);
    threatTimeout = setTimeout(threatFail, THREAT_MS + 80);
  }

  function threatPointerDown(e) {
    if (!threatState) return;
    threatState.down = true; threatState.sx = e.clientX; threatState.sy = e.clientY;
  }

  function threatPointerUp(e) {
    if (!threatState || !threatState.down) return;
    const tx = e.clientX - threatState.sx, ty = e.clientY - threatState.sy;
    const amount = Math.hypot(tx,ty);
    threatState.down = false;
    if (amount > 64 && dominantDirection(tx,ty) === threatState.closeDir) threatSuccess();
  }

  function clearThreat() {
    clearTimeout(threatTimeout); cancelAnimationFrame(threatRAF); threatTimeout = null; threatRAF = null;
  }

  function threatSuccess() {
    if (!threatState) return;
    clearThreat();
    threatState = null;
    audio.slam();
    els.threat.hidden = true;
    showLine('「……近いな。」', 100, 1200);
    els.door.style.transition = 'none';
    els.door.style.opacity = '1';
    els.door.style.transform = '';
    resetPeek();
    locked = false;
  }

  function threatFail() {
    if (!threatState) return;
    clearThreat();
    threatState = null;
    els.threat.hidden = true;
    els.gameOverText.textContent = `DOOR ${pad(depth+1)} / ${TOTAL_DOORS}`;
    els.gameOver.hidden = false;
    locked = true;
  }

  function finishGame() {
    locked = true;
    audio.slam();
    flash();
    localStorage.setItem('fearDoorCleared','1');
    setTimeout(() => { els.ending.hidden = false; }, 720);
  }

  function flash() {
    els.flash.classList.remove('go'); void els.flash.offsetWidth; els.flash.classList.add('go');
  }

  function startGame() {
    audio.unlock();
    depth = 0; hasMoved = false; locked = false;
    els.gestureHint.classList.remove('used');
    els.intro.hidden = true; els.ending.hidden = true; els.gameOver.hidden = true; els.threat.hidden = true;
    renderNode({announce:false});
    showLine('「……まだ動いているのか。」', 450, 2300);
  }

  function retryDoor() {
    els.gameOver.hidden = true;
    locked = false;
    els.door.style.transition='none'; els.door.style.transform=''; els.door.style.opacity='1'; resetPeek();
    showLine('「もう一度だ。」', 200, 1000);
  }

  els.startBtn.addEventListener('click', startGame);
  els.restartBtn.addEventListener('click', startGame);
  els.retryBtn.addEventListener('click', retryDoor);
  els.door.addEventListener('pointerdown', pointerDown);
  els.door.addEventListener('pointermove', pointerMove);
  els.door.addEventListener('pointerup', pointerUp);
  els.door.addEventListener('pointercancel', pointerUp);
  els.door.addEventListener('keydown', (e) => {
    const map = {ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
    if (!locked && map[e.key]) { e.preventDefault(); setPeek(map[e.key],70); commitDirection(map[e.key]); }
  });
  els.threat.addEventListener('pointerdown', threatPointerDown);
  els.threat.addEventListener('pointerup', threatPointerUp);
  els.threat.addEventListener('pointercancel', () => { if (threatState) threatState.down=false; });
  document.addEventListener('touchmove', (e) => e.preventDefault(), {passive:false});
})();
