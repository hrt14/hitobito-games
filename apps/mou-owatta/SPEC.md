# もう終わった。 — Product Spec

## Exact use moment
会議の発言、返信、失敗など終わった出来事を頭の中で再生し続けている人が、3〜5分で「事実」「想像」「次にできること」を分け、新情報のない再生を停止する。

## Central benefit
反省に必要な学びだけ残し、同じ情報の反芻を終了する。

## Problem / design rationale
終わった出来事について、変えられる次の行動と、変えられない過去・未確認の想像が混ざると再生が続く。仕分け→コントロール判定→次の一手を1つ保存→再生停止、の終了動作にする。

## Core interaction
頭の中の文を「事実 / 想像 / 次にできること」へ仕分け、変えられるか判断し、残す行動を1つだけ保存する。その後、再び考えたくなる再生ボタンに対して自分で「再生停止」を押す。操作そのものが思考終了の練習になる。

## First 10 seconds
「反省は残す。反芻は捨てる。」と、事実→次の一手1つ→終了の流れを即表示する。

## Success condition
10ステージを通して事実仕分けと再生停止を行い、終了力・事実判定・余計な再生回数が見える。

## Uniqueness
`nou-keshigomu`は仕事から心を離す切替。これは終わった出来事の反芻を、事実/想像/次の一手へ分解して終了する訓練。

## Repeat-use strategy
異なる具体場面を反復することで、現実でも「新情報がないなら再生しない」を使えるようにする。

## Title rationale
- Main user benefit/motive: 過去の出来事から心地よく離れる
- Why this title is direct and specific: ユーザーが今必要な終了宣言そのもの
- How it matches the actual app: 最後に必ず「これはもう終わった。」へ到達する
- Market/uniqueness checks actually performed: 今回は既存アプリ名を維持。新規タイトルの重複回避より既存URL・認知の継続を優先
