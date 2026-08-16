// 宿題モンスター — テストプレイ用イベント記録（仕様 16）
//
// 外部送信はしない。端末内に保存し、JSONで書き出せるだけにする。
// 宿題名などの自由入力本文は記録しない。

export const EVENT_NAMES = [
  'app_opened',
  'homework_created',
  'bite_selected',
  'bite_started',
  'bite_completed',
  'bite_too_big',
  'bite_resized',
  'break_started',
  'returned_from_break',
  'session_ended',
  'monster_growth_unlocked',
];

/**
 * 記録できるのは種類だけ。自由入力文字列は受け取っても捨てる。
 * @param {object} store
 * @param {string} name
 * @param {{subject?:string, category?:string, size?:string, level?:number, milestone?:string}} detail
 */
export function logEvent(store, name, detail = {}) {
  const entry = {
    name,
    at: new Date().toISOString(),
    subject: detail.subject || null,
    category: detail.category || null,
    size: detail.size || null,
    level: typeof detail.level === 'number' ? detail.level : null,
    milestone: detail.milestone || null,
    totalBites: store.getState().monster.totalBites,
  };

  store.update(
    (state) => ({ events: [...state.events, entry] }),
    { silent: true },
  );
}

export function exportEventsJson(store) {
  const state = store.getState();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      schemaVersion: state.schemaVersion,
      stats: state.stats,
      monster: {
        stage: state.monster.stage,
        totalBites: state.monster.totalBites,
        growthPoints: state.monster.growthPoints,
        decompositionPoints: state.monster.decompositionPoints,
        subjectBites: state.monster.subjectBites,
      },
      events: state.events,
    },
    null,
    2,
  );
}
