// 通過システム（CASE 03）
// 追跡AIは持たない。踏切の音 → 通過 → 静寂 のサイクルだけを回す。
// 緊張の出どころが「距離」でも「空間」でもなく「時間」になるのがこのCASE。

export class Pass {
  constructor(caseData) {
    this.c = caseData;
    this.active = false;
    this.state = 'quiet';   // quiet（歩ける） | warn（鳴っている） | cross（横切っている）
    this.t = 0;
    this.count = 0;
  }

  start(fresh = true) {
    this.active = true;
    this.state = 'quiet';
    this.t = this.c.PASS.firstQuiet;
    if (fresh) this.count = 0;
  }

  stop() { this.active = false; this.state = 'quiet'; }

  // 静寂の長さ。エリアごとに変え、回を追うごとに短くする。
  // A5（線路沿い）だけ極端に短い＝山場
  quietFor(area) {
    const P = this.c.PASS;
    const base = (P.quietByArea && P.quietByArea[area.id]) ?? P.quiet;
    return Math.max(P.minQuiet, base - this.count * P.quicken);
  }

  // 状態が変わったフレームだけ 'warn' / 'cross' / 'clear' を返す
  update(dt, area) {
    if (!this.active) return null;
    this.t -= dt;
    if (this.t > 0) return null;
    const P = this.c.PASS;
    if (this.state === 'quiet') { this.state = 'warn';  this.t = P.warn;  return 'warn'; }
    if (this.state === 'warn')  { this.state = 'cross'; this.t = P.cross; return 'cross'; }
    this.state = 'quiet';
    this.count++;
    this.t = this.quietFor(area);
    return 'clear';
  }

  get warning()  { return this.state === 'warn'; }
  get crossing() { return this.state === 'cross'; }

  // 警告の進み具合 0..1。踏切の音と画面の縁に使う
  get pressure() {
    if (this.state === 'warn') return 1 - Math.max(0, this.t) / this.c.PASS.warn;
    return this.state === 'cross' ? 1 : 0;
  }
}
