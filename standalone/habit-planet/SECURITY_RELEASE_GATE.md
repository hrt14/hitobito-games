# Habit Planet — Security / Billing Release Gate

公開前の課金事故・不正アクセス対策の最終ゲート。
現時点の判定は **B: コード側はかなり固まっているが、外部設定が未完了**。
以下の外部設定を完了して実機確認が通るまでは、PR #459 を Draft のままにして本番公開しない。

## すでにコードで対策済み

### Firestore
- `users/{uid}/appState/habit_planet` の固定1ドキュメントだけ本人が `get/create/update` 可
- state書き込みは `state`, `updatedAt` の2フィールドだけ
- collection `list` 不可
- `entitlements/{uid}` は本人の `get` だけ。client write/list不可
- `stripeEvents/*` はserver only
- 未定義collectionは明示的にdeny
- クライアントは全件queryではなく固定document参照
- 現在Firestore Trigger Functionは使っていないため、Functionが自分の書き込みで再発火する無限ループ経路はない

### Cloud Functions / Cloud Run Functions
- `region: asia-northeast1`
- `minInstances: 0`
- `maxInstances: 2`
- `memory: 256MiB`
- `cpu: gcf_gen1`
- `concurrency: 1`
- `timeoutSeconds: 30`
- Checkout: 1ユーザー5回 / 10分のbest-effort rate limit
- Portal: 1ユーザー10回 / 10分のbest-effort rate limit
- user API body 32KiB、Stripe webhook 1MiB上限

### Stripe
- Webhookは `Stripe-Signature` をHMAC-SHA256で検証
- timestamp許容は5分
- 署名NGは処理しない
- webhook event IDは副作用が成功した後だけ保存し、失敗時のStripe retryを妨げない
- Checkout SessionはIdempotency-Key付き
- 既存subscriptionがあるユーザーの二重subscription作成を拒否

### App Check実装
- WebクライアントにreCAPTCHA Enterprise用App Checkコード実装済み
- Firestore SDKはApp Check初期化後にtokenを利用
- `/api/checkout` と `/api/portal` は `X-Firebase-AppCheck` を送信
- Functions側はApp Check token検証コード実装済み
- Stripe webhookはStripe自身から来るためApp Check対象外

## 公開前に外部設定で必須

- [ ] Firebase App Checkで `Habit Planet Web` + reCAPTCHA Enterpriseを登録
- [ ] `public/firebase-config.js` に公開site keyを設定
- [ ] App Check metricsで正規通信を確認
- [ ] FirestoreのApp Checkを **Enforce**
- [ ] Functions parameter `HABIT_PLANET_REQUIRE_APP_CHECK=true` で再deploy
- [ ] `Cloud Run Functions` Spend Cap 月500円が有効であることを再確認
- [ ] **Cloud Runにも別のSpend Cap 月500円を設定**
- [ ] project全体のBilling Alert 月1,000円を維持
- [ ] Billing Alertの通知先メールを実際に受信できることを確認
- [ ] Cloud Billing accountが「Free Trial」か「Paid」かを確認し、90日後に意図せず停止しない運用を決める
- [ ] Firebase/GCP IAMでGitHub deployerにHabit Planet projectの必要最小限deploy権限を付与

## Sandbox E2E必須

- [ ] Hosting / Firestore Rules / Functions deploy成功
- [ ] Googleログイン成功
- [ ] Firestore同期成功
- [ ] App Check Enforce後も正規クライアントのread/write成功
- [ ] App CheckなしのFunctions user APIが拒否される
- [ ] Stripe Sandbox Checkout成功
- [ ] Webhook署名OK
- [ ] `entitlements/{uid}` がactiveになる
- [ ] Pro機能が解放される
- [ ] Customer Portalが開く
- [ ] cancel_at_period_endが反映される
- [ ] subscription削除後にProが失効する
- [ ] webhook再送で二重副作用がない
- [ ] iPhone実機でPWA / タイマー / 通知 / 再訪を確認

## 現在の外部ブロッカー

GitHub ActionsからFirebase bootstrap deployを実行したところ、Workload Identity認証自体は成功したが、
`github-firebase-deployer@hitobito-levelup.iam.gserviceaccount.com` が `habit-planet-5bbc3` projectを参照できず停止した。

このIAMを解消するまではFirebase実機deploy・Stripe Sandbox E2Eへ進めない。

## 判定の上げ方

上の外部設定とE2Eをすべて通したら **A: 公開可** に上げる。
Firestore Security RulesやApp Check enforcementが緩い状態で公開する場合は **C: 公開しない** と扱う。
