# 2択で決めろ — Product Spec

## Exact use moment
選択肢が3つ以上あり、比較軸を増やしすぎて決められない人が、候補を2〜8個入れて、1〜2分で最終候補を1つに絞る。

## Central benefit
複数候補を一度に比較せず、2択だけを繰り返して決断を終える。

## Problem / design rationale
候補が多いほど全組み合わせを頭の中で比較し、決断が止まりやすい。全候補を同時に評価させず、トーナメント形式で「今この2つならどちらを残す？」だけにする。重要な決断の正解を保証するのではなく、自分の選好を可視化する道具に限定する。

## Core interaction
候補カードが2枚ずつ対戦し、残したい方をタップすると勝者が中央へ進む。敗者は画面外へ落ちる。奇数候補はシード扱い。決勝後、優勝候補と「戻して再戦」導線を表示する。

## First 10 seconds
「候補を入れる→2択だけ答える→1つ残る」が一画面で理解でき、サンプル候補ボタンですぐ試せる。

## Success condition
ユーザー自身の選択だけで候補が1つ残り、何回の比較で決めたかが表示される。

## Uniqueness
`suteru-yuki`は日常シーンで「やらないこと」を鍛える訓練。これはユーザー自身の具体的な候補をトーナメントで1つに決める実用ツール。

## Repeat-use strategy
一回の決断ごとに使うワンショットツール。履歴は端末に候補名を保存せず、決定回数だけ保存する。

## Title rationale
- Main user benefit/motive: 迷う時間を短くする
- Why this title is direct and specific: 「2択」という操作と「決める」という結果が分かる
- How it matches the actual app: 全比較が必ず2択
- Market/uniqueness checks actually performed: Web/Amazon検索で「決めろ」単独は楽曲・書籍表現などに広く使われていたため、機構を明示した「2択で決めろ」を採用
