export const DAY_HOURS = 24;

export function createRun(scenario, runNumber = 1) {
  return {
    scenarioId: scenario.id,
    runNumber,
    remaining: DAY_HOURS,
    elapsed: 0,
    chosen: [],
    ended: false,
  };
}

export function canChoose(run, action) {
  return !run.ended && action.duration <= run.remaining + 1e-9;
}

export function chooseAction(run, action) {
  if (!canChoose(run, action)) return run;
  return {
    ...run,
    remaining: roundQuarter(run.remaining - action.duration),
    elapsed: roundQuarter(run.elapsed + action.duration),
    chosen: [...run.chosen, { ...action, at: run.elapsed }],
  };
}

export function endRun(run) {
  return { ...run, ended: true };
}

export function formatDuration(hours) {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function clockAt(startHour, elapsed) {
  const total = Math.round((startHour + elapsed) * 60);
  const dayOffset = Math.floor(total / (24 * 60));
  const min = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${dayOffset ? '翌 ' : ''}${h}:${m}`;
}

export function evaluateRun(scenario, run) {
  const chosenIds = new Set(run.chosen.map(a => a.id));
  const chosenById = new Map(run.chosen.map(a => [a.id, a]));
  const heartDone = scenario.heartGoals.filter(id => chosenIds.has(id));
  const saidDone = scenario.saidGoals.filter(id => chosenIds.has(id));
  const missedHeart = scenario.heartGoals.filter(id => !chosenIds.has(id));
  const inertiaHours = run.chosen.reduce((sum, a) => sum + (a.inertia >= 3 ? a.duration : 0), 0);
  const intentionalHours = run.chosen.reduce((sum, a) => sum + (a.heart >= 3 ? a.duration : 0), 0);
  const heartScore = run.chosen.reduce((sum, a) => sum + a.heart * Math.sqrt(a.duration), 0);
  const earlyBonus = heartDone.reduce((sum, id) => {
    const a = chosenById.get(id);
    const ratio = a ? 1 - (a.at / DAY_HOURS) : 0;
    return sum + Math.max(0, ratio);
  }, 0);
  const alignment = Math.max(0, Math.min(100, Math.round(
    (heartDone.length / Math.max(1, scenario.heartGoals.length)) * 58 +
    (saidDone.length / Math.max(1, scenario.saidGoals.length)) * 18 +
    Math.min(14, earlyBonus * 5) +
    Math.min(10, intentionalHours / 2) -
    Math.min(26, inertiaHours * 3)
  )));
  return {
    heartDone: heartDone.length,
    heartTotal: scenario.heartGoals.length,
    saidDone: saidDone.length,
    saidTotal: scenario.saidGoals.length,
    missedHeart,
    inertiaHours: roundQuarter(inertiaHours),
    intentionalHours: roundQuarter(intentionalHours),
    alignment,
    heartScore: Math.round(heartScore),
  };
}

export function bestScore(history, scenarioId) {
  const values = history.filter(h => h.scenarioId === scenarioId).map(h => h.result.alignment);
  return values.length ? Math.max(...values) : null;
}

function roundQuarter(value) {
  return Math.round(value * 4) / 4;
}
