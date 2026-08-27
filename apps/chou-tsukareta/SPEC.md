# 疲れたの正体 — Product Spec

## Exact use moment
「なんか疲れた」と感じているが、睡眠不足なのか、考えすぎなのか、人付き合いなのか、仕事量なのか自分でも説明できない人が、1分ほど質問に答えて、いま何に削られているかを自分の言葉として持ち帰るために開く。

## Central benefit
漠然とした「疲れた」を、今日の自分に当てはまる具体的な一文へ変える。

## Problem / design rationale
疲れには単一の原因だけを想定しない。NHSは疲れの一般的な要因として睡眠不足、ストレス、生活要因などを挙げ、WHOも仕事上の心理社会的リスクとして過剰な仕事量・長時間労働・仕事へのコントロール不足・支援不足などを挙げている。一方、このアプリは医療上の原因や病名を判定しない。

設計上は、ユーザーが最初から原因カテゴリを選ぶのではなく、具体的な感覚・場面への回答から候補を絞る。最終結果は「型の名前」だけでなく、「何が起きている / 何に削られている / 今いちばん減らすもの」を一続きの文章にする。

Sources:
- NHS, Tiredness and fatigue: https://www.nhs.uk/symptoms/tiredness-and-fatigue/
- NHS, Self-help tips to fight tiredness: https://www.nhs.uk/live-well/sleep-and-tiredness/self-help-tips-to-fight-fatigue/
- WHO, Mental health at work: https://www.who.int/news-room/fact-sheets/detail/mental-health-at-work
- WHO, Psycho-social risks and mental health: https://www.who.int/tools/occupational-hazards-in-health-sector/psycho-social-risks-mental-health

## Core interaction
Akinatorのように1問ずつ答える。回答ごとに6つの疲労負荷軸（回復不足 / 認知過負荷 / 未完了 / 対人警戒 / 感情残留 / 仕事圧）を更新し、現在の上位候補を最も見分けやすい次の質問を動的に選ぶ。

ユーザーには内部スコアを見せすぎず、画面上の「輪郭」だけが少しずつ鮮明になる。質問は最大7問。十分に候補が絞れた場合は6問で終了する。

この操作がテーマに合う理由: 漠然とした疲れを最初から分類させず、答えるたびに不要な仮説を捨て、残った疲れの輪郭を言語化する体験そのものが目的だから。

## First 10 seconds
最初の画面に「疲れたの正体」「7問以内で、いま何に削られているか言葉にする」「文字入力なし」を表示し、主ボタン1つですぐ質問を始められる。長い説明は置かない。

## Success condition
結果を読んだときに、単なる「脳疲労型」ではなく、たとえば「今日は体力より、終わっていない仕事を頭の中で持ち続けることに削られている。休む前に“今日やらないこと”を決める方が効きそう」のように、本人がそのまま自分の状態を説明できる文章が得られる。

## Uniqueness
既存の回復・気分転換アプリが「特定の疲れへの対処」を行うのに対し、このアプリは対処の前段で、原因が分からない状態から複数仮説を絞り込み、言葉と次のLEVEL UPアプリへ接続する入口として機能する。

## Repeat-use strategy
結果をlocalStorageに保存し、次回は前回の主因と比較して「前回と同じ / 今日は違う」を表示する。疲れの主因は日によって変わるため、再利用に意味がある。

## Title rationale
- Main user benefit/motive: 漠然とした不快感から抜け、状態を言葉にして少し楽になる。
- Why this title is direct and specific: 「疲れたの正体」は、ユーザーが知りたいものをそのままタイトルにしている。
- How it matches the actual app: 最大7問で疲れの負荷源を絞り、最終的に一文で言語化する。
- Market/uniqueness checks actually performed: 2026-08-27にウェブ検索で Amazon.co.jp の完全一致語「疲れたの正体」と一般ウェブの同語を確認。今回の検索結果では Amazon.co.jp の完全一致タイトルは確認できなかったが、近い表現として「疲労の正体」を含む既刊・記事は複数存在した。検索は商標・著作権上の独占利用可否を保証するものではないため、その保証はしない。
