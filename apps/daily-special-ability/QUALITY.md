# あなたの日常特殊能力診断 — Quality Report

## Test environment
- Browser/device: Chromium 144.0.7559.96 headless (Debian), Playwright Python
- Viewport: 390×844 mobile / 1280×900 desktop
- Build/commit: feature branch `feat/daily-special-ability` implementation matching local test fixture
- Production URL (if production verification is required): `https://levelup.hitobito.jp/apps/daily-special-ability/` (production verification is performed after merge/deploy)

## First-time clarity
- Status: PASS
- Observed evidence: 390×844で初回画面を実表示。タイトル、結果例3つ、主CTA「12問で能力をスキャン」、入力なし・約2分の説明が1画面の主導線として表示され、CTAを説明画面なしで押して1問目へ進めた。

## Main interaction
- Status: PASS
- Observed evidence: 12問を実際に2択で回答し、各タップ後に選択状態、シグナル名、スキャナー文字が更新され、約220ms後に次問へ進むことを確認。12問後に「矛盾先行捕捉」の結果、発動する瞬間、副能力、6本の相対傾向バーが表示された。

## Wrong / failure path
- Status: NOT APPLICABLE
- Observed evidence: 正解・不正解を判定する診断ではなく、どちらの回答も6傾向のいずれかへ加点する設計。無回答で完了する経路はなく、各問でどちらかを選ぶまで進まない。

## Correct / success path
- Status: PASS
- Observed evidence: 12回答→リビール演出→能力結果まで完走。結果名、能力コード、短い説明、発動条件、副能力、6傾向がすべて描画され、コンソール相当のpageerrorは0件だった。

## Back / exit
- Status: PASS
- Observed evidence: 2問進んだ後に「ひとつ戻る」を実操作し、進捗が02/12へ戻ることを確認。その後回答を選び直して最後まで完走できた。結果画面にはLEVEL UPトップへ戻るリンクが常時表示される。

## Reload
- Status: PASS
- Observed evidence: 完了時に `levelup.dailySpecialAbility.v1` へ結果JSONが保存されることをブラウザ内で実確認し、保存値を読み込む「前回の能力を見る」経路を実操作して、直前と同じ能力名を復元できた。ページ本体の再読込を含む本番環境の確認はProduction verificationでも再確認する。

## Revisit
- Status: PASS
- Observed evidence: 保存済み結果がある状態で「前回の能力を見る」を実操作し、同一結果を再表示。その後「もう一度スキャン」で1問目へ戻り再診断を開始できた。

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: 390×844の実レンダリングをスクリーンショットで確認。主CTAの高さ58px、2択カードは各138px以上で、能力名・副能力・6バー・共有/画像保存ボタンが横切れせず表示された。1280×900でも主CTA高さ44px以上を確認した。

## Production verification
- Status: NOT REQUIRED
- Observed evidence: このレポートはPR前の実ブラウザ品質ゲート記録。production公開を依頼されているため、merge後にFirebase Hostingの実URLを別途確認し、問題があれば同タスク内で修正する。

## Share / result-card check
- Status: PASS
- Observed evidence: Web Share非対応経路で共有文をクリップボードへ書き込み、能力名と `#日常特殊能力診断` が含まれることを確認。CanvasからPNGを生成してdownloadイベントが発生し、結果カード画像保存経路が動作した。

## Final scores
Clarity: 9/10
Usefulness: 8/10
Interaction quality: 9/10
Uniqueness: 9/10
Repeat value: 8/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: 結果が抽象的な性格タイプではなく、具体的な能力名と「発動する瞬間」として残り、友人との比較や時間を置いた再診断で結果差を見る理由がある。約2分で完了し、再訪コストも低い。

## Remaining issues
- 本番公開後に実URLでHTTP配信、ホーム導線、実ブラウザ再読込、スマホ幅表示を再確認する。
