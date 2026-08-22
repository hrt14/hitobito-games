# Hosting / Deploy Policy

更新日: 2026-08-23

## 基本方針

**公開ホスティングは Firebase / Google Cloud 系へ一本化する。Vercel は完全撤去する。Cloudflare は DNS 等で必要な場合のみ残し、Pages を本番ホスティングとして使わない。**

移行中のサービス停止を防ぐため、既存 Vercel / Cloudflare Pages 本番は Firebase 側の仮 URL・独自ドメイン・認証・API の確認が完了するまで削除しない。

### 配置ルール

- **Firebase Hosting**: 静的ポータル、通常ゲーム、LEVEL UP、静的音声サイト
- **Firebase App Hosting**: Next.js アプリ（SSR / Server Components / API を含むもの）
- **Cloud Functions for Firebase / Cloud Run**: API、バックグラウンド処理、サーバー処理
- **Cloud Scheduler + Functions / Cloud Run**: 定期処理
- **Firestore**: アプリデータ
- **Firebase Authentication**: ログイン
- **Cloud Storage for Firebase**: ファイル・音声
- **Secret Manager**: API キー等の秘密情報

## 1. Firebase Hosting — 静的公開物

Firebase Hosting に置くもの:

- Hitobito Games ポータル
- `hitobito-games/apps/*` の静的ゲーム
- LEVEL UP 系
- `audio-site` 等の静的サイト

静的サイトは GitHub Actions から Workload Identity Federation でデプロイし、長期鍵を GitHub Secrets に保存しない構成を標準とする。

既存の `hitobito-levelup` Firebase デプロイはこの標準構成の基準実装とする。

## 2. Firebase App Hosting — Next.js

Next.js 13.5+ のアプリは Firebase App Hosting を標準とする。

対象:

- `hrt14/ecplayers`
- `hrt14/hitobito-tools`
- `hrt14/hitobito-analytics`
- `hrt14/lastfire-idle`（Working Planet）
- 今後追加する Next.js ベースの Web アプリ

Firebase App Hosting の GitHub 連携を使い、production branch への push をロールアウトの起点とする。

環境変数は Firebase App Hosting の環境設定を使用し、秘密情報は Secret Manager を参照する。秘密値をリポジトリへコミットしない。

## 3. Vercel — 廃止

Vercel へ新規 production deploy しない。

移行対象として現在把握しているもの:

- `games.hitobito.jp`
- `404.hitobito.jp`
- `working-planet.hitobito.jp`
- Vercel で公開している Next.js アプリ

撤去手順:

1. Firebase 側に同等環境を作る
2. Firebase の仮 URL で build / route / auth / API を確認
3. 独自ドメインを Firebase 側へ追加
4. DNS を Firebase 指定値へ変更
5. HTTPS / ログイン / API /主要画面を実機確認
6. Vercel 由来の DNS レコードを削除
7. Vercel プロジェクトの Git 連携・環境変数・production deployment を停止
8. Vercel プロジェクトを削除
9. リポジトリ内の `vercel.json`、`.vercel*`、Vercel 用 workflow / deploy hook を削除

**Vercel の削除は 5 の確認完了後にのみ行う。**

## 4. Cloudflare Pages — 廃止予定

Cloudflare Pages への新規本番配置を増やさない。

既存 Pages 配信は Firebase Hosting へ移行後に停止する。Cloudflare を DNS / CDN / WAF 等で使う場合でも、アプリ本体の origin / hosting は Firebase / Google Cloud 系とする。

## 5. AAA LAB

AAA 品質を目指す実験は自動 production deploy しない。

初期対象:

- `apps/oceans-of-earth`
- `apps/astral-dawn`

流れ:

1. ローカル実装
2. `npm run human-test`
3. 実機テスト
4. 改善
5. GitHub へ保存
6. 公開判断後に Firebase Hosting / App Hosting の適切な方へ配置

## Human Playtest

人間テストプレイは全カテゴリ横断の入口として維持する。

```bash
npm run human-test
```

## 移行中の事故防止ルール

- Vercel / Cloudflare Pages の production を先に削除しない。
- DNS 切替前に Firebase の仮 URL で動作確認する。
- Next.js を旧 Framework-aware Firebase Hosting へ新規移行せず、Firebase App Hosting を使う。
- API キー・サービスアカウント JSON をリポジトリへ保存しない。
- GitHub Actions の Google Cloud 認証は Workload Identity Federation を標準とする。
- DNS 切替後は HTTP 200、主要 route、Firebase Auth、Firestore、API、モバイル実機まで確認する。
- 本番切替後、Vercel 依存ファイルと deploy hook を必ず削除する。
