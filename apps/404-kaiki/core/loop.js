// 周回と変化（CASE 05）
// このCASEには歩き回る怪異がいない。怪異は駅そのもの。
// あるのは「毎周ひとつだけ何かが違う」ことだけ。
//
// 「気づく」を movement だけで表せるのは、このゲームが元々
// 「近づくこと＝調べること」だから（SPEC §11 §12）。
// 変わったものの所まで歩けば、それが気づいたということになる。
//
// 一周＝一つの変化。見つけても周は終わらない。**縫い目で終わる。**
// 見つけずに縫い目を越えたら見落とし。これで「一周＝一回の捜索」になる。

export class Loop {
  constructor(caseData) {
    this.c = caseData;
    this.active = false;
    this.lap = 0;        // 1 から
    this.idx = 0;        // この周で変わっているもの
    this.found = false;  // この周のぶんを見つけたか
    this.missed = 0;     // 見落としたまま一周した回数
    this.t = 0;
    this.hint = 0;       // 0=まだ 1=気配 2=場所を言う（マークも戻る）
    this.done = false;   // 最後の変化に気づいた＝輪が切れた
  }

  start(fresh = true) {
    this.active = true;
    this.done = false;
    if (fresh) { this.lap = 0; this.idx = 0; this.missed = 0; }
    this.found = false;
    this.beginLap();
  }

  stop() { this.active = false; }

  beginLap() {
    this.lap++;
    this.t = 0;
    this.hint = 0;
  }

  // この周で変わっているもの。見つけた後も、そこにあり続ける
  get change() {
    return this.c.CHANGES[this.idx] || null;
  }

  get noticed() { return this.idx + (this.found ? 1 : 0); }

  // 駅の壊れ具合 0..1。周回と見落としで進む
  get decay() {
    return Math.min(1, this.idx * 0.16 + this.missed * 0.22);
  }

  // 経過に応じてヒントの段階を上げる。上がったフレームだけ返す。
  // 切符を拾っていると仲間の指摘が遅れる（CASE05_SLICE §4）
  update(dt, hasTicket) {
    if (!this.active || this.done || this.found) return null;
    this.t += dt;
    const H = this.c.LOOP;
    const h1 = hasTicket ? H.hint1Ticket : H.hint1;
    const h2 = hasTicket ? H.hint2Ticket : H.hint2;
    if (this.hint === 0 && this.t > h1) { this.hint = 1; return 'hint1'; }
    if (this.hint === 1 && this.t > h2) { this.hint = 2; return 'hint2'; }
    return null;
  }

  // 変わっているものの近くまで来たか
  near(player) {
    if (!this.active || this.done || this.found) return false;
    const ch = this.change;
    if (!ch) return false;
    const R = this.c.LOOP;
    const dx = (player.x - ch.x) / R.radiusX;
    const dy = (player.y - ch.y) / R.radiusY;
    return dx * dx + dy * dy <= 1;
  }

  // 気づいた。周はまだ終わらない（縫い目まで歩く）
  notice() {
    this.found = true;
    if (this.idx >= this.c.CHANGES.length - 1) { this.done = true; return true; }
    return false;
  }

  // 縫い目を越えた。ここで一周が閉じる。
  // 返り値: 'next'（次の周へ） | 'miss'（見落とし） | 'lost'（三回目）
  crossSeam() {
    if (!this.active || this.done) return null;
    if (this.found) {
      this.idx++;
      this.found = false;
      this.beginLap();
      return 'next';
    }
    this.missed++;
    if (this.missed >= this.c.LOOP.maxMiss) return 'lost';
    this.beginLap();
    return 'miss';
  }

  // マークを出してよいか。二周目からは出さないのが仕掛け
  showMarks() { return !this.active || this.hint >= 2; }
}
