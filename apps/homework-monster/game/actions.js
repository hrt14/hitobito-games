// 宿題モンスター — ゲーム操作（UIから呼ぶ副作用のまとめ）

import { newId } from './store.js';
import { logEvent } from './events.js';
import { applyRemaining } from './biteEngine.js';
import { growthFor, milestoneFor, stageForBites } from './growthRules.js';
import { HOMEWORK_KINDS, templateById } from './biteTemplates.js';

export function createActions(store) {
  const state = () => store.getState();

  function findHomework(id) {
    return state().homework.find((h) => h.id === id) || null;
  }

  function findSession(id) {
    return state().sessions.find((s) => s.id === id) || null;
  }

  function patchSession(id, patch) {
    store.update((s) => ({
      sessions: s.sessions.map((session) => (session.id === id ? { ...session, ...patch } : session)),
    }));
    return findSession(id);
  }

  return {
    findHomework,
    findSession,

    markOpened() {
      logEvent(store, 'app_opened');
      store.update((s) => ({ stats: { ...s.stats, lastPlayedAt: new Date().toISOString() } }));
    },

    completeOnboarding() {
      store.update({ onboardingCompleted: true });
    },

    createHomework({ subject, title, kindId, amount }) {
      const kind = HOMEWORK_KINDS.find((k) => k.id === kindId) || HOMEWORK_KINDS[0];
      const now = new Date().toISOString();
      const homework = {
        id: newId('hw'),
        title: title || '',
        subject,
        category: kind.category,
        totalAmount: typeof amount === 'number' && amount > 0 ? amount : undefined,
        remainingAmount: typeof amount === 'number' && amount > 0 ? amount : undefined,
        unit: kind.unit,
        unitLabel: kind.unitLabel,
        customUnit: '',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      store.update((s) => ({ homework: [...s.homework, homework] }));
      logEvent(store, 'homework_created', { subject, category: kind.category });
      return homework;
    },

    /** ひとくちを選ぶ。既存セッションがあれば作り直さず更新する。 */
    selectBite(homeworkId, bite, { sessionId = null } = {}) {
      const homework = findHomework(homeworkId);
      const existing = sessionId ? findSession(sessionId) : null;

      const payload = {
        templateId: bite.custom ? null : bite.id,
        customLabel: bite.label,
        size: bite.size,
        hierarchyLevel: bite.hierarchyLevel,
        subjectCategory: bite.subjectCategory,
        status: 'selected',
      };

      let session;
      if (existing && existing.status !== 'fed') {
        session = patchSession(existing.id, payload);
      } else {
        session = {
          id: newId('bs'),
          homeworkId,
          resizeCount: 0,
          timerSeconds: 0,
          startedAt: null,
          completedAt: null,
          ...payload,
        };
        store.update((s) => ({ sessions: [...s.sessions, session] }));
      }

      store.update({ activeSessionId: session.id });
      logEvent(store, 'bite_selected', {
        subject: homework?.subject,
        category: bite.subjectCategory,
        size: bite.size,
        level: bite.hierarchyLevel,
      });
      return session;
    },

    /** 宿題そのものを終えたときの「ごちそう」セッションを作る */
    startFeast(homeworkId) {
      const homework = findHomework(homeworkId);
      if (!homework) return null;
      const now = new Date().toISOString();
      const session = {
        id: newId('bs'),
        homeworkId,
        templateId: null,
        customLabel: '宿題ぜんぶ おわり',
        size: 'solid_bite',
        hierarchyLevel: 0,
        subjectCategory: homework.category,
        status: 'completed',
        startedAt: now,
        completedAt: now,
        resizeCount: 0,
        timerSeconds: 0,
        feast: true,
      };
      store.update((s) => ({ sessions: [...s.sessions, session], activeSessionId: session.id }));
      logEvent(store, 'bite_completed', {
        subject: homework.subject,
        category: homework.category,
        size: 'feast',
        level: 0,
      });
      return session;
    },

    startBite(sessionId) {
      const session = findSession(sessionId);
      if (!session) return null;
      const homework = findHomework(session.homeworkId);
      const updated = patchSession(sessionId, {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      });
      store.update((s) => ({ stats: { ...s.stats, totalStarts: s.stats.totalStarts + 1 } }));
      logEvent(store, 'bite_started', {
        subject: homework?.subject,
        category: session.subjectCategory,
        size: session.size,
        level: session.hierarchyLevel,
      });
      return updated;
    },

    setTimer(sessionId, seconds) {
      patchSession(sessionId, { timerSeconds: seconds });
    },

    completeBite(sessionId) {
      const session = findSession(sessionId);
      if (!session) return null;
      const homework = findHomework(session.homeworkId);
      const updated = patchSession(sessionId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      logEvent(store, 'bite_completed', {
        subject: homework?.subject,
        category: session.subjectCategory,
        size: session.size,
        level: session.hierarchyLevel,
      });
      return updated;
    },

    /** 「まだ大きい」。責めずに、もっと小さい候補へ渡す。 */
    markTooBig(sessionId) {
      const session = findSession(sessionId);
      if (!session) return null;
      const homework = findHomework(session.homeworkId);
      logEvent(store, 'bite_too_big', {
        subject: homework?.subject,
        category: session.subjectCategory,
        size: session.size,
        level: session.hierarchyLevel,
      });
      return session;
    },

    /** 小さく切り直した。分解力とちいさくできた数が増える。 */
    resizeBite(sessionId, bite) {
      const session = findSession(sessionId);
      if (!session) return null;
      const homework = findHomework(session.homeworkId);

      patchSession(sessionId, {
        templateId: bite.custom ? null : bite.id,
        customLabel: bite.label,
        size: bite.size,
        hierarchyLevel: bite.hierarchyLevel,
        subjectCategory: bite.subjectCategory,
        status: 'selected',
        resizeCount: session.resizeCount + 1,
      });

      store.update((s) => ({
        stats: { ...s.stats, totalResizes: s.stats.totalResizes + 1 },
        monster: { ...s.monster, decompositionPoints: s.monster.decompositionPoints + 1 },
      }));

      logEvent(store, 'bite_resized', {
        subject: homework?.subject,
        category: bite.subjectCategory,
        size: bite.size,
        level: bite.hierarchyLevel,
      });
      return findSession(sessionId);
    },

    startBreak(sessionId) {
      const session = findSession(sessionId);
      if (session) patchSession(sessionId, { status: 'paused' });
      logEvent(store, 'break_started', { size: session?.size, level: session?.hierarchyLevel });
    },

    returnFromBreak(sessionId) {
      const session = findSession(sessionId);
      if (session) patchSession(sessionId, { status: 'in_progress' });
      store.update((s) => ({
        stats: { ...s.stats, returnedAfterBreak: s.stats.returnedAfterBreak + 1 },
      }));
      logEvent(store, 'returned_from_break', { size: session?.size, level: session?.hierarchyLevel });
    },

    /**
     * モンスターに食べさせる。ひとくち数・成長値・教科別回数を加算し、
     * 累計ひとくち数に対応する変化があれば返す。
     */
    feedMonster(sessionId) {
      const session = findSession(sessionId);
      if (!session) return null;
      const homework = findHomework(session.homeworkId);
      const subject = homework?.subject || 'other';

      const before = state().monster;
      const totalBites = before.totalBites + 1;
      const growth = growthFor(session.size);

      let monster = {
        ...before,
        totalBites,
        growthPoints: before.growthPoints + growth,
        subjectBites: {
          ...before.subjectBites,
          [subject]: (before.subjectBites[subject] || 0) + 1,
        },
      };

      // 残量は「1問やる」「1ページやる」などでだけ減る（着手行動では減らさない）
      const template = session.templateId ? templateById(session.templateId) : null;
      const updatedHomework = applyRemaining(homework, template);

      const feast =
        Boolean(session.feast) ||
        (Boolean(updatedHomework) &&
          typeof updatedHomework.remainingAmount === 'number' &&
          updatedHomework.remainingAmount === 0 &&
          homework?.status === 'active');

      if (feast) monster = { ...monster, growthPoints: monster.growthPoints + 3 };

      const milestone = milestoneFor(totalBites);
      if (milestone && milestone.apply) monster = milestone.apply(monster);
      if (!milestone || !milestone.apply) monster = { ...monster, stage: stageForBites(totalBites) };

      store.update((s) => ({
        monster,
        homework: s.homework.map((h) =>
          h.id === updatedHomework?.id
            ? { ...updatedHomework, status: feast ? 'completed' : h.status, updatedAt: new Date().toISOString() }
            : h,
        ),
        stats: { ...s.stats, totalCompletedBites: s.stats.totalCompletedBites + 1, lastPlayedAt: new Date().toISOString() },
        pendingMilestone: milestone?.interaction ? { id: milestone.id, bites: milestone.bites } : null,
        lastResult: {
          sessionId,
          subject,
          biteLabel: session.customLabel,
          size: session.size,
          feast,
          milestoneId: milestone?.id || null,
          homeworkId: session.homeworkId,
        },
      }));

      patchSession(sessionId, { status: 'fed' });

      if (milestone) {
        logEvent(store, 'monster_growth_unlocked', {
          subject,
          size: session.size,
          level: session.hierarchyLevel,
          milestone: milestone.id,
        });
      }

      return { milestone, feast, totalBites, subject };
    },

    /** 色・名前・パーツの選択を反映する */
    applyMilestoneChoice(milestoneId, choice) {
      store.update((s) => {
        const monster = { ...s.monster };
        if (milestoneId === 'color') monster.color = choice;
        if (milestoneId === 'name') monster.name = choice;
        if (milestoneId === 'part') monster.partVariant = choice;
        return { monster, pendingMilestone: null };
      });
    },

    clearPendingMilestone() {
      store.update({ pendingMilestone: null });
    },

    endSession() {
      const active = state().activeSessionId;
      const session = active ? findSession(active) : null;
      logEvent(store, 'session_ended', { size: session?.size, level: session?.hierarchyLevel });
      store.update({ activeSessionId: null });
    },

    updateSettings(patch) {
      store.update((s) => ({ settings: { ...s.settings, ...patch } }));
    },
  };
}
