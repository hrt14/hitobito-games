(() => {
  'use strict';

  const BOOK_URL = '/books/shigoto-baisoku-kyokasho/book.json';
  const MANIFEST_URL = '/generated-audio/manifest.json';
  const KEY = 'hitobito-audio-progress-v2';
  const audio = new Audio();
  audio.preload = 'metadata';

  const state = {
    book: null,
    manifest: null,
    chapter: 0,
    time: 0,
    playing: false,
    rate: 1,
    voiceKey: 'achernar',
    sleepTimer: null,
    pendingSeek: 0,
    fallback: false,
    fallbackVoice: null,
    fallbackSegment: 0,
    fallbackSegments: [],
    lastSaveAt: 0,
  };

  const $ = (id) => document.getElementById(id);

  function showView(name) {
    $('home').classList.toggle('active', name === 'home');
    $('playerView').classList.toggle('active', name === 'player');
    location.hash = name === 'player' ? 'listen' : 'home';
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const whole = Math.floor(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  }

  function chunkText(text, max = 115) {
    const raw = String(text || '').replace(/\r/g, '').split(/(?<=[。！？!?])|\n+/).map(s => s.trim()).filter(Boolean);
    const out = [];
    for (const piece of raw) {
      if (piece.length <= max) { out.push(piece); continue; }
      const parts = piece.split(/(?<=[、，,])/).filter(Boolean);
      let buf = '';
      for (const part of parts) {
        if ((buf + part).length > max && buf) { out.push(buf); buf = ''; }
        if (part.length > max) {
          for (let i = 0; i < part.length; i += max) out.push(part.slice(i, i + max));
        } else {
          buf += part;
        }
      }
      if (buf) out.push(buf);
    }
    return out;
  }

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (Number.isInteger(saved.chapter)) state.chapter = Math.min(Math.max(saved.chapter, 0), 16);
      if (Number.isFinite(saved.time)) state.time = Math.max(0, Number(saved.time));
      if (saved.rate) state.rate = Number(saved.rate) || 1;
      if (typeof saved.voiceKey === 'string') state.voiceKey = saved.voiceKey;
    } catch (_e) {}
    $('rateSelect').value = String(state.rate);
  }

  function saveProgress(force = false) {
    const now = Date.now();
    if (!force && now - state.lastSaveAt < 1000) return;
    state.lastSaveAt = now;
    const currentTime = state.fallback ? state.time : (Number.isFinite(audio.currentTime) ? audio.currentTime : state.time);
    localStorage.setItem(KEY, JSON.stringify({
      chapter: state.chapter,
      time: currentTime,
      rate: state.rate,
      voiceKey: state.voiceKey,
      updatedAt: now,
    }));
  }

  function renderChapters() {
    const root = $('chapterList');
    root.innerHTML = '';
    state.book.chapters.forEach((chapter, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chapter' + (i === state.chapter ? ' active' : '');
      btn.innerHTML = `<span class="chapter-no">${String(i + 1).padStart(2, '0')}</span><span class="chapter-title"></span><span class="chapter-play">▶</span>`;
      btn.querySelector('.chapter-title').textContent = chapter.title;
      btn.addEventListener('click', () => setChapter(i, 0, true, true));
      root.appendChild(btn);
    });
  }

  function renderTranscript() {
    const chapter = state.book.chapters[state.chapter];
    const root = $('transcript');
    root.innerHTML = '';
    const h = document.createElement('h3');
    h.textContent = chapter.title;
    root.appendChild(h);
    chapter.text.split(/\n+/).filter(Boolean).forEach(p => {
      const el = document.createElement('p');
      el.textContent = p;
      root.appendChild(el);
    });
  }

  function getChapterAudioPath() {
    const chapter = state.book.chapters[state.chapter];
    return state.manifest?.chapters?.[chapter.id]?.[state.voiceKey] || null;
  }

  function updateUI() {
    if (!state.book) return;
    const ch = state.book.chapters[state.chapter];
    $('chapterName').textContent = ch.title;

    let chapterRatio = 0;
    if (state.fallback && state.fallbackSegments.length) {
      chapterRatio = state.fallbackSegment / state.fallbackSegments.length;
      $('segmentText').textContent = `端末音声 ${state.fallbackSegment + 1} / ${state.fallbackSegments.length}`;
    } else if (Number.isFinite(audio.duration) && audio.duration > 0) {
      chapterRatio = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
      $('segmentText').textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    } else {
      $('segmentText').textContent = 'HD音声を準備中';
    }

    const overall = (state.chapter + chapterRatio) / state.book.chapters.length;
    const pct = Math.round(overall * 100);
    $('progressBar').style.width = pct + '%';
    $('progressText').textContent = pct + '%';
    $('playPause').textContent = state.playing ? 'Ⅱ' : '▶';
    document.querySelectorAll('.chapter').forEach((el, i) => el.classList.toggle('active', i === state.chapter));
    saveProgress();
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function chooseFallbackVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const ja = voices.filter(v => /^ja([-_]|$)/i.test(v.lang));
    state.fallbackVoice = ja.find(v => /premium|enhanced|kyoko|otoya|nanami/i.test(v.name)) || ja[0] || null;
    return state.fallbackVoice;
  }

  function speakFallbackCurrent() {
    if (!state.playing || !state.fallback) return;
    if (!state.fallbackSegments.length) return nextChapter(true);
    const utterance = new SpeechSynthesisUtterance(state.fallbackSegments[state.fallbackSegment]);
    utterance.lang = 'ja-JP';
    utterance.rate = state.rate;
    if (chooseFallbackVoice()) utterance.voice = state.fallbackVoice;
    utterance.onend = () => {
      if (!state.playing || !state.fallback) return;
      if (state.fallbackSegment < state.fallbackSegments.length - 1) {
        state.fallbackSegment++;
        updateUI();
        speakFallbackCurrent();
      } else {
        nextChapter(true);
      }
    };
    utterance.onerror = (event) => {
      if (!['canceled', 'interrupted'].includes(event.error)) {
        state.playing = false;
        updateUI();
        $('segmentText').textContent = '再生できません';
      }
    };
    stopSpeech();
    window.speechSynthesis.speak(utterance);
    updateUI();
  }

  function startFallback(autoplay = true) {
    audio.pause();
    state.fallback = true;
    state.fallbackSegment = 0;
    state.fallbackSegments = chunkText(state.book.chapters[state.chapter].text);
    if (!('speechSynthesis' in window)) {
      state.playing = false;
      $('segmentText').textContent = '音声を読み込めません';
      updateUI();
      return;
    }
    state.playing = autoplay;
    updateUI();
    if (autoplay) speakFallbackCurrent();
  }

  function prepareAudio(resumeTime = 0, autoplay = false) {
    stopSpeech();
    state.fallback = false;
    state.pendingSeek = Math.max(0, Number(resumeTime) || 0);
    const src = getChapterAudioPath();
    if (!src) {
      startFallback(autoplay);
      return;
    }

    audio.pause();
    audio.src = `${src}?v=${encodeURIComponent(state.manifest?.generatedAt || '1')}`;
    audio.playbackRate = state.rate;
    audio.load();

    if (autoplay) {
      state.playing = true;
      updateUI();
      const promise = audio.play();
      if (promise?.catch) promise.catch(() => startFallback(true));
    } else {
      state.playing = false;
      updateUI();
    }
  }

  function setChapter(index, time = 0, rerender = true, autoplay = false) {
    stop(false);
    state.chapter = Math.min(Math.max(index, 0), state.book.chapters.length - 1);
    state.time = Math.max(0, time);
    state.fallbackSegment = 0;
    if (rerender) {
      renderTranscript();
      renderChapters();
    }
    prepareAudio(state.time, autoplay);
    updateUI();
  }

  function play() {
    if (state.fallback) {
      state.playing = true;
      speakFallbackCurrent();
      return;
    }
    if (!getChapterAudioPath()) {
      startFallback(true);
      return;
    }
    audio.playbackRate = state.rate;
    state.playing = true;
    updateUI();
    const promise = audio.play();
    if (promise?.catch) promise.catch(() => startFallback(true));
  }

  function stop(resetLabel = false) {
    audio.pause();
    stopSpeech();
    state.playing = false;
    if (!state.fallback && Number.isFinite(audio.currentTime)) state.time = audio.currentTime;
    saveProgress(true);
    updateUI();
    if (resetLabel) $('segmentText').textContent = '読了';
  }

  function togglePlay() {
    state.playing ? stop(false) : play();
  }

  function prev() {
    if (state.fallback) {
      stopSpeech();
      state.fallbackSegment = Math.max(0, state.fallbackSegment - 1);
      state.playing = true;
      speakFallbackCurrent();
      return;
    }
    audio.currentTime = Math.max(0, (audio.currentTime || 0) - 15);
    state.time = audio.currentTime;
    updateUI();
  }

  function next() {
    if (state.fallback) {
      stopSpeech();
      if (state.fallbackSegment < state.fallbackSegments.length - 1) {
        state.fallbackSegment++;
        state.playing = true;
        speakFallbackCurrent();
      } else {
        nextChapter(true);
      }
      return;
    }
    if (Number.isFinite(audio.duration) && audio.currentTime + 15 >= audio.duration) {
      nextChapter(state.playing);
      return;
    }
    audio.currentTime = Math.min(Number.isFinite(audio.duration) ? audio.duration : Infinity, (audio.currentTime || 0) + 15);
    state.time = audio.currentTime;
    updateUI();
  }

  function nextChapter(autoplay = true) {
    if (state.chapter < state.book.chapters.length - 1) setChapter(state.chapter + 1, 0, true, autoplay);
    else stop(true);
  }

  function setSleep(minutes) {
    if (state.sleepTimer) clearTimeout(state.sleepTimer);
    state.sleepTimer = null;
    if (minutes > 0) {
      state.sleepTimer = setTimeout(() => {
        stop(false);
        $('segmentText').textContent = 'スリープ停止';
        $('sleepSelect').value = '0';
      }, minutes * 60 * 1000);
    }
  }

  function populateVoiceSelect() {
    const select = $('voiceSelect');
    select.innerHTML = '';
    const voices = state.manifest?.voices || [];
    if (!voices.length) {
      const option = document.createElement('option');
      option.value = 'device';
      option.textContent = '端末の日本語音声';
      select.appendChild(option);
      state.voiceKey = 'device';
      return;
    }
    if (!voices.some(v => v.key === state.voiceKey)) state.voiceKey = voices[0].key;
    for (const voice of voices) {
      const option = document.createElement('option');
      option.value = voice.key;
      option.textContent = voice.label;
      select.appendChild(option);
    }
    select.value = state.voiceKey;
  }

  function setupAudioEvents() {
    audio.addEventListener('loadedmetadata', () => {
      if (state.pendingSeek > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(state.pendingSeek, Math.max(0, audio.duration - 0.25));
      }
      state.pendingSeek = 0;
      updateUI();
    });
    audio.addEventListener('timeupdate', () => {
      if (!state.fallback) {
        state.time = audio.currentTime || 0;
        updateUI();
      }
    });
    audio.addEventListener('play', () => {
      state.fallback = false;
      state.playing = true;
      updateUI();
    });
    audio.addEventListener('pause', () => {
      if (!state.fallback && !audio.ended) {
        state.playing = false;
        updateUI();
      }
    });
    audio.addEventListener('ended', () => nextChapter(true));
    audio.addEventListener('error', () => {
      if (audio.src && !state.fallback) startFallback(state.playing);
    });
  }

  async function init() {
    const bookRes = await fetch(BOOK_URL, { cache: 'no-store' });
    if (!bookRes.ok) throw new Error('book load failed');
    state.book = await bookRes.json();

    try {
      const manifestRes = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (manifestRes.ok) state.manifest = await manifestRes.json();
    } catch (_e) {}

    loadProgress();
    populateVoiceSelect();
    setupAudioEvents();
    renderChapters();
    renderTranscript();
    prepareAudio(state.time, false);
    updateUI();

    window.speechSynthesis?.addEventListener?.('voiceschanged', chooseFallbackVoice);

    $('openBook').addEventListener('click', () => showView('player'));
    $('backHome').addEventListener('click', () => { stop(false); showView('home'); });
    $('playPause').addEventListener('click', togglePlay);
    $('prevSegment').addEventListener('click', prev);
    $('nextSegment').addEventListener('click', next);
    $('rateSelect').addEventListener('change', (event) => {
      state.rate = Number(event.target.value) || 1;
      audio.playbackRate = state.rate;
      saveProgress(true);
      if (state.fallback && state.playing) speakFallbackCurrent();
    });
    $('voiceSelect').addEventListener('change', (event) => {
      const wasPlaying = state.playing;
      const resumeTime = state.fallback ? 0 : (audio.currentTime || state.time || 0);
      state.voiceKey = event.target.value;
      state.time = resumeTime;
      saveProgress(true);
      prepareAudio(resumeTime, wasPlaying);
    });
    $('sleepSelect').addEventListener('change', (event) => setSleep(Number(event.target.value) || 0));

    if (location.hash === '#listen') showView('player');
  }

  init().catch(() => {
    document.body.insertAdjacentHTML('beforeend', '<div style="padding:20px;color:#ff9c7a">書籍データを読み込めませんでした。</div>');
  });

  addEventListener('beforeunload', () => stop(false));
})();
