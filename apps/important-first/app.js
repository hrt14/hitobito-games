(() => {
  const STORAGE_KEY = 'levelup-important-first-v1';
  const todayKey = () => new Date().toLocaleDateString('sv-SE');
  const defaultState = { sessions: 0, judgments: 0, best: 0, q2Completed: 0, todayReserve: null };
  let saved = loadState();

  const SCENARIOS = [
    { q:1, tag:'仕事', text:'今日17時が締切の重要な提案書。まだ最終確認が終わっていない。', clue:'重要な成果に直結し、締切も目前。', action:'今やる。完了まで守る。' },
    { q:1, tag:'健康', text:'強い痛みが出て、今日中の受診を勧められている。', clue:'健康への影響が大きく、今の対応が必要。', action:'今やる。必要な対応を先にする。' },
    { q:1, tag:'お金', text:'今日が期限の税金・料金の支払い。延滞すると不利益が出る。', clue:'放置の影響が大きく、期限も今日。', action:'今やる。締切を越えない。' },
    { q:1, tag:'家族', text:'家族から「今すぐ助けが必要」と連絡。安全に関わる内容だ。', clue:'大切な人の安全に関わり、待てない。', action:'今やる。危機対応を優先する。' },
    { q:1, tag:'仕事', text:'本番環境で障害。ユーザーがサービスを使えない状態が続いている。', clue:'影響が大きく、現在進行中の問題。', action:'今やる。火を消す。' },
    { q:1, tag:'約束', text:'30分後に重要な会議。共有必須の資料がまだ開けない。', clue:'重要な約束に必要で、時間切れが近い。', action:'今やる。会議成立に必要な最低限へ。' },

    { q:2, tag:'仕事', text:'来月の大型案件に向けて、今週30分だけ段取りを作っておく。', clue:'まだ急がないが、未来の成果と火事予防に効く。', action:'予定を守る。先に時間を確保する。' },
    { q:2, tag:'健康', text:'体調は悪くない。週3回の運動を続けるため、今日20分歩く。', clue:'今すぐ困らないが、長期の健康に効く。', action:'予定を守る。緊急になる前に積む。' },
    { q:2, tag:'学習', text:'仕事で将来必要になるスキルを、今日20分だけ練習する。', clue:'締切はないが、長期成果に効く。', action:'予定を守る。学習枠を先に取る。' },
    { q:2, tag:'人間関係', text:'特に用事はないが、大切な人と落ち着いて10分話す。', clue:'急ぎではないが、大切な関係への投資。', action:'予定を守る。関係は平時に育てる。' },
    { q:2, tag:'改善', text:'毎週起きるミスを減らすため、手順を15分だけ見直す。', clue:'今のトラブルではなく、次のトラブルを減らす。', action:'予定を守る。予防に時間を使う。' },
    { q:2, tag:'計画', text:'来週の重要タスク3つを決めて、先にカレンダーへ入れる。', clue:'緊急になる前に重要な時間を確保する行動。', action:'予定を守る。重要を予約する。' },
    { q:2, tag:'回復', text:'まだ限界ではないが、集中力を戻すため20分休む。', clue:'倒れてからでは遅い。回復は重要な予防。', action:'予定を守る。回復も重要な投資。' },
    { q:2, tag:'お金', text:'急ぎの支払いはない。家計と固定費を月1回見直す。', clue:'今すぐの危機ではないが、長期の余裕に効く。', action:'予定を守る。お金の予防管理をする。' },

    { q:3, tag:'仕事', text:'同僚から「今すぐ見て」と来た、成果に影響しない資料の色味確認。', clue:'相手には急ぎでも、自分の重要成果にはほぼ影響しない。', action:'任せる・断る。必要なら後で返す。' },
    { q:3, tag:'通知', text:'作業中、重要でないグループチャットが「至急リアクションください」と光る。', clue:'通知は急かすが、重要ではない。', action:'任せる・断る。通知の速さに支配されない。' },
    { q:3, tag:'会議', text:'自分の判断が不要な会議に「開始5分前、参加お願いします」と呼ばれた。', clue:'時間は迫っているが、自分の重要役割ではない。', action:'任せる・断る。必要性を確認する。' },
    { q:3, tag:'依頼', text:'他の人でもできる軽作業を「今日中で」と頼まれた。自分には重要な仕事がある。', clue:'期限はあるが、自分が担う重要性は低い。', action:'任せる・断る。抱え込まない。' },
    { q:3, tag:'メール', text:'件名に【至急】とあるが、内容は参考情報の転送依頼だけ。', clue:'ラベルは緊急でも、中身は重要ではない。', action:'任せる・断る。件名ではなく中身で判断。' },
    { q:3, tag:'仕事', text:'別部署の小さなトラブル。担当者がいるのに、自分にも即レスを求められた。', clue:'今起きているが、自分が持つべき重要責任ではない。', action:'任せる・断る。担当へ戻す。' },

    { q:4, tag:'スマホ', text:'目的もないのにSNSを開き、次のおすすめ動画を見続ける。', clue:'急ぎでも重要でもなく、時間だけ消える。', action:'やらない。閉じる。' },
    { q:4, tag:'仕事', text:'誰も使っていない古い資料の見た目を、理由なく整え続ける。', clue:'期限も成果への影響もない。', action:'やらない。終わりにする。' },
    { q:4, tag:'情報', text:'必要のないニュースを、なんとなく何度も更新して確認する。', clue:'今の目的にも期限にも関係しない。', action:'やらない。目的に戻る。' },
    { q:4, tag:'比較', text:'買う予定もない商品のレビューを延々と比較し続ける。', clue:'意思決定の予定がなく、長期価値にもつながらない。', action:'やらない。調べる理由ができてから。' },
    { q:4, tag:'メール', text:'返信不要の古いメールを、整理だけのために何度も読み返す。', clue:'急ぎでも重要でもない整理のための整理。', action:'やらない。必要なとき検索する。' },
    { q:4, tag:'作業', text:'成果に影響しないファイル名を完璧にそろえることに30分使う。', clue:'緊急性も重要性も低い微調整。', action:'やらない。十分で止める。' },
  ];

  const RESERVES = [
    { icon:'PLAN', title:'重要タスク3つを決める', minutes:'15分', note:'来週・明日の重要事項を先に予定へ' },
    { icon:'LEARN', title:'未来に効く学習をする', minutes:'20分', note:'締切がない勉強を先に守る' },
    { icon:'MOVE', title:'体を動かす', minutes:'15分', note:'体調を崩す前のメンテナンス' },
    { icon:'TALK', title:'大切な人と話す', minutes:'10分', note:'問題がない時に関係を育てる' },
    { icon:'FIX', title:'繰り返す問題を1つ改善', minutes:'15分', note:'次の火事を減らす仕組みづくり' },
    { icon:'REST', title:'回復の時間を取る', minutes:'20分', note:'限界になる前にエネルギーを戻す' },
  ];

  const screens = [...document.querySelectorAll('.screen')];
  const taskCard = document.getElementById('taskCard');
  const feedback = document.getElementById('feedback');
  let round = [];
  let index = 0;
  let correct = 0;
  let combo = 0;
  let q2Correct = 0;
  let q2Total = 0;
  let trapCorrect = 0;
  let trapTotal = 0;
  let locked = false;
  let feedbackTimer = null;
  let selectedReserve = null;
  let drag = null;

  function loadState() {
    try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return { ...defaultState }; }
  }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }
  function buzz(pattern = 12) { try { navigator.vibrate?.(pattern); } catch {} }
  function show(name) {
    screens.forEach((s) => s.classList.toggle('active', s.dataset.screen === name));
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (name === 'home') renderToday();
    if (name === 'record') renderRecord();
  }
  function home() { location.href = '/'; }

  function renderToday() {
    if (saved.todayReserve && saved.todayReserve.date !== todayKey()) saved.todayReserve = null;
    const r = saved.todayReserve;
    document.getElementById('todayStatus').textContent = r ? (r.done ? '完了' : `${r.when}に予約`) : '未予約';
    document.getElementById('todayTitle').textContent = r ? r.title : '重要だけど、まだ急ぎじゃないことを1つ守る';
    document.getElementById('todayMeta').textContent = r ? `${r.minutes} / ${r.note}` : '先に時間を確保すると、未来の火事を減らしやすい。';
    document.getElementById('reserveBtn').textContent = r ? 'Q2を変更' : '今日のQ2を予約';
    document.getElementById('completeQ2Btn').classList.toggle('hidden', !r || r.done);
  }

  function balancedRound() {
    const picks = [];
    for (const q of [1,2,3,4]) {
      const pool = SCENARIOS.filter((s) => s.q === q).sort(() => Math.random() - .5);
      picks.push(...pool.slice(0,2));
    }
    return picks.sort(() => Math.random() - .5);
  }
  function startTraining() {
    round = balancedRound(); index = 0; correct = 0; combo = 0; q2Correct = 0; q2Total = 0; trapCorrect = 0; trapTotal = 0; locked = false;
    show('training'); renderQuestion();
  }
  function renderQuestion() {
    locked = false;
    feedback.className = 'feedback';
    const s = round[index];
    document.getElementById('progressText').textContent = `${index + 1} / ${round.length}`;
    document.getElementById('comboText').textContent = combo;
    document.getElementById('progressBar').style.width = `${(index / round.length) * 100}%`;
    document.getElementById('sceneTag').textContent = s.tag;
    document.getElementById('sceneText').textContent = s.text;
    document.getElementById('urgentSignal').textContent = '緊急度 ?';
    document.getElementById('importantSignal').textContent = '重要度 ?';
    taskCard.style.transform = '';
    taskCard.style.opacity = '';
  }
  function quadrantLabel(q) { return ({1:'Q1 今やる',2:'Q2 予定を守る',3:'Q3 任せる・断る',4:'Q4 やらない'})[q]; }
  function answer(q) {
    if (locked) return;
    locked = true;
    const s = round[index];
    const ok = Number(q) === s.q;
    if (s.q === 2) q2Total++;
    if (s.q === 3 || s.q === 4) trapTotal++;
    if (ok) {
      correct++; combo++;
      if (s.q === 2) q2Correct++;
      if (s.q === 3 || s.q === 4) trapCorrect++;
      buzz(18);
    } else {
      combo = 0; buzz([18,45,18]);
    }
    document.getElementById('comboText').textContent = combo;
    document.getElementById('urgentSignal').textContent = s.q === 1 || s.q === 3 ? '緊急：高' : '緊急：低';
    document.getElementById('importantSignal').textContent = s.q === 1 || s.q === 2 ? '重要：高' : '重要：低';
    document.getElementById('feedbackMark').textContent = ok ? '✓' : '↘';
    document.getElementById('feedbackTitle').textContent = ok ? `${quadrantLabel(s.q)}。` : `正解は ${quadrantLabel(s.q)}。`;
    document.getElementById('feedbackCopy').textContent = `${s.clue} ${s.action}`;
    feedback.className = `feedback show${ok ? '' : ' bad'}`;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(nextQuestion, ok ? 1300 : 1900);
  }
  function nextQuestion() {
    clearTimeout(feedbackTimer);
    feedback.className = 'feedback';
    index++;
    if (index >= round.length) finishTraining(); else renderQuestion();
  }
  function finishTraining() {
    const accuracy = Math.round((correct / round.length) * 100);
    saved.sessions++;
    saved.judgments += round.length;
    saved.best = Math.max(saved.best, accuracy);
    persist();
    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('accuracyResult').textContent = `${accuracy}%`;
    document.getElementById('q2Result').textContent = `${q2Correct}/${q2Total}`;
    document.getElementById('trapResult').textContent = `${trapCorrect}/${trapTotal}`;
    const lesson = buildLesson(accuracy);
    document.getElementById('resultTitle').textContent = lesson.title;
    document.getElementById('resultCopy').textContent = lesson.copy;
    document.getElementById('lessonCard').innerHTML = `<span class="tiny">NEXT RULE</span><strong>${lesson.rule}</strong><p>${lesson.detail}</p>`;
    show('result');
  }
  function buildLesson(accuracy) {
    if (accuracy >= 88 && q2Correct === q2Total) return { title:'重要センサー、かなり強い。', copy:'「急ぎだから」ではなく、重要度を見て選べています。', rule:'Q2は「暇ができたら」ではなく、先に予約する。', detail:'Q1を必要最小限で処理し、Q3・Q4を減らして、Q2の時間を守る。' };
    if (q2Correct < q2Total) return { title:'Q2を見逃しやすい。', copy:'緊急でない重要事項は、静かなので後ろへ流れます。', rule:'「今すぐ困らない」は、後回しの理由にしない。', detail:'計画・学習・運動・関係づくり・改善・回復は、急ぐ前に時間を取る。' };
    if (trapCorrect < trapTotal) return { title:'「急ぎ」に少し引っ張られた。', copy:'急いで見えることと、重要なことは同じではありません。', rule:'「至急」と書いてあっても、まず重要度を見る。', detail:'自分の目的や役割に効かないなら、任せる・断る・後回しも選択肢。' };
    return { title:'4象限がつながってきた。', copy:`今回は${correct}/${round.length}。迷った瞬間こそ練習になります。`, rule:'重要か？ → 緊急か？ の順で見る。', detail:'先に重要度を決めると、目の前の圧に判断を奪われにくい。' };
  }

  function renderReserve() {
    const grid = document.getElementById('reserveGrid');
    grid.innerHTML = RESERVES.map((r,i) => `<button class="reserve-option" data-reserve="${i}" type="button"><span class="reserve-icon">${r.icon}</span><span><strong>${r.title}</strong><small>${r.minutes} · ${r.note}</small></span><span class="chev">→</span></button>`).join('');
    grid.querySelectorAll('[data-reserve]').forEach((btn) => btn.addEventListener('click', () => chooseReserve(Number(btn.dataset.reserve))));
    selectedReserve = null;
    document.getElementById('whenPanel').classList.add('hidden');
  }
  function chooseReserve(i) {
    selectedReserve = RESERVES[i]; buzz(10);
    document.getElementById('reserveChoice').textContent = `${selectedReserve.title}（${selectedReserve.minutes}）`;
    document.getElementById('whenPanel').classList.remove('hidden');
    document.getElementById('whenPanel').scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
  function saveReserve(when) {
    if (!selectedReserve) return;
    saved.todayReserve = { ...selectedReserve, when, date: todayKey(), done:false };
    persist(); buzz([15,35,25]); show('home');
  }
  function completeQ2() {
    if (!saved.todayReserve || saved.todayReserve.done) return;
    saved.todayReserve.done = true;
    saved.q2Completed++;
    persist(); buzz([18,30,38]); renderToday();
  }

  function rankForState() {
    if (saved.sessions >= 20 && saved.best >= 90 && saved.q2Completed >= 10) return ['重要度マスター','急ぎの圧より、重要なことを先に守る型がかなり定着しています。'];
    if (saved.sessions >= 8 && saved.q2Completed >= 3) return ['Q2ガーディアン','重要だけど静かなものを、意識して守る段階です。'];
    if (saved.sessions >= 3) return ['緊急トラップ回避中','「急ぎ＝重要」を切り離す回数が増えています。'];
    return ['重要度ビギナー','まずは「重要か？」を先に見る癖をつけるところから。'];
  }
  function renderRecord() {
    const [rank, copy] = rankForState();
    document.getElementById('recordSessions').textContent = saved.sessions;
    document.getElementById('recordJudgments').textContent = saved.judgments;
    document.getElementById('recordBest').textContent = saved.sessions ? saved.best : '—';
    document.getElementById('recordQ2').textContent = saved.q2Completed;
    document.getElementById('recordRank').textContent = rank;
    document.getElementById('recordRankCopy').textContent = copy;
  }

  document.getElementById('startTraining').addEventListener('click', startTraining);
  document.getElementById('reserveBtn').addEventListener('click', () => { renderReserve(); show('reserve'); });
  document.getElementById('completeQ2Btn').addEventListener('click', completeQ2);
  document.getElementById('recordBtn').addEventListener('click', () => show('record'));
  document.getElementById('homeBtn').addEventListener('click', home);
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => show(b.dataset.back)));
  document.querySelectorAll('.drop').forEach((b) => b.addEventListener('click', () => answer(Number(b.dataset.q))));
  feedback.addEventListener('click', () => { if (locked) nextQuestion(); });
  document.querySelectorAll('[data-when]').forEach((b) => b.addEventListener('click', () => saveReserve(b.dataset.when)));
  document.getElementById('againBtn').addEventListener('click', startTraining);
  document.getElementById('resultReserveBtn').addEventListener('click', () => { renderReserve(); show('reserve'); });
  document.getElementById('resultHomeBtn').addEventListener('click', () => show('home'));
  document.getElementById('resetBtn').addEventListener('click', () => { if (!confirm('記録をリセットしますか？')) return; saved = { ...defaultState }; persist(); renderRecord(); renderToday(); });

  taskCard.addEventListener('pointerdown', (e) => {
    if (locked) return;
    drag = { id:e.pointerId, x:e.clientX, y:e.clientY };
    taskCard.setPointerCapture?.(e.pointerId);
    taskCard.classList.add('dragging');
  });
  taskCard.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId || locked) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    taskCard.style.transform = `translate(${dx * .28}px,${dy * .28}px) rotate(${dx * .012}deg) scale(.98)`;
    document.querySelectorAll('.drop').forEach((d) => d.classList.remove('hover'));
    const el = document.elementFromPoint(e.clientX,e.clientY)?.closest?.('.drop');
    el?.classList.add('hover');
  });
  taskCard.addEventListener('pointerup', (e) => {
    if (!drag || drag.id !== e.pointerId || locked) return;
    document.querySelectorAll('.drop').forEach((d) => d.classList.remove('hover'));
    const target = document.elementFromPoint(e.clientX,e.clientY)?.closest?.('.drop');
    drag = null; taskCard.classList.remove('dragging'); taskCard.style.transform = '';
    if (target) answer(Number(target.dataset.q));
  });
  taskCard.addEventListener('pointercancel', () => { drag = null; taskCard.classList.remove('dragging'); taskCard.style.transform = ''; });

  renderToday();
})();
