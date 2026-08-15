// テケテケ本体（CASE 03）
// 追わない。止まらない。振り向かない。ただ横切るだけ。
// くねくねが「動かないから怖い」なら、こちらは「止まらないから怖い」。

export class TekeTeke {
  constructor(caseData) {
    this.c = caseData;
    this.visible = false;
    this.x = 0;
    this.y = 120;
    this.dir = 1;
    this.t = 0;
    this.reached = false;  // プレイヤーの位置を通り過ぎたか
    this.armT = 0;         // 手を伸ばしているモーション
  }

  // 片側から現れて、反対側へ抜ける
  cross(player) {
    const T = this.c.TEKETEKE;
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.x = player.x - this.dir * T.span;
    this.y = player.y;
    this.visible = true;
    this.reached = false;
    this.armT = 0;
  }

  hide() { this.visible = false; }

  update(dt, player) {
    this.t += dt;
    if (!this.visible) return;
    const T = this.c.TEKETEKE;
    this.x += this.dir * T.speed * dt;
    // 深さは追ってくる。y へ逃げても助からない。助かるのは高さだけ
    this.y += (player.y - this.y) * Math.min(1, dt * 4);
    if (this.armT > 0) this.armT -= dt;
    if ((this.x - player.x) * this.dir > T.span) this.visible = false;
  }

  // プレイヤーの真横に来た瞬間。ここで高さを測られる
  atPlayer(player) {
    if (!this.visible || this.reached) return false;
    if ((this.x - player.x) * this.dir < 0) return false;
    this.reached = true;
    this.armT = 0.42;
    return true;
  }
}
