# Hosting / Deploy Policy

更新日: 2026-08-26

## 基本方針

ゲームは「作ったAI」ではなく、作品の性質と運用単位で分ける。

- **Vercel**: ポータルと主力ゲーム
- **Cloudflare Pages**: 小〜中規模の通常ゲームをまとめて配信
- **Firebase Hosting**: LEVEL UP 系
- **AAA LAB**: サーバー公開しない。人間テストプレイ専用

コミットと公開は分離する。作業中は何度でも commit してよいが、公開 deploy は作業セッションの区切りでまとめて行う。

### Vercel Git Integration

2026-08-26、Vercel の全プロジェクトで Git Integration を停止した。

- GitHub への push / PR / merge を Vercel の自動デプロイのトリガーにしない。
- Preview Deployment も自動生成しない。
- Vercel へ公開するときは、対象プロジェクトと変更内容を確認して意図的にデプロイする。
- 「GitHubへ保存」と「本番へ公開」は別作業として扱う。

目的は、開発中の細かな commit や別作品の変更で Vercel の無料デプロイ枠を消費しないこと。

## 1. Vercel — 主力 / 入口

Vercelに残すもの:

- `games.hitobito.jp` — Hitobito Games ポータル
- `404.hitobito.jp` — 404怪異調査クラブ
- `working-planet.hitobito.jp` — Working Planet

主力作品は通常ゲームの一括デプロイに巻き込まない。404 / Working Planet はそれぞれ独立プロジェクトのまま育てる。

## 2. Cloudflare Pages — 通常ゲーム

`hitobito-games/apps/*` のうち、以下を除く小〜中規模ゲームを一つのPagesプロジェクトにまとめる。

除外:

- `404-kaiki`（Vercel主力）
- `levelup` カテゴリ（Firebaseへ）
- `aaa-lab` カテゴリ（人間テスト限定）

運用イメージ:

1. 複数ゲームをローカルで修正
2. 修正ごとに commit
3. 人間テストプレイ
4. 区切りのよいところで一度だけ Cloudflare Pages へ deploy

## 3. Firebase Hosting — LEVEL UP

LEVEL UP 系は Firebase Hosting にまとめる。

対象は `scripts/playtest-catalog.mjs` で `category: levelup` として管理するゲーム、および LEVEL UP の Next.js 側ゲーム。

移行完了までは既存Vercel公開を壊さない。Firebase側のホスティングとドメインが正常に確認できてから切り替える。

## 4. AAA LAB — 人間テスト限定

AAA品質を目指す超実験は公開ホスティングへ自動deployしない。

初期対象:

- `apps/oceans-of-earth` — 一人称水族館 / 海洋AAA実験
- `apps/astral-dawn` — Three.js JRPG AAA実験

今後のFPS等もここへ入れる。

AAA LABの流れ:

1. ローカル実装
2. `npm run human-test`
3. 実機でプレイ
4. 改善
5. GitHubへ保存
6. **外部ホスティングへは出さない**

## Human Playtest

人間テストプレイは全カテゴリ横断の入口として維持する。

```bash
npm run human-test
```

AAA LAB は人間テスト画面上で専用カテゴリとして表示する。

## 事故防止ルール

- 新しい小〜中規模ゲームのためにVercelプロジェクトを新規作成しない。
- Vercel の Git Integration を安易に再接続しない。
- AAA LABをVercel / Cloudflare / Firebaseのproductionへ自動deployしない。
- 404 / Working Planetを通常ゲーム一括ホスティングへ混ぜない。
- ホスティング移行時は先に新環境で動作確認し、既存ドメインを最後に切り替える。
- 既存の本番環境を移行途中で削除しない。
