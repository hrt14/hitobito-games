import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
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
    authBound: false,
    modalOpen: false,
    pendingWizard: false,
    screen: 'landing',
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
    const code = String(error?.code || '');
    if (code.includes('popup-closed-by-user')) return 'ログインをキャンセルしました。';
    if (code.includes('popup-blocked')) return 'Googleログイン画面を開けませんでした。もう一度タップしてください。';
    if (code.includes('unauthorized-domain')) return 'このドメインではGoogleログインを利用できません。';
    if (code.includes('operation-not-allowed')) return 'Googleログインの設定を確認しています。';
    if (code.includes('permission-denied')) return '保存権限を確認してください。';
    if (code.includes('network') || code.includes('unavailable')) return '通信できませんでした。もう一度お試しください。';
    if (code.includes('firebase-not-ready')) return 'ログイン機能を読み込み中です。数秒後にもう一度お試しください。';
    return '処理に失敗しました' + (code ? `（${code}）` : '') + '。もう一度お試しください。';
  }

  const host = document.createElement('div');
  host.id = 'levelup-maker';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host{all:initial;display:contents;color-scheme:dark;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif;--lime:#d8ff5b;--text:#f6f8f1;--muted:#aab19e;--line:rgba(216,255,91,.22)}
      *{box-sizing:border-box}button,input,textarea{font:inherit}button{cursor:pointer}.maker-fab{position:fixed;right:0;top:calc(50% + 106px);transform:translateY(-50%);z-index:2147483290;width:40px;min-height:112px;padding:10px 7px;border:1px solid rgba(216,255,91,.48);border-right:0;border-radius:15px 0 0 15px;background:#d8ff5b;color:#11150c;font-size:11px;font-weight:950;line-height:1.08;writing-mode:vertical-rl;text-orientation:upright;letter-spacing:.05em;box-shadow:0 10px 30px rgba(0,0,0,.36);-webkit-tap-highlight-color:transparent}.maker-fab:focus-visible{outline:2px solid #fff;outline-offset:2px}.maker-fab .spark{margin-bottom:6px;font-size:13px}.backdrop{position:fixed;z-index:2147483300;inset:0;background:rgba(0,0,0,.68);display:none;place-items:center;padding:12px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}.backdrop.open{display:grid}.dialog{width:min(620px,100%);max-height:min(820px,calc(100dvh - 24px));overflow:auto;border:1px solid var(--line);border-radius:25px;background:radial-gradient(circle at 92% 0,rgba(216,255,91,.09),transparent 30%),linear-gradient(145deg,#171c12,#0b0e09);box-shadow:0 30px 100px rgba(0,0,0,.62);color:var(--text)}.dialog-head{display:flex;justify-content:space-between;align-items:center;padding:17px 19px;border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;background:rgba(18,23,15,.97);z-index:2}.progress{font-size:9px;letter-spacing:.14em;font-weight:950;color:var(--lime)}.close{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:transparent;color:var(--text);font-size:19px}.dialog-body{padding:23px 20px 20px}.step-kicker,.eyebrow{font-size:9px;color:var(--lime);font-weight:950;letter-spacing:.14em}.dialog h2{font-size:clamp(27px,7vw,40px);line-height:1.07;letter-spacing:-.045em;margin:8px 0 11px}.desc{font-size:12px;line-height:1.8;color:#abb3a3;margin:0 0 18px}.desc strong{color:var(--text)}.examples{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0 19px}.example{font-size:10px;color:#c1c8b9;border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:7px 10px;background:rgba(255,255,255,.025)}.primary,.secondary,.google{min-height:48px;border-radius:14px;padding:0 17px;font-weight:950}.primary{border:0;background:var(--lime);color:#11150c}.primary:disabled,.google:disabled{opacity:.5;cursor:wait}.secondary{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:var(--text)}.google{width:100%;border:0;background:#fff;color:#202124}.actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.hint{font-size:10px;color:#7e8777}.field{width:100%;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:#0c100a;color:var(--text);padding:13px 14px;outline:none}.field:focus{border-color:rgba(216,255,91,.65);box-shadow:0 0 0 3px rgba(216,255,91,.08)}textarea.field{min-height:128px;resize:vertical;line-height:1.65}.small-field{margin-top:11px;min-height:86px}.choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.choice{min-height:50px;text-align:left;border:1px solid rgba(255,255,255,.10);border-radius:13px;background:rgba(255,255,255,.025);color:var(--text);padding:11px 12px;font-size:11px;font-weight:850}.choice.on{border-color:rgba(216,255,91,.65);background:rgba(216,255,91,.09);color:#efffc0}.choice small{display:block;color:#899281;font-size:9px;font-weight:500;line-height:1.5;margin-top:4px}.choice.on small{color:#bdc99e}.nav{display:flex;justify-content:space-between;gap:10px;margin-top:21px;padding-top:17px;border-top:1px solid rgba(255,255,255,.07)}.error,.message{font-size:10px;color:#ffb5a6;margin:10px 0}.summary{display:grid;gap:8px}.summary-row{padding:11px 12px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.025)}.summary-row span{display:block;font-size:8px;letter-spacing:.12em;color:#7f8878;font-weight:950;margin-bottom:4px}.summary-row strong{font-size:11px;line-height:1.55}.promise{margin:14px 0 0;padding:12px;border-radius:13px;background:rgba(216,255,91,.07);color:#cbd5b4;font-size:10px;line-height:1.7}.success{text-align:center;padding:18px 5px 5px}.success-mark{width:58px;height:58px;display:grid;place-items:center;margin:0 auto 14px;border-radius:50%;background:var(--lime);color:#11150c;font-size:25px;font-weight:950}.success h2{margin-bottom:10px}.success p{font-size:11px;line-height:1.8;color:#aab29f}.my-block{margin-top:22px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08)}.my-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:10px}.my-head h3{font-size:17px;margin:4px 0 0}.count{font-size:9px;color:#858e7d}.request-list{display:grid;gap:8px}.request{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.025)}.request-title{font-size:11px;font-weight:900;line-height:1.45}.request-meta{font-size:9px;color:#899281;margin-top:4px}.status{align-self:start;font-size:9px;font-weight:950;border-radius:999px;padding:5px 8px;background:rgba(216,255,91,.1);color:var(--lime);white-space:nowrap}.request-actions{grid-column:1/-1;display:flex;gap:7px}.mini{border:1px solid rgba(255,255,255,.12);background:transparent;color:var(--text);border-radius:10px;padding:7px 10px;font-size:10px;font-weight:900;text-decoration:none}.empty{font-size:10px;color:#858e7d}.auth-ready{margin-top:10px;font-size:9px;color:#7f8878}.auth-ready strong{color:#b8c3a5}
      @media(max-width:600px){.maker-fab{top:calc(50% + 98px);width:38px;min-height:104px;font-size:10px}.choices{grid-template-columns:1fr}.dialog-body{padding:20px 15px}.backdrop{align-items:end;padding:0}.dialog{width:100%;max-height:92dvh;border-radius:23px 23px 0 0;border-bottom:0}.dialog-head{padding:13px 15px}.request{grid-template-columns:1fr}.status{justify-self:start}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
    </style>
    <button class="maker-fab" type="button" data-maker-fab aria-label="自分に合うLEVEL UPアプリの制作を依頼する"><span class="spark">＋</span>アプリ制作</button>
    <div class="backdrop" aria-hidden="true"><div class="dialog" role="dialog" aria-modal="true" aria-label="LEVEL UP アプリ制作依頼"></div></div>`;

  const fab = shadow.querySelector('[data-maker-fab]');
  const backdrop = shadow.querySelector('.backdrop');
  const dialog = shadow.querySelector('.dialog');

  function statusLabel(status) {
    if (status === 'published') return '公開中';
    if (status === 'building') return '制作中';
    if (status === 'rejected') return '要確認';
    return '制作依頼済み';
  }

  function safeAppPath(request) {
    const requestPath = String(request.appPath || '');
    if (/^\/apps\/[a-z0-9-]+\/$/.test(requestPath)) return requestPath;
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

  function requestListHtml() {
    const list = state.requests.slice(0, 8);
    if (!list.length) return '<div class="empty">まだ制作依頼はありません。</div>';
    return list.map((request) => {
      const appPath = safeAppPath(request);
      return `<div class="request"><div><div class="request-title">${escapeHtml(requestTitle(request))}</div><div class="request-meta">${escapeHtml(formatDate(request.createdAt))} · ${escapeHtml(labelFor(modes, request.solutionType))}</div></div><span class="status">${escapeHtml(statusLabel(request.status))}</span>${appPath ? `<div class="request-actions"><a class="mini" href="${escapeHtml(appPath)}">遊ぶ ↗</a><button class="mini" type="button" data-share="${escapeHtml(appPath)}" data-title="${escapeHtml(requestTitle(request))}">シェア</button></div>` : ''}</div>`;
    }).join('');
  }

  function openModal() {
    state.modalOpen = true;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
  }

  function closeModal() {
    state.modalOpen = false;
    state.screen = 'landing';
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    state.message = '';
  }

  function header(progress) {
    return `<div class="dialog-head"><div class="progress">${escapeHtml(progress)}</div><button class="close" type="button" aria-label="閉じる">×</button></div>`;
  }

  function wireClose() {
    dialog.querySelector('.close')?.addEventListener('click', closeModal);
  }

  function wireShare() {
    dialog.querySelectorAll('[data-share]').forEach((button) => button.addEventListener('click', () => shareRequest(button)));
  }

  function openMaker() {
    state.screen = 'landing';
    state.message = '';
    renderLanding();
    openModal();
  }

  fab.addEventListener('click', openMaker);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.modalOpen) closeModal();
  });

  function renderLanding() {
    state.screen = 'landing';
    const my = state.user ? `<div class="my-block"><div class="my-head"><div><div class="eyebrow">MY LEVEL UP</div><h3>自分の制作アプリ</h3></div><span class="count">${state.requests.length}件</span></div><div class="request-list">${requestListHtml()}</div></div>` : '';
    dialog.innerHTML = `${header('APP CREATION')}<div class="dialog-body"><div class="step-kicker">もう少し、自分に合わせたいときに。</div><h2>困りごとを、<br>自分用のLEVEL UPへ。</h2><p class="desc">今あるLEVEL UPを使うだけでなく、<strong>あなたの悩み・変えたい行動・身につけたい習慣に合わせたアプリ</strong>を制作依頼できます。ゲームのアイデアは必要ありません。5つの質問に答えると、内容に合う形をこちらで考えます。</p><div class="examples"><span class="example">朝すぐ起きたい</span><span class="example">仕事を始めたい</span><span class="example">嫌なことを引きずりたくない</span><span class="example">スマホをやめたい</span></div><div class="actions"><button class="primary" type="button" data-start>5問で制作依頼する</button><span class="hint">約1〜2分</span></div>${my}</div>`;
    wireClose();
    wireShare();
    dialog.querySelector('[data-start]')?.addEventListener('click', startRequest);
  }

  async function shareRequest(button) {
    const appPath = button.dataset.share || '';
    const url = new URL(appPath, location.origin).href;
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

  function startRequest() {
    if (!state.user) {
      state.pendingWizard = true;
      state.screen = 'login';
      renderLogin();
      return;
    }
    state.form = blankForm();
    state.step = 0;
    state.message = '';
    state.screen = 'wizard';
    renderWizard();
  }

  function renderLogin() {
    state.screen = 'login';
    const ready = Boolean(state.auth);
    dialog.innerHTML = `${header('LOGIN REQUIRED')}<div class="dialog-body"><div class="step-kicker">制作依頼はGoogleログインが必要です</div><h2>自分の制作アプリとして<br>残しておく。</h2><p class="desc">依頼内容と完成したアプリを、あなたのLEVEL UPアカウントに紐づけます。普段のLEVEL UPを遊ぶだけならログインは不要です。</p>${state.message ? `<div class="message">${escapeHtml(state.message)}</div>` : ''}<button class="google" type="button" data-login ${state.busy || !ready ? 'disabled' : ''}>${state.busy ? 'ログイン中…' : ready ? 'Googleでログイン' : 'ログイン機能を読み込み中…'}</button><div class="auth-ready">${ready ? '<strong>ログイン準備完了</strong>' : '数秒で準備が完了します。'}</div></div>`;
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
    if (state.step === 3) return `<div class="step-kicker">STEP 4 / 5</div><h2>どんな変化がほしい？</h2><p class="desc">欲しい効果を選んでください。中身の設計はLEVEL UP側で考えます。</p><div class="choices">${modes.map(([id,label,detail]) => `<button class="choice ${form.solutionType === id ? 'on' : ''}" type="button" data-choice="solutionType" data-value="${id}">${escapeHtml(label)}<small>${escapeHtml(detail)}</small></button>`).join('')}</div>`;
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
    state.screen = 'wizard';
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
    state.screen = 'confirm';
    const f = state.form;
    const timing = labelFor(timings, f.usageTiming) + (f.timingDetail ? `：${f.timingDetail}` : '');
    dialog.innerHTML = `${header('CONFIRM')}<div class="dialog-body"><div class="step-kicker">制作依頼の確認</div><h2>この内容で、<br>あなた用のLEVEL UPを依頼。</h2><div class="summary"><div class="summary-row"><span>困りごと</span><strong>${escapeHtml(f.problem)}</strong></div><div class="summary-row"><span>なりたい状態</span><strong>${escapeHtml(labelFor(goalTypes, f.goalType))}<br>${escapeHtml(f.goalDetail)}</strong></div><div class="summary-row"><span>使うタイミング</span><strong>${escapeHtml(timing)}</strong></div><div class="summary-row"><span>タイプ</span><strong>${escapeHtml(labelFor(modes, f.solutionType))}</strong></div><div class="summary-row"><span>1回の長さ</span><strong>${escapeHtml(labelFor(durations, f.duration))}</strong></div></div><div class="promise">どんなゲームにするかは聞きません。内容に合う「即時介入・反復トレーニング・段階的行動・習慣化」などの構造をLEVEL UP側で考えて制作します。</div>${state.message ? `<div class="error">${escapeHtml(state.message)}</div>` : ''}<div class="nav"><button class="secondary" type="button" data-back>戻る</button><button class="primary" type="button" data-submit ${state.busy ? 'disabled' : ''}>${state.busy ? '送信中…' : 'この内容で制作を依頼する'}</button></div></div>`;
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
      const request = { id, ...state.form, status: 'requested', createdAt: now, updatedAt: now, appSlug: '', appTitle: '', appPath: '' };
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
    state.screen = 'success';
    state.busy = false;
    dialog.innerHTML = `${header('REQUESTED')}<div class="dialog-body"><div class="success"><div class="success-mark">✓</div><h2>制作依頼を受け付けました。</h2><p>依頼は「自分の制作アプリ」に残ります。制作状況や公開されたアプリも、この制作タブから確認できます。</p><button class="primary" type="button" data-done>制作アプリを確認する</button></div></div>`;
    wireClose();
    dialog.querySelector('[data-done]')?.addEventListener('click', renderLanding);
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
    if (!user || !state.db) {
      if (state.modalOpen && state.screen === 'landing') renderLanding();
      return;
    }
    const ref = state.db.collection('levelupUsers').doc(user.uid);
    state.unsubscribe = ref.onSnapshot((snapshot) => {
      state.requests = normalizeRequests(snapshot.data() || {});
      if (state.modalOpen && state.screen === 'landing') renderLanding();
    }, (error) => console.warn('[LEVEL UP maker] request listener failed', error));
  }

  function onUserChanged(user) {
    state.user = user;
    state.busy = false;
    listenRequests(user);
    if (user && state.pendingWizard) {
      state.pendingWizard = false;
      state.form = blankForm();
      state.step = 0;
      state.message = '';
      renderWizard();
    } else if (state.modalOpen && state.screen === 'login') {
      renderLogin();
    } else if (state.modalOpen && state.screen === 'landing') {
      renderLanding();
    }
  }

  async function signIn() {
    if (!state.auth || state.busy) {
      state.message = 'ログイン機能を読み込み中です。数秒後にもう一度お試しください。';
      renderLogin();
      return;
    }
    state.busy = true;
    state.message = '';
    renderLogin();
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await state.auth.signInWithPopup(provider);
      if (result?.user) onUserChanged(result.user);
    } catch (error) {
      console.warn('[LEVEL UP maker] sign-in failed', error);
      state.busy = false;
      state.message = friendlyError(error);
      renderLogin();
    }
  }

  async function waitForFirebaseSdk(timeoutMs = 6000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (window.firebase?.initializeApp && window.firebase?.auth && window.firebase?.firestore) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return false;
  }

  async function initializeFirebase() {
    try {
      const sdkReady = await waitForFirebaseSdk();
      if (!sdkReady) {
        const error = new Error('Firebase SDK unavailable');
        error.code = 'auth/firebase-not-ready';
        throw error;
      }
      let app = firebase.apps?.[0] || null;
      if (!app) {
        const response = await fetch('/__/firebase/init.json', { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) {
          const error = new Error('Firebase config unavailable');
          error.code = 'auth/firebase-not-ready';
          throw error;
        }
        app = firebase.initializeApp(await response.json());
      }
      state.auth = app.auth();
      state.db = app.firestore();
      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      if (!state.authBound) {
        state.authBound = true;
        state.auth.onAuthStateChanged(onUserChanged);
      }
      if (state.modalOpen && state.screen === 'login') renderLogin();
    } catch (error) {
      console.warn('[LEVEL UP maker] Firebase initialization failed', error);
      state.message = friendlyError(error);
      if (state.modalOpen && state.screen === 'login') renderLogin();
    }
  }

  initializeFirebase();
}

const assetSource = `(${makerBootstrap.toString()})();\n`;
fs.writeFileSync(assetPath, assetSource);
const assetVersion = createHash('sha256').update(assetSource).digest('hex').slice(0, 12);

let html = fs.readFileSync(indexPath, 'utf8');
const snippet = `\n<script src="/levelup-maker.js?v=${assetVersion}" ${marker}></script>\n`;
if (html.includes(marker)) {
  html = html.replace(/\n?<script[^>]*data-levelup-maker[^>]*><\/script>\n?/g, snippet);
} else {
  html = html.includes('</body>') ? html.replace('</body>', `${snippet}</body>`) : `${html}${snippet}`;
}
fs.writeFileSync(indexPath, html);

const builtHtml = fs.readFileSync(indexPath, 'utf8');
if (!fs.existsSync(assetPath) || !builtHtml.includes(marker) || !builtHtml.includes(`/levelup-maker.js?v=${assetVersion}`)) {
  throw new Error('LEVEL UP maker injection failed.');
}
if (!assetSource.includes('data-maker-fab') || assetSource.includes('insertBefore(host, intro.nextSibling)')) {
  throw new Error('LEVEL UP maker must stay a floating secondary flow and must not occupy the home content stream.');
}

console.log(`[Firebase] LEVEL UP floating guided app request flow injected; maker=${assetVersion}`);
