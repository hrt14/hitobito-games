// 宿題モンスター — 状態と保存（仕様 13 / 14）
//
// 主要操作のたびに localStorage へ自動保存する。
// 壊れたデータは初期化前にバックアップとして取り出せるようにしておく。

import { DEFAULT_COLOR } from './growthRules.js';

export const STORAGE_KEY = 'hitobito_homework_monster_v1';
export const SCHEMA_VERSION = 1;

const MAX_EVENTS = 600;
const MAX_SESSIONS = 300;

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    onboardingCompleted: false,
    homework: [],
    sessions: [],
    monster: {
      name: '',
      stage: 'egg',
      color: DEFAULT_COLOR.id,
      partVariant: null,
      totalBites: 0,
      growthPoints: 0,
      decompositionPoints: 0,
      subjectBites: { math: 0, japanese: 0, english: 0, science: 0, social: 0, other: 0 },
      unlockedReactions: [],
      roomUnlocked: false,
      patternUnlocked: false,
      sparkle: false,
      bigPlate: false,
      crown: false,
    },
    stats: {
      totalStarts: 0,
      totalCompletedBites: 0,
      totalResizes: 0,
      returnedAfterBreak: 0,
      lastPlayedAt: '',
    },
    activeSessionId: null,
    settings: {
      bgm: false,
      sfx: true,
      reducedMotion: false,
      furigana: false,
    },
    ui: { screen: 'boot', params: {} },
    events: [],
  };
}

export function newId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 保存データを初期状態にマージする。欠けたキーは初期値で補う。 */
function migrate(raw) {
  const base = createInitialState();
  if (!raw || typeof raw !== 'object') return base;

  return {
    ...base,
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    monster: { ...base.monster, ...(raw.monster || {}), subjectBites: { ...base.monster.subjectBites, ...(raw.monster?.subjectBites || {}) } },
    stats: { ...base.stats, ...(raw.stats || {}) },
    settings: { ...base.settings, ...(raw.settings || {}) },
    ui: { ...base.ui, ...(raw.ui || {}) },
    homework: Array.isArray(raw.homework) ? raw.homework : [],
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    events: Array.isArray(raw.events) ? raw.events : [],
  };
}

export function createStore() {
  let corruptedBackup = null;
  let state;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    state = stored ? migrate(JSON.parse(stored)) : createInitialState();
  } catch (error) {
    // 壊れていても消さずに持っておき、設定画面から書き出せるようにする
    try {
      corruptedBackup = localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      corruptedBackup = null;
    }
    state = createInitialState();
  }

  const listeners = new Set();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // 容量超過などで保存できなくても、遊びは止めない
    }
  }

  function notify() {
    for (const fn of listeners) fn(state);
  }

  return {
    getState: () => state,

    /** updater(state) が返した部分状態をマージして保存する */
    update(updater, { silent = false } = {}) {
      const patch = typeof updater === 'function' ? updater(state) : updater;
      if (!patch) return state;
      state = { ...state, ...patch };
      if (state.events.length > MAX_EVENTS) state.events = state.events.slice(-MAX_EVENTS);
      if (state.sessions.length > MAX_SESSIONS) state.sessions = state.sessions.slice(-MAX_SESSIONS);
      persist();
      if (!silent) notify();
      return state;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    exportJson() {
      return JSON.stringify(state, null, 2);
    },

    corruptedBackup: () => corruptedBackup,

    reset() {
      state = createInitialState();
      persist();
      notify();
      return state;
    },
  };
}
