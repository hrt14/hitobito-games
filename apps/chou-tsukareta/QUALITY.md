# 疲れたの正体 — Quality Report

## Test environment
- Browser/device: UNVERIFIED — GitHub connector経由で実装中。ブラウザ実機確認は本番反映後に実施する。
- Viewport: UNVERIFIED
- Build/commit: feat/chou-tsukareta-akinator
- Production URL (if production verification is required): https://levelup.hitobito.jp/apps/chou-tsukareta/

## First-time clarity
- Status: UNVERIFIED
- Observed evidence: 静的レビューでは、開始画面に「疲れたの正体」「いま何に削られているかを言葉にする」「7問以内 / 文字入力なし / 約1分」と主ボタン1つを配置。ブラウザ観察は未実施。

## Main interaction
- Status: UNVERIFIED
- Observed evidence: 回答後に6負荷軸を更新し、現在の上位候補を見分けやすい未出題の質問を動的選択するロジックを実装。最大7問、6問以降で主因と副因の差が十分なら終了する。ブラウザ観察は未実施。

## Wrong / failure path
- Status: NOT APPLICABLE
- Observed evidence: 正誤問題ではなく、自己状態の絞り込み。回答に「正解/不正解」は設定しない。

## Correct / success path
- Status: UNVERIFIED
- Observed evidence: 結果で主因タイトル、主因＋副因を合成した言語化文、上位負荷、いま減らすもの、今はしなくていいもの、関連LEVEL UPアプリを表示する実装。ブラウザ観察は未実施。

## Back / exit
- Status: UNVERIFIED
- Observed evidence: 1問戻る際に直前回答の重みをスコアから差し戻し、その質問を再表示する実装。トップへ戻るリンクも実装。ブラウザ観察は未実施。

## Reload
- Status: UNVERIFIED
- Observed evidence: 診断途中は保存しない設計。完了結果のみlocalStorageへ保存する。ブラウザ観察は未実施。

## Revisit
- Status: UNVERIFIED
- Observed evidence: 保存結果がある場合は開始画面から前回結果を開け、新規診断完了時には前回主因と今回主因の差を文章で表示する実装。保存結果の負荷バーは保存スコアから再計算するよう静的レビューで修正済み。ブラウザ観察は未実施。

## Mobile readability and tap targets
- Status: UNVERIFIED
- Observed evidence: 560px以下中心の1カラム、選択肢min-height 64px、主要操作48px以上、390px以下の調整、prefers-reduced-motion対応をCSSで実装。ブラウザ観察は未実施。

## Production verification
- Status: UNVERIFIED
- Observed evidence: Firebase Hosting本番反映と本番URLでの操作確認が残っている。

## Final scores
Clarity: 9/10
Usefulness: 9/10
Interaction quality: 8/10
Uniqueness: 9/10
Repeat value: 8/10

※上記は実装内容の静的セルフレビューによる暫定点。ブラウザ実機確認で下方修正を含め再評価する。

## Final question
If I genuinely had this problem, would I open this app again?

Answer: UNVERIFIED
Reason: 原因が分からない「疲れた」を具体的な言葉へ変え、前回との差も見られる設計なので再利用理由はあるが、実ブラウザでの体験確認前のためYESとは確定しない。

## Remaining issues
- 品質ゲートスクリプト実行
- モバイル相当viewportで開始→複数分岐→戻る→結果→再診断→前回比較をブラウザ確認
- Firebase Hosting本番反映後、levelup.hitobito.jpで実機確認
