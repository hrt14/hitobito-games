# 悪くないのに責められ、行動まで制限されたとき — Product Spec

## Exact use moment
身に覚えのないことで責められ、相手の決めつけを根拠に権限・外出・発言・交友などの行動まで制限されそうになり、怒り・焦り・無力感で反射的に言い返したくなっている人が、その場または直後の数分で使う。終了時には「何が事実か」「何が相手の断定か」「何が制限か」を分け、自分に残る選択権と次の一手を言葉にできている。

## Central benefit
相手の断定に飲み込まれず、自分に残っている選択権を取り戻して、境界のある返答を選べる状態になる。

## Problem / design rationale
強く責められると、確認できる事実・相手の解釈・実際の行動制限が一つの「自分が悪い／自分は何もできない」という塊になりやすい。そこで、認知的再評価の考え方に沿って解釈と事実を分け、さらにストレス場面でのコントロール可能性に着目し、他者の感情や謝罪を支配しようとせず、自分が選べる行動だけを回収する。

参考にした研究:
- Maier et al., Behavioral control, the medial prefrontal cortex, and resilience: https://pmc.ncbi.nlm.nih.gov/articles/PMC3181837/
- Ochsner et al., Cognitive Reappraisal of Emotion: A Meta-Analysis of Human Neuroimaging Studies: https://pmc.ncbi.nlm.nih.gov/articles/PMC4193464/

本アプリ自体の臨床的有効性を主張するものではない。

## Core interaction
1. 相手の言葉を「確認できる事実 / 相手の断定 / 行動の制限」の3分類へタップで仕分ける。
2. 自分で決められる行動だけを選び、相手の謝罪・感情・信念は選択対象から外す。
3. 返答断片を「事実 → 境界 → 条件確認 → 次の一手」の順番に組み立てる。
4. 追加の圧に対し、ボタンを1.2秒押し続けてから返答を見る。

分類・選択・組み立て・一時停止という操作そのものが、現実場面で必要な認知と行動を再現する。

## First 10 seconds
最初の画面で「悪くないのに責められ、行動まで制限されたとき」と使用場面を明示し、実例のケースカードと「事実から取り戻す」ボタンを表示する。長いチュートリアルは置かない。

## Success condition
ユーザーが1セッション内で、5つの発言を正しく分類し、自分に残る4つの選択権だけを回収し、境界の4行を正しい順で組み、追加の圧に1.2秒反射停止できる。終了時に開始前後の動揺度を比較できる。

## Uniqueness
既存の「課題の分離」「アサーティブ」「揉めそうでも必要なお願いをする」と異なり、「濡れ衣・決めつけ + 実際の行動制限」が同時に起きた場面に特化し、事実/断定/制限の分離から選択権回収、境界返答、反射停止まで一続きで練習する。

## Repeat-use strategy
職場・家族・仕事責任・友人の4ケースを順番に回し、ケースが変わっても同じ判断原則を適用できるようにする。端末に訓練回数と最大の動揺低下を保存し、Googleログイン中はFirestore `levelupUsers/{uid}/history/unfair-blame` に同期して別端末でも継続できる。

## Title rationale
- Main user benefit/motive: 理不尽な責めと制限から自分の判断・選択権を守る。
- Why this title is direct and specific: 「悪くないのに責められ」「行動まで制限されたとき」という使用瞬間をそのまま書いた。
- How it matches the actual app: 4ステップすべてが、その状況で事実・境界・選択権を取り戻す練習になっている。
- Market/uniqueness checks actually performed (if any): 本タスクでは外部タイトル市場調査は行っていない。既存LEVEL UP内の役割重複のみ確認した。
