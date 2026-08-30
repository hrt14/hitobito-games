# 見えない残高 — Quality Report

## Test environment
- Browser/device: Playwright Chromium 140.0.7339.16 / mobile touch context
- Viewport: 390x844
- Build/commit: `60bc5cbf6f24bcc8c2a41a72c37e9fb3a2dc2a15` on branch `app-mienai-zandaka`
- Test run: GitHub Actions `見えない残高 browser playtest` run 33312704410
- Production URL (after merge): https://levelup.hitobito.jp/apps/mienai-zandaka/

## First-time clarity
- Status: PASS
- Observed evidence: 実ブラウザ390x844で初回アクセスし、タイトル「見えない残高」、残高0、主操作「ひとつ積む」、副操作「気づいたことがある」が表示され、説明を開かなくても開始できることを確認した。

## Main interaction
- Status: PASS
- Observed evidence: 実ブラウザで「ひとつ積む」→「助けた」をタップし、現在残高・今日積んだ・積んだ総数が0から1へ増えることを確認した。続けて複数カテゴリを積み、残高5まで操作できた。

## Wrong / failure path
- Status: PASS
- Observed evidence: 「見せた・自慢した」を選択後、半減確認をキャンセルし、残高2が変化しないことを実ブラウザで確認した。Escapeでもシートを閉じられた。

## Correct / success path
- Status: PASS
- Observed evidence: 残高5で「愚痴」を選ぶと確認画面に5→2が表示され、確定後に現在残高2・気づいた回数1となる一方、積んだ総数5は保持された。半減が過去の実践まで消す罰になっていないことを確認した。

## Back / exit
- Status: PASS
- Observed evidence: 「ひとつ積む」の選択シートを開いて「閉じる」を押し、残高を変えずに元画面へ戻れることを実ブラウザで確認した。気づきシートはキャンセルとEscapeでも離脱できた。

## Reload
- Status: PASS
- Observed evidence: 残高1・積んだ総数1の状態でページを再読み込みし、localStorageから両方が1のまま復元されることを実ブラウザで確認した。

## Revisit
- Status: PASS
- Observed evidence: 保存後の再読み込みを再訪相当として実行し、現在残高と積んだ総数が維持され、そのまま次の「積む」操作へ続けられることを確認した。

## Mobile readability and tap targets
- Status: PASS
- Observed evidence: 390x844のモバイル表示で主操作・副操作の両方が表示され、Playwrightの実測で各ボタン高48px以上を確認した。選択、確認、キャンセルまでタッチ文脈で完走した。

## Production verification
- Status: NOT REQUIRED
- Observed evidence: この品質レポートはPR段階の実ブラウザ検証用。main反映後はFirebase本番URLを別途確認し、本番確認前に実装完了とは報告しない。

## Final scores
Clarity: 9/10
Usefulness: 8/10
Interaction quality: 8/10
Uniqueness: 9/10
Repeat value: 8/10

## Final question
If I genuinely had this problem, would I open this app again?

Answer: YES
Reason: 日常の小さな親切を10秒程度で積め、現在残高だけでなく減らない総数も残る。気づき操作も責める文言ではなく、確認して区切って再開できるため、毎日繰り返す目的が明確。

## Remaining issues
- mainマージ後、Firebase本番URLでタイトル・主操作・半減・保存・LEVEL UPトップ掲載を確認する。
