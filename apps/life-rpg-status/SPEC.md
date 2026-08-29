# 人生RPGステータス — Product Spec

## Exact use moment
「自分はどういう環境で力が出て、どこで疲れやすいのか」をタイプ名だけでなく具体的に理解したい人が、仕事・人間関係・変化・判断・疲労の30場面へ直感で答え、今の自分の傾向と次に試す行動を得る。

## Central benefit
自分を固定タイプに決めつけず、日常で使える「自分の取扱説明」を6軸で持ち帰る。

## Problem / design rationale
短い診断は遊びとして面白くても、質問数が少ないと自己理解への納得感が弱い。そこで30の具体場面を6軸（ENERGY / STRUCTURE / OPENNESS / RELATION / DRIVE / STABILITY）へ分け、各軸を連続値として可視化する。International Personality Item Pool（IPIP）の公開項目群とBig Five系の「連続的な特性」という考え方を設計参考にするが、本アプリの軸・設問・採点はLEVEL UP独自で、妥当性検証された心理検査ではない。

## Core interaction
30の具体場面について、左右の行動傾向のどちらに近いかを5段階タップで回答する。結果では6軸の数値だけでなく「力が出やすい環境」「消耗しやすい罠」「次の1週間で試すこと」へ変換する。抽象的な自己評価ではなく、場面判断の積み重ねで自己理解する。

## First 10 seconds
トップで「12問から30問へ」「タイプ名より、どんな環境で力が出てどこで消耗しやすいかまで返す」と明示し、「30問で自分を読む」をすぐ押せる。

## Success condition
30問完了後、自分の6軸・強く出た2傾向・環境・罠・次の実験を確認でき、結果を固定的な人格ラベルではなく現在の傾向として理解できる。

## Uniqueness
既存LEVEL UPの単一スキル訓練や1テーマ診断ではなく、複数の生活場面を横断して「自分が自然に使いやすい戦い方」を6軸で俯瞰し、次の実験まで返す自己理解ツールとして独立する。

## Repeat-use strategy
結果を端末内に保存し、役割・環境・生活状態が変わった時に再回答して、前回との差を「固定タイプ」ではなく状態と傾向の変化として見る。

## Title rationale
- Main user benefit/motive: 自己理解 / 好奇心
- Why this title is direct and specific: 「人生」「RPG」「ステータス」で複数の自分軸をゲーム的に可視化する内容を示す。
- How it matches the actual app: 30問の回答を6軸のRPGビルドとして可視化する。
- Market/uniqueness checks actually performed: LEVEL UP既存カタログの診断・自己理解系を確認し、複数軸の総合自己理解という中心価値が重複しないことを確認。

## Evidence
- International Personality Item Pool: https://ipip.ori.org/

## Safety / claims
心理検査・医療診断ではないこと、科学的に妥当性検証されたタイプ判定ではないことを画面内に明記する。
