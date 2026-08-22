# 言いたいことを、ちゃんと言える。 — Quality Report

## Test environment
- Browser/device: UNVERIFIED（実装前）
- Viewport: UNVERIFIED
- Build/commit: SPEC作成時点
- Production URL (if production verification is required): UNVERIFIED

## First-time clarity
- Status: UNVERIFIED
- Observed evidence: 実装後に初回表示から10秒以内の理解を実ブラウザで確認する。

## Main interaction
- Status: UNVERIFIED
- Observed evidence: 実装後に反射カード排除→返答組み立て→押し返しラウンドを実操作する。

## Wrong / failure path
- Status: UNVERIFIED
- Observed evidence: 受け身・攻撃的・曖昧な断片を選んだ際のフィードバックと復帰を確認する。

## Correct / success path
- Status: UNVERIFIED
- Observed evidence: 事実・立場・要望／境界を組み、押し返しにも再主張して完了できるか確認する。

## Back / exit
- Status: UNVERIFIED
- Observed evidence: 実装後にホームへ戻る操作と再開始を確認する。

## Reload
- Status: UNVERIFIED
- Observed evidence: 実装後にリロード時の進行・保存データの扱いを確認する。

## Revisit
- Status: UNVERIFIED
- Observed evidence: 実装後に技能履歴が保存され、次回の練習へ反映されるか確認する。

## Mobile readability and tap targets
- Status: UNVERIFIED
- Observed evidence: 実装後にスマホ幅で文字サイズ、折返し、主要タップ領域を確認する。

## Production verification
- Status: UNVERIFIED
- Observed evidence: Firebase本番反映後に公開URLで確認する。

## Final scores
Clarity: 0/10
Usefulness: 0/10
Interaction quality: 0/10
Uniqueness: 0/10
Repeat value: 0/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: UNVERIFIED
Reason: 実装・実ブラウザテスト前のため判定しない。

## Remaining issues
- UIとゲームロジックを実装する。
- 実ブラウザ／スマホ幅で全フローを操作する。
- 品質ゲートを通す。
- Firebaseへ反映し本番確認する。
