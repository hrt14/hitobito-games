// くねくね本体（CASE 02）
// 追ってこない。田の向こうを、こちらへ寄りながらゆっくり流れるだけ。
// 「動かないものが一番こわい」を成立させるため、Chase とは別物にする。

export class Kunekune {
  constructor(caseData) {
    this.c = caseData;
    this.phase = 0;
    this.visible = false;
    this.x = 0;
    this.y = caseData.KUNEKUNE.y;
    this.fade = 0;
    this.t = 0;
    this.active = false;   // PHASE 4 で理解度が動き出す
  }

  setPhase(n) { this.phase = n; }

  // 田の向こうに立たせる。画面から出ると発見できないので、
  // 遠さは x ではなく y（＝田の奥）で出す（SPEC §26）
  show(player) {
    this.visible = true;
    this.lead = this.c.KUNEKUNE.ahead;
    this.x = player.x + this.lead;
    this.y = this.c.KUNEKUNE.y;
  }

  hide() { this.visible = false; }

  update(dt, player) {
    this.t += dt;
    const target = this.visible ? 1 : 0;
    this.fade += (target - this.fade) * Math.min(1, dt * 2.2);
    if (!this.visible) return;

    const K = this.c.KUNEKUNE;
    // 追ってこない。ただし、どれだけ歩いても同じ距離の田の向こうに居る。
    // 離れないことが恐怖なので、走って振り切らせない（CASE02_SLICE §2）
    if (this.active && this.lead > K.minGap) {
      this.lead = Math.max(K.minGap, this.lead - K.driftSpeed * dt);
    }
    const want = Math.max(160, Math.min(this.c.WORLD.length - 60, player.x + this.lead));
    this.x += (want - this.x) * Math.min(1, dt * 3);
    this.y = K.y;
  }

  // 描画用。関節の折れ具合。理解度が上がるほど「読めて」しまう
  joints(understanding) {
    const n = 7;
    const out = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const wob = Math.sin(this.t * 1.7 + i * 1.3) * (10 + i * 4)
                + Math.sin(this.t * 3.1 + i * 0.7) * (5 + i * 2);
      // 理解度が高いほど動きが規則的＝意味を持って見える
      const order = understanding * Math.sin(this.t * 2.2 + i * 0.9) * 14;
      out.push({ u, dx: wob * (1 - understanding * 0.45) + order });
    }
    return out;
  }
}
