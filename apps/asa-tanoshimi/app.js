const STORAGE_KEY = 'levelup-asa-tanoshimi-v1';

const ideas = [
  '好きなコーヒーをいれる',
  'ちょっといい朝ごはん',
  '好きな音楽を1曲だけ聴く',
  '10分だけゲーム・漫画',
  '朝の空気を吸いに外へ出る',
  '誰にも邪魔されない朝時間',
];

const mysteryBonuses = [
  'カーテンを開けたら、最初に見えた色を1つ覚えておく。今日のラッキーカラー。',
  '好きな曲を1曲だけ、朝のテーマソングにする。',
  '飲み物の最初の一口だけ、何もしないで味わう。',
  '窓の外を10秒だけ見る。朝の景色を1枚、頭の中に保存。',
  '今日やらなくていいことを1つ決める。朝から荷物を1個減らす。',
  '起きた自分に「よく来た」と言う。今日の最初のクリア扱い。',
  '朝いちばんに、好きなものを1つ見る。写真でも本でも景色でもOK。',
  '布団から出たら両腕を上へ。3秒だけ「今日スタート」のポーズ。',
];

const root = document.querySelector('#app');
let state = loadState();
let ticker = null;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      plan: parsed.plan || null,
      streak: Number(parsed.streak || 0),
      total: Number(parsed.total || 0),
      lastCompletedDate: parsed.lastCompletedDate || null,
    };
  } catch {
    return { plan: null, streak: 0, total: 0, lastCompletedDate: null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pad(n) { return String(n).padStart(2, '0'); }
function localDateKey(date = new Date()) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }

function nextWakeDateKey(wakeTime) {
  const now = new Date();
  const [hh, mm] = wakeTime.split(':').map(Number);
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return localDateKey(target);
}

function targetDate(plan) {
  const [y, m, d] = plan.targetDate.split('-').map(Number);
  const [hh, mm] = plan.wakeTime.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function formatTarget(plan) {
  const date = targetDate(plan);
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function baseTop(phase) {
  return `<div class="topline"><a class="home-link" href="/">← LEVEL UP</a><span class="phase">${phase}</span></div>`;
}

function render() {
  clearInterval(ticker);
  ticker = null;
  root.classList.remove('morning');

  if (!state.plan) return renderSetup();
  const target = targetDate(state.plan).getTime();
  if (Date.now() < target) return renderSealed();
  root.classList.add('morning');
  if (!state.plan.revealed) return renderMorningReady();
  if (!state.plan.completed) return renderRevealed();
  return renderCompleted();
}

function renderSetup() {
  root.innerHTML = `<section class="screen">
    ${baseTop('NIGHT / 仕込み')}
    <header class="hero">
      <div class="eyebrow">MAKE TOMORROW MORNING WORTH WAKING UP FOR</div>
      <h1>明日の朝に、<br>楽しみを置く。</h1>
      <p>「早く寝なきゃ」ではなく、<strong>早く朝になってほしい</strong>を作る。寝る前に、朝のごほうびを1個だけ予約します。</p>
    </header>
    <div class="panel">
      <span class="label">次の朝、何があったら少し楽しみ？</span>
      <div class="chips">${ideas.slice(0, 6).map((idea, i) => `<button class="chip" type="button" data-idea="${i}">${escapeHtml(idea)}</button>`).join('')}</div>
      <input class="text-input" id="joy" maxlength="54" placeholder="自分で書く（例：新しい漫画を1話読む）" autocomplete="off" />
      <div class="row">
        <div><span class="label">朝の開封時刻</span><div class="hint">この時刻までは宝箱を開けられません。</div></div>
        <input class="time-input" id="wake" type="time" value="07:00" aria-label="朝の開封時刻" />
      </div>
      <button class="primary" id="seal" type="button" disabled>朝の宝箱に封印する</button>
    </div>
  </section>`;

  const joy = root.querySelector('#joy');
  const seal = root.querySelector('#seal');
  const setReady = () => { seal.disabled = joy.value.trim().length < 2; };
  joy.addEventListener('input', setReady);
  root.querySelectorAll('[data-idea]').forEach((button) => {
    button.addEventListener('click', () => {
      root.querySelectorAll('.chip').forEach((el) => el.classList.remove('selected'));
      button.classList.add('selected');
      joy.value = ideas[Number(button.dataset.idea)];
      setReady();
    });
  });
  seal.addEventListener('click', () => {
    const value = joy.value.trim();
    if (!value) return;
    const mysteryIndex = Math.floor(Math.random() * mysteryBonuses.length);
    const wakeTime = root.querySelector('#wake').value || '07:00';
    state.plan = {
      joy: value,
      wakeTime,
      targetDate: nextWakeDateKey(wakeTime),
      createdAt: Date.now(),
      mysteryIndex,
      revealed: false,
      completed: false,
    };
    saveState();
    render();
  });
}

function countdownText() {
  const diff = Math.max(0, targetDate(state.plan).getTime() - Date.now());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours >= 1) return `${hours}時間 ${pad(minutes)}分`;
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}分 ${pad(seconds)}秒`;
}

function renderSealed() {
  root.innerHTML = `<section class="screen sealed">
    ${baseTop('NIGHT / 封印中')}
    <div class="sky" aria-hidden="true">
      <i class="star s1"></i><i class="star s2"></i><i class="star s3"></i><i class="star s4"></i>
      <div class="moon"></div>
      <div class="lock-card"><div class="lock-icon">🔒</div><div class="lock-title">朝の宝箱</div><div class="lock-copy">${escapeHtml(formatTarget(state.plan))} に解禁</div></div>
    </div>
    <div class="countdown" id="countdown">${countdownText()}</div>
    <div class="count-label">朝の開封まで</div>
    <p class="sealed-note">楽しみはもう置いてあります。<br><strong>今やることは、朝まで時間を飛ばすこと。</strong></p>
    <div class="sleep-cta">🌙 ここから先は画面を閉じてOK。<br>寝たら、次にこのアプリを開くときは朝です。</div>
    <button class="tiny-action" id="reset" type="button">仕込みをやり直す</button>
  </section>`;

  const countdown = root.querySelector('#countdown');
  ticker = setInterval(() => {
    if (Date.now() >= targetDate(state.plan).getTime()) return render();
    countdown.textContent = countdownText();
  }, 1000);
  root.querySelector('#reset').addEventListener('click', () => {
    if (!confirm('朝の宝箱を作り直しますか？')) return;
    state.plan = null; saveState(); render();
  });
}

function renderMorningReady() {
  root.innerHTML = `<section class="screen">
    ${baseTop('MORNING / 解禁')}
    <div class="sun-wrap"><div class="sun" aria-hidden="true"></div></div>
    <header class="hero" style="text-align:center;margin-top:-6px">
      <div class="eyebrow">GOOD MORNING</div>
      <h1>朝が、来た。</h1>
      <p>昨夜の自分から、朝の自分へ。</p>
    </header>
    <button class="primary" id="open" type="button">起きた！ 朝の宝箱を開ける</button>
    <div class="scorebar"><span class="score-pill">連続 ${state.streak} 朝</span><span class="score-pill">累計 ${state.total} 朝</span></div>
  </section>`;
  root.querySelector('#open').addEventListener('click', () => {
    state.plan.revealed = true; saveState(); render();
  });
}

function confettiMarkup() {
  return `<div class="confetti" aria-hidden="true">${Array.from({length: 18}, (_, i) => `<i style="left:${(i * 37) % 96}%;animation-delay:${(i % 6) * .07}s"></i>`).join('')}</div>`;
}

function renderRevealed() {
  const bonus = mysteryBonuses[state.plan.mysteryIndex % mysteryBonuses.length];
  root.innerHTML = `<section class="screen reveal">
    ${baseTop('MORNING / OPEN')}
    ${confettiMarkup()}
    <div class="gift">
      <div class="gift-tag">昨夜の自分から届きました</div>
      <h2>${escapeHtml(state.plan.joy)}</h2>
      <p>これが今日の朝のごほうび。<br>仕事や予定より先に、朝に楽しみがある。</p>
      <div class="mystery"><b>SECRET MORNING BONUS</b><span>${escapeHtml(bonus)}</span></div>
    </div>
    <button class="secondary" id="done" type="button">やった！ 朝の楽しみ回収</button>
    <button class="ghost" id="later" type="button">まだ。あとで回収する</button>
  </section>`;
  root.querySelector('#done').addEventListener('click', completeMorning);
  root.querySelector('#later').addEventListener('click', () => {
    root.querySelector('#later').textContent = 'OK。宝箱はここに置いておく';
  }, { once: true });
}

function completeMorning() {
  const today = localDateKey();
  if (state.lastCompletedDate !== today) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    state.streak = state.lastCompletedDate === localDateKey(yesterday) ? state.streak + 1 : 1;
    state.total += 1;
    state.lastCompletedDate = today;
  }
  state.plan.completed = true;
  saveState();
  render();
}

function renderCompleted() {
  root.innerHTML = `<section class="screen">
    ${baseTop('MORNING / CLEAR')}
    <div class="sun-wrap"><div class="sun" aria-hidden="true"></div></div>
    <div class="done-box">
      <div class="eyebrow">MORNING CLEAR</div>
      <h2>朝を1個、楽しんだ。</h2>
      <p>夜に楽しみを仕込む → 寝る → 朝に回収する。<br>このループを、また今夜。</p>
      <div class="scorebar"><span class="score-pill">🔥 ${state.streak} 朝連続</span><span class="score-pill">★ 累計 ${state.total} 朝</span></div>
    </div>
    <button class="primary" id="next" type="button">今夜の分を仕込む</button>
  </section>`;
  root.querySelector('#next').addEventListener('click', () => {
    state.plan = null; saveState(); render();
  });
}

render();
