import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const outDir = path.join(root, '.dist', 'firebase');

if (!fs.existsSync(path.join(outDir, 'index.html'))) {
  throw new Error('Firebase LEVEL UP bundle not found. Run this after the LEVEL UP home build.');
}

const updated = '2026-08-20';
const companyUrl = 'https://mangabito.biz/?page_id=6081';
const contactUrl = 'https://mangabito.biz/?page_id=11154';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function page({ title, description, body }) {
  const canonical = `https://levelup.hitobito.jp/${title === 'プライバシーポリシー' ? 'privacy' : title === '利用規約' ? 'terms' : 'support'}/`;
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#0a0d08" />
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <title>${escapeHtml(title)} | LEVEL UP</title>
  <style>
    :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Yu Gothic UI","Yu Gothic",sans-serif;color:#f6f8f1;background:#090b08;--lime:#d8ff5b;--muted:#aab09f;--line:rgba(216,255,91,.18)}
    *{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 88% -10%,rgba(216,255,91,.11),transparent 32%),#090b08;color:#f6f8f1;-webkit-font-smoothing:antialiased}a{color:var(--lime)}
    .shell{width:min(780px,calc(100% - 32px));margin:auto;padding:20px 0 72px}.top{display:flex;align-items:center;justify-content:space-between;padding:8px 0 18px;border-bottom:1px solid var(--line)}.brand{color:#fff;text-decoration:none;font-size:11px;font-weight:950;letter-spacing:.16em}.home{color:var(--muted);text-decoration:none;font-size:11px}
    main{padding:48px 0}.kicker{font-size:10px;font-weight:950;letter-spacing:.16em;color:var(--lime);margin-bottom:12px}h1{font-size:clamp(38px,9vw,64px);line-height:.94;letter-spacing:-.055em;margin:0 0 16px}.lead{font-size:14px;line-height:1.9;color:#c2c8b8;margin:0 0 34px}.section{padding:24px 0;border-top:1px solid var(--line)}h2{font-size:21px;letter-spacing:-.025em;margin:0 0 11px}p,li{font-size:13px;line-height:1.85;color:#bcc2b3}ul{padding-left:1.25em}.note{border:1px solid rgba(216,255,91,.22);background:rgba(216,255,91,.055);border-radius:16px;padding:16px;margin:18px 0}.note p{margin:0}.meta{font-size:11px;color:#7f8777;margin-top:30px}.button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border-radius:999px;background:var(--lime);color:#10140c;text-decoration:none;font-size:12px;font-weight:950}
    @media(max-width:600px){main{padding-top:36px}.section{padding:21px 0}}
  </style>
</head>
<body>
  <div class="shell">
    <header class="top"><a class="brand" href="/">HITOBITO / LEVEL UP</a><a class="home" href="/">トップへ</a></header>
    <main>${body}<div class="meta">最終更新: ${updated}</div></main>
  </div>
</body>
</html>`;
}

const privacy = page({
  title: 'プライバシーポリシー',
  description: 'hitobito LEVEL UPのプライバシーポリシー。',
  body: `
    <div class="kicker">PRIVACY</div>
    <h1>プライバシーポリシー</h1>
    <p class="lead">株式会社まんがびと（以下「当社」）は、hitobito LEVEL UP（以下「本サービス」）における利用者情報を、以下の方針で取り扱います。</p>

    <section class="section"><h2>1. 取得・利用する情報</h2><p>本サービスでは、利用状況に応じて次の情報を取り扱います。</p><ul>
      <li>Googleログインを利用した場合の認証情報（Firebase Authenticationが提供するユーザーID、表示名、メールアドレス、プロフィール画像URL等）</li>
      <li>お気に入り、プレイ履歴、プレイ回数など、端末内またはログイン時に同期する利用データ</li>
      <li>匿名のランダムな訪問者ID、閲覧したページ・ゲーム、開始・最終利用時刻、利用時間、完了状態、操作・ステップを表す識別子などの利用状況データ</li>
      <li>検索利用に関する集計情報（検索回数や、あらかじめ定義した悩みカテゴリに該当した回数等）</li>
    </ul><p>ブラウザのローカルストレージ等を使って、訪問者ID、お気に入り、未同期のプレイ履歴などを端末内に保存する場合があります。</p></section>

    <section class="section"><h2>2. 利用目的</h2><ul>
      <li>本サービスの提供、ログイン、端末間同期のため</li>
      <li>利用履歴・お気に入り等を利用者本人に提供するため</li>
      <li>利用状況を集計し、ゲームや画面、導線、品質を改善するため</li>
      <li>不具合の調査、セキュリティ確保、不正利用防止のため</li>
    </ul></section>

    <section class="section"><h2>3. ChatGPT Plugin / Skillについて</h2><div class="note"><p>現在のLEVEL UP Plugin初版はSkills-only構成です。利用者がLEVEL UPの外部Webページを開かない限り、LEVEL UP側のサーバーへChatGPTの会話内容を送信するためのMCPサーバー通信は行いません。ChatGPT自体におけるデータの取扱いは、OpenAIが定める規約・プライバシー方針に従います。</p></div></section>

    <section class="section"><h2>4. 外部サービス</h2><p>本サービスは、認証、データ保存、ホスティング等のためGoogle Firebase等の外部サービスを利用します。これらのサービスでは、各事業者の規約・プライバシー方針に基づき情報が処理される場合があります。</p></section>

    <section class="section"><h2>5. 第三者提供・販売</h2><p>当社は、法令に基づく場合等を除き、利用者情報を利用目的と無関係な第三者へ販売しません。サービス提供に必要な委託先・クラウド事業者による処理は、この限りではありません。</p></section>

    <section class="section"><h2>6. 保存期間と管理</h2><p>取得した情報は、利用目的の達成およびサービス運営に必要な期間保存し、不要になった情報は合理的な方法で削除または匿名化します。当社は、不正アクセス、漏えい、改ざん等を防ぐため合理的な安全管理措置を講じます。</p></section>

    <section class="section"><h2>7. 照会・削除の相談</h2><p>本サービスに関する利用者情報の照会、訂正、削除等の相談は、サポート窓口からご連絡ください。</p><p><a href="/support/">LEVEL UP サポート</a></p></section>

    <section class="section"><h2>8. 方針の変更</h2><p>サービス内容や法令等の変更に応じて本方針を変更することがあります。重要な変更がある場合は、本ページ等で分かりやすくお知らせします。</p></section>

    <section class="section"><h2>運営者</h2><p>株式会社まんがびと<br><a href="${companyUrl}" rel="external">会社概要</a></p></section>`
});

const terms = page({
  title: '利用規約',
  description: 'hitobito LEVEL UPの利用規約。',
  body: `
    <div class="kicker">TERMS</div>
    <h1>利用規約</h1>
    <p class="lead">この利用規約は、株式会社まんがびと（以下「当社」）が提供するhitobito LEVEL UP（以下「本サービス」）の利用条件を定めます。</p>

    <section class="section"><h2>1. サービスの位置づけ</h2><p>本サービスは、考え方・判断・行動を短いゲームや練習として反復するための自己改善・学習支援サービスです。医療行為、医療上の診断、治療、カウンセリングその他の専門サービスを提供するものではありません。</p></section>

    <section class="section"><h2>2. 利用</h2><p>利用者は、本規約および適用される法令に従って本サービスを利用できます。一部機能ではGoogleログイン等の外部認証を利用できます。認証情報の管理は、利用者自身の責任で行ってください。</p></section>

    <section class="section"><h2>3. 禁止事項</h2><ul>
      <li>法令または公序良俗に反する利用</li>
      <li>本サービス、他の利用者、第三者の権利・利益を侵害する行為</li>
      <li>不正アクセス、過度な負荷、サービス妨害、セキュリティ回避を試みる行為</li>
      <li>当社または第三者になりすます行為</li>
      <li>その他、当社がサービス運営上不適切と合理的に判断する行為</li>
    </ul></section>

    <section class="section"><h2>4. 知的財産</h2><p>本サービスに含まれる文章、デザイン、プログラム、ゲーム、名称、画像その他のコンテンツに関する権利は、当社または正当な権利者に帰属します。法令上認められる範囲を超えて、権利者の許可なく利用することはできません。</p></section>

    <section class="section"><h2>5. サービスの変更・停止</h2><p>当社は、品質改善、保守、障害対応、事業上の必要その他の理由により、本サービスの全部または一部を変更、追加、停止または終了することがあります。</p></section>

    <section class="section"><h2>6. 保証と責任</h2><p>当社は、本サービスの継続提供、特定の成果、完全性、正確性、特定目的への適合性を保証するものではありません。当社の責任は、適用される法令で免責・制限が認められる範囲に限られます。</p></section>

    <section class="section"><h2>7. プライバシー</h2><p>利用者情報の取扱いは、<a href="/privacy/">プライバシーポリシー</a>に従います。</p></section>

    <section class="section"><h2>8. 規約の変更</h2><p>当社は、サービス内容や法令等の変更に応じて本規約を変更することがあります。重要な変更がある場合は、本サービス上で分かりやすくお知らせします。</p></section>

    <section class="section"><h2>9. 準拠法</h2><p>本規約は日本法に準拠します。</p></section>

    <section class="section"><h2>運営者</h2><p>株式会社まんがびと<br><a href="${companyUrl}" rel="external">会社概要</a></p></section>`
});

const support = page({
  title: 'サポート',
  description: 'hitobito LEVEL UPのサポート窓口。',
  body: `
    <div class="kicker">SUPPORT</div>
    <h1>サポート</h1>
    <p class="lead">LEVEL UPの不具合、ログイン、データ、Plugin、その他のお問い合わせはこちらからお送りください。</p>
    <section class="section"><h2>お問い合わせ</h2><p>運営会社「株式会社まんがびと」のお問い合わせフォームで受け付けています。題名に「LEVEL UP」と入れていただくと内容を確認しやすくなります。</p><p><a class="button" href="${contactUrl}" rel="external">お問い合わせフォームを開く →</a></p></section>
    <section class="section"><h2>ご連絡時にあると助かる情報</h2><ul><li>利用していたゲーム名またはページURL</li><li>発生したこと</li><li>利用端末・ブラウザ</li><li>ログイン関連の場合は、発生したおおよその時刻</li></ul><p>パスワード、認証コード、秘密鍵などの機密情報は送らないでください。</p></section>
    <section class="section"><h2>運営者</h2><p>株式会社まんがびと<br><a href="${companyUrl}" rel="external">会社概要</a></p></section>`
});

const pages = [
  ['privacy', privacy],
  ['terms', terms],
  ['support', support],
];

for (const [slug, html] of pages) {
  const dir = path.join(outDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

for (const [slug] of pages) {
  const file = path.join(outDir, slug, 'index.html');
  if (!fs.existsSync(file)) throw new Error(`LEVEL UP public page missing: ${slug}`);
}

console.log('[Firebase] LEVEL UP privacy, terms and support pages generated.');
