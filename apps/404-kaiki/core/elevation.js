// 高さ（CASE 03）
// engine に3本目の座標 z を足す。台の footprint へ「歩いて入るだけ」で上がる。
// ボタンは無い（SPEC §11 §12）。

export class Elevation {
  constructor(caseData) {
    this.c = caseData;
    this.z = 0;
    this.on = null;
    this.wasOn = null;
  }

  reset() { this.z = 0; this.on = null; this.wasOn = null; }

  // 重なっている台のうち一番高いものに乗る
  platformAt(p) {
    let best = null;
    for (const t of this.c.PLATFORMS) {
      const half = t.w / 2;
      if (p.x < t.x - half || p.x > t.x + half) continue;
      if (p.y < t.y || p.y > t.y + t.d) continue;
      if (!best || t.h > best.h) best = t;
    }
    return best;
  }

  update(dt, p) {
    const t = this.platformAt(p);
    this.wasOn = this.on;
    this.on = t;
    const want = t ? t.h : 0;
    // 上がるのはよじ登る分だけ遅く、降りるのは速い。
    // 「間に合った／間に合わなかった」が絵として出るようにする
    const k = want > this.z ? 9 : 15;
    this.z += (want - this.z) * Math.min(1, dt * k);
    if (Math.abs(want - this.z) < 0.5) this.z = want;
    p.z = this.z;
    return this.z;
  }

  // テケテケの手が届かない高さまで上がりきっているか
  safe() { return this.z >= this.c.TEKETEKE.reach; }

  justOn() { return !!this.on && (!this.wasOn || this.wasOn.id !== this.on.id); }
}
