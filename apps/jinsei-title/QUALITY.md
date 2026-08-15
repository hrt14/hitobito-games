# 品質確認

- [x] HTML構文を標準パーサーで読める
- [x] スマホviewport + safe area
- [x] 外部ランタイム依存なし
- [x] 8シナリオ
- [x] 6編集レンズ
- [x] レンズ別BGM
- [x] レンズ別選択肢
- [x] 空入力ブロック
- [x] Enter入力対応
- [x] 8問後リザルト
- [x] リプレイ初期化
- [x] サウンド切替
- [x] 自由入力タイトルをHTMLエスケープ
- [x] JavaScript `node --check` 合格
- [x] 外部依存なし
- [x] GitHubブランチ `feat/jinsei-title`
- [ ] Vercelデプロイ（意図的に未実施）

## 備考

この実行環境のChromium headlessはDBus/zygote起動で停止したため、スクリーンショットによる実ブラウザ確認は未完了。静的構文・進行ロジック・主要UI条件は機械チェック済み。
