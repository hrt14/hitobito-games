# 聴く。 — Product Spec

## Exact use moment
相談や雑談で相手が話し始めた時、すぐ助言・自分の体験・評価を返してしまう人が、数分の反復で「まず相手を受け取る」3手を思い出し、相手が続きを話せる返しを作れるようになる。

## Central benefit
助言より先に、相手の話を正確に受け取り、続きを引き出す返答ができる。

## Problem / design rationale
CDCの会話ガイドは、注意を向けて聴くこと、open-ended questions、関心と支持を示すことを推奨している。SAMHSAも支援場面の主要スキルとしてactive listeningを扱う。本アプリは専門的なカウンセリング訓練ではなく、日常会話で「要点を拾う→感情は仮置き→開いた質問」の順で返す練習に限定する。

Sources:
- CDC, Conversations Matter: https://www.cdc.gov/howrightnow/talk/index.html
- SAMHSA, Crisis Counseling Skills: https://www.samhsa.gov/resource/dbhis/crisis-counseling-skills

## Core interaction
1つの発話に対し、3つの枠（要点／感情の仮置き／開いた質問）それぞれで候補を選び、3枚の返答を組む。助言・決めつけ・自分語りの distractor を避ける操作そのものが傾聴の判断になる。

## First 10 seconds
「答える前に、相手を受け取る」と3手を表示し、「6会話、受け取る」を押すとすぐ実際の発話が出る。

## Success condition
6会話×3判断で正答率を出し、「要点」「感情」「質問」のどこを外しやすいかを返す。

## Uniqueness
既存のコミュニケーション系アプリはお願い・断り方・境界線など“自分が伝える”技術が中心。本アプリは“相手が続きを話せる返し”を組み立てる受信側のスキルだけを反復するため置換できない。

## Repeat-use strategy
仕事・友人・家族・チーム・学習・日常の6場面を反復し、結果で弱い段を示す。現実の会話で助言を急いだと気づいた時に再利用する。

## Title rationale
- Main user benefit/motive: 人との会話を良くする／理解される関係を作る
- Why this title is direct and specific: 「傾聴」より日常語で、行動そのものを一語で示す
- How it matches the actual app: 全操作が相手の発話を受け取る返答づくり
- Market/uniqueness checks actually performed: GitHub内のLEVEL UP既存アプリを listening / 傾聴 / 聞く / empathy などで検索し、同じ受信スキル訓練は見つからなかった
