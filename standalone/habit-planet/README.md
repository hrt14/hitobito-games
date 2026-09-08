# Habit Planet

毎日の行動を「自分の惑星の成長」に変換する習慣・タイマーアプリ。
Habit Eggの成熟した実用機能をベースにしつつ、既存Habit EggのDB・認証・ユーザーデータは移行しない独立アプリ。

## 料金

### Free
- 日次習慣 / 毎日〜6日おき
- タイマー / 記録 / 補正 / 複数同時計測
- 惑星育成 / 星図
- 集中・呼吸モード
- 作業しすぎ防止

### Habit Planet Pro — ¥500/月
- 毎週タスク
- 毎月タスク
- ワンタイムタスク
- 終了して明日に送る
- 分析 / 履歴修正 / CSV

Stripe Sandbox:
- Product: `prod_VDpvSMqdeljCGP`
- Price: `price_1UDOG913XnwPDs4e0qYRUIXo`

## 本番アーキテクチャ

Habit Planetの本番経路は次に統一する。

- Cloudflare Workers + Static Assets: Web配信とAPI
- Cloudflare D1: アプリ状態 / Pro entitlement / Stripe event marker
- Firebase Authentication: Googleログインだけを利用
- Stripe: Hosted Checkout / Customer Portal / Webhook

**本番経路では Firestore / Firebase Hosting / Firebase Functions を使わない。**
Firebase版は別ブランチ / PR #459 に退避してあり、Cloudflare版のロールバック比較用に残す。

## D1

初期migration: `migrations/0001_init.sql`

### `user_states`
1ユーザーにつき1行。現在のアプリ状態全体をJSONで保存し、細かいテーブル分割によるread増加を避ける。

- `uid` primary key
- `state_json`
- `updated_at`

### `entitlements`
Stripe subscriptionから作るserver-ownedのPro状態。

- `uid` primary key
- `status`
- `stripe_customer_id`
- `stripe_subscription_id`
- `current_period_end`
- `cancel_at_period_end`
- `updated_at`

### `stripe_events`
Webhook再送時の重複副作用を防ぐ処理済みイベントID。
副作用が成功した**後**にマーカーを保存するため、一時障害時はStripe retryで復旧できる。

## Worker API

`worker/index.js`

- `GET /api/state` — 自分の状態を取得
- `PUT /api/state` — 自分の状態を保存
- `GET /api/entitlement` — 自分のPro状態を取得
- `POST /api/checkout` — Stripe Hosted Checkout開始
- `POST /api/portal` — Stripe Customer Portal開始
- `POST /api/stripe-webhook` — Stripe Webhook受信

`state`は最大1MiB。Checkout/PortalはFirebase Auth必須。WebhookはFirebase AuthではなくStripe署名で保護する。

## Firebase Authentication

FirebaseはGoogleログイン専用で使う。Firestore SDKやFirebase Admin SDKはCloudflare版には入れない。

ブラウザはFirebase ID TokenをWorkerへBearer tokenとして送る。WorkerはGoogleの公開証明書を使って署名検証する。

必須検証項目:

1. `alg` が `RS256`
2. `kid` がGoogle公開証明書リストに存在
3. JWT署名が正しい
4. `exp` が未来
5. `iat` が未来ではない
6. `aud` が `habit-planet-5bbc3`
7. `iss` が `https://securetoken.google.com/habit-planet-5bbc3`
8. `sub` が空でなく128文字以下
9. `auth_time` が未来ではない

公開証明書はGoogleのレスポンスのHTTP cache policyに従いCloudflare Cache APIへ保存する。未知の`kid`が来た場合は1度だけcacheを破棄して再取得し、鍵ローテーションに追従する。

Firebase Authのauthorized domainには、最終的なCloudflare Worker / custom domainを追加する。

## Stripe

Sandboxで先にE2Eする。

必要な秘密値:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

これらは**Wrangler config、GitHub、クライアントJS、チャットへ書かない**。
Cloudflare側へsecretとして直接登録する。

通常変数:
- `STRIPE_PRICE_ID=price_1UDOG913XnwPDs4e0qYRUIXo`
- `FIREBASE_PROJECT_ID=habit-planet-5bbc3`
- `PUBLIC_ORIGIN=<Cloudflareの実URL>`

