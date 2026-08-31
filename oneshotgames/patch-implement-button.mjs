import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appPath = path.join(root, '.dist', 'osg', 'app.js');
if (!fs.existsSync(appPath)) throw new Error('OSG built app.js not found');

let source = fs.readFileSync(appPath, 'utf8');

function replaceOnce(search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`OSG implement-button patch target missing: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) throw new Error(`OSG implement-button patch target ambiguous: ${label}`);
  source = source.slice(0, first) + replacement + source.slice(first + search.length);
}

const improveAction = `          \${published && req.gameId ? \`<button class="mini-btn" type="button" data-improve="\${escapeHtml(req.gameId)}">改善する</button>\` : ''}`;
replaceOnce(
  improveAction,
  `          \${!published && req.status === 'queued' && !req.implementationRequestedAt ? \`<button class="mini-btn" type="button" data-implement="\${escapeHtml(req.id)}">実装する</button>\` : ''}\n          \${!published && req.status === 'queued' && req.implementationRequestedAt ? \`<button class="mini-btn" type="button" disabled>実装依頼済み</button>\` : ''}\n${improveAction}`,
  'quest action buttons',
);

const improveBinding = `    els.questsList.querySelectorAll('[data-improve]').forEach((button) => button.addEventListener('click', () => startImprovement(button.dataset.improve)));`;
replaceOnce(
  improveBinding,
  `    els.questsList.querySelectorAll('[data-implement]').forEach((button) => button.addEventListener('click', () => requestImplementation(button.dataset.implement, button)));\n${improveBinding}`,
  'quest action bindings',
);

const submitMarker = `  async function submitQuest() {`;
const implementFunction = `  async function requestImplementation(requestId, button) {
    if (!state.user || !state.db || !requestId) return;
    const ref = state.db.collection('levelupUsers').doc(state.user.uid);
    const now = new Date().toISOString();
    if (button) {
      button.disabled = true;
      button.textContent = '送信中…';
    }
    try {
      await state.db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error('request document not found');
        const list = Array.isArray(snap.data()?.osgRequests) ? snap.data().osgRequests : [];
        let found = false;
        const next = list.map((item) => {
          if (item?.id !== requestId) return item;
          found = true;
          return { ...item, status: 'queued', implementationRequestedAt: now, updatedAt: now };
        });
        if (!found) throw new Error('request not found');
        tx.set(ref, { osgRequests: next }, { merge: true });
      });
      state.requests = state.requests.map((item) => item?.id === requestId ? { ...item, status: 'queued', implementationRequestedAt: now, updatedAt: now } : item);
      renderAccount();
      setMessage('実装キューへ送信しました。', 'ok');
    } catch (error) {
      console.warn('[OSG] implementation request failed', error);
      if (button) {
        button.disabled = false;
        button.textContent = '実装する';
      }
      setMessage('実装キューへ送信できませんでした。もう一度お試しください。', 'error');
    }
  }

`;
replaceOnce(submitMarker, `${implementFunction}${submitMarker}`, 'implementation request function');

fs.writeFileSync(appPath, source);
console.log('[OSG] queued request implementation button injected');
