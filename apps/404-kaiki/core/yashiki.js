// 八尺様本体（CASE 06）
// 外では距離を保つだけ。家では回るだけ。追跡AIは持たない。
// 01は追う、02は動かない、03は横切る、04は並んで歩く、05は姿が無い、06は**回る**。

export class Yashiki {
  constructor(caseData) {
    this.c = caseData;
    this.visible = false;
    this.x = 0;
    this.y = caseData.YASHIKI.outY;
    this.fade = 0;
    this.t = 0;
    this.mode = 'far';   // far（田の向こう） | circle（家の周りを回る）
    this.dir = 1;
    this.lead = 0;
  }

  // 田の向こうに立たせる。近づきも遠ざかりもしない
  showFar(player) {
    const Y = this.c.YASHIKI;
    this.visible = true;
    this.mode = 'far';
    this.lead = Y.lead;
    this.x = player.x + this.lead;
    this.y = Y.outY;
  }

  // 家の周りを回りはじめる
  circle(house) {
    const Y = this.c.YASHIKI;
    this.visible = true;
    this.mode = 'circle';
    this.x = house.x0 + 40;
    this.y = Y.wallY;
    this.dir = 1;
  }

  hide() { this.visible = false; }

  update(dt, player, night = 0, lured = false) {
    this.t += dt;
    const target = this.visible ? 1 : 0;
    this.fade += (target - this.fade) * Math.min(1, dt * 2.2);
    if (!this.visible) return;
    const Y = this.c.YASHIKI;

    if (this.mode === 'far') {
      // どこまで歩いても同じ距離。振り切れないし、近づけもしない
      const want = Math.max(120, player.x + this.lead);
      this.x += (want - this.x) * Math.min(1, dt * 2.4);
      this.y = Y.outY;
      return;
    }

    // 家の周り。夜が更けるほど速くなる
    const house = this.c.HOUSE;
    const sp = Y.circleSpeed * (1 + night * Y.quicken);
    if (lured) {
      // お守りを持っていると、こちらの側へ寄ってくる。休む間が無くなる
      const d = player.x - this.x;
      if (Math.abs(d) > 24) this.dir = Math.sign(d);
    }
    this.x += this.dir * sp * dt;
    if (this.x < house.x0 + 30) { this.x = house.x0 + 30; this.dir = 1; }
    if (this.x > house.x1 - 30) { this.x = house.x1 - 30; this.dir = -1; }
    this.y = Y.wallY;
  }
}
