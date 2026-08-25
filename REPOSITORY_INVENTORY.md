# Repository Inventory

更新日: 2026-08-26

GitHub / Vercel / Firebase / Cloudflare の役割が混ざらないようにするための整理台帳。

## 共通ルール

- Vercel の Git Integration は全プロジェクトで停止済み。
- Cloudflare / Firebase の production GitHub Actions も `workflow_dispatch` のみに変更済み。
- GitHub への push / PR / merge と本番 deploy は分離する。
- 不要 repo はいきなり削除せず、まず Archive を基本とする。
- 独立サービスとして運用するものは 1 repo を維持する。
- 小〜中規模のゲームは原則 `hitobito-games/apps/<slug>` に集約する。
- repo 名はサービス名・本番名とできるだけ一致させる。

## 現行リポジトリ

| Repository | 主な用途 | 方針 | 次の整理 |
| --- | --- | --- | --- |
| `ecplayers` | ECplayers | 維持 | Cloudflare Workers 運用を継続 |
| `hitobito-games` | Games / LEVEL UP / Playtest | 中核として維持 | 小〜中規模ゲームの集約先 |
| `hitobito-tools` | hitobito.jp / tools / 2100 / drop / life1 など | 維持 | ルートと公開先の対応表を継続整備 |
| `hitobito-analytics` | GA4 分析アプリ | 維持 | 独立サービスとして管理 |
| `habit-egg` | Habit Egg | 維持 | 独立サービスとして管理 |
| `touch-egg` | Touch Egg | 維持 | 独立サービスとして管理 |
| `chinese-instant-composition` | 中国語瞬間作文 | 維持 | 独立サービスとして管理 |
| `working-planet` | Working Planet | 維持 | 独立ゲームとして管理 |
| `swipe-earth` | Swipe Earth | 当面維持 | 今後の利用状況で統合判断 |
| `hitobito-sozai` | ひとびと素材 | 維持 | 独立サービスとして管理 |
| `forest-camp` | 雪原キャンプ MVP | 統合候補 | Vite構成をmonorepo向けに調整後 `apps/forest-camp` へ移行 |
| `infra-king` | インフラ王 | 統合済み・元repo維持中 | `apps/infra-king` へコピー済み。本番確認後に元repoをArchive |
| `coding-egg` | Touch Egg フィードバック実験 | Archive済み | 必要になれば解除可能 |
| `hirata-ai-company` | AI会社ごっこ実験 | 保留 | 継続利用なら維持、不要なら Archive |
| `-sleep-egg` | 空 repo | Archive済み | 不要確定後のみ削除検討 |

## 第一段階

1. Vercel Git Integration を全件停止 — **完了**
2. `hitobito-tools` README 更新 — **完了**
3. `hitobito-games/HOSTING_POLICY.md` に manual deploy 方針を明記 — **完了**
4. `deploy-targets.json` に `gitIntegration: false` / `deployMode: manual` を記録 — **完了**
5. `-sleep-egg` を Archive — **完了**
6. `coding-egg` を Archive — **完了**
7. `-hitobito-lab` → `hitobito-sozai` — **完了**
8. `lastfire-idle` → `working-planet` — **完了**
9. Cloudflare Pages production Action を manual-only 化 — **完了**
10. Firebase LEVEL UP production Actions を manual-only 化 — **完了**

## 第二段階

### infra-king

- `hrt14/infra-king` の現行 `index.html` / `style.css` / `game.js` を `hitobito-games/apps/infra-king` へ同一内容で統合 — **完了**
- main への反映 — **完了**
- Cloudflare Pages への手動デプロイ — **未実施**
- `https://play.hitobito.jp/apps/infra-king/` の本番確認 — **未実施**
- 元repo `hrt14/infra-king` のArchive — **本番確認後**

### forest-camp

- `forest-camp` → `hitobito-games/apps/forest-camp`
- 現状は Vite + React (`/src/main.jsx`)。静的ゲーム群へそのまま置けないため、ビルド方式または静的化を決めてから移行する。

元repoのArchiveは、移行先の本番確認が終わってから行う。
