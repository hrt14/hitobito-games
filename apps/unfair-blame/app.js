(() => {
  'use strict';

  const STORAGE_KEY = 'hitobito-unfair-blame-progress-v2';
  const SLUG = 'unfair-blame';

  const scenarios = [
    {
      label: '職場 / ファイル削除',
      scene: '共有ファイルが消えた。上司から、あなたが削除した前提で責められた。削除者はまだログで特定されていない。',
      accusation: '「あなたが消したんだろう。言い訳はいい」',
      restriction: '調査が終わるまで、共有ファイルの更新権限を外すと言われた。',
      cards: [
        ['ファイルは17:42に削除されている','fact','時刻は確認できる。犯人の特定とは別。'],
        ['あなたが削除したに違いない','assumption','証拠が出るまでは断定ではなく推測。'],
        ['削除者はまだログで確認できていない','fact','「未特定」も重要な事実。'],
        ['調査終了まで更新権限を外す','restriction','犯人認定と、暫定的な権限制限は分けて扱える。'],
        ['前にも何かやっていそうだ','assumption','過去の印象は、今回の証拠にはならない。']
      ],
      control: [
        ['自分が確認している事実を短く言う',true,'事実の提示は自分で選べる。'],
        ['相手を今すぐ謝らせる',false,'謝るかどうかは相手の領域。'],
        ['権限制限の理由と解除条件を聞く',true,'制限の条件確認はできる。'],
        ['ログを第三者と一緒に確認する提案をする',true,'検証方法を提案できる。'],
        ['相手が自分を疑わなくなる',false,'相手の内心は操作できない。'],
        ['断定と暫定措置を分けて扱うよう求める',true,'論点を分けることはできる。']
      ],
      reply: [
        ['条件確認','権限制限の理由と、解除条件を確認させてください。',3],
        ['事実','現時点では削除者は特定されていません。',1],
        ['次の一手','必要なら、ログを第三者と一緒に確認します。',4],
        ['境界','私が削除した前提で扱うことには同意できません。',2]
      ],
      pressure: '「だから言い訳はいいって。とにかく触らないで」',
      steady: '触らないことは承知しました。ただし、私が削除したという断定とは分けてください。解除条件と確認担当だけ決めたいです。'
    },
    {
      label: '家族 / 外出を止められる',
      scene: '返信が遅れたことを「何か隠している証拠」と決めつけられ、説明を聞かれないまま責められている。',
      accusation: '「返信しないのは、やましいことがあるからでしょ」',
      restriction: '「今週は外出しないで」と一方的に言われた。',
      cards: [
        ['返信が3時間空いた','fact','返信間隔は確認できる事実。'],
        ['隠し事があるから返信しなかった','assumption','理由の断定は、返信間隔だけからは決まらない。'],
        ['その時間は会議中だった','fact','自分が確認できる事情は事実として出せる。'],
        ['今週は外出しないでと言われた','restriction','相手の不安と、あなたの行動制限は別の論点。'],
        ['返信が遅い人は信用できない','assumption','評価は事実ではない。']
      ],
      control: [
        ['返信が遅れた理由を説明する',true,'自分の事情は自分で説明できる。'],
        ['相手の不安を完全になくす',false,'不安をどう感じるかは相手の領域。'],
        ['同意していない制限はその場で保留する',true,'同意するかどうかは自分で判断できる。'],
        ['話が成立しないなら第三者を交える',true,'一対一を続けない選択肢もある。'],
        ['相手に自分を信じさせる',false,'信じるかどうかは相手が決める。'],
        ['危険を感じたらその場を離れる',true,'安全を優先する選択権は手放さない。']
      ],
      reply: [
        ['次の一手','落ち着いて話せないなら、いったん距離を置いてから話します。',4],
        ['境界','返信の遅さだけで隠し事と決めつけることには同意できません。',2],
        ['事実','返信が遅れた時間は会議中でした。',1],
        ['条件確認','外出を止める必要があると考える理由は、別に聞かせてください。',3]
      ],
      pressure: '「本当に何もないなら、外出しなくても困らないでしょ」',
      steady: '疑われていることと、外出を制限することは別です。疑いについては話しますが、同意していない制限まで受け入れるとは言っていません。'
    },
    {
      label: '仕事 / 納期遅れの責任',
      scene: '複数工程で遅れた案件について、会議で「あなたの確認が遅かったせい」と一本化され、発言まで止められた。',
      accusation: '「今回遅れたのは、あなたの確認が遅かったから」',
      restriction: '「今後この案件では勝手に提案しないで」と言われた。',
      cards: [
        ['自分の確認は予定より1日遅れた','fact','自分に不利な事実も切り分けて持つ。'],
        ['案件全体の遅れは全部あなたが原因だ','assumption','一部の遅れと全体原因の断定は別。'],
        ['前工程も2日遅れていた','fact','複数要因があるなら、事実として並べる。'],
        ['今後この案件では提案しないで','restriction','責任評価と、今後の役割制限を分ける。'],
        ['確認が遅い人は判断力がない','assumption','人格評価は今回の工程事実ではない。']
      ],
      control: [
        ['自分の遅れ1日は認める',true,'自分の範囲だけは引き受けられる。'],
        ['会議参加者全員の印象を変える',false,'全員の評価は操作できない。'],
        ['工程ごとの遅れを時系列で出す',true,'事実を構造化できる。'],
        ['提案禁止の範囲と期間を確認する',true,'曖昧な制限は具体化できる。'],
        ['上司の機嫌を直す',false,'機嫌は相手の領域。'],
        ['必要なら別の責任者に事実確認を依頼する',true,'検証経路を増やせる。']
      ],
      reply: [
        ['境界','ただ、案件全体の遅れを私一人の原因とするのは事実と違います。',2],
        ['次の一手','工程ごとの日付を並べて、責任範囲を確認したいです。',4],
        ['事実','私の確認が1日遅れた点は認識しています。',1],
        ['条件確認','提案しないというのは、どの範囲をいつまで指しますか。',3]
      ],
      pressure: '「細かい話はいい。責任逃れにしか聞こえない」',
      steady: '自分の1日の遅れは引き受けます。その上で、全体原因は工程表で確認したいです。責任を逃れるためではなく、次回の再発防止のためです。'
    },
    {
      label: '友人 / うわさで責められる',
      scene: '第三者から聞いた話だけで「悪口を言った」と決めつけられ、交友関係まで指図されている。',
      accusation: '「あなたが私の悪口を言ったって聞いた」',
      restriction: '「もうあの人とは会わないで」と言われた。',
      cards: [
        ['第三者が「そう聞いた」と伝えた','fact','「誰かがそう伝えた」ことと、内容が事実かは別。'],
        ['あなたが悪口を言ったのは確定だ','assumption','伝聞だけでは本人の発言内容は確定しない。'],
        ['自分はその言葉を言っていない','fact','自分が何を言ったかは確認できる事実として出せる。'],
        ['もうあの人とは会わないでと言われた','restriction','疑いの話と交友関係の制限は分けて扱う。'],
        ['そんなことをする人は信用できない','assumption','人物評価は証拠ではない。']
      ],
      control: [
        ['自分が言った内容を具体的に説明する',true,'自分の発言は自分で説明できる。'],
        ['相手をその場で納得させる',false,'納得するかどうかは相手の領域。'],
        ['誰から何を聞いたのか確認する',true,'情報の出所と内容を確認できる。'],
        ['交友関係の指図には同意しないと伝える',true,'自分の交友関係は自分で決められる。'],
        ['噂を聞いた全員の印象を消す',false,'他人全員の認識は操作できない。'],
        ['必要なら当事者を交えて確認する',true,'検証の場を提案できる。']
      ],
      reply: [
        ['条件確認','誰から、私が何を言ったと聞いたのか確認させてください。',3],
        ['事実','私は、その内容の悪口は言っていません。',1],
        ['境界','伝聞だけで私が言ったと確定することには同意できません。',2],
        ['次の一手','必要なら、伝えた人も含めて事実を確認します。',4]
      ],
      pressure: '「でも聞いたんだから。普通ならもう会わないでしょ」',
      steady: '聞いた内容の確認には応じます。ただ、誰と会うかまで決められることには同意しません。まず発言内容を確認しましょう。'
    }
  ];

  const state = {
    scenarioIndex: 0,
    cardIndex: 0,
    sortCorrect: 0,
    sortLocked: false,
    controlSelected: new Set(),
    buildOrder: [],
    pauseReady: false,
    stressBefore: 65,
    stressAfter: 65,
    progress: readLocalProgress(),
    authUser: null,
    db: null,
    holdTimer: null
  };

  const $ = (id) => document.getElementById(id);
  const views = ['introView','sortView','controlView','buildView','pressureView','resultView'];

  function readLocalProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return {
        sessions: Math.max(0, Number(raw?.sessions) || 0),
        bestDrop: Math.max(0, Number(raw?.bestDrop) || 0)
      };
    } catch {
      return { sessions: 0, bestDrop: 0 };
    }
  }

  function writeLocalProgress(progress) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch {}
  }

  function showView(id) {
    views.forEach((view) => $(view).classList.toggle('active', view === id));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function scenario() { return scenarios[state.scenarioIndex]; }
  function pulse() { if (navigator.vibrate) navigator.vibrate(18); }

  function renderIntro() {
    const s = scenario();
    $('scenarioLabel').textContent = s.label;
    $('scenarioScene').textContent = s.scene;
    $('scenarioAccusation').textContent = s.accusation;
    $('scenarioRestriction').textContent = s.restriction;
    $('sessionCount').textContent = state.progress.sessions;
    $('beforeRange').value = String(state.stressBefore);
    $('beforeValue').textContent = String(state.stressBefore);
    showView('introView');
  }

  function startRun() {
    state.cardIndex = 0;
    state.sortCorrect = 0;
    state.sortLocked = false;
    state.controlSelected = new Set();
    state.buildOrder = [];
    state.pauseReady = false;
    state.stressAfter = state.stressBefore;
    $('savedPanel').classList.add('hidden');
    $('saveBtn').classList.remove('hidden');
    renderSort();
  }

  function renderSort() {
    const card = scenario().cards[state.cardIndex];
    $('sortProgress').textContent = `${state.cardIndex + 1} / ${scenario().cards.length}`;
    $('evidenceNo').textContent = `EVIDENCE #${String(state.cardIndex + 1).padStart(2,'0')}`;
    $('evidenceText').textContent = card[0];
    document.querySelectorAll('.bucket').forEach((button) => {
      button.disabled = false;
      button.classList.remove('correct');
    });
    state.sortLocked = false;
    setFeedback('sortFeedback','');
    $('sortNextBtn').classList.add('hidden');
    showView('sortView');
  }

  function chooseBucket(bucket) {
    if (state.sortLocked) return;
    const card = scenario().cards[state.cardIndex];
    if (bucket !== card[1]) {
      setFeedback('sortFeedback','その箱ではない。「確認できるか」「誰かの解釈か」「行動を縛る話か」で見る。');
      pulse();
      return;
    }
    state.sortCorrect += 1;
    state.sortLocked = true;
    document.querySelectorAll('.bucket').forEach((button) => {
      button.disabled = true;
      if (button.dataset.bucket === bucket) button.classList.add('correct');
    });
    setFeedback('sortFeedback',card[2]);
    $('sortNextBtn').textContent = state.cardIndex === scenario().cards.length - 1 ? '選択権を取り戻す →' : '次の言葉 →';
    $('sortNextBtn').classList.remove('hidden');
    pulse();
  }

  function nextSort() {
    if (!state.sortLocked) return;
    if (state.cardIndex >= scenario().cards.length - 1) {
      renderControl();
      return;
    }
    state.cardIndex += 1;
    renderSort();
  }

  function renderControl() {
    const board = $('controlBoard');
    board.innerHTML = '';
    scenario().control.forEach((item,index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'control-chip';
      button.dataset.index = String(index);
      button.innerHTML = `<span class="mark">+</span><span>${escapeHtml(item[0])}</span>`;
      button.addEventListener('click', () => toggleControl(index,button));
      board.appendChild(button);
    });
    $('controlProgress').textContent = '0 / 4';
    setFeedback('controlFeedback','');
    showView('controlView');
  }

  function toggleControl(index,button) {
    if (state.controlSelected.has(index)) state.controlSelected.delete(index);
    else state.controlSelected.add(index);
    const active = state.controlSelected.has(index);
    button.classList.toggle('active',active);
    button.querySelector('.mark').textContent = active ? '✓' : '+';
    const correctCount = scenario().control.filter((item,i) => item[1] && state.controlSelected.has(i)).length;
    $('controlProgress').textContent = `${correctCount} / 4`;
    setFeedback('controlFeedback','');
    pulse();
  }

  function checkControl() {
    const items = scenario().control;
    const selectedWrong = items.find((item,i) => !item[1] && state.controlSelected.has(i));
    const missed = items.find((item,i) => item[1] && !state.controlSelected.has(i));
    if (!selectedWrong && !missed) {
      setFeedback('controlFeedback','選択権を回収できた。相手に決められない部分まで取り戻そうとしないのがポイント。');
      pulse();
      setTimeout(renderBuild,420);
      return;
    }
    setFeedback('controlFeedback',(selectedWrong || missed)[2]);
    pulse();
  }

  function renderBuild() {
    state.buildOrder = [];
    renderBuiltReply();
    const parts = $('replyParts');
    parts.innerHTML = '';
    scenario().reply.forEach((item,index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'reply-part';
      button.dataset.index = String(index);
      button.innerHTML = `<span>${escapeHtml(item[0])}</span><p>${escapeHtml(item[1])}</p>`;
      button.addEventListener('click', () => chooseReply(index,button));
      parts.appendChild(button);
    });
    $('buildNextBtn').classList.add('hidden');
    setFeedback('buildFeedback','');
    showView('buildView');
  }

  function chooseReply(index,button) {
    if (state.buildOrder.includes(index)) return;
    const part = scenario().reply[index];
    const expected = state.buildOrder.length + 1;
    if (part[2] !== expected) {
      const expectedPart = scenario().reply.find((item) => item[2] === expected);
      setFeedback('buildFeedback',`先に「${expectedPart[0]}」を置く。説明を増やす前に、順番で自分を守る。`);
      pulse();
      return;
    }
    state.buildOrder.push(index);
    button.classList.add('used');
    button.disabled = true;
    renderBuiltReply();
    setFeedback('buildFeedback',`${part[0]}を置いた。${state.buildOrder.length === 4 ? 'これで反論ではなく、境界のある返答になった。' : '次へ。'}`);
    if (state.buildOrder.length === 4) $('buildNextBtn').classList.remove('hidden');
    pulse();
  }

  function renderBuiltReply() {
    $('buildProgress').textContent = `${state.buildOrder.length} / 4`;
    $('paperCount').textContent = `${state.buildOrder.length}/4`;
    if (!state.buildOrder.length) {
      $('builtReply').innerHTML = '<p class="empty">下の断片から、最初の一文を選ぶ。</p>';
      return;
    }
    const ordered = [...state.buildOrder].sort((a,b) => scenario().reply[a][2] - scenario().reply[b][2]);
    $('builtReply').innerHTML = ordered.map((index) => {
      const item = scenario().reply[index];
      return `<p><b>${item[2]}.</b>${escapeHtml(item[1])}</p>`;
    }).join('');
  }

  function renderPressure() {
    state.pauseReady = false;
    $('pressureText').textContent = scenario().pressure;
    $('steadyReply').textContent = scenario().steady;
    $('steadyBox').classList.add('hidden');
    $('holdBtn').classList.remove('hidden','pressing');
    $('pressureNextBtn').classList.add('hidden');
    setFeedback('pressureFeedback','');
    showView('pressureView');
  }

  function beginHold() {
    if (state.pauseReady) return;
    $('holdBtn').classList.add('pressing');
    setFeedback('pressureFeedback','反射で返さず、1.2秒だけ止まる。押したまま。');
    clearTimeout(state.holdTimer);
    state.holdTimer = setTimeout(() => {
      state.pauseReady = true;
      $('holdBtn').classList.add('hidden');
      $('steadyBox').classList.remove('hidden');
      $('pressureNextBtn').classList.remove('hidden');
      setFeedback('pressureFeedback','止まれた。怒りを消すのではなく、返事を選ぶ時間を作った。');
      pulse();
    },1200);
  }

  function endHold() {
    $('holdBtn').classList.remove('pressing');
    if (state.holdTimer) clearTimeout(state.holdTimer);
    state.holdTimer = null;
    if (!state.pauseReady) setFeedback('pressureFeedback','途中で離した。もう一度、1.2秒だけ保留する。');
  }

  function renderResult() {
    state.stressAfter = state.stressBefore;
    $('afterRange').value = String(state.stressAfter);
    $('afterValue').textContent = String(state.stressAfter);
    $('resultSort').textContent = `${state.sortCorrect}/${scenario().cards.length}`;
    $('resultControl').textContent = '4/4';
    $('resultBuild').textContent = '4/4';
    $('resultPause').textContent = state.pauseReady ? 'OK' : '—';
    renderDelta();
    showView('resultView');
  }

  function renderDelta() {
    const delta = state.stressBefore - state.stressAfter;
    $('beforeResult').textContent = `開始 ${state.stressBefore}`;
    $('afterResult').textContent = `現在 ${state.stressAfter}`;
    $('deltaResult').textContent = delta > 0 ? `−${delta}` : delta === 0 ? '変化なし' : `+${Math.abs(delta)}`;
  }

  async function saveResult() {
    const drop = Math.max(0,state.stressBefore - state.stressAfter);
    const next = {
      sessions: state.progress.sessions + 1,
      bestDrop: Math.max(state.progress.bestDrop,drop)
    };
    state.progress = next;
    writeLocalProgress(next);
    $('sessionCount').textContent = String(next.sessions);
    $('saveBtn').classList.add('hidden');
    $('savedPanel').classList.remove('hidden');
    $('savedPanel').innerHTML = `<b>RECORDED</b><br>${next.sessions}回目の訓練。最大の動揺低下は ${next.bestDrop}。`;
    $('syncStatus').textContent = state.authUser && state.db ? '端末に記録。Firestoreへ同期中…' : '端末に記録しました。ログインするとFirestoreにも同期します。';
    pulse();
    if (state.authUser && state.db) await syncResultToFirestore(drop);
  }

  async function initFirebaseSync() {
    const started = Date.now();
    const timer = setInterval(async () => {
      if (window.firebase?.auth && window.firebase?.firestore && window.firebase.apps?.length) {
        clearInterval(timer);
        try {
          state.db = window.firebase.firestore();
          window.firebase.auth().onAuthStateChanged(async (user) => {
            state.authUser = user || null;
            if (user) {
              $('syncStatus').textContent = 'Googleログイン中。結果はFirestoreにも同期します。';
              await mergeRemoteProgress();
            } else {
              $('syncStatus').textContent = '端末に保存できます。ログインするとFirestoreにも同期します。';
            }
          });
        } catch {
          $('syncStatus').textContent = '端末保存は利用できます。Firestore接続は今回利用できません。';
        }
      } else if (Date.now() - started > 10000) {
        clearInterval(timer);
      }
    },250);
  }

  async function mergeRemoteProgress() {
    if (!state.authUser || !state.db) return;
    try {
      const ref = state.db.collection('levelupUsers').doc(state.authUser.uid).collection('history').doc(SLUG);
      const snap = await ref.get();
      const data = snap.exists ? snap.data() : {};
      const merged = {
        sessions: Math.max(state.progress.sessions,Number(data?.trainingSessions) || 0),
        bestDrop: Math.max(state.progress.bestDrop,Number(data?.bestStressDrop) || 0)
      };
      state.progress = merged;
      writeLocalProgress(merged);
      $('sessionCount').textContent = String(merged.sessions);
    } catch {
      $('syncStatus').textContent = '端末保存は継続中。Firestoreの読み込みは次回再試行します。';
    }
  }

  async function syncResultToFirestore(drop) {
    try {
      const ref = state.db.collection('levelupUsers').doc(state.authUser.uid).collection('history').doc(SLUG);
      await state.db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists ? snap.data() : {};
        const remoteSessions = Math.max(0,Number(current?.trainingSessions) || 0);
        const remoteBest = Math.max(0,Number(current?.bestStressDrop) || 0);
        tx.set(ref,{
          trainingSessions: Math.max(state.progress.sessions,remoteSessions + 1),
          bestStressDrop: Math.max(state.progress.bestDrop,remoteBest,drop),
          lastStressBefore: state.stressBefore,
          lastStressAfter: state.stressAfter,
          lastScenario: state.scenarioIndex,
          lastTrainingAt: window.firebase.firestore.FieldValue.serverTimestamp()
        },{ merge:true });
      });
      $('syncStatus').textContent = 'Firestoreに同期済み。別端末でも訓練回数を引き継げます。';
    } catch {
      $('syncStatus').textContent = '端末には記録済み。Firestore同期は次回ログイン時に再試行できます。';
    }
  }

  function setFeedback(id,text) {
    const el = $(id);
    el.textContent = text;
    el.classList.toggle('show',Boolean(text));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g,(char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  $('beforeRange').addEventListener('input',(event) => {
    state.stressBefore = Number(event.target.value);
    $('beforeValue').textContent = String(state.stressBefore);
  });
  $('afterRange').addEventListener('input',(event) => {
    state.stressAfter = Number(event.target.value);
    $('afterValue').textContent = String(state.stressAfter);
    $('saveBtn').classList.remove('hidden');
    $('savedPanel').classList.add('hidden');
    renderDelta();
  });
  $('startBtn').addEventListener('click',startRun);
  document.querySelectorAll('.bucket').forEach((button) => button.addEventListener('click',() => chooseBucket(button.dataset.bucket)));
  $('sortNextBtn').addEventListener('click',nextSort);
  $('controlCheckBtn').addEventListener('click',checkControl);
  $('buildNextBtn').addEventListener('click',renderPressure);
  $('holdBtn').addEventListener('pointerdown',beginHold);
  ['pointerup','pointerleave','pointercancel'].forEach((name) => $('holdBtn').addEventListener(name,endHold));
  $('pressureNextBtn').addEventListener('click',renderResult);
  $('saveBtn').addEventListener('click',saveResult);
  $('retryBtn').addEventListener('click',() => { state.stressBefore = state.stressAfter; renderIntro(); });
  $('nextScenarioBtn').addEventListener('click',() => { state.scenarioIndex = (state.scenarioIndex + 1) % scenarios.length; renderIntro(); });

  renderIntro();
  initFirebaseSync();
})();
