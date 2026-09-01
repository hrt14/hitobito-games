# 成功する方で考える。 — Product Spec

## Exact use moment
何かを出す・話す・始める直前に、「失敗したら」「うまくいかなかったら」という予測が枝分かれして行動が弱くなりそうな人が、30〜60秒で必要なリスク確認だけを終え、成功する前提の具体的な一手へ戻るために使う。

## Central benefit
失敗予測の反芻を短く打ち切り、成功側の行動を1つ選んで実行しやすくする。

## Problem / design rationale
反復的な否定思考や反芻は、問題解決や目的に沿った行動を妨げることがある。一方で、望む未来を気持ちよく想像するだけでは努力につながらない場合もあるため、このアプリは「成功を保証する」「不安を無視する」設計にはしない。

セッションでは、まず最悪ケースが対処可能かを一度だけ確認する。その後は失敗可能性を増殖させず、成功する可能性があるなら「通す・伝える・終える・始める」ための具体的な行動へ注意を戻す。成功期待を行動へつなぐことを中心にし、空想だけで終わらせない。

Research basis checked for this design:
- Oettingen & Mayer (2002), *The motivating function of thinking about the future: expectations versus fantasies*, JPSP. PubMed: https://pubmed.ncbi.nlm.nih.gov/12416922/
- Oettingen, Pak & Schnetter (2001), *Self-regulation of goal setting: turning free fantasies about the future into binding goals*, JPSP. PubMed: https://pubmed.ncbi.nlm.nih.gov/11374746/
- Watkins (2008), *Constructive and unconstructive repetitive thought*, Psychological Bulletin. PubMed: https://pubmed.ncbi.nlm.nih.gov/18298268/
- Watkins & Roberts (2020), *Reflecting on rumination*, Behaviour Research and Therapy. PubMed: https://pubmed.ncbi.nlm.nih.gov/32087393/

## Core interaction
1. 実生活の場面と、そこから枝分かれして増えていく「失敗予測」が画面に出る。
2. ユーザーは枝を1本ずつ読んで解決するのではなく、画面上の枝をスワイプ／タップで切って「これ以上増やさない」を身体的に実行する。
3. 「最悪でも対処できる？」を1回だけ確認し、場面ごとの現実的なリカバリー手段を選ぶ。
4. 最後に中央の大きな「成功する方で考える」レバーを前へ押し、その場面で成功確率を上げる具体的な一手を選ぶ。
5. 枝分かれしていた画面が一本の前進ラインに収束する。

操作そのものを「反芻の枝を切る → 対処可能性を一度確認する → 成功側の一手へ収束する」という思考手順に一致させる。

## First 10 seconds
最初の画面にタイトル「成功する方で考える。」、説明「失敗を考え尽くす前に、必要な確認だけして前へ進む30秒トレーニング」、大きな「枝を切る」開始ボタンを表示する。開始後すぐに具体的な1場面と失敗予測の枝が動き始め、チュートリアルを読まずに最初の枝を触れる。

## Success condition
1セッションで、失敗予測の枝を増やさずに止め、対処可能性を1回確認し、成功側の具体的な行動を1つ選べたら成功。結果画面では「今日、何回『失敗予想 → 次の一手』へ戻せたか」と平均判断時間を表示し、活動量ではなく判断の反射を可視化する。

## Uniqueness
既存の「3秒で動く」「失敗から学ぶ」「考えすぎを整理する」系と違い、挑戦直前に自動増殖する失敗予測そのものを視覚的に切り、成功期待と具体的な行動を結び直す反射に特化する。

## Repeat-use strategy
仕事、会話、発信、依頼、創作、初挑戦、日常の小さな決断など場面を変え、短い反復で「失敗予測を増やさない → 対処可能性を一度だけ見る → 成功側の一手」の判断速度を育てる。端末内に直近の成功側選択回数と判断時間を保存し、再訪時に前回との差を見せる。

## Title rationale
- Main user benefit/motive: 怖れから離れ、成功確率を上げる行動に戻る。
- Why this title is direct and specific: 「成功を信じろ」ではなく、自分が選べる行為として「成功する方で考える」と表現する。
- How it matches the actual app: メイン操作が失敗側の枝を切り、成功側の具体的な一手へ収束する体験そのもの。
- Market/uniqueness checks actually performed (if any): 2026-09-01にWeb検索で「成功する方で考える」「うまくいく前提」「成功するつもりでやる」「成功側に賭けろ」とAmazon.co.jpを含む完全一致候補を確認。検索結果では「成功する方で考える」の明確な同名商品は確認できなかった。ただしAmazon内部検索を完全に網羅した確認ではないため、法的な独占性や商標非侵害を保証するものではない。
