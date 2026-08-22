(() => {
  'use strict';

  const STORAGE_KEY = 'hitobito-hard-request-progress-v1';
  const EXPECTED_ORDER = ['fact', 'context', 'request', 'choice'];
  const SLOT_LABELS = ['事実', '事情', 'お願い', '選べる余地'];

  const DOMAIN_ITEMS = [
    { text: '何をお願いするか', domain: 'mine' },
    { text: 'どういう言葉で伝えるか', domain: 'mine' },
    { text: '相手が機嫌よく受け入れるか', domain: 'theirs' },
    { text: '相手が自分をどう評価するか', domain: 'theirs' },
  ];

  const KIND_FEEDBACK = {
    fact: 'まず、評価ではなく事実から。',
    context: '事情は短く。言い訳でお願いを埋めない。',
    request: 'お願いは、相手が判断できる具体さにする。',
    choice: '相手が選べる余地を残す。',
    blame: '相手を責めて通すより、自分のお願いを明確に。',
    overapology: '謝罪でお願いを埋めない。必要な相談を短く伝える。',
  };

  const SCENARIOS = [
    {
      label: '日程変更',
      situation: '自分の調整ミスで予定が重なった。相手に時間変更をお願いしないと解決しない。',
      requestTitle: '打ち合わせ時間の変更',
      parts: [
        ['s1-fact', 'fact', '27日の予定について相談があります。'],
        ['s1-context', 'context', '私の調整ミスで予定が重なってしまいました。'],
        ['s1-request', 'request', '可能であれば9:30〜10:30へ変更をお願いできますか。'],
        ['s1-choice', 'choice', '難しければ別の時間を相談させてください。'],
        ['s1-blame', 'blame', 'そちらも予定を調整できるはずなのでお願いします。'],
        ['s1-sorry', 'overapology', '本当に本当に申し訳なくて、無理なら全部こちらが悪いので……'],
      ],
      reaction: 'それ、かなり困るんですけど。もっと早く言ってほしかったです。',
      calmReply: 'そうですよね。急なお願いなので困ると思います。それでも変更できると助かります。難しいでしょうか。',
      finalResponse: '今回は難しいです。別の日なら調整できます。',
    },
    {
      label: '納期相談',
      situation: 'このままだと品質を落とす。取引先に納期を1日延ばせないか相談する必要がある。',
      requestTitle: '納期を1日延ばす相談',
      parts: [
        ['s2-fact', 'fact', '現在の進行状況についてご相談があります。'],
        ['s2-context', 'context', '現状のままでは確認工程が不足する見込みです。'],
        ['s2-request', 'request', '納期を1日延ばしていただくことは可能でしょうか。'],
        ['s2-choice', 'choice', '難しければ優先範囲を絞る案も相談したいです。'],
        ['s2-blame', 'blame', 'そもそも途中の確認が遅かったので、この納期は無理です。'],
        ['s2-sorry', 'overapology', 'こちらの力不足で本当に申し訳ないのですが、どうか何とか……'],
      ],
      reaction: '納期は最初に決めましたよね。今さら変えるのは困ります。',
      calmReply: 'おっしゃる通りです。その前提で、品質を落とさないために1日だけ相談したいです。難しければ優先範囲を一緒に決めたいです。',
      finalResponse: '1日は無理ですが、午前中までなら延ばせます。',
    },
    {
      label: 'やり直し依頼',
      situation: '同僚の成果物に重要な抜けがある。気まずいが、やり直しを頼まないと後工程で問題になる。',
      requestTitle: '成果物のやり直し',
      parts: [
        ['s3-fact', 'fact', '提出いただいた資料の3ページ目について相談があります。'],
        ['s3-context', 'context', '判断に必要な数値の根拠がまだ入っていません。'],
        ['s3-request', 'request', '根拠データを追加して、今日中に差し替えてもらえますか。'],
        ['s3-choice', 'choice', '難しければ、どこまでなら今日できるか教えてください。'],
        ['s3-blame', 'blame', '前にも言いましたよね。どうして毎回抜けるんですか。'],
        ['s3-sorry', 'overapology', '細かいことを言って本当に申し訳ないんですけど……'],
      ],
      reaction: 'そこまで必要ですか？ もうかなり時間をかけたんですが。',
      calmReply: '時間をかけてもらったのは分かっています。ただ、この根拠がないと次の判断ができないので、ここだけ追加をお願いします。',
      finalResponse: '分かりました。今日中は厳しいので、明日の朝一なら対応します。',
    },
    {
      label: '仕事量の調整',
      situation: '仕事を抱えすぎている。このまま全部受けると期限か品質が崩れるので、上司に優先順位の変更を頼む。',
      requestTitle: '優先順位の変更',
      parts: [
        ['s4-fact', 'fact', '今週の担当タスクについて相談があります。'],
        ['s4-context', 'context', 'A・B・Cを今週中に全部終えると、確認時間が取れない状態です。'],
        ['s4-request', 'request', 'Bを来週へ回して、今週はAとCを優先してよいでしょうか。'],
        ['s4-choice', 'choice', 'Bが最優先なら、代わりにどれを後ろへずらすか決めたいです。'],
        ['s4-blame', 'blame', 'こんな量を振られたら誰でも無理です。'],
        ['s4-sorry', 'overapology', '私がもっと頑張ればいい話かもしれませんが、すみません……'],
      ],
      reaction: 'みんな忙しいんだけど。これくらい何とかならない？',
      calmReply: '忙しいのは承知しています。その上で、全部を同じ優先度では終えられないので、A・B・Cの順番だけ決めたいです。',
      finalResponse: 'じゃあBを来週にしよう。AとCを優先してください。',
    },
    {
      label: '家族へのお願い',
      situation: '自分だけでは回らない。家族に今夜の家事を代わってもらいたいが、相手も疲れている。',
      requestTitle: '家事を代わってもらう',
      parts: [
        ['s5-fact', 'fact', '今夜の家事についてお願いがあります。'],
        ['s5-context', 'context', '今日は帰宅後も締切の作業が1時間ほど残っています。'],
        ['s5-request', 'request', '今夜だけ食器洗いを代わってもらえますか。'],
        ['s5-choice', 'choice', '難しければ、洗濯とどちらならできそうか相談したいです。'],
        ['s5-blame', 'blame', '私ばかりやってるんだから、今日はそっちがやって。'],
        ['s5-sorry', 'overapology', '疲れてるのに頼んでごめんね。本当にごめん。無理ならいいから……'],
      ],
      reaction: 'こっちだって疲れてるよ。なんで今日なの？',
      calmReply: '疲れているのは分かってる。今日は締切があるので、今夜だけお願いしたい。難しければ別の分担を決めよう。',
      finalResponse: '食器洗いならやるよ。洗濯はお願い。',
    },
    {
      label: '予定の変更',
      situation: '友人との約束を変更したい。がっかりされる可能性はあるが、無理して予定どおり行くのも難しい。',
      requestTitle: '約束の時間変更',
      parts: [
        ['s6-fact', 'fact', '明日の約束の時間について相談があります。'],
        ['s6-context', 'context', '午前の予定が延びる可能性が高くなりました。'],
        ['s6-request', 'request', '開始を15時から17時へ変更してもらえますか。'],
        ['s6-choice', 'choice', '難しければ別日に変えるのでも大丈夫です。'],
        ['s6-blame', 'blame', 'どうせいつも時間は余裕あるでしょ。17時でいいよね。'],
        ['s6-sorry', 'overapology', 'せっかく空けてくれたのに最悪だよね。本当にごめん、嫌われても仕方ない。'],
      ],
      reaction: 'えー、楽しみにしてたのに。正直ちょっと残念。',
      calmReply: '楽しみにしてくれてたのに変更になってごめん。残念に思うのはもっともだと思う。それでも17時へ変えられると助かる。',
      finalResponse: '17時なら大丈夫。次は早めに教えてね。',
    },
  ].map((scenario) => ({
    ...scenario,
    parts: scenario.parts.map(([id, kind, text]) => ({ id, kind, text })),
  }));

  const PRESETS = [
    {
      label: '日程変更',
      topic: '打ち合わせ時間について相談があります',
      fact: '私の調整ミスで予定が重なってしまいました',
      request: '可能であれば9:30〜10:30へ変更をお願いできますか',
      alternative: '難しければ別の時間を相談させてください',
    },
    {
      label: '納期相談',
      topic: '納期について相談があります',
      fact: '現状のままでは確認工程が不足する見込みです',
      request: '納期を1日延ばしていただくことは可能でしょうか',
      alternative: '難しければ優先範囲を絞る案を相談したいです',
    },
    {
      label: 'やり直し',
      topic: '提出物について相談があります',
      fact: '判断に必要な根拠データがまだ入っていません',
      request: '根拠データを追加して差し替えてもらえますか',
      alternative: '難しければ、いつまでなら対応できるか教えてください',
    },
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const state = {
    progress: readProgress(),
    scenarioIndex: 0,
    domainIndex: 0,
    buildOrder: [],
    mistakes: 0,
    reactionStep: 'preview',
  };

  function readProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return {
        sessions: Number.isFinite(parsed?.sessions) ? parsed.sessions : 0,
        best: Number.isFinite(parsed?.best) ? parsed.best : 0,
      };
    } catch {
      return { sessions: 0, best: 0 };
    }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress)); } catch { /* optional */ }
  }

  function buzz() {
    try { navigator.vibrate?.(12); } catch { /* optional */ }
  }

  function showView(name) {
    $$('.view').forEach((view) => view.classList.toggle('active', view.dataset.view === name));
    $('#restartBtn').classList.toggle('hidden', name !== 'training');
    if (name === 'home') renderHomeProgress();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function setStage(stageName) {
    const names = ['sort', 'build', 'reaction', 'result'];
    names.forEach((name, index) => {
      $(`#${name}Stage`).classList.toggle('hidden', name !== stageName);
      $('#stepRail').children[index].classList.toggle('active', index <= names.indexOf(stageName));
    });
  }

  function currentScenario() { return SCENARIOS[state.scenarioIndex]; }

  function startTraining(index = state.progress.sessions % SCENARIOS.length) {
    state.scenarioIndex = index % SCENARIOS.length;
    state.domainIndex = 0;
    state.buildOrder = [];
    state.mistakes = 0;
    state.reactionStep = 'preview';
    const scenario = currentScenario();
    $('#scenarioTitle').textContent = scenario.requestTitle;
    $('#scenarioSituation').textContent = scenario.situation;
    $('#domainFeedback').textContent = '';
    $('#buildFeedback').textContent = '';
    renderDomainPrompt();
    renderBuild();
    renderReaction();
    setStage('sort');
    showView('training');
  }

  function renderHomeProgress() {
    const el = $('#homeProgress');
    if (!state.progress.sessions) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    el.replaceChildren();
    const sessions = document.createElement('span');
    sessions.textContent = `練習 ${state.progress.sessions}回`;
    const best = document.createElement('span');
    best.textContent = `自己軸 BEST ${state.progress.best}/9`;
    el.append(sessions, best);
  }

  function renderDomainPrompt() {
    const item = DOMAIN_ITEMS[state.domainIndex];
    $('#domainPrompt').textContent = item.text;
    if (!$('#domainFeedback').textContent) {
      $('#domainFeedback').textContent = `${state.domainIndex + 1} / ${DOMAIN_ITEMS.length}`;
    }
  }

  function classifyDomain(choice) {
    const item = DOMAIN_ITEMS[state.domainIndex];
    if (choice !== item.domain) {
      state.mistakes += 1;
      $('#domainFeedback').textContent = choice === 'mine'
        ? 'そこまで背負わなくていい。相手の反応は相手の領域。'
        : 'これは自分で選べる。相手に渡さず、自分の領域に残す。';
      buzz();
      return;
    }

    $('#domainFeedback').textContent = item.domain === 'mine'
      ? '自分で選べる。ここに集中。'
      : '相手が決めること。背負わない。';
    buzz();

    setTimeout(() => {
      if (state.domainIndex === DOMAIN_ITEMS.length - 1) {
        setStage('build');
        $('#domainFeedback').textContent = '';
        renderBuild();
      } else {
        state.domainIndex += 1;
        $('#domainFeedback').textContent = '';
        renderDomainPrompt();
      }
    }, 240);
  }

  function selectedParts() {
    const scenario = currentScenario();
    return state.buildOrder
      .map((id) => scenario.parts.find((part) => part.id === id))
      .filter(Boolean);
  }

  function renderBuild() {
    const scenario = currentScenario();
    const slots = $('#buildSlots');
    const parts = selectedParts();
    slots.replaceChildren();

    EXPECTED_ORDER.forEach((kind, index) => {
      const slot = document.createElement('div');
      slot.className = `build-slot${parts[index] ? ' filled' : ''}`;
      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${SLOT_LABELS[index]}`;
      const text = document.createElement('p');
      text.textContent = parts[index]?.text || 'ここに入れる';
      slot.append(label, text);
      slots.append(slot);
    });

    const grid = $('#partGrid');
    grid.replaceChildren();
    scenario.parts
      .filter((part) => !state.buildOrder.includes(part.id))
      .forEach((part) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = part.text;
        button.addEventListener('click', () => choosePart(part));
        grid.append(button);
      });

    if (!$('#buildFeedback').textContent) {
      $('#buildFeedback').textContent = '責める・謝り倒すを捨てて、相手が判断できる形へ。';
    }
  }

  function choosePart(part) {
    const expected = EXPECTED_ORDER[state.buildOrder.length];
    if (part.kind !== expected) {
      state.mistakes += 1;
      $('#buildFeedback').textContent = KIND_FEEDBACK[part.kind] || '今はその順番ではない。';
      buzz();
      return;
    }

    state.buildOrder.push(part.id);
    $('#buildFeedback').textContent = KIND_FEEDBACK[part.kind];
    buzz();
    renderBuild();
    if (state.buildOrder.length === EXPECTED_ORDER.length) {
      setTimeout(() => {
        state.reactionStep = 'preview';
        renderReaction();
        setStage('reaction');
      }, 360);
    }
  }

  function assembledRequest() {
    const scenario = currentScenario();
    return EXPECTED_ORDER
      .map((kind) => scenario.parts.find((part) => part.kind === kind)?.text)
      .filter(Boolean)
      .join('\n');
  }

  function reactionCard(label, text) {
    const card = document.createElement('article');
    card.className = 'reaction-card';
    const small = document.createElement('span');
    small.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = `「${text}」`;
    card.append(small, strong);
    return card;
  }

  function renderReaction() {
    const scenario = currentScenario();
    const root = $('#reactionContent');
    root.replaceChildren();

    if (state.reactionStep === 'preview') {
      const preview = document.createElement('article');
      preview.className = 'request-preview';
      const label = document.createElement('span');
      label.textContent = 'あなたのお願い';
      const pre = document.createElement('pre');
      pre.textContent = assembledRequest();
      preview.append(label, pre);
      const button = makeButton('お願いする', 'primary', () => {
        state.reactionStep = 'reaction';
        buzz();
        renderReaction();
      });
      root.append(preview, button);
      return;
    }

    if (state.reactionStep === 'reaction') {
      root.append(reactionCard('相手', scenario.reaction));
      const h2 = document.createElement('h2');
      h2.textContent = 'この反応を、どこに置く？';
      const grid = document.createElement('div');
      grid.className = 'two-grid';
      grid.append(
        makeDomainButton('自分の領域', '自分の価値にする', 'mine'),
        makeDomainButton('相手の領域', '相手の反応として戻す', 'theirs'),
      );
      const feedback = document.createElement('div');
      feedback.id = 'reactionFeedback';
      feedback.className = 'feedback';
      feedback.textContent = '嫌な顔をされても、お願いしたこと自体が失敗になるわけではない。';
      root.append(h2, grid, feedback);
      return;
    }

    if (state.reactionStep === 'reply') {
      const axis = document.createElement('div');
      axis.className = 'axis-card';
      const axisLabel = document.createElement('span');
      axisLabel.textContent = '軸を戻した';
      const axisText = document.createElement('strong');
      axisText.textContent = '相手は嫌がっていい。こちらは必要なお願いを続ける。';
      axis.append(axisLabel, axisText);

      const reply = document.createElement('article');
      reply.className = 'reply-card';
      const label = document.createElement('span');
      label.textContent = '次の一言';
      const p = document.createElement('p');
      p.textContent = scenario.calmReply;
      reply.append(label, p);
      const button = makeButton('この言い方で返す', 'primary', () => {
        state.reactionStep = 'final';
        buzz();
        renderReaction();
      });
      root.append(axis, reply, button);
      return;
    }

    root.append(reactionCard('相手の最終回答', scenario.finalResponse));
    const helper = document.createElement('p');
    helper.className = 'helper';
    helper.textContent = 'YESでもNOでも、ここで採点するのは「相手を動かせたか」ではなく「自分の仕事をやれたか」。';
    const button = makeButton('結果を見る', 'primary', finishSession);
    root.append(helper, button);
  }

  function makeButton(text, className, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', handler);
    return button;
  }

  function makeDomainButton(label, strongText, domain) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    const small = document.createElement('span');
    small.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = strongText;
    button.append(small, strong);
    button.addEventListener('click', () => settleReaction(domain));
    return button;
  }

  function settleReaction(domain) {
    const feedback = $('#reactionFeedback');
    if (domain === 'mine') {
      state.mistakes += 1;
      feedback.textContent = '相手が困る・怒る・断ることは、あなたの価値ではない。相手の反応として戻す。';
      buzz();
      return;
    }
    feedback.textContent = '戻せた。相手は嫌がっていい。あなたは丁寧にお願いを続けられる。';
    buzz();
    setTimeout(() => {
      state.reactionStep = 'reply';
      renderReaction();
    }, 320);
  }

  function finishSession() {
    const score = Math.max(0, 9 - state.mistakes);
    state.progress = {
      sessions: state.progress.sessions + 1,
      best: Math.max(state.progress.best, score),
    };
    saveProgress();
    $('#scoreText').textContent = `${score}/9`;
    $('#bestLine').textContent = `練習 ${state.progress.sessions}回 / BEST ${state.progress.best}/9`;
    setStage('result');
    buzz();
  }

  function normalizeSentence(value) {
    const trimmed = value.trim().replace(/[。！？!?]+$/u, '');
    return trimmed ? `${trimmed}。` : '';
  }

  function buildFieldScript() {
    const lines = [
      $('#topicInput').value,
      $('#factInput').value,
      $('#requestInput').value,
      $('#alternativeInput').value,
    ].map(normalizeSentence).filter(Boolean);
    return lines.join('\n');
  }

  function renderFieldScript() {
    const script = buildFieldScript();
    $('#scriptPreview').textContent = script || '4行を埋めると、ここにお願い文ができます。';
    $('#copyBtn').disabled = !script;
    $('#copyBtn').textContent = 'コピー';
    $('#copyFeedback').textContent = '';
  }

  function renderPresets() {
    const row = $('#presetRow');
    row.replaceChildren();
    PRESETS.forEach((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = preset.label;
      button.addEventListener('click', () => {
        $('#topicInput').value = preset.topic;
        $('#factInput').value = preset.fact;
        $('#requestInput').value = preset.request;
        $('#alternativeInput').value = preset.alternative;
        renderFieldScript();
        buzz();
      });
      row.append(button);
    });
  }

  async function copyFieldScript() {
    const script = buildFieldScript();
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script);
      $('#copyBtn').textContent = 'コピー済み';
      $('#copyFeedback').textContent = 'お願い文をコピーしました。';
      buzz();
    } catch {
      $('#copyFeedback').textContent = 'コピーできませんでした。文章を長押しして選択してください。';
    }
  }

  $$('.choice[data-domain]').forEach((button) => {
    button.addEventListener('click', () => classifyDomain(button.dataset.domain));
  });

  $('#startBtn').addEventListener('click', () => startTraining());
  $('#fieldBtn').addEventListener('click', () => showView('field'));
  $('#fieldTrainBtn').addEventListener('click', () => startTraining());
  $('#fieldHomeBtn').addEventListener('click', () => showView('home'));
  $('#resultFieldBtn').addEventListener('click', () => showView('field'));
  $('#nextScenarioBtn').addEventListener('click', () => startTraining((state.scenarioIndex + 1) % SCENARIOS.length));
  $('#restartBtn').addEventListener('click', () => startTraining(state.scenarioIndex));
  $('#copyBtn').addEventListener('click', copyFieldScript);
  ['#topicInput', '#factInput', '#requestInput', '#alternativeInput'].forEach((selector) => {
    $(selector).addEventListener('input', renderFieldScript);
  });

  state.scenarioIndex = state.progress.sessions % SCENARIOS.length;
  renderPresets();
  renderFieldScript();
  renderHomeProgress();
})();
