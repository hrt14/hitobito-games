import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const assetPath = path.join(root, '.dist', 'firebase', 'levelup-maker.js');

if (!fs.existsSync(assetPath)) {
  throw new Error('LEVEL UP maker asset not found. Run scripts/inject-levelup-maker.mjs first.');
}

let source = fs.readFileSync(assetPath, 'utf8');

function replaceOnce(search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`LEVEL UP maker Step 2 patch target missing: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`LEVEL UP maker Step 2 patch target is ambiguous: ${label}`);
  }
  source = source.slice(0, first) + replacement + source.slice(first + search.length);
}

replaceOnce(
  "if (state.step === 1) return Boolean(form.goalType) && form.goalDetail.trim().length >= 2;",
  "if (state.step === 1) return Boolean(form.goalType) && (form.goalType !== 'other' || form.goalDetail.trim().length >= 2);",
  'Step 2 validation',
);

const goalTextarea = '<textarea class="field small-field" maxlength="180" data-goal-detail placeholder="例：考える前に、最初の1分だけ仕事を始められるようになりたい">${escapeHtml(form.goalDetail)}</textarea>';
replaceOnce(
  goalTextarea,
  '${form.goalType === \'other\' ? `' + goalTextarea + '` : \'\'}',
  'Step 2 custom goal textarea',
);

replaceOnce(
  '      state.form[button.dataset.choice] = button.dataset.value;',
  "      const field = button.dataset.choice;\n      const value = button.dataset.value;\n      if (field === 'goalType' && value !== 'other') state.form.goalDetail = labelFor(goalTypes, value);\n      if (field === 'usageTiming' && value !== 'other') state.form.timingDetail = '';\n      state.form[field] = value;",
  'choice state update',
);

replaceOnce(
  "        state.message = state.step === 0 ? '困っていることをもう少し具体的に書いてください。' : state.step === 1 ? '近いゴールを選び、なりたい状態を一言書いてください。' : 'ひとつ選んでください。';",
  "        state.message = state.step === 0 ? '困っていることをもう少し具体的に書いてください。' : state.step === 1 ? (state.form.goalType === 'other' ? '「その他」の内容を入力してください。' : 'なりたい状態をひとつ選んでください。') : 'ひとつ選んでください。';",
  'Step 2 validation message',
);

replaceOnce(
  "    const f = state.form;\n    const timing = labelFor(timings, f.usageTiming) + (f.timingDetail ? `：${f.timingDetail}` : '');",
  "    const f = state.form;\n    const goal = f.goalType === 'other' ? f.goalDetail : labelFor(goalTypes, f.goalType);\n    const timing = labelFor(timings, f.usageTiming) + (f.timingDetail ? `：${f.timingDetail}` : '');",
  'confirmation goal value',
);

replaceOnce(
  '<strong>${escapeHtml(labelFor(goalTypes, f.goalType))}<br>${escapeHtml(f.goalDetail)}</strong>',
  '<strong>${escapeHtml(goal)}</strong>',
  'confirmation goal display',
);

const beforeKickers = source;
source = source.replace(/<div class="step-kicker">STEP [1-5] \/ 5<\/div>/g, '');
const removedKickers = (beforeKickers.match(/<div class="step-kicker">STEP [1-5] \/ 5<\/div>/g) || []).length;
if (removedKickers !== 5) {
  throw new Error(`Expected 5 duplicate wizard step labels, removed ${removedKickers}.`);
}

fs.writeFileSync(assetPath, source);
console.log('[LEVEL UP maker] Step 2 choice flow patched.');