import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const outDir = path.join(root, '.dist', 'firebase');
const indexPath = path.join(outDir, 'index.html');
const assetPath = path.join(outDir, 'levelup-maker.js');
const marker = 'data-levelup-maker';

if (!fs.existsSync(indexPath)) {
  throw new Error('Firebase LEVEL UP home not found. Run this after build-firebase-levelup-home and account injection.');
}

function makerBootstrap() {
  'use strict';

  if (window.__LEVELUP_MAKER_LOADED__) return;
  window.__LEVELUP_MAKER_LOADED__ = true;

  const state = {
    auth: null,
    db: null,
    user: null,
    requests: [],
    unsubscribe: null,
    modalOpen: false,
    pendingWizard: false,
    step: 0,
    busy: false,
    message: '',
    form: blankForm(),
  };

  const goalTypes = [
    ['switch', '今すぐ気持ちを切り替えたい'],
    ['start', '行動できるようになりたい'],
    ['stop', 'やめられるようになりたい'],
    ['learn', '考え方を身につけたい'],
    ['habit', '習慣にしたい'],
    ['other', 'その他'],
  ];
  const timings = [
    ['moment', '困ったその瞬間'],
    ['morning', '朝'],
    ['night', '寝る前'],
    ['before-work', '仕事・勉強を始める前'],
    ['fixed', '毎日決まった時間'],
    ['remembered', '思い出したとき'],
    ['other', 'その他'],
  ];
  const modes = [
    ['instant', '今すぐ', '30秒〜3分で、その場を乗り越える'],
    ['training', 'トレーニング', '繰り返して判断や考え方を身につける'],
    ['habit', '習慣化', '記録・継続・振り返りで定着を助ける'],
    ['auto', 'おまかせ', '内容に合う形をLEVEL UP側で考える'],
  ];
  const durations = [
    ['30sec', '30秒以内'],
    ['1-3min', '1〜3分'],
    ['5min', '5分くらい'],
    ['10min', '10分くらい'],
    ['any', '時間は気にしない'],
    ['auto', 'おまかせ'],
  ];

  function blankForm() {
    return {
      problem: '',
      goalType: '',
      goalDetail: '',
      usageTiming: '',
      timingDetail: '',
      solutionType: '',
      duration: '',
    };
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function labelFor(list, value) {
    return list.find((item) => item[0] === value)?.[1] || value || '未選択';
  }

  function friendlyError(error) {
    const code = error?.code || '';
    if (code.includes('popup-closed-by-user')) return 'ログインをキャンセルしました。';
    if (code.includes('popup-blocked')) return 'ポップアップがブロックされました。もう一度お試しください。';
    if (code.includes('permission-denied')) return '保存権限を確認してください。';
    if (code.includes('network') || code.includes('unavailable')) return '通信できませんでした。もう一度お試しください。';
    return '処理に失敗しました。もう一度お試しください。';
  }

  const host = document.createElement('section');
  host.id = 'levelup-maker';
  host.style.display = 'block';
  host.style.margin = '0 0 34px';

  const intro = document.querySelector('.intro');
  if (intro?.parentNode) intro.parentNode.insertBefore(host, intro.nextSibling);
  else (document.querySelector('main') || document.body).prepend(host);

  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host{all:initial;display:block;color-scheme:dark;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif;--lime:#d8ff5b;--bg:#0c0f0a;--panel:#141912;--text:#f6f8f1;--muted:#aab19e;--line:rgba(216,255,91,.20)}
      *{box-sizing:border-box}button,input,textarea{font:inherit}button{cursor:pointer}.wrap{border:1px solid var(--line);border-radius:26px;background:radial-gradient(circle at 92% 0,rgba(216,255,91,.13),transparent 30%),linear-gradient(145deg,#151b11,#0c0f0a);overflow:hidden}.maker{padding:25px}.eyebrow{font-size:9px;letter-spacing:.18em;color:var(--lime);font-weight:950}.title{font-size:clamp(28px,5vw,48px);line-height:1.02;letter-spacing:-.05em;margin:8px 0 12px;color:var(--text)}.lead{max-width:760px;color:#b8bfac;font-size:12px;line-height:1.85;margin:0}.lead strong{color:var(--text)}.examples{display:flex;flex-wrap:wrap;gap:7px;margin:17px 0 20px}.example{font-size:10px;color:#bec6b5;border:1px solid rgba(255,255,255,.09);border-radius:999px;padding:7px 10px;background:rgba(255,255,255,.025)}.actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.primary,.secondary{min-height:46px;border-radius:14px;padding:0 17px;font-weight:950}.primary{border:0;background:var(--lime);color:#11150c}.primary:disabled{opacity:.5;cursor:wait}.secondary{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:var(--text)}.hint{font-size:10px;color:#7e8777}.mine{border-top:1px solid var(--line);padding:21px 25px 24px}.mine-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:12px}.mine h3{margin:4px 0 0;color:var(--text);font-size:18px}.count{font-size:10px;color:#828b7b}.request-list{display:grid;gap:8px}.request{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:13px 14px;border:1px solid rgba(255,255,255,.08);border-radius:15px;background:rgba(255,255,255,.025)}.request-title{font-size:12px;font-weight:900;color:var(--text);line-height:1.45}.request-meta{font-size:9px;color:#889180;margin-top:5px}.status{align-self:start;font-size:9px;font-weight:950;border-radius:999px;padding:6px 8px;background:rgba(216,255,91,.1);color:var(--lime);white-space:nowrap}.request-actions{grid-column:1/-1;display:flex;gap:8px}.mini{border:1px solid rgba(255,255,255,.12);background:transparent;color:var(--text);border-radius:10px;padding:7px 10px;font-size:10px;font-weight:900}.empty{font-size:11px;color:#858e7d;padding:4px 0}.login-note{padding:17px 25px;border-top:1px solid var(--line);font-size:10px;color:#8d9685}.backdrop{position:fixed;z-index:2147483300;inset:0;background:rgba(0,0,0,.66);display:none;place-items:center;padding:12px}.backdrop.open{display:grid}.dialog{width:min(620px,100%);max-height:min(820px,calc(100dvh - 24px));overflow:auto;border:1px solid var(--line);border-radius:25px;background:linear-gradient(145deg,#171c12,#0b0e09);box-shadow:0 30px 100px rgba(0,0,0,.62);color:var(--text)}.dialog-head{display:flex;justify-content:space-between;align-items:center;padding:17px 19px;border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;background:#12170f;z-index:2}.progress{font-size:9px;letter-spacing:.14em;font-weight:950;color:var(--lime)}.close{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:transparent;color:var(--text);font-size:19px}.dialog-body{padding:23px 20px 20px}.step-kicker{font-size:9px;color:#7f8878;font-weight:900;letter-spacing:.12em}.dialog h2{font-size:clamp(26px,7vw,38px);line-height:1.08;letter-spacing:-.045em;margin:7px 0 9px}.desc{font-size:11px;line-height:1.75;color:#a8b0a0;margin:0 0 18px}.field{width:100%;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:#0c100a;color:var(--text);padding:13px 14px;outline:none}.field:focus{border-color:rgba(216,255,91,.65);box-shadow:0 0 0 3px rgba(216,255,91,.08)}textarea.field{min-height:128px;resize:vertical;line-height:1.65}.small-field{margin-top:11px;min-height:86px}.choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.choice{min-height:50px;text-align:left;border:1px solid rgba(255,255,255,.10);border-radius:13px;background:rgba(255,255,255,.025);color:var(--text);padding:11px 12px;font-size:11px;font-weight:850}.choice.on{border-color:rgba(216,255,91,.65);background:rgba(216,255,91,.09);color:#efffc0}.choice small{display:block;color:#899281;font-size:9px;font-weight:500;line-height:1.5;margin-top:4px}.choice.on small{color:#bdc99e}.nav{display:flex;justify-content:space-between;gap:10px;margin-top:21px;padding-top:17px;border-top:1px solid rgba(255,255,255,.07)}.error{font-size:10px;color:#ffb5a6;margin-top:10px}.summary{display:grid;gap:8px}.summary-row{padding:11px 12px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.025)}.summary-row span{display:block;font-size:8px;letter-spacing:.12em;color:#7f8878;font-weight:950;margin-bottom:4px}.summary-row strong{font-size:11px;line-height:1.55}.promise{margin:14px 0 0;padding:12px;border-radius:13px;background:rgba(216,255,91,.07);color:#cbd5b4;font-size:10px;line-height:1.7}.success{text-align:center;padding:18px 5px 5px}.success-mark{width:58px;height:58px;display:grid;place-items:center;margin:0 auto 14px;border-radius:50%;background:var(--lime);color:#11150c;font-size:25px;font-weight:950}.success h2{margin-bottom:10px}.success p{font-size:11px;line-height:1.8;color:#aab29f}.google{width:100%;min-height:48px;border:0;border-radius:14px;background:#fff;color:#202124;font-weight:900}.message{font-size:10px;color:#ffb5a6;margin:10px 0}.top-link{margin-left:7px!important}
      @media(max-width:600px){.maker,.mine{padding-left:16px;padding-right:16px}.title{font-size:34px}.choices{grid-template-columns:1fr}.dialog-body{padding:20px 15px}.request{grid-template-columns:1fr}.status{justify-self:start}.backdrop{align-items:end;padding:0}.dialog{width:100%;max-height:92dvh;border-radius:23px 23px 0 0;border-bottom:0}.dialog-head{padding:13px 15px}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
    </style>
    <div class="wrap"><div class="maker-ui"></div></div>
    <div class="backdrop" aria-hidden="true"><div class="dialog" role="dialog" aria-modal="true" aria-label="LEVEL UP アプリ制作依頼"></div></div>`;

  const makerUi = shadow.querySelector('.maker-ui');
  const backdrop = shadow.querySelector('.backdrop');
  const dialog = shadow.querySelector('.dialog');

  const top = document.querySelector('.top');
  if (top && !top.querySelector('[data-maker-link]')) {
    const link = document.createElement('a');
    link.href = '#levelup-maker';
    link.textContent = 'MAKE';
    link.dataset.makerLink = 'true';
    link.setAttribute('aria-label', '自分専用のLEVEL UPアプリを作る');
    top.appendChild(link);
  }

  function statusLabel(status) {
    if (status === 'published') return '公開中';
    if (status === 'building') return '制作中';
    if (status === 'rejected') return '要確認';
    return '制作依頼済み';
  }

  function safeAppPath(request) {
    const path = String(request.appPath || '');
    if (/^\/apps\/[a-z0-9-]+\/$/.test(path)) return path;
    const slug = String(request.appSlug || '');
    if (/^[a-z0-9-]{1,64}$/.test(slug)) return `/apps/${slug}/`;
    return '';
  }

  function requestTitle(request) {
    return request.appTitle || request.problem || '制作依頼';
  }

  function formatDate(value) {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(date);
  }

  function renderHome() {
    const user = state.user;
    const list = state.requests.slice(0, 12);
    const listHtml = list.length ? list.map((request) => {
      const path = safeAppPath(request);
      return `<div class="request">
        <div><div class="request-title">${escapeHtml(requestTitle(request))}</div><div class="request-meta">${escapeHtml(formatDate(request.createdAt))} · ${escapeHtml(labelFor(modes, request.solutionType))}</div></div>
        <span class="status">${escapeHtml(statusLabel(request.status))}</span>
        ${path ? `<div class="request-actions"><a class="mini" href="${escapeHtml(path)}">遊ぶ ↗</a><button class="mini" type="button" data-share="${escapeHtml(path)}" data-title="${escapeHtml(requestTitle(request))}">シェア</button></div>` : ''}
      </div>`;
    }).join('') : '<div class="empty">まだ制作依頼はありません。</div>';

    makerUi.innerHTML = `
      <div class="maker">
        <div class="eyebrow">MAKE YOUR LEVEL UP</div>
        <h2 class="title">困りごとを、<br>自分に効くアプリに。</h2>
        <p class="lead">LEVEL UPは、ただゲームを作る場所ではありません。<strong>悩み・困っていること・やめたい行動・身につけたい習慣</strong>を、その場の第一歩、反復トレーニング、習慣化を助ける小さなアプリに変えます。ゲームのアイデアを考える必要はありません。5つの質問に答えて、変えたいことを教えてください。</p>
        <div class="examples"><span class="example">朝すぐ起きたい</span><span class="example">仕事を始めたい</span><span class="example">嫌なことを引きずりたくない</span><span class="example">スマホをやめたい</span></div>
        <div class="actions"><button class="primary" type="button" data-start>${user ? '新しいアプリを制作依頼する' : 'ログインして制作依頼する'}</button><span class="hint">5問 · 約1〜2分</span></div>
      </div>
      ${user ? `<div class="mine"><div class="mine-head"><div><div class="eyebrow">MY LEVEL UP</div><h3>自分の制作アプリ</h3></div><span class="count">${state.requests.length}件</span></div><div class="request-list">${listHtml}</div></div>` : '<div class="login-note">制作依頼はGoogleログインが必要です。公開されたLEVEL UPアプリは、これまで通りログインなしで誰でも遊べます。</div>'}`;

    makerUi.querySelector('[data-start]')?.addEventListener('click', () => startRequest());
    makerUi.querySelectorAll('[data-share]').forEach((button) => button.addEventListener('click', () => shareRequest(button)));
  }

  async function shareRequest(button) {
    const path = button.dataset.share || '';
    const url = new URL(path, location.origin).href;
    const title = button.dataset.title || 'LEVEL UP';
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        const before = button.textContent;
        button.textContent = 'コピーしました';
        setTimeout(() => { button.textContent = before; }, 1400);
      }
    } catch {}
  }

  function openModal() {
    state.modalOpen = true;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
  }

  function closeModal() {
    state.modalOpen = false;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    state.message = '';
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.modalOpen) closeModal();
  });

  async function startRequest() {
    if (!state.user) {
      state.pendingWizard = true;
      renderLogin();
      openModal();
      return;
    }
    state.form = blankForm();
    state.step = 0;
    state.message = '';
    renderWizard();
    openModal();
  }

  function header(progress) {
    return `<div class="dialog-head"><div class="progress">${escapeHtml(progress)}</div><button class="close" type="button" aria-label="閉じる">×</button></div>`;
  }

  function wireClose() {
    dialog.querySelector('.close')?.addEventListener('click', closeModal);
  }

  function renderLogin() {
    dialog.innerHTML = `${header('LOGIN REQUIRED')}<div class="dialog-body"><div class="step-kicker">制作依頼はログイン必須</div><h2>自分のLEVEL UPとして<br>残すためにログイン。</h2><p class="desc">制作依頼と完成したアプリを、あなたのアカウントに紐づけます。遊ぶだけならログインは不要です。</p>${state.message ? `<div class="message">${escapeHtml(state.message)}</div>` : ''}<button class="google" type="button" data-login ${state.busy ? 'disabled' : ''}>Googleでログイン</button></div>`;
    wireClose();
    dialog.querySelector('[data-login]')?.addEventListener('click', signIn);
  }

  function validateStep() {
    const form = state.form;
    if (state.step === 0) return form.problem.trim().length >= 4;
    if (state.step === 1) return Boolean(form.goalType) && form.goalDetail.trim().length >= 2;
    if (state.step === 2) return Boolean(form.usageTiming) && (form.usageTiming !== 'other' || form.timingDetail.trim().length >= 2);
    if (state.step === 3) return Boolean(form.solutionType);
    if (state.step === 4) return Boolean(form.duration);
    return true;
  }

  function stepBody() {
    const form = state.form;
    if (state.step === 0) return `<div class="step-kicker">STEP 1 / 5</div><h2>今、何を変えたい？</h2><p class="desc">困っていることを、そのまま書いてください。アプリの形を考える必要はありません。</p><textarea class="field" maxlength="240" data-problem placeholder="例：仕事を始めようとしても、ついスマホを見て30分くらい経ってしまう">${escapeHtml(form.problem)}</textarea>`;
    if (state.step === 1) return `<div class="step-kicker">STEP 2 / 5</div><h2>どうなれたら成功？</h2><p class="desc">このアプリを使ったあと、何が変わっていたら「効いた」と言えますか？</p><div class="choices">${goalTypes.map(([id,label]) => `<button class="choice ${form.goalType === id ? 'on' : ''}" type="button" data-choice="goalType" data-value="${id}">${escapeHtml(label)}</button>`).join('')}</div><textarea class="field small-field" maxlength="180" data-goal-detail placeholder="例：考える前に、最初の1分だけ仕事を始められるようになりたい">${escapeHtml(form.goalDetail)}</textarea>`;
    if (state.step === 2) return `<div class="step-kicker">STEP 3 / 5</div><h2>いつ使いたい？</h2><p class="desc">使う瞬間が分かると、その場で効く設計にできます。</p><div class="choices">${timings.map(([id,label]) => `<button class="choice ${form.usageTiming === id ? 'on' : ''}" type="button" data-choice="usageTiming" data-value="${id}">${escapeHtml(label)}</button>`).join('')}</div>${form.usageTiming === 'other' ? `<textarea class="field small-field" maxlength="120" data-timing-detail placeholder="どんなときに開きたいですか？">${escapeHtml(form.timingDetail)}</textarea>` : ''}`;
    if (state.step === 3) return `<div class="step-kicker">STEP 4 / 5</div><h2>どんな変化がほしい？</h2><p class="desc">ゲーム方式ではなく、欲しい効果を選んでください。中身の設計はLEVEL UP側で考えます。</p><div class="choices">${modes.map(([id,label,detail]) => `<button class="choice ${form.solutionType === id ? 'on' : ''}" type="button" data-choice="solutionType" data-value="${id}">${escapeHtml(label)}<small>${escapeHtml(detail)}</small></button>`).join('')}</div>`;
    return `<div class="step-kicker">STEP 5 / 5</div><h2>1回どれくらいなら<br>使えそう？</h2><p class="desc">続けられる長さを選んでください。短いほど良い、ではなく現実に使える長さを優先します。</p><div class="choices">${durations.map(([id,label]) => `<button class="choice ${form.duration === id ? 'on' : ''}" type="button" data-choice="duration" data-value="${id}">${escapeHtml(label)}</button>`).join('')}</div>`;
  }

  function syncFields() {
    const problem = dialog.querySelector('[data-problem]');
    if (problem) state.form.problem = problem.value;
    const goal = dialog.querySelector('[data-goal-detail]');
    if (goal) state.form.goalDetail = goal.value;
    const timing = dialog.querySelector('[data-timing-detail]');
    if (timing) state.form.timingDetail = timing.value;
  }

  function renderWizard() {
    dialog.innerHTML = `${header(`STEP ${state.step + 1} / 5`)}<div class="dialog-body">${stepBody()}${state.message ? `<div class="error">${escapeHtml(state.message)}</div>` : ''}<div class="nav">${state.step > 0 ? '<button class="secondary" type="button" data-prev>戻る</button>' : '<span></span>'}<button class="primary" type="button" data-next>次へ</button></div></div>`;
    wireClose();
    dialog.querySelectorAll('[data-choice]').forEach((button) => button.addEventListener('click', () => {
      syncFields();
      state.form[button.dataset.choice] = button.dataset.value;
      state.message = '';
      renderWizard();
    }));
    dialog.querySelector('[data-prev]')?.addEventListener('click', () => {
      syncFields(); state.step -= 1; state.message = ''; renderWizard();
    });
    dialog.querySelector('[data-next]')?.addEventListener('click', () => {
      syncFields();
      if (!validateStep()) {
        state.message = state.step === 0 ? '困っていることをもう少し具体的に書いてください。' : state.step === 1 ? '近いゴールを選び、なりたい状態を一言書いてください。' : 'ひとつ選んでください。';
        renderWizard();
        return;
      }
      state.message = '';
      if (state.step < 4) { state.step += 1; renderWizard(); }
      else renderConfirm();
    });
    setTimeout(() => dialog.querySelector('textarea')?.focus({ preventScroll: true }), 0);
  }

  function renderConfirm() {
    const f = state.form;
    const timing = labelFor(timings, f.usageTiming) + (f.timingDetail ? `：${f.timingDetail}` : '');
    dialog.innerHTML = `${header('CONFIRM')}<div class="dialog-body"><div class="step-kicker">制作依頼の確認</div><h2>あなたが作ろうとしている<br>LEVEL UP</h2><div class="summary">
      <div class="summary-row"><span>困りごと</span><strong>${escapeHtml(f.problem)}</strong></div>
      <div class="summary-row"><span>なりたい状態</span><strong>${escapeHtml(labelFor(goalTypes, f.goalType))}<br>${escapeHtml(f.goalDetail)}</strong></div>
      <div class="summary-row"><span>使うタイミング</span><strong>${escapeHtml(timing)}</strong></div>
      <div class="summary-row"><span>タイプ</span><strong>${escapeHtml(labelFor(modes, f.solutionType))}</strong></div>
      <div class="summary-row"><span>1回の長さ</span><strong>${escapeHtml(labelFor(durations, f.duration))}</strong></div>
    </div><div class="promise">どんなゲームにするかは聞きません。LEVEL UP側が、内容に合う「即時介入・反復トレーニング・段階的行動・習慣化」などの構造を考えて制作します。</div>${state.message ? `<div class="error">${escapeHtml(state.message)}</div>` : ''}<div class="nav"><button class="secondary" type="button" data-back>戻る</button><button class="primary" type="button" data-submit ${state.busy ? 'disabled' : ''}>${state.busy ? '送信中…' : 'この内容で制作を依頼する'}</button></div></div>`;
    wireClose();
    dialog.querySelector('[data-back]')?.addEventListener('click', () => { state.step = 4; state.message = ''; renderWizard(); });
    dialog.querySelector('[data-submit]')?.addEventListener('click', submitRequest);
  }

  async function submitRequest() {
    if (!state.user || !state.db || state.busy) return;
    state.busy = true;
    state.message = '';
    renderConfirm();
    try {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const request = {
        id,
        ...state.form,
        status: 'requested',
        createdAt: now,
        updatedAt: now,
        appSlug: '',
        appTitle: '',
        appPath: '',
      };
      const ref = state.db.collection('levelupUsers').doc(state.user.uid);
      await state.db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        const current = snapshot.exists && snapshot.data()?.creationRequests && typeof snapshot.data().creationRequests === 'object' ? snapshot.data().creationRequests : {};
        const next = { ...current, [id]: request };
        const sorted = Object.values(next).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 50);
        const limited = Object.fromEntries(sorted.map((item) => [item.id, item]));
        tx.set(ref, { creationRequests: limited, creationRequestsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      });
      window.dispatchEvent(new CustomEvent('levelup:creation-requested', { detail: { id } }));
      renderSuccess();
    } catch (error) {
      console.warn('[LEVEL UP maker] request failed', error);
      state.message = friendlyError(error);
      state.busy = false;
      renderConfirm();
    }
  }

  function renderSuccess() {
    state.busy = false;
    dialog.innerHTML = `${header('REQUESTED')}<div class="dialog-body"><div class="success"><div class="success-mark">✓</div><h2>制作依頼を受け付けました。</h2><p>この依頼は「自分の制作アプリ」に残ります。制作状況や公開されたアプリも、同じ場所から確認できます。</p><button class="primary" type="button" data-done>自分の制作アプリを見る</button></div></div>`;
    wireClose();
    dialog.querySelector('[data-done]')?.addEventListener('click', () => { closeModal(); host.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }

  function normalizeRequests(data) {
    const raw = data?.creationRequests;
    if (!raw || typeof raw !== 'object') return [];
    const values = Array.isArray(raw) ? raw : Object.values(raw);
    return values.filter((item) => item && typeof item === 'object' && item.id).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  function listenRequests(user) {
    state.unsubscribe?.();
    state.unsubscribe = null;
    state.requests = [];
    renderHome();
    if (!user || !state.db) return;
    const ref = state.db.collection('levelupUsers').doc(user.uid);
    state.unsubscribe = ref.onSnapshot((snapshot) => {
      state.requests = normalizeRequests(snapshot.data() || {});
      renderHome();
    }, (error) => console.warn('[LEVEL UP maker] request listener failed', error));
  }

  async function signIn() {
    if (!state.auth || state.busy) return;
    state.busy = true;
    state.message = '';
    renderLogin();
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await state.auth.signInWithPopup(provider);
    } catch (error) {
      state.busy = false;
      state.message = friendlyError(error);
      renderLogin();
    }
  }

  async function initializeFirebase() {
    renderHome();
    if (!window.firebase?.auth || !window.firebase?.firestore || !firebase.apps?.length) {
      console.warn('[LEVEL UP maker] Firebase SDK unavailable');
      return;
    }
    try {
      state.auth = firebase.auth();
      state.db = firebase.firestore();
      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      state.auth.onAuthStateChanged((user) => {
        state.user = user;
        state.busy = false;
        listenRequests(user);
        if (user && state.pendingWizard) {
          state.pendingWizard = false;
          state.form = blankForm();
          state.step = 0;
          state.message = '';
          renderWizard();
          openModal();
        } else if (!user && state.modalOpen && !state.pendingWizard) {
          renderLogin();
        }
      });
    } catch (error) {
      console.warn('[LEVEL UP maker] Firebase initialization failed', error);
    }
  }

  initializeFirebase();
}

fs.writeFileSync(assetPath, `(${makerBootstrap.toString()})();\n`);

let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes(marker)) {
  const snippet = `\n<script src="/levelup-maker.js" ${marker}></script>\n`;
  html = html.includes('</body>') ? html.replace('</body>', `${snippet}</body>`) : `${html}${snippet}`;
  fs.writeFileSync(indexPath, html);
}

if (!fs.existsSync(assetPath) || !fs.readFileSync(indexPath, 'utf8').includes(marker)) {
  throw new Error('LEVEL UP maker injection failed.');
}

console.log('[Firebase] LEVEL UP guided app request flow injected');
