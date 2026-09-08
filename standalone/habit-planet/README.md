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

- Firebase Hosting: SPA / PWA
- Firebase Authentication: Google
- Cloud Firestore: app state + entitlement
- Cloud Functions for Firebase: Stripe Checkout / Customer Portal / Webhook
- Stripe: Hosted Checkout / Billing

通常利用の状態は `users/{uid}/appState/habit_planet` の1ドキュメントへ保存し、Firestoreのreadを増やしすぎない構成にしている。
Pro状態は `entitlements/{uid}`。クライアントは自分のentitlementを読むだけで書けない。

## Firebaseを作ったあとに行う設定

Habit Planet専用の新規Firebase projectを作る。既存LEVEL UPの `hitobito-levelup` には載せない。

1. Authentication > Sign-in method > Google を有効化
2. Firestore Databaseを作成
3. Hostingを有効化
4. Functionsを使うためBillingをBlazeへ接続（固定月額ではなく従量。無料枠内なら実請求0円になり得る）
5. Web appを登録し、公開Firebase configを `public/firebase-config.js` に入れる
6. `.firebaserc.example` を `.firebaserc` にコピーし project ID を入れる
7. `firebase functions:secrets:set STRIPE_SECRET_KEY`
8. `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`（Webhook作成後）
9. Sandboxは `STRIPE_HABIT_PLANET_PRICE_ID=price_1UDOG913XnwPDs4e0qYRUIXo`
10. `HABIT_PLANET_PUBLIC_ORIGIN` を実際のHosting URLに設定
11. `firebase deploy --only firestore:rules,hosting,functions`

秘密鍵をGitHubやクライアントJSに置かない。

## Stripe Webhook

デプロイ後のURL:

`https://<HOST>/api/stripe-webhook`

購読イベント:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

FunctionsはStripe署名を5分許容で検証し、Firestoreの `stripeEvents/{eventId}` を処理済みマーカーとして使用する。

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
- Live用Product/Price/WebhookはSandboxと分離して新規作成
