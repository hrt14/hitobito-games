# Repository Inventory

更新日: 2026-08-26

GitHub / Vercel / Firebase / Cloudflare の役割が混ざらないようにするための整理台帳。

## 共通ルール

- Vercel の Git Integration は全プロジェクトで停止済み。
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
| `lastfire-idle` | Working Planet | 維持 | repo 名を `working-planet` へ変更候補 |
| `swipe-earth` | Swipe Earth | 当面維持 | 今後の利用状況で統合判断 |
| `-hitobito-lab` | ひとびと素材 | 維持 | repo 名を `hitobito-sozai` へ変更候補 |
| `forest-camp` | 雪原キャンプ MVP | 統合候補 | `hitobito-games/apps/forest-camp` へ移行後 Archive |
| `infra-king` | インフラ王 | 統合候補 | `hitobito-games/apps/infra-king` へ移行後 Archive |
| `coding-egg` | Touch Egg フィードバック実験 | Archive候補 | 必要要素を確認して Archive |
| `hirata-ai-company` | AI会社ごっこ実験 | 保留 | 継続利用なら維持、不要なら Archive |
| `-sleep-egg` | 空 repo | Archive候補 | Archive。不要確定後のみ削除検討 |

## 第一段階

コードや本番URLを動かさずに整理する。

1. Vercel Git Integration を全件停止する — **完了**
2. `hitobito-tools` README の古い公開構成と自動デプロイ記述を修正 — **完了**
3. `hitobito-games/HOSTING_POLICY.md` に Vercel manual deploy 方針を明記 — **完了**
4. `deploy-targets.json` に `gitIntegration: false` / `deployMode: manual` を記録 — **完了**
5. `-sleep-egg` を Archive — **手動管理操作待ち**
6. `coding-egg` を Archive候補として最終確認 — **手動管理操作待ち**
7. `-hitobito-lab` → `hitobito-sozai` の rename — **手動管理操作待ち**
8. `lastfire-idle` → `working-planet` の rename — **手動管理操作待ち**

## 第二段階

本番を壊さないよう、移行先で確認してから元 repo を Archive する。

- `forest-camp` → `hitobito-games/apps/forest-camp`
- `infra-king` → `hitobito-games/apps/infra-king`

履歴保存が必要なら git subtree / filter-repo 等を検討する。単純コピーで十分なら、まず現在版を移して本番確認し、その後元 repo を Archive する。
