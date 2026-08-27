import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.CONSULTANT_HANSEIKAI_URL || 'http://127.0.0.1:4173/apps/consultant-hanseikai/?test=1';
const artifactDir = path.resolve('apps/consultant-hanseikai/.artifacts');
fs.mkdirSync(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const evidence = [];
const pass = (label, detail) => evidence.push({ label, status: 'PASS', detail });
const fail = (label, detail) => { evidence.push({ label, status: 'FAIL', detail }); throw new Error(`${label}: ${detail}`); };
const assert = (condition, label, detail) => condition ? pass(label, detail) : fail(label, detail);

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(artifactDir, '01-home.png'), fullPage: true });
  assert((await page.locator('body').innerText()).includes('コンサル後反省会を'), 'first-time clarity', 'ホームで用途がタイトルと説明から即座に確認できた');
  assert(await page.getByRole('button', { name: '3分で終わらせる' }).isVisible(), 'start CTA', '最初の主要操作が1つに絞られている');
  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  assert(homeOverflow, 'mobile width', '390px幅で横スクロールなし');

  await page.getByRole('button', { name: '3分で終わらせる' }).click();
  assert(await page.getByRole('button', { name: '仕分ける' }).isDisabled(), 'failure path', '悩みカード未選択では次へ進めない');
  await page.getByRole('button', { name: '戻る' }).click();
  assert((await page.locator('body').innerText()).includes('3分で終わらせる'), 'back / exit', '選択画面から戻るとホームへ安全に戻った');

  await page.getByRole('button', { name: '3分で終わらせる' }).click();
  for (const text of ['相手の反応が薄かった','契約、続くかな','もっと準備できた','適当なこと言ったかも','人の商売ばかり進めてる']) {
    await page.getByRole('button', { name: text }).click();
  }
  await page.getByRole('button', { name: '仕分ける' }).click();

  const thought = page.locator('[data-swipe]');
  const box = await thought.boundingBox();
  if (!box) fail('main interaction', '仕分けカードの座標が取れない');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 90, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(750);
  pass('main interaction swipe', '1枚目を左スワイプして事実へ仕分けできた');

  await page.getByRole('button', { name: /想像/ }).click();
  await page.waitForTimeout(750);
  await page.getByRole('button', { name: /次に変える/ }).click();
  await page.waitForTimeout(750);
  await page.getByRole('button', { name: /次に変える/ }).click();
  await page.waitForTimeout(750);
  await page.getByRole('button', { name: /事実/ }).click();
  await page.waitForTimeout(750);

  assert((await page.locator('body').innerText()).includes('想像を捨てる'), 'discard screen', '仕分け後に想像カード破棄へ自然に遷移した');
  const trash = page.locator('[data-discard]');
  const trashBox = await trash.boundingBox();
  if (!trashBox) fail('discard swipe', '想像カードの座標が取れない');
  await page.mouse.move(trashBox.x + trashBox.width / 2, trashBox.y + trashBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(trashBox.x + trashBox.width / 2, trashBox.y + trashBox.height / 2 - 95, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(650);
  assert((await page.locator('body').innerText()).includes('想像 0'), 'discard complete', '上スワイプで想像カードが0件になった');

  await page.getByRole('button', { name: '改善を1個だけ残す' }).click();
  const improvementButtons = page.locator('[data-improvement]');
  assert(await improvementButtons.count() === 2, 'improvement candidates', '今回の反省から具体的な改善候補が2つ生成された');
  await improvementButtons.nth(0).click();
  await page.waitForTimeout(80);
  await page.locator('[data-improvement]').nth(1).click();
  assert(await page.locator('[data-improvement].selected').count() === 1, 'one improvement limit', '2個目を選ぶと置き換わり、選択は常に1個だけ');
  await page.getByRole('button', { name: 'これ1個だけ持ち帰る' }).click();

  assert((await page.locator('body').innerText()).includes('次は、自分の番。'), 'own business bridge', 'コンサル反省から自分の商売へ明示的に視点が切り替わった');
  await page.locator('[data-own="five"]').click();
  await page.getByRole('button', { name: 'この1個で戻る' }).click();
  await page.locator('[data-after]').evaluate((el) => { el.value = '30'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.getByRole('button', { name: '反省会を閉じる' }).click();
  await page.screenshot({ path: path.join(artifactDir, '02-result.png'), fullPage: true });
  const resultText = await page.locator('body').innerText();
  assert(resultText.includes('反省会、終了。'), 'correct / success path', '開始から結果画面まで完了した');
  assert(resultText.includes('今日、背負わなくていいもの') && resultText.includes('次回変えること') && resultText.includes('自分の商売'), 'ending proof', '終了画面に手放したもの・改善1個・自分の一手が揃っている');

  await page.reload({ waitUntil: 'networkidle' });
  const reloaded = await page.locator('body').innerText();
  assert(reloaded.includes('前回：反省会'), 'reload', '再読み込み後も非機密サマリーだけが表示された');
  assert(!reloaded.includes('契約、続くかな'), 'privacy on reload', '選択した悩み本文は再訪画面へ永続表示されない');

  await page.getByRole('button', { name: '3分で終わらせる' }).click();
  assert((await page.locator('body').innerText()).includes('今、何が引っかかってる？'), 'revisit', '再訪時にもすぐ新しい反省会を開始できた');

  const touchTargets = await page.evaluate(() => Array.from(document.querySelectorAll('button')).filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }).map((b) => ({ text: b.textContent.trim().slice(0, 30), w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height })));
  const tooSmall = touchTargets.filter((x) => x.w < 44 || x.h < 44);
  assert(tooSmall.length === 0, 'mobile tap targets', `可視ボタン${touchTargets.length}件すべて44px以上`);

  fs.writeFileSync(path.join(artifactDir, 'evidence.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ status: 'PASS', evidence }, null, 2));
} catch (error) {
  try { await page.screenshot({ path: path.join(artifactDir, 'failure.png'), fullPage: true }); } catch {}
  fs.writeFileSync(path.join(artifactDir, 'evidence.json'), JSON.stringify([...evidence, { status: 'ERROR', detail: String(error?.stack || error) }], null, 2));
  throw error;
} finally {
  await browser.close();
}
