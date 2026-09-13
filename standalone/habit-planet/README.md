# Habit Planet

毎日の行動を「自分の惑星の成長」に変換する習慣・タイマーアプリ。
Habit Eggの成熟した実用機能をベースにしつつ、既存Habit EggのDB/認証/ユーザーデータは一切移行せず、Firebaseの新規アプリとして独立させる。

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

## 構成

- Firebase project: `habit-planet-5bbc3`
- Firebase Hosting: SPA / PWA
- Firebase Authentication: Google
- Cloud Firestore: app state + entitlement
- Cloud Functions for Firebase (2nd gen / Cloud Run Functions): Stripe Checkout / Customer Portal / Webhook
- Stripe: Hosted Checkout / Billing

通常利用の状態は `users/{uid}/appState/habit_planet` の1ドキュメントへ保存し、Firestoreのreadを増やしすぎない構成にしている。
Pro状態は `entitlements/{uid}`。クライアントは自分のentitlementを読むだけで書けない。

## 課金事故のガードレール

Google Cloud / Firebase側で設定済み:
- Blaze従量課金
- project全体の通常Budget Alert: 月 `¥1,000`
- `Cloud Run Functions` の Spend Cap enforcement: 月 `¥500`
- 通知: 50% / 80% / 100%

コード側でもFunctionsの暴走を抑える:
- `minInstances: 0`
- `maxInstances: 2`
- `memory: 256MiB`
- `cpu: gcf_gen1`（低メモリFunctionsのfractional CPU相当）
- `concurrency: 1`
- `timeoutSeconds: 30`
- Checkout: 1ユーザー5回 / 10分のbest-effort rate limit
- Portal: 1ユーザー10回 / 10分のbest-effort rate limit
- user API request body 32KiB、Stripe webhook 1MiBに制限

Firestore:
- ユーザーは自分の固定 `habit_planet` state documentだけ取得・更新可
- 書き込みfieldは `state`, `updatedAt` のみ
- entitlementは自分のdocumentの取得のみ、client write/list不可
- Stripe event markerはserver only
- 未定義collectionはexplicit deny

Hosting:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- camera / microphone / geolocation / payment permissionsを禁止

> Spend Capは課金集計の遅延があるため「500円を1円も超えない」保証ではない。コード側のmaxInstances等と二重で守る。

## App Check

WebクライアントとHTTP APIにはApp Check対応コードを準備済み。
初回deployを壊さないため、まだenforcementはOFFの状態で出せる。

有効化手順:
1. Google CloudでWeb用reCAPTCHA Enterprise score-based keyを作成
2. Firebase > App Checkで `Habit Planet Web` を登録
3. 公開site keyを `public/firebase-config.js` の `HABIT_PLANET_APP_CHECK_SITE_KEY` に入れる
4. メトリクスを確認
5. FirestoreのApp Check enforcementをON
6. Functions parameter `HABIT_PLANET_REQUIRE_APP_CHECK=true` で再deploy

Checkout / Portalは `X-Firebase-AppCheck` を送信し、Functions側でFirebase Admin SDKを使ってtokenを検証する。Stripe webhookはStripe自身から来るためApp Check対象外。

## Firebase初期設定状況

完了:
1. Authentication > Googleを有効化
2. Firestore Database作成
3. Hosting有効化
4. Blaze接続
5. Web app `Habit Planet Web` 登録
6. Firebase公開config反映
7. project Budget Alert / Cloud Run Functions Spend Cap設定

未完了:
1. `STRIPE_SECRET_KEY` をFirebase Secret Managerへ設定
2. 初回 Hosting / Firestore Rules / Functions deploy
3. deploy後のStripe Sandbox webhook endpoint作成
4. `STRIPE_WEBHOOK_SECRET` をFirebase Secret Managerへ設定してFunctions再deploy
5. App Check登録・enforcement
6. Sandbox E2E

秘密鍵をGitHubやクライアントJSに置かない。

## Stripe Webhook

デプロイ後のURL:

`https://habit-planet-5bbc3.web.app/api/stripe-webhook`

購読イベント:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

FunctionsはStripe署名を5分許容で検証し、Firestoreの `stripeEvents/{eventId}` を処理済みマーカーとして使用する。
処理済みマーカーは副作用がすべて成功した後に保存するので、一時障害時はStripe retryで復旧できる。

## deploy parameter / secret

- `STRIPE_SECRET_KEY`: Firebase Secret Manager（必須）
- `STRIPE_WEBHOOK_SECRET`: Firebase Secret Manager（webhook deploy時に必須）
- `STRIPE_HABIT_PLANET_PRICE_ID`: default `price_1UDOG913XnwPDs4e0qYRUIXo`
- `HABIT_PLANET_PUBLIC_ORIGIN`: default `https://habit-planet-5bbc3.web.app`
- `HABIT_PLANET_REQUIRE_APP_CHECK`: default `false`

手動deploy例:

`firebase deploy --only firestore:rules,hosting,functions --project habit-planet-5bbc3`

## ローカル確認

Firebase未設定でもLocalStorageモードで無料機能は動作する。
localhostでPro UI/機能だけ確認する場合:

`http://localhost:PORT/?pro_preview=1`

これはlocalhost限定でStripe購入権限を偽装する開発用表示で、本番ホストでは有効にならない。

## 本番化前チェック

- Sandbox checkout成功
- webhook署名OK
- checkout後に `entitlements/{uid}` がactiveになる
- Pro解放
- Customer Portalからcancel_at_period_end
- 期間終了/削除イベントでPro失効
- Webhook再送で二重副作用なし
- Googleログイン / Firestore同期
- iPhoneでPWA / タイマー / 通知挙動
- 無料ユーザーからPro機能が直接使えない
- App Check enforcement後も正規Webアプリが動く
- Live用Product/Price/WebhookはSandboxと分離して新規作成
