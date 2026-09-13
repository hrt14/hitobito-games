# Habit Planet — Cloudflare Security / Release Gate

このファイルは「コードが書けた」ではなく、**課金ユーザーを受け付けてよい状態か**を判定するための公開前ゲート。
Cloudflare版はFirebase Authenticationだけを残し、Firestore / Firebase Hosting / Firebase Functionsを本番経路から外す。

## 判定

- 開発中: Workers Freeで可
- Sandbox E2E前: **公開不可**
- 有料ユーザー受付前: **Workers Paid必須**
- 下記の必須項目が1つでも未確認: **公開不可**

## 1. Cloudflare基盤

- [ ] `habit-planet` D1 databaseを作成
- [ ] `wrangler.example.jsonc` を元に実 `wrangler.jsonc` を作成
- [ ] `DB` bindingが正しいD1 database IDを参照
- [ ] Static Assets binding `ASSETS` が有効
- [ ] `/api/*` がWorkerを先に通る
- [ ] `migrations/0001_init.sql` をremote D1へ適用
- [ ] Cloudflare上の実URLを `PUBLIC_ORIGIN` に設定
- [ ] Workers / D1のusage notificationを受け取れる状態
- [ ] 同一Cloudflare accountの他アプリを含む総使用量を確認できる状態

## 2. 本番料金モード

Sandbox / 開発中はWorkers Freeでよい。

課金受付開始前:

- [ ] Workers Paidへ変更済み
- [ ] Paid切替後にWorker / D1 / Static Assetsが正常動作
- [ ] account-wide usageを確認

理由: Free quotaのハード停止は開発中の事故防止には有効だが、課金済みユーザーまで巻き込んで停止するため、本番の可用性要件には合わない。

## 3. Firebase Authentication

Firebase project: `habit-planet-5bbc3`

- [x] Googleログインを利用するコード
- [x] Firestore SDKをCloudflare版clientから除去
- [x] Firebase Admin SDKをWorkerで不使用
- [ ] Cloudflareの最終domainをFirebase Auth authorized domainsへ追加
- [ ] 実domainからGoogleログイン成功
- [ ] Identity Platformへのアップグレード有無を確認

Blaze → Spark降格は**Cloudflare E2E完了後**。先に降格しない。

## 4. Firebase ID Token検証

Workerで以下を全て必須にする。

- [x] Authorization Bearer必須
- [x] `alg === RS256`
- [x] `kid` 必須
- [x] `kid` がGoogle公開証明書に存在
- [x] 公開証明書で署名検証
- [x] `exp` が未来
- [x] `iat` が未来でない
- [x] `aud === habit-planet-5bbc3`
- [x] `iss === https://securetoken.google.com/habit-planet-5bbc3`
- [x] `sub` が空でなく128文字以下
- [x] `auth_time` が未来でない
- [x] Google公開証明書をCloudflare Cache APIでcache
- [x] 未知`kid`時に1回だけcache refreshして鍵ローテーションへ追従

実機 / integration test:

- [ ] 正常token → 200
- [ ] tokenなし → 401
- [ ] 改ざんtoken → 401
- [ ] wrong audience → 401
- [ ] expired token → 401

## 5. D1データ境界

D1はブラウザから直接触らせない。WorkerだけがDB bindingを持つ。

- [x] app stateはFirebase tokenの`sub`から決めたuidだけを読み書き
- [x] request bodyのuidを信用しない
- [x] state最大1MiB
- [x] 1ユーザー1 `user_states` row
- [x] entitlementはclient write APIなし
- [x] Stripe event markerはWebhook内部だけでwrite
- [ ] uid Aのtokenでuid Bのstateを取得できないことをintegration test
- [ ] malformed / oversized stateを400/413で拒否

## 6. D1使用量ガード

- [x] timerの秒tickではD1 writeしない
- [x] state saveはUI側でdebounce
- [x] entitlement通常pollは60秒
- [x] visible復帰時だけ追加refresh
- [x] Checkout成功直後のみ2秒pollを最大約30秒
- [ ] Cloudflare dashboardでD1 read/write usageを確認

## 7. Stripe secrets

- [ ] `STRIPE_SECRET_KEY` をCloudflare secretとして登録
- [ ] `STRIPE_WEBHOOK_SECRET` をCloudflare secretとして登録
- [ ] secretをGitHubへcommitしていない
- [ ] secretをclient JSへ含めていない
- [ ] secretをWrangler configのplain varsへ含めていない

Sandbox Price:
`price_1UDOG913XnwPDs4e0qYRUIXo`

## 8. Stripe Checkout / Portal

- [x] CheckoutはFirebase Auth必須
- [x] PortalはFirebase Auth必須
- [x] 既存subscription状態を見て二重契約を抑止
- [x] Stripe CheckoutへIdempotency-Keyを送る
- [x] success / cancel URLを`PUBLIC_ORIGIN`基準で生成
- [ ] Sandbox Checkout実決済
- [ ] Portalを開ける

## 9. Stripe Webhook

公開endpoint:
`/api/stripe-webhook`

- [x] `stripe-signature`必須
- [x] HMAC-SHA256署名検証
- [x] timestamp 5分許容
- [x] `checkout.session.completed`処理
- [x] subscription created / updated / deleted処理
- [x] entitlementをD1へ反映
- [x] event ID重複チェック
- [x] 副作用成功後にevent marker保存
- [ ] Sandbox webhook endpoint作成
- [ ] 正常署名 → 2xx
- [ ] 不正署名 → 400
- [ ] 同一event再送 → duplicate 2xx、二重副作用なし
- [ ] D1一時失敗 → event marker未保存、2xxにせずStripe retry可能

## 10. Static Assets / browser security

- [x] `X-Content-Type-Options: nosniff`
- [x] `X-Frame-Options: DENY`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] camera / microphone / geolocation / payment Permissions Policyを禁止
- [ ] Cloudflare実URLでheadersを確認
- [ ] SPA deep-link / service worker / manifest確認

## 11. Habit Planet機能E2E

- [ ] 初回表示
- [ ] 習慣追加
- [ ] タイマー開始 / pause / resume / finish
- [ ] LocalStorage再訪
- [ ] Googleログイン
- [ ] D1 state cloud sync
- [ ] 18惑星の星図
- [ ] Pro分析
- [ ] 毎週 / 毎月 / one-time
- [ ] 明日送り
- [ ] Stripe購入 → Pro unlock
- [ ] cancel_at_period_end反映
- [ ] subscription deleted → Pro lock
- [ ] iPhone PWA

## 12. Firebase旧基盤の停止確認

Cloudflare E2E成功後:

- [ ] Cloudflare版browserにFirestore requestがない
- [ ] Firebase Hostingを本番URLに使っていない
- [ ] Firebase Functionsへ本番requestがない
- [ ] Firebase版PR #459をfallbackとして残す / 廃止判断は別途
- [ ] Identity Platform状態を確認してからBlaze → Spark判断
- [ ] GCP Spend Cap / Budgetの削除はロールバック不要判断後

## 公開判定

**Sandbox E2E成功 + Worker token検証 + D1境界 + Stripe署名 + Workers Paid + Firebase authorized domain** が全部確認できるまで課金受付を開始しない。
