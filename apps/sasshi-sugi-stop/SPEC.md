# それ、事実？ — Product Spec

## Exact use moment
相手の返信・表情・短い返事などを見て「嫌われた」「怒っている」と相手の内面まで確定し、取り越し苦労で疲れている人が、2〜3分で観察できた事実と自分の推測を分け、未確認のことを未確認のまま置ける状態へ戻る。

## Central benefit
相手の気持ちを「察した」ことと「分かった」ことを分け、余計な心配を増やしにくくする。

## Problem / design rationale
相手の思考を確認せず確定する「mind reading」は、NHS系医療機関が紹介する unhelpful thinking styles の一例。本アプリは診断や治療ではなく、日常で観察可能な事実と推測を分離する判断練習に限定する。NHSのthought recordが状況・考え・根拠・別の見方を分けて検討する構造も参考にした。

Sources:
- NHS, Thought record: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/thought-record/
- Royal National Orthopaedic Hospital, Unhelpful Thinking Styles: https://www.rnoh.nhs.uk/patients-and-visitors/patient-information-guides/unhelpful-thinking-styles

## Core interaction
具体的な対人場面で1つの文を読み、「事実」「推測」の2つの箱へ即仕分けする。同じ出来事から事実文と推測文の両方を出すため、内容ではなく“どこまで確認できるか”を見る反射を鍛える。最後に自分の現実の心配を事実と推測へ2分割できる。

## First 10 seconds
タイトル直下に「見えた事実と頭が足した推測を分ける」と明示し、「8問、仕分ける」を押すとすぐ最初の文と「事実／推測」の2ボタンが出る。

## Success condition
8問で事実・推測を仕分け、結果画面で「推測を見抜いた回数」と正答率を確認できる。実戦モードでは今の心配を事実と推測に分けられる。

## Uniqueness
`kanji-warukatta` は会話後の反省会を終える用途、`sore-honto` は思い込み全般の見直し。本アプリは相手の内面を読み過ぎる瞬間だけに絞り、観察可能性で高速仕分けする反射訓練なので置換できない。

## Repeat-use strategy
問題は毎回16文から8文をランダム出題し、仕事・友人・家族・顧客・SNSなど異なる場面で同じルールを反復する。現実の取り越し苦労が発生した時にも実戦モードを再利用できる。

## Title rationale
- Main user benefit/motive: 不安・取り越し苦労から抜ける
- Why this title is direct and specific: 心配を生む文に対して「それ、事実？」と問い直す操作そのものを表す
- How it matches the actual app: 全操作が事実と推測の仕分け
- Market/uniqueness checks actually performed: GitHub内のLEVEL UP既存アプリを `察し`, `気持ち`, `mind reading`, `overthinking` などで検索し、同一の反射訓練は見つからなかった
