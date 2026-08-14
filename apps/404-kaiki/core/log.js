// Investigation Log（SPEC §38 §39 §40）
// Wikipedia的な説明画面にしない。404部が書いたノートにする。
// 中身は CASE 側（data/caseXX.js の RECORD / EVIDENCE）が持つ。

export function buildRecord(state) {
  const c = state.c;
  const rec = c.RECORD;
  const found = c.POINTS
    .filter(p => state.isDone(p.id))
    .map(p => c.EVIDENCE[p.id])
    .filter(Boolean);

  const unresolved = [...rec.unresolved];
  for (const [flag, line] of Object.entries(rec.unresolvedIf || {})) {
    if (state.flags[flag]) unresolved.push(line);
  }

  return {
    case: rec.case,
    rumor: rec.rumor,
    places: rec.places,
    encounter: rec.encounter,
    evidence: found,
    optional: `${state.optionalDone()} / ${state.optionalTotal()}`,
    notes: rec.notes,
    unresolved,
  };
}