Webhook購読イベント:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Webhookは`stripe-signature`をHMAC-SHA256で検証し、timestamp許容は5分。CheckoutはFirebase uid + 10分bucketのStripe Idempotency-Keyを送って連打時の重複session作成を抑える。

## Cloudflare初期セットアップ

Cloudflare側のD1 database IDはまだリポジトリへ固定していない。実環境作成後に以下を行う。

1. `habit-planet` D1 databaseを作成
2. `wrangler.example.jsonc` を `wrangler.jsonc` へコピー
3. `database_id` を実D1 IDへ置換
4. `PUBLIC_ORIGIN` を実URLへ置換
5. D1 migrationを適用
6. Stripe secretsをCloudflareへ直接登録
7. deploy
8. Firebase Auth authorized domainへ公開domainを追加
9. Stripe Sandbox Webhookを `/api/stripe-webhook` へ接続
10. Sandbox E2E

ローカル例:

```bash
cd standalone/habit-planet
npm install
cp wrangler.example.jsonc wrangler.jsonc
npm run d1:migrate:local
npm run dev
```

remote D1 IDを入れた後:

```bash
npm run d1:migrate:remote
npm run deploy
```

secretはCloudflare dashboardまたはWranglerのsecret登録機能から入力し、shell historyやファイルに残さない。

## D1使用量を増やしすぎない設計

- アプリ状態は1ユーザー1 row
- タイマーの1秒tickではD1を書かない
- 変更時のcloud saveはdebounce
- entitlementの通常pollは60秒に1回
- tabが再表示された時は即refresh
- Stripe購入直後だけ最大約30秒、2秒間隔の限定fast poll

Free開発環境で1本のアプリがaccount-wide quotaを食い切らないよう、不要なpoll/read/writeを最初から抑える。

## Cloudflare料金運用

- 開発 / Sandbox: Workers Freeで検証
- **有料ユーザーから課金受付を開始する前にWorkers Paidへ変更**

Freeのハード停止は開発中の課金事故防止には有効だが、有料ユーザーが利用中にaccount-wide quotaへ到達するとサービス停止になるため、本番の課金受付後はPaidを前提にする。

D1/Workersは同一Cloudflareアカウント全体でquotaを共有する。Hitobitoの他アプリを増やす場合も、1アプリだけの使用量ではなくアカウント総量を監視する。

## Firebase Blaze → Sparkについて

**Cloudflare E2E完了前には降格しない。**

Cloudflare版でFireStore / Hosting / Functionsへの依存がゼロになったことを確認後、Firebase AuthenticationのIdentity Platform状態を確認する。

- Identity Platform未アップグレード: Spark降格候補
- Identity Platformアップグレード済み: 利用上限とAuth料金を確認してBlaze維持も検討

昨日作成したGCP Budget / Spend Capの削除も、Cloudflare移行完了とロールバック不要判断の後に行う。

## ローカル保存

Firebase未設定・未ログイン時もLocalStorageで無料機能は動く。
localhostでPro UIだけ確認する場合:

`http://localhost:PORT/?pro_preview=1`

これはlocalhost限定で、実課金entitlementを偽装するものではない。

## 本番化前E2E

- Cloudflare Static Assets表示
- Googleログイン
- Firebase ID Tokenの正常tokenのみWorkerで通る
- tokenなし / 改ざんtoken / wrong aud / expired tokenを拒否
- D1 state save / reload / 別uidアクセス不可
- Sandbox Checkout成功
- Webhook署名OK / 不正署名拒否
- checkout後にD1 entitlementがactive
- Pro解放
- Customer Portal
- `cancel_at_period_end`反映
- subscription deletedでPro失効
- Webhook再送で重複副作用なし
- D1失敗時にWebhookが2xxを返さずStripe retry可能
- iPhone PWA / タイマー / 通知
- FreeユーザーからPro機能を直接使えない
- Firestore / Firebase Hosting / Firebase Functionsへ本番トラフィックがない
- Workers Paidへ変更後に課金受付開始
