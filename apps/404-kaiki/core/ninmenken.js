// 人面犬本体（CASE 04）
// 追ってこない。隣を歩いてくる。追跡AIは持たない。
// 01は追う、02は動かない、03は横切る、04は並んで歩く。

export class Ninmenken {
  constructor(caseData) {
    this.c = caseData;
    this.visible = false;
    this.x = 0;
    this.y = 150;
    this.fade = 0;
    this.t = 0;
    this.facing = 1;
    this.mode = 'walk';   // walk（隣を歩く） | wait（路地の奥で待つ）
    this.talkT = 0;
  }

  // 路地の奥に立たせる（PHASE 3 の目撃）
  waitAt(alley) {
    this.visible = true;
    this.mode = 'wait';
    this.x = alley.x;
    this.y = alley.deep + 24;
  }

  // 隣に並ぶ（PHASE 4）
  walkWith(player) {
    this.visible = true;
    this.mode = 'walk';
    const N = this.c.NINMENKEN;
    this.x = player.x - N.gap;
    this.y = Math.min(190, player.y + N.side);
  }

  hide() { this.visible = false; this.mode = 'walk'; }

  update(dt, player) {
    this.t += dt;
    this.talkT = Math.max(0, this.talkT - dt);
    const target = this.visible ? 1 : 0;
    this.fade += (target - this.fade) * Math.min(1, dt * 2.4);
    if (!this.visible || this.mode !== 'walk') return;

    // 一定の距離で並ぶ。追いつきも離れもしない
    const N = this.c.NINMENKEN;
    const want = player.x - N.gap * this.facingOf(player);
    this.x += (want - this.x) * Math.min(1, dt * N.follow);
    const wy = Math.max(20, Math.min(196, player.y + N.side));
    this.y += (wy - this.y) * Math.min(1, dt * 2.6);
    this.facing = this.x < player.x ? 1 : -1;
  }

  // プレイヤーの進行方向。後ろ側に付く
  facingOf(player) {
    if (player.x > (this._lastPx ?? player.x)) this._dir = 1;
    else if (player.x < (this._lastPx ?? player.x)) this._dir = -1;
    this._lastPx = player.x;
    return this._dir ?? 1;
  }

  talk() { this.talkT = 1.6; }
}
