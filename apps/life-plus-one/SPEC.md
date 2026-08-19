# LIFE +1 — implementation spec

## Goal
「今日は何も進んでいない」と感じる人が、今日起きた事実から「昨日までの人生にはなかった差分」を30〜60秒で1つ見つけられるようにする。

## Core loop
1. 今日あったことを一言入力する。
2. ログイン中はFirebase ID token付きでサーバーのOpenAI分析へ送る。
3. AIは褒めず、事実から確実に言える +1 / WHY / LIFE を構造化して返す。
4. 未ログイン・API未接続・通信失敗時はローカル簡易判定へフォールバックする。
5. ユーザーが納得したときだけ「人生に追加する」を押す。
6. 記録数と履歴をこの端末に保存する。ストリークや減点は行わない。

## AI rules
- 存在しない成果を作らない。
- 小さな行動を大げさな成長にしない。
- 嫌な出来事を美化しない。
- 失敗は「成功」に変換せず、明確な場合のみ検証データとして扱う。
- +1が根拠を持って見つからない場合は `found:false` を返す。
- テンプレ褒めをしない。
- 最大の主役はAIではなく「ユーザーが今日生きた事実」。

## Categories
experience / knowledge / skill / courage / recovery / self_knowledge / relationship / memory / boundary / rest / failure_data / progress / other

## Privacy/security
- OpenAI API key is never shipped to the browser.
- AI endpoint requires a Firebase Authentication ID token.
- AI input is limited to 1000 characters.
- The function keeps no OpenAI response state (`store:false`).
- Local history is deletable from the app.

## AI endpoint
`POST https://asia-northeast1-hitobito-levelup.cloudfunctions.net/analyzeLifePlusOne`
