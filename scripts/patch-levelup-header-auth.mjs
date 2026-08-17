import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');

if (!fs.existsSync(homePath)) {
  throw new Error('LEVEL UP home bundle not found. Run the home/account injectors first.');
}

let html = fs.readFileSync(homePath, 'utf8');

const oldBinding = `      if (!authBound && window.firebase?.auth && window.firebase?.apps?.length) {
        try {
          window.firebase.auth().onAuthStateChanged(renderAccount);
          authBound = true;
        } catch (error) {
          console.warn('[LEVEL UP header account] auth binding failed', error);
        }
      }`;

const newBinding = `      if (!authBound && window.firebase?.auth && window.firebase?.apps?.length) {
        try {
          const needsCustomAuth = location.hostname === 'levelup.hitobito.jp';
          const authApp = needsCustomAuth
            ? window.firebase.apps.find((app) => app.name === 'levelup-custom-auth')
            : window.firebase.app();
          if (authApp) {
            authApp.auth().onAuthStateChanged(renderAccount);
            authBound = true;
          }
        } catch (error) {
          console.warn('[LEVEL UP header account] auth binding failed', error);
        }
      }`;

if (!html.includes("app.name === 'levelup-custom-auth'")) {
  if (!html.includes(oldBinding)) {
    throw new Error('Could not find LEVEL UP header auth binding block to patch.');
  }
  html = html.replace(oldBinding, newBinding);
}

const oldOpen = `    const openAccountPanel = () => {
      const trigger = document.getElementById('levelup-account-root')?.shadowRoot?.querySelector('.trigger');
      trigger?.click();
    };`;

const newOpen = `    const openAccountPanel = () => {
      const clickPanel = (attempt = 0) => {
        const trigger = document.getElementById('levelup-account-root')?.shadowRoot?.querySelector('.trigger');
        if (trigger) {
          trigger.click();
          return;
        }
        if (attempt < 20) setTimeout(() => clickPanel(attempt + 1), 50);
      };
      clickPanel();
    };`;

if (!html.includes('const clickPanel = (attempt = 0) => {')) {
  if (!html.includes(oldOpen)) {
    throw new Error('Could not find LEVEL UP header account open handler to patch.');
  }
  html = html.replace(oldOpen, newOpen);
}

fs.writeFileSync(homePath, html);

const required = [
  "location.hostname === 'levelup.hitobito.jp'",
  "app.name === 'levelup-custom-auth'",
  'authApp.auth().onAuthStateChanged(renderAccount)',
  'const clickPanel = (attempt = 0) => {',
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`LEVEL UP header auth patch missing: ${marker}`);
}

console.log('[Firebase] LEVEL UP header bound to the same auth app used by mobile redirect login');
