# 10年後から戻ってきた — QUALITY

## Quality gate

### 分かりやすさ — 9/10
- 開始画面で「10年後の自分が戻る」「今日の分岐を1つ変える」「3分だけ」が同時に分かる。
- 各画面は STEP 表示と1つの主CTAに絞る。
- 「未来の予言ではない」と開始時・FUTURE LOGの両方で明示。

### 役立ち度 — 9/10
- 抽象的な人生診断で終わらず、最後は3分以内に開始できる具体行動へ落ちる。
- 「始める・連絡・予約・やめる・決める・片づける」の日常6場面を用意。
- 完璧な完了ではなく、現実での着手を成功条件にする。

### 操作の気持ちよさ — 9/10
- 2036年カプセルをNOWまで引く固有ドラッグ操作。
- 年号が2036→2026へ変化する即時フィードバック。
- 小さな振動、時間軸、ポータル、タイマーで操作結果を返す。
- reduced motion と非ドラッグ補助導線を用意。

### 独自性 — 10/10
- 「未来の自分から一手だけ持ち帰る」という制約がUI・コピー・操作・タイマーまで一貫。
- 一般的な3択診断、励ましアプリ、ToDoリストでは代用できない。

### 継続性 — 8/10
- 実際に着手した行動だけを未来変更ログとして蓄積。
- 別の分岐を1つずつ変える再プレイ導線。
- 直近ログを見て「やったこと」が残る。

**全項目7点以上。自己評価平均 9.0 / 10。**

## UI QA checklist

- [x] mobile-first single-column layout
- [x] safe-area inset対応
- [x] 主CTA 58px以上
- [x] タップ領域が近接しすぎない
- [x] 390px以下のレイアウト分岐あり
- [x] 700px以下の高さ圧縮あり
- [x] prefers-reduced-motion対応
- [x] 外部CDN / API依存なし
- [x] 相対manifest path
- [x] production Open Graph URL
- [x] localStorageのみで履歴保存
- [x] HTMLエスケープ関数で自由入力を再描画
- [x] pointer drag以外の補助ボタンあり
- [x] keyboard Enter / Space / ArrowDownでカプセル確定可能

## Interaction QA scenarios

1. 初回 → 開始 → テーマ選択 → FUTURE LOG → 一手選択 → drag → timer → done。
2. 自由入力42字以内 → drag → timer → done。
3. dragを使わず補助ボタン → timer。
4. timer開始 → 一時停止 → 再開。
5. timer途中で「できた」。
6. 「今日はここまで」で未着手保存。
7. 再プレイ → 別テーマ選択。
8. リロード後に未来変更ログが残る。
9. Web Share対応環境で共有、非対応環境でclipboard fallback。
10. Escapeで初期画面へ戻る。

## Production QA

本番反映後に以下を実ブラウザで確認して初めて完成扱いとする。

- [ ] `https://levelup.hitobito.jp/apps/10-years-back/` が200で開く
- [ ] タイトル / 初回CTAが見える
- [ ] 6テーマの選択が動く
- [ ] FUTURE LOGからmissionへ進める
- [ ] カプセルdragまたは補助ボタンでACTION WINDOWへ進める
- [ ] 3分タイマーの開始 / pause が動く
- [ ] done後に未来変更ログが増える
- [ ] reload後も履歴が残る
- [ ] 390px前後で横スクロールが出ない
- [ ] コンソールに致命的エラーがない

Production QAが未チェックの間は「実装済み・本番確認完了」と報告しない。
