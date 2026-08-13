// Case System / Checkpoint System（SPEC §63 §64 §36）
import { AREAS, GATES, POINTS } from '../data/case01.js';

const KEY = 'hitobito_404_case01_slice_v1';

const FRESH = () => ({
  current_case: 'case01',
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
  constructor() {
    this.data = FRESH();
    this.checkpointPos = null;
  }

  static hasSave() {
    try { return !!localStorage.getItem(KEY); } catch { return false; }
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...FRESH(), ...JSON.parse(raw) };
    } catch { this.data = FRESH(); }
    return this;
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* 保存できなくても進行は止めない */ }
  }

  reset() {
    this.data = FRESH();
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

    const gate = GATES.find(g => g.unlockedBy === point.id);
    let opened = null;
    if (gate && !this.isUnlocked(gate.opens)) {
      this.data.unlocked_areas.push(gate.opens);
      opened = gate;
    }
    if (point.id === 'P5') this.flags.knows_shrine = true;
    if (point.id === 'H1') this.flags.saw_graffiti_404 = true;
    this.save();
    return opened;
  }

  // 開放済みエリアの右端。ここより先へは歩けない
  frontier() {
    let x = 0;
    for (const a of AREAS) if (this.isUnlocked(a.id)) x = Math.max(x, a.x1);
    return x;
  }

  areaAt(x) {
    return AREAS.find(a => x >= a.x0 && x < a.x1) || AREAS[AREAS.length - 1];
  }

  gateAt(x) {
    return GATES.find(g => Math.abs(g.x - x) < 60) || null;
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
    return POINTS.filter(p => p.required && this.isDone(p.id)).length;
  }

  optionalTotal() { return POINTS.filter(p => !p.required).length; }
  optionalDone() { return this.data.optional_points.length; }

  markCleared(record) {
    this.data.case_progress = 'cleared';
    this.data.case_completed = true;
    this.data.case_records.case01 = record;
    this.save();
  }
}
