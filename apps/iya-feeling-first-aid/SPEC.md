# 嫌な気持ち、いったん下げる — Product Spec

## Exact use moment
理由がはっきりしない不安・イライラ・恥ずかしさ・悲しさなどが急に湧き上がり、頭の中で原因探しや反芻を始めそうな人が、その場で約1分だけ使い、感情を消そうとせず「今すぐ反応しなければ」という圧を1段下げて次の数分へ戻る。

## Central benefit
急に来た嫌な気持ちの勢いを、原因分析より先にいったん下げる。

## Problem / design rationale
急な不快感の最中は「なぜ？」「どうしよう？」と説明や解決を急ぐほど、頭の中の材料を増やしやすい。本アプリは、まず波をやり過ごす短い待機、次に感情へ一語だけ名前をつけ、最後に注意を身体・目の前へ戻す構成にする。

感情へ言葉をつける affect labeling については、Lieberman et al. (2007) がネガティブ刺激に対する扁桃体反応の低下と関連する結果を報告している（PubMed PMID: 17576282）。呼吸については短時間で確実に感情を下げると誇張せず、数秒の「反応を遅らせる間」としてのみ使う。Breathing practices の系統的レビューでは、ストレス・不安低減の研究はある一方、短すぎる実施を万能視できないため、本アプリの効果を医療的に保証しない。

References:
- Lieberman MD, et al. Putting feelings into words: affect labeling disrupts amygdala activity in response to affective stimuli. Psychological Science. 2007. PMID 17576282. https://pubmed.ncbi.nlm.nih.gov/17576282/
- Bentley TGK, et al. Breathing Practices for Stress and Anxiety Reduction: Conceptual Framework and Guidelines for Future Research. 2023. https://pmc.ncbi.nlm.nih.gov/articles/PMC10741869/

## Core interaction
1. いまの強さを1〜5で1タップ記録する。
2. 大きな「波」へ指を置き、8秒だけ押したままにする。押している間は波の高さが少しずつ下がる。これは「消す」操作ではなく「反応せず通過を待つ」身体的な比喩。
3. 一番近い感情ラベルを1つ選ぶ。「私は不安」ではなく「不安が来てる」と表示し、感情と自分を同一化しすぎない。
4. いま近い場所を「体 / 思い出 / 先の想像 / 相手 / 理由不明」から1つ選ぶ。
5. そのタイプに合う30秒未満のアンカーを1つ選び実行する（足裏、肩、視線、水など）。
6. 強さをもう一度1〜5で記録し、下がった段階と今回効いたアンカーを保存する。

この操作は説明を読む訓練ではなく、「待つ → 名前をつける → 今へ戻す」という順番そのものを身体で反復する。

## First 10 seconds
最初の画面でタイトル「嫌な気持ち、いったん下げる」、補足「理由はあとでいい。まず1分だけ波を下げる。」、1〜5の強さボタンを同時に表示する。開始ボタンやチュートリアルを挟まず、最初のタップからセッションが始まる。

## Success condition
終了時に、開始時より強さが1段階以上下がる、または同じ強さでも「原因探し・即反応」をせず一連の1分を完走して、次にやる小さい行動を選べている。下がらなかった場合も「失敗」扱いせず、再実行または別の対処へ移れる。

## Uniqueness
既存の「機嫌は自分で取る」は日常の嫌な出来事に対して自分側の回復手段を増やす2分トレーニング。本作は、出来事や原因が明確でないまま急に感情が立ち上がった瞬間の約1分の救急フローであり、訓練ではなく実使用を主目的にする。

## Repeat-use strategy
急な不快感が来たたびに使える。直近7回の「開始強度 → 終了強度」と選んだアンカーを localStorage に保存し、3回以上使ったら「自分は何で下がりやすいか」を実測で表示する。ポイントや連続ログインではなく、自分に効く戻し方を覚えることを再訪価値にする。

## Title rationale
- Main user benefit/motive: 急な不快感から少し楽になる / 怖れ・不快から距離を取る。
- Why this title is direct and specific: 「嫌な気持ち」という利用瞬間と「いったん下げる」という控えめな約束をそのまま表す。
- How it matches the actual app: セッション前後の強度を測り、消す・治すではなく1段下げる設計。
- Market/uniqueness checks actually performed: 2026-08-29 に Web 検索で「嫌な気持ち、いったん下げる」「嫌な気持ち リセット」の Amazon.co.jp 一致候補を確認し、前者の一致結果は確認できなかった。医療・治療を連想させる強い表現は避けた。
