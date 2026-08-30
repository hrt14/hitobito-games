(() => {
  'use strict';
  const STORAGE_KEY = 'levelup-bedtime-best-case-v1';
  const CUTS = [
    {
      label: '始まり', kicker: 'CUT 1 · OPENING',
      question: '全部うまくいく日の最初の1秒。<br>どこにいて、何が見える？',
      help: '説明ではなく、頭の中で1枚絵にできるくらい短く。',
      placeholder: '例：朝、カーテン越しの光。落ち着いて起きている。'
    },
    {
      label: '最高の瞬間', kicker: 'CUT 2 · PEAK',
      question: '何が起きたら、<br>「全部うまくいった」と確信する？',
      help: '結果の説明ではなく、「その瞬間に見えること」を置く。',
      placeholder: '例：相手が笑ってうなずく。机の上に合意した資料がある。'
    },
    {
      label: '安心の余韻', kicker: 'CUT 3 · AFTERGLOW',
      question: '全部終わったあと。<br>どこで、どんな安心を感じている？',
      help: '興奮ではなく「もう大丈夫」の場面で映画を終える。',
      placeholder: '例：帰り道。肩の力が抜けて、静かに「よかった」と思う。'
    }
  ];
  const SUGGESTIONS = {
    '明日': [
      ['朝、自然に目が覚めている', '予定どおりに一つずつ進んでいる', '夜「いい一日だった」と座っている'],
      ['カーテンの光と静かな部屋', 'やることが片付き時計を見る', '布団に入り肩の力が抜ける']
    ],
    '仕事': [
      ['落ち着いて席につく', '相手がうなずき話が決まる', '会議後に廊下をゆっくり歩く'],
      ['資料を開いて深く息をする', '「それで進めましょう」と聞く', 'PCを閉じて静かに満足している']
    ],
    '人間関係': [
      ['相手と自然に目が合う', 'お互いに笑って本音を話している', '帰宅後、胸のつかえがない'],
      ['穏やかに挨拶している', '伝えたかったことが伝わる', '一人になって安心して息を吐く']
    ],
    'お金': [
      ['数字を落ち着いて確認している', '望んだ成果が数字として見える', '支払いを終えて余裕を感じる'],
      ['机で計画を開いている', '必要な売上・収入が入っている', '「これなら大丈夫」と画面を閉じる']
    ],
    'やりたいこと': [
      ['始める場所に立っている', '完成したものを目の前で見ている', '終えたあと静かに眺めている'],
      ['最初の一手を迷わず始める', '「できた」と分かる瞬間が来る', '帰り道に少し笑っている']
    ],
    '人生全体': [
      ['好きな場所で一日が始まる', '大切な人・仕事・時間が自然につながる', '夜、今日の暮らしに安心している'],
      ['朝の部屋に好きなものがある', '望んだ生活を普通の日として過ごす', '明日もこの感じでいいと思う']
    ]
  };

  const state = {
    theme: '', custom: '', cutIndex: 0, cuts: ['', '', ''], quotes: ['', '', ''],
    detail: null, playbackIndex: 0, selectedDetailType: '', fromSaved: false
  };

  const $ = (id) => document.getElementById(id);
  const screens = ['startScreen', 'buildScreen', 'storyboardScreen', 'playbackScreen', 'lightsoutScreen', 'blackoutScreen'];
  const els = Object.fromEntries(screens.map((id) => [id, $(id)]));

  function safeParse(value) {
    try { return JSON.parse(value); } catch { return null; }
  }
  function loadSaved() {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.cuts) || saved.cuts.length !== 3 || saved.cuts.some((x) => typeof x !== 'string' || !x.trim())) return null;
    return saved;
  }
  function saveStory() {
    const payload = {
      version: 1,
      theme: state.theme,
      custom: state.custom,
      cuts: state.cuts.slice(),
      quotes: state.quotes.slice(),
      detail: state.detail,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    refreshSavedCard();
  }
  function showScreen(id) {
    screens.forEach((screenId) => els[screenId].classList.toggle('active', screenId === id));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function text(value, max = 120) { return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max); }
  function chosenLabel() { return state.custom || state.theme || '今夜のテーマ'; }
  function resetState() {
    state.theme = ''; state.custom = ''; state.cutIndex = 0; state.cuts = ['', '', '']; state.quotes = ['', '', ''];
    state.detail = null; state.playbackIndex = 0; state.selectedDetailType = ''; state.fromSaved = false;
    $('customTheme').value = '';
    document.querySelectorAll('.theme-choice').forEach((b) => b.classList.remove('selected'));
  }
  function startNew(theme, custom = '') {
    resetState();
    state.theme = theme || 'やりたいこと';
    state.custom = text(custom, 46);
    state.cutIndex = 0;
    renderBuild();
    showScreen('buildScreen');
  }
  function refreshSavedCard() {
    const saved = loadSaved();
    $('savedCard').hidden = !saved;
    if (!saved) return;
    $('savedTheme').textContent = saved.custom || saved.theme || '昨夜の3シーン';
    $('savedPreview').textContent = saved.cuts.join(' → ');
  }
  function hydrateFromSaved(saved) {
    if (!saved) return false;
    state.theme = text(saved.theme, 46);
    state.custom = text(saved.custom, 46);
    state.cuts = saved.cuts.map((x) => text(x, 120));
    state.quotes = Array.isArray(saved.quotes) ? [0,1,2].map((i) => text(saved.quotes[i], 60)) : ['', '', ''];
    state.detail = saved.detail && typeof saved.detail === 'object' ? { type: text(saved.detail.type, 12), value: text(saved.detail.value, 80) } : null;
    state.fromSaved = true;
    return true;
  }

  function suggestionsFor(index) {
    const base = SUGGESTIONS[state.theme] || SUGGESTIONS['やりたいこと'];
    const first = base[0][index];
    const second = base[1][index];
    const specific = state.custom && index === 1 ? `${state.custom}が、望んだ形で進んでいる` : '';
    return [specific, first, second].filter(Boolean).slice(0, 3);
  }
  function renderBuild() {
    const i = state.cutIndex;
    const cut = CUTS[i];
    $('cutCounter').textContent = `CUT ${i + 1} / 3`;
    $('progressBar').style.width = `${((i + 1) / 3) * 100}%`;
    $('buildTheme').textContent = chosenLabel();
    $('cutKicker').textContent = cut.kicker;
    $('cutQuestion').innerHTML = cut.question;
    $('cutHelp').textContent = cut.help;
    $('sceneInput').placeholder = cut.placeholder;
    $('sceneInput').value = state.cuts[i] || '';
    $('quoteInput').value = state.quotes[i] || '';
    $('quoteWrap').hidden = i !== 1;
    $('buildValidation').textContent = '';
    const sug = $('suggestions');
    sug.innerHTML = '';
    suggestionsFor(i).forEach((label) => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'suggestion'; btn.textContent = label;
      btn.addEventListener('click', () => { $('sceneInput').value = label; $('sceneInput').focus(); });
      sug.appendChild(btn);
    });
    for (let n = 0; n < 3; n += 1) {
      const frame = document.querySelector(`.film-frame[data-index="${n}"]`);
      frame.classList.toggle('current', n === i);
      frame.classList.toggle('filled', Boolean(state.cuts[n]));
      $(`frame${n}`).textContent = state.cuts[n] || 'まだ空白';
    }
    $('buildBackBtn').textContent = i === 0 ? '← テーマ選択へ戻る' : '← ひとつ戻る';
  }
  function commitCurrentCut() {
    const value = text($('sceneInput').value, 120);
    if (!value) {
      $('buildValidation').textContent = '1枚の映像になる言葉を、ひとつだけ入れてください。';
      $('sceneInput').focus();
      return;
    }
    state.cuts[state.cutIndex] = value;
    state.quotes[state.cutIndex] = state.cutIndex === 1 ? text($('quoteInput').value, 60) : '';
    if (state.cutIndex < 2) {
      state.cutIndex += 1;
      renderBuild();
      $('sceneInput').focus();
    } else {
      renderStoryboard();
      saveStory();
      showScreen('storyboardScreen');
    }
  }

  function renderStoryboard() {
    const labels = ['START · 始まり', 'PEAK · 最高の瞬間', 'CALM · 安心の余韻'];
    $('storyboard').innerHTML = '';
    state.cuts.forEach((cut, i) => {
      const card = document.createElement('article');
      card.className = 'story-card';
      const quote = state.quotes[i] ? `<em>${escapeHtml(state.quotes[i])}</em>` : '';
      card.innerHTML = `<span class="num">0${i + 1}</span><small>${labels[i]}</small><strong>${escapeHtml(cut)}</strong>${quote}`;
      $('storyboard').appendChild(card);
    });
    if (state.detail?.value) {
      const card = document.createElement('article');
      card.className = 'story-card';
      card.innerHTML = `<span class="num">+</span><small>ONE DETAIL</small><strong>${escapeHtml(detailPrefix(state.detail.type))}${escapeHtml(state.detail.value)}</strong>`;
      $('storyboard').appendChild(card);
    }
    $('detailEditor').hidden = true;
    $('detailInput').value = '';
    $('detailValidation').textContent = '';
    document.querySelectorAll('.detail-choice').forEach((b) => b.classList.toggle('selected', b.dataset.detail === state.selectedDetailType));
  }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
  }
  function detailPrefix(type) {
    return type === 'visual' ? '見える：' : type === 'sound' ? '聞こえる：' : type === 'body' ? '体：' : '';
  }
  function chooseDetail(type) {
    state.selectedDetailType = type;
    document.querySelectorAll('.detail-choice').forEach((b) => b.classList.toggle('selected', b.dataset.detail === type));
    const map = {
      visual: ['何が見える？', '例：窓の外が明るい / 相手の笑顔 / 完成した画面'],
      sound: ['何が聞こえる？', '例：「いいね」「決まりです」 / 静かな部屋'],
      body: ['体はどんな感じ？', '例：肩が軽い / 胸がひらく / 深く息ができる']
    };
    $('detailLabel').textContent = map[type][0];
    $('detailInput').placeholder = map[type][1];
    $('detailEditor').hidden = false;
    $('detailInput').focus();
  }
  function saveDetail() {
    const value = text($('detailInput').value, 80);
    if (!state.selectedDetailType || !value) {
      $('detailValidation').textContent = 'ひとつだけ、短く入れてください。';
      return;
    }
    state.detail = { type: state.selectedDetailType, value };
    saveStory();
    renderStoryboard();
  }

  function renderPlayback() {
    const i = state.playbackIndex;
    const labels = ['CUT 1 · 始まり', 'CUT 2 · 最高の瞬間', 'CUT 3 · 安心の余韻'];
    $('playbackProgress').textContent = `${i + 1} / 3`;
    $('playbackKicker').textContent = labels[i];
    $('playbackText').textContent = state.cuts[i];
    $('playbackQuote').textContent = state.quotes[i] || '';
    $('playbackQuote').hidden = !state.quotes[i];
    const detailVisible = i === 2 && state.detail?.value;
    $('playbackDetail').hidden = !detailVisible;
    if (detailVisible) $('playbackDetail').textContent = `${detailPrefix(state.detail.type)}${state.detail.value}`;
    document.querySelectorAll('#playbackDots i').forEach((dot, n) => dot.classList.toggle('on', n === i));
    $('playbackNextBtn').innerHTML = i === 2 ? '3シーンを覚えた <b>→</b>' : '次のシーン <b>→</b>';
  }
  function startPlayback() {
    state.playbackIndex = 0;
    renderPlayback();
    showScreen('playbackScreen');
  }
  function renderLightsout() {
    $('memoryCuts').innerHTML = '';
    const names = ['始まり', '最高', '安心'];
    state.cuts.forEach((cut, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<b>${names[i]}</b><span>${escapeHtml(cut)}</span>`;
      $('memoryCuts').appendChild(li);
    });
  }

  document.querySelectorAll('.theme-choice').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.theme-choice').forEach((b) => b.classList.remove('selected'));
      button.classList.add('selected');
      state.theme = button.dataset.theme || '';
      $('startValidation').textContent = '';
      startNew(state.theme, text($('customTheme').value, 46));
    });
  });
  $('customStartBtn').addEventListener('click', () => {
    const custom = text($('customTheme').value, 46);
    const selected = document.querySelector('.theme-choice.selected')?.dataset.theme || '';
    if (!custom && !selected) {
      $('startValidation').textContent = '上のテーマを1つ選ぶか、具体的な内容を一言入れてください。';
      return;
    }
    startNew(selected || 'やりたいこと', custom);
  });
  $('customTheme').addEventListener('input', () => { $('startValidation').textContent = ''; });
  $('addCutBtn').addEventListener('click', commitCurrentCut);
  $('buildBackBtn').addEventListener('click', () => {
    if (state.cutIndex > 0) { state.cutIndex -= 1; renderBuild(); }
    else { refreshSavedCard(); showScreen('startScreen'); }
  });
  document.querySelectorAll('.film-frame').forEach((frame) => {
    frame.addEventListener('click', () => {
      const target = Number(frame.dataset.index);
      if (target <= state.cutIndex || state.cuts[target]) { state.cutIndex = target; renderBuild(); }
    });
  });
  document.querySelectorAll('.detail-choice').forEach((b) => b.addEventListener('click', () => chooseDetail(b.dataset.detail)));
  $('saveDetailBtn').addEventListener('click', saveDetail);
  $('prepareBtn').addEventListener('click', startPlayback);
  $('editCutsBtn').addEventListener('click', () => { state.cutIndex = 0; renderBuild(); showScreen('buildScreen'); });
  $('playbackBackBtn').addEventListener('click', () => {
    if (state.playbackIndex > 0) { state.playbackIndex -= 1; renderPlayback(); }
    else { renderStoryboard(); showScreen('storyboardScreen'); }
  });
  $('playbackNextBtn').addEventListener('click', () => {
    if (state.playbackIndex < 2) { state.playbackIndex += 1; renderPlayback(); }
    else { renderLightsout(); showScreen('lightsoutScreen'); }
  });
  $('screenDownBtn').addEventListener('click', () => showScreen('blackoutScreen'));
  $('blackoutReturnBtn').addEventListener('click', () => { renderLightsout(); showScreen('lightsoutScreen'); });
  $('lightsoutBackBtn').addEventListener('click', startPlayback);
  $('replayBtn').addEventListener('click', () => {
    const saved = loadSaved();
    if (hydrateFromSaved(saved)) startPlayback();
  });
  $('sharpenSavedBtn').addEventListener('click', () => {
    const saved = loadSaved();
    if (hydrateFromSaved(saved)) { renderStoryboard(); showScreen('storyboardScreen'); }
  });

  refreshSavedCard();
})();
