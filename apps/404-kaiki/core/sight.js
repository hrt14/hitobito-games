// Sight System（CASE 02）
// CASE 01 の Chase の代わり。追われるのではなく、見て「理解してしまう」と負ける。
// 遮蔽物の陰に入ると視線が切れて、理解度が下がる。
// 生還の動詞は「逃げる」ではなく「見ない」（SPEC §32）。

export class Sight {
  constructor(caseData) {
    this.c = caseData;
    this.active = false;
    this.understanding = 0; // 0..1。1 で理解してしまう
    this.lost = false;
    this.inCover = false;
    this.coverId = null;
    this.wasInCover = false;
    this.elapsed = 0;
  }

  start(from = 0) {
    this.active = true;
    this.understanding = from;
    this.lost = false;
    this.elapsed = 0;
    this.inCover = false;
    this.wasInCover = false;
    this.coverId = null;
  }

  stop() { this.active = false; }

  // プレイヤーが遮蔽の陰にいるか。
  // 遮蔽より手前（y が大きい側）かつ、幅の中に入っていること。
  // くねくねは常に田の向こう（y が小さい側）にいるので、これで視線が切れる。
  coverAt(player) {
    for (const c of this.c.COVERS) {
      const half = c.w / 2;
      if (player.x < c.x - half || player.x > c.x + half) continue;
      if (player.y <= c.y + 6) continue;              // 遮蔽より奥にいる＝丸見え
      if (player.y > c.y + (c.reach || 130)) continue; // 影の先へ出た
      return c;
    }
    return null;
  }

  // 田の側（y が小さい）ほど、遮るものが無くてよく見えてしまう。
  // A4（田んぼの一本道）は帯そのものが狭いので、どこにいても逃げ場がない。
  exposure(player) {
    const t = Math.max(0, Math.min(1, player.y / this.c.WORLD.bandBottom));
    return 0.45 + 0.55 * (1 - t);
  }

  update(dt, player, kunekune) {
    if (!this.active) return;
    this.elapsed += dt;

    const cover = this.coverAt(player);
    this.wasInCover = this.inCover;
    this.inCover = !!cover;
    this.coverId = cover ? cover.id : null;

    const K = this.c.KUNEKUNE;
    if (cover) {
      this.understanding -= K.fadeRate * dt;
    } else {
      // 近いほど速く分かってしまう
      const gap = Math.abs(kunekune.x - player.x);
      const near = Math.max(0, 1 - gap / 900);
      const rate = K.fillRate * (1 + near * (K.nearBoost - 1)) * this.exposure(player);
      this.understanding += rate * dt;
    }
    this.understanding = Math.max(0, Math.min(1, this.understanding));
    if (this.understanding >= 1) this.lost = true;
  }

  // 覗いてしまった時（双眼鏡）
  peek(amount) {
    this.understanding = Math.min(1, this.understanding + amount);
  }

  // 陰に入った瞬間 / 出た瞬間
  justEntered() { return this.inCover && !this.wasInCover; }
  justLeft() { return !this.inCover && this.wasInCover; }
}
