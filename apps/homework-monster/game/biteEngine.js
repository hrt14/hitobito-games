// 宿題モンスター — 分解エンジン（仕様 15）
//
// UIから独立させる。入力は「カテゴリ・現在のテンプレート・階層レベル・残量」、
// 出力は「表示文・1段階小さい候補・サイズ・食べ物の見た目・モンスターの反応」。

import { templatesFor, templateById, SIZE_META } from './biteTemplates.js';

/** 現在より1段階小さい候補（最大3件） */
export function getSmallerBites(current, templates = null) {
  if (!current) return [];
  const pool = templates || templatesFor(current.subjectCategory);
  return pool
    .filter(
      (t) =>
        t.subjectCategory === current.subjectCategory &&
        t.hierarchyLevel > current.hierarchyLevel,
    )
    .sort((a, b) => a.hierarchyLevel - b.hierarchyLevel)
    .slice(0, 3);
}

/** そのままの宿題（いちばん大きい塊） */
export function wholeTemplate(category) {
  const list = templatesFor(category);
  return list[0] || null;
}

/**
 * 既定のひとくち。常に `bite` サイズを返す。
 * 前回たくさんできたことを理由に大きくしない（仕様 7.4 / 原則D）。
 */
export function defaultTemplate(category) {
  const list = templatesFor(category);
  return list.find((t) => t.size === 'bite') || list[list.length - 1] || null;
}

/** 指定サイズの中でいちばん大きいものを返す（サイズ直接選択用） */
export function templateForSize(category, size) {
  const list = templatesFor(category);
  return list.find((t) => t.size === size) || defaultTemplate(category);
}

/** 1段階小さいテンプレート（なければ null） */
export function nextSmaller(current) {
  return getSmallerBites(current)[0] || null;
}

export function canGoSmaller(current) {
  return Boolean(nextSmaller(current));
}

/** モンスターの反応タイプ。小さくするほど困る→期待→笑顔（仕様 7.3） */
export function reactionFor(bite) {
  if (!bite) return 'idle';
  if (bite.hierarchyLevel <= 1) return 'struggle';
  if (bite.size === 'solid_bite') return 'struggle';
  if (bite.size === 'bite') return 'hopeful';
  return 'happy';
}

/** 食べ物の見た目サイズ */
export function foodScaleFor(bite) {
  if (!bite) return 'medium';
  if (bite.hierarchyLevel <= 1) return 'giant';
  if (bite.size === 'solid_bite') return 'large';
  if (bite.size === 'bite') return 'medium';
  return 'small';
}

/** 大きすぎて食べられない状態か */
export function isTooBigToEat(bite) {
  return Boolean(bite) && bite.hierarchyLevel <= 1;
}

/** 現在のひとくちの表示情報をまとめて返す（仕様 15.2） */
export function describeBite(bite) {
  const size = SIZE_META[bite?.size] || SIZE_META.bite;
  return {
    label: bite?.label || '',
    size: size.id,
    sizeLabel: size.label,
    sizeHint: size.hint,
    growth: size.growth,
    foodScale: foodScaleFor(bite),
    reaction: reactionFor(bite),
    tooBig: isTooBigToEat(bite),
    smaller: getSmallerBites(bite),
  };
}

/** 自由入力で作る、いちばん小さいひとくち */
export function customBite(category, label, fromLevel) {
  return {
    id: `custom-${category}-${fromLevel + 1}`,
    subjectCategory: category,
    label,
    size: 'fragment',
    hierarchyLevel: fromLevel + 1,
    estimatedSeconds: 10,
    reduces: null,
    custom: true,
  };
}

/** セッションに保存されたひとくちを復元する */
export function reviveBite(session) {
  if (!session) return null;
  const base = session.templateId ? templateById(session.templateId) : null;
  if (base) return base;
  return {
    id: session.templateId || 'custom',
    subjectCategory: session.subjectCategory || 'generic',
    label: session.customLabel,
    size: session.size || 'fragment',
    hierarchyLevel: session.hierarchyLevel || 99,
    reduces: null,
    custom: true,
  };
}

/**
 * 完了したひとくちで宿題の残量を減らす（仕様 15.4）。
 * 着手行動（見る・開く・座る）では減らさない。減らなくても成長は必ず加算する。
 */
export function applyRemaining(homework, bite) {
  if (!homework || !bite || !bite.reduces) return homework;
  if (typeof homework.remainingAmount !== 'number') return homework;

  if (bite.reduces.unit === 'all') {
    return { ...homework, remainingAmount: 0 };
  }
  if (homework.unit && bite.reduces.unit !== homework.unit) return homework;

  const next = Math.max(0, homework.remainingAmount - (bite.reduces.amount || 0));
  return { ...homework, remainingAmount: next };
}
