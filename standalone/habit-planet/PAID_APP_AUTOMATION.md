# 有料アプリ本番化の自動化

`provisioning.json`を正本にし、Stripe、Cloudflare Workers/D1、Firebase Auth、Vercel proxyの差分を1コマンドで適用する。
秘密値はJSONやGitへ入れず、実行環境のsecretだけから渡す。

## 次アプリで変える値

1. `provisioning.json`をアプリのディレクトリへ複製する。
2. `app`、`cloudflare`、`firebase`、`stripe`、`vercel`を新アプリの値へ変更する。
3. `wrangler.example.jsonc`を複製し、D1の`database_id`はゼロUUIDのままにする。
4. Checkout用`stripe.integrationIdentifier`の末尾には新しいランダム英小文字8文字を使う。
5. プライバシーポリシー、利用規約、特定商取引法に基づく表示を先に公開する。

## dry-run

```bash
cd standalone/<paid-app>
npm install --ignore-scripts
npm run provision:plan
```

dry-runは設定の完全性、HTTPS、金額、Webhookイベント、integration identifierを検証するだけで、外部リソースを変更しない。

## 本番適用

次の値をCIの保護されたEnvironment secrets、または一時的なローカル環境変数で渡す。

- `STRIPE_ADMIN_SECRET_KEY`: Product、Price、Portal、Webhookを管理できる本番secret key
- `STRIPE_RUNTIME_SECRET_KEY`: Worker専用restricted key。Checkout Session、Customer Portal Session、Subscription readに必要な権限だけを付ける
- `STRIPE_WEBHOOK_SECRET`: 同じURLのWebhookが既にある場合のみ必要。新規作成時はStripe応答から自動取得する
- `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`: 対象Worker、D1、secretに限定した権限
- `GOOGLE_OAUTH_ACCESS_TOKEN`: Firebase Authentication設定更新権限の短命トークン
- `VERCEL_TOKEN`: 対象Teamとproxy projectに限定したトークン

```bash
npm run provision:apply
```

`--apply --yes`が揃わない限り、本番変更は行わない。適用すると次を順に実行する。

1. Stripe Productと月額PriceをIDまたは`app_key` metadataで再利用し、なければ冪等キー付きで作成
2. アプリ専用Customer Portal設定を作成・更新し、即時解約、請求書履歴、支払方法変更を有効化
3. 必要イベントだけのWebhookを作成・更新
4. `wrangler.jsonc`のPrice、Portal、Firebase、公開URLを更新
5. D1がゼロUUIDなら作成し、migrationを適用
6. Stripe runtime keyとWebhook secretをWorker secretへ標準入力で登録し、Workerをdeploy
7. Firebase authorized domainsへ独自ドメインを追加
8. Vercel proxyを作成・deployし、独自ドメインを割り当て

## リリースゲート

- Stripe Dashboardで本番モード、500円/月、税込、対象Productを確認する
- 法定表示3ページが200で表示され、販売者情報と問い合わせ手段が確定している
- Googleログイン後、別端末相当でD1同期を確認する
- 実カードで1件購入し、Webhook→D1→Pro反映を確認する
- Customer Portalで解約し、`customer.subscription.deleted`→D1→Pro解除を確認する
- Stripe、Cloudflare、Vercelのログに500エラーやWebhook再送がない
- E2E後、テスト用顧客・請求の扱いを経理方針に従って記録する

Habit Eggは別リポジトリ・別公開経路なので、この設定とdeploy対象へ含めない。
