# LEVEL UP deployment rule

LEVEL UP の正式な実装・公開経路は以下。

- Source repository: `hrt14/hitobito-games`
- App location: `apps/<slug>/`
- Production host: Firebase Hosting
- Production trigger: GitHub Actions
- Auto-dispatch workflow: `.github/workflows/auto-deploy-levelup-production.yml`
- Verified production workflow: `.github/workflows/deploy-levelup-production-closed-loop.yml`

## Important

- LEVEL UP に Vercel は使わない。
- `hrt14/hitobito-tools` は LEVEL UP の新規アプリ実装先として使わない。
- LEVEL UP の新規アプリは `hrt14/hitobito-games/apps/<slug>/` に追加する。
- 実装完了は、GitHub への反映だけではなく、Firebase Hosting への本番デプロイと本番URLでの確認までを含む。

Updated: 2026-08-30 JST
