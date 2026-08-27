# 返信は1文でいい — Product Spec

## Exact use moment
LINE・メール・DMを返さなければと思いながら、ちゃんと書こうとして放置している人が、1〜2分で最低限の返信文を作り、コピーして送信へ進む。

## Central benefit
「ちゃんと返信する」を「1文だけ返す」まで小さくして、放置を終える。

## Problem / design rationale
返信は内容・礼儀・説明・日程調整を一度に完成させようとすると重くなる。まず返信目的を1つ選び、必要な要素だけチップで組み、1文を生成する。NEGOTIATORのフット・イン・ザ・ドアとして、最初の要求を「完璧な返信」ではなく「目的を1つ選ぶ」にする。

## Core interaction
最初に「何で止まってる？」を1タップで選ぶ。その後「受け取った / 今は答えられない / 日程だけ返す / 断る / 確認する」などの目的カードを選ぶ。必要な短い部品をタップすると、画面上の返信文が1文に組み上がる。最後にコピーする。

## First 10 seconds
「ちゃんと返さなくていい。まず1文。」と、止まっている理由の大ボタンが表示される。

## Success condition
ユーザーが自分の状況に合う1文を生成し、クリップボードへコピーできる。コピー後に「送る」「あとで整える」のどちらでも完了扱いにする。

## Uniqueness
`hard-request`は難しいお願いの伝え方を訓練する。これは返信放置という着手摩擦を最小1文にして解消する実用ツール。

## Repeat-use strategy
返信を放置した瞬間に毎回使える。個別メッセージ本文は保存しない。

## Title rationale
- Main user benefit/motive: 時間節約と返信ストレスの軽減
- Why this title is direct and specific: 「1文でいい」が要求を小さくする中心体験そのもの
- How it matches the actual app: 出力は原則1文
- Market/uniqueness checks actually performed: Web/Amazon検索で候補「返信しろ」より、具体的で圧を下げる「返信は1文でいい」を採用
