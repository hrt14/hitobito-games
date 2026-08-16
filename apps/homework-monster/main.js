// 宿題モンスター — 画面遷移と起動（仕様 10）

import { createStore } from './game/store.js';
import { createActions } from './game/actions.js';
import { playSound, setAudioSettings, unlockAudio, startBgm, stopBgm } from './game/audio.js';
import { applyFurigana } from './ui/dom.js';

import { openingScreen } from './screens/opening.js';
import { homeScreen } from './screens/home.js';
import { subjectScreen } from './screens/subject.js';
import { inputScreen } from './screens/input.js';
import { chunkScreen } from './screens/chunk.js';
import { focusScreen } from './screens/focus.js';
import { feedingScreen } from './screens/feeding.js';
import { resultScreen } from './screens/result.js';
import { breakScreen } from './screens/break.js';
import { endScreen } from './screens/end.js';
import { recordsScreen } from './screens/records.js';
import { settingsScreen } from './screens/settings.js';
import { listScreen } from './screens/list.js';
import { bookScreen } from './screens/book.js';

const SCREENS = {
  opening: openingScreen,
  home: homeScreen,
  subject: subjectScreen,
  input: inputScreen,
  chunk: chunkScreen,
  focus: focusScreen,
  feeding: feedingScreen,
  result: resultScreen,
  break: breakScreen,
  end: endScreen,
  records: recordsScreen,
  settings: settingsScreen,
  list: listScreen,
  book: bookScreen,
};

// ブラウザ更新時に復元してよい画面（仕様 10）
const RESTORABLE = new Set(['home', 'subject', 'chunk', 'focus', 'feeding', 'break', 'list', 'book', 'records']);

const store = createStore();
const actions = createActions(store);
const appEl = document.getElementById('app');
const gameEl = document.getElementById('game');

const ctx = {
  store,
  actions,
  state: () => store.getState(),
  sound: (name) => playSound(name),
  go(screen, params = {}) {
    store.update({ ui: { screen, params } }, { silent: true });
    render();
  },
  rerender: () => render(),
  syncApp: () => syncApp(),
  syncAudio: () => syncAudio(),
};

function syncApp() {
  const state = store.getState();
  // 最初のひとくちを食べさせるまでは暗い部屋。食べた瞬間に色が戻る。
  appEl.classList.toggle('is-dark', state.monster.totalBites === 0);
  appEl.classList.toggle('reduced', Boolean(state.settings.reducedMotion));
}

function syncAudio() {
  const { settings } = store.getState();
  setAudioSettings({ bgm: settings.bgm, sfx: settings.sfx });
  if (settings.bgm) startBgm();
  else stopBgm();
}

function render() {
  const state = store.getState();
  const factory = SCREENS[state.ui.screen] || homeScreen;
  gameEl.innerHTML = '';
  const node = factory(ctx);
  gameEl.appendChild(node);
  if (state.settings.furigana) applyFurigana(node);
  syncApp();
}

function resolveBootScreen() {
  const state = store.getState();
  if (!state.onboardingCompleted) return { screen: 'opening', params: {} };
  if (state.pendingMilestone && state.lastResult) return { screen: 'result', params: {} };

  const { screen, params } = state.ui;
  if (!RESTORABLE.has(screen)) return { screen: 'home', params: {} };

  // 参照先が消えている画面には戻さない
  if (screen === 'chunk' && !actions.findHomework(params.homeworkId)) return { screen: 'home', params: {} };
  if (screen === 'focus' || screen === 'feeding' || screen === 'break') {
    const session = actions.findSession(params.sessionId || state.activeSessionId);
    if (!session || session.status === 'fed') return { screen: 'home', params: {} };
  }
  return { screen, params };
}

function boot() {
  actions.markOpened();
  syncAudio();

  const target = resolveBootScreen();
  ctx.go(target.screen, target.params);

  // 最初のタップで音を鳴らせるようにする
  const unlock = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

boot();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* オフライン対応は任意。失敗しても遊びには影響しない */
    });
  });
}
