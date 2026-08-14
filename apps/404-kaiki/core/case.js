// Case System / Checkpoint System（SPEC §63 §64 §36）
// CASE データは注入する。ここに特定CASEの import を足さないこと
// （足した時点で2本目のCASEが入らなくなる）


const FRESH = (id) => ({
  current_case: id,
  case_progress: 'investigation', // investigation | escape | cleared
  unlocked_areas: ['A1'],
  investigated_points: [],
  optional_points: [],
  checkpoint: null,
  case_completed: false,
  case_records: {},
  story_flags: {},
});

export class CaseState {
  constructor(caseData) {
    this.c = caseData;
    this.key = `hitobito_404_${caseData.id}_slice_v1`;
    this.data = FRESH(caseData.id);
    this.checkpointPos = null;
  }

  static hasSave(caseId) {
    try { return !!localStorage.getItem(`hitobito_404_${caseId}_slice_v1`); } catch { return false; }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) this.data = { ...FRESH(this.c.id), ...JSON.parse(raw) };
    } catch { this.data = FRESH(this.c.id); }
    return this;
  }

  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch { /* 保存できなくても進行は止めない */ }
  }

  reset() {
    this.data = FRESH(this.c.id);
    this.checkpointPos = null;
    this.save();
  }

  get flags() { return this.data.story_flags; }

  isUnlocked(areaId) { return this.data.unlocked_areas.includes(areaId); }

  isDone(pointId) {
    return this.data.investigated_points.includes(pointId)
        || this.data.optional_points.includes(pointId);
  }

  // 調査完了。開放したエリアIDを返す（無ければ null）
  complete(point) {
    const list = point.required ? this.data.investigated_points : this.data.optional_points;
    if (!list.includes(point.id)) list.push(point.id);

    const gate = this.c.GATES.find(g => g.unlockedBy === point.id);
    let opened = null;
    if (gate && !this.isUnlocked(gate.opens)) {
      this.data.unlocked_areas.push(gate.opens);
      opened = gate;
    }
    if (point.flag) this.flags[point.flag] = true;
    this.save();
    return opened;
  }

  // 開放済みエリアの右端。ここより先へは歩けない
  frontier() {
    let x = 0;
    for (const a of this.c.AREAS) if (this.isUnlocked(a.id)) x = Math.max(x, a.x1);
    return x;
  }

  areaAt(x) {
    const A = this.c.AREAS;
    return A.find(a => x >= a.x0 && x < a.x1) || A[A.length - 1];
  }

  gateAt(x) {
    return this.c.GATES.find(g => Math.abs(g.x - x) < 60) || null;
  }

  isGateOpen(gate) { return this.isUnlocked(gate.opens); }

  setCheckpoint(id, pos, extra) {
    this.data.checkpoint = id;
    this.checkpointPos = { x: pos.x, y: pos.y, ...(extra || {}) };
    this.data.story_flags.checkpoint_pos = this.checkpointPos;
    this.save();
  }

  restoreCheckpoint() {
    return this.checkpointPos || this.data.story_flags.checkpoint_pos || null;
  }

  requiredDone() {
    return this.c.POINTS.filter(p => p.required && this.isDone(p.id)).length;
  }

  optionalTotal() { return this.c.POINTS.filter(p => !p.required).length; }
  optionalDone() { return this.data.optional_points.length; }

  markCleared(record) {
    this.data.case_progress = 'cleared';
    this.data.case_completed = true;
    this.data.case_records[this.c.id] = record;
    this.save();
  }
}
