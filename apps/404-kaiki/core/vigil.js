// 籠城（CASE 06）
// 生還地点が無い。**朝が来たら終わり**。
// 五枚の札を、一人で守る。彼女の前の札は 4.2秒 で落ち、
// 他の四枚も 56秒 で落ちる。張り付くことも、離れることもできない。

export class Vigil {
  constructor(caseData) {
    this.c = caseData;
    this.active = false;
    this.left = 0;        // 夜の残り（秒）
    this.wards = [];
    this.torn = 0;        // 破れた枚数
    this.lost = false;
    this.repairing = null;
    this.targetId = null; // 緑のラインがいま指している札
  }

  reset(fromHalf = false) {
    const V = this.c.VIGIL;
    this.left = fromHalf ? V.night * V.retry : V.night;
    this.wards = this.c.WARDS.map(w => ({ ...w, s: 1, torn: false }));
    this.torn = 0;
    this.lost = false;
    this.repairing = null;
    this.targetId = null;
  }

  start(fromHalf = false) {
    this.active = true;
    this.reset(fromHalf);
  }

  stop() { this.active = false; }

  // 夜の進み具合 0..1。彼女の巡回はこれで速くなる
  get night() {
    const V = this.c.VIGIL;
    return Math.max(0, Math.min(1, 1 - this.left / V.night));
  }

  // 一番減っている札。仲間が言うのはこっち
  weakest() {
    let best = null;
    for (const w of this.wards) {
      if (w.torn) continue;
      if (!best || w.s < best.s) best = w;
    }
    return best;
  }

  // 緑のラインが指すのは「一番減っている札」ではなく
  // 「**一番先に落ちる札**」（CASE06_SLICE §2）。
  // 彼女の正面は 0.24/s、他は 0.018/s。残量だけで選ぶと十三倍間違える
  urgent(yashiki, player) {
    const V = this.c.VIGIL;
    const near = this.facing(yashiki);
    const life = w => w.s / (w === near ? V.decayNear : V.decayFar);
    // いま自分が押さえていて、もう戻りきった札は指さない。
    // 指し続けると線は「そこを動くな」と言っているのと同じになり、
    // 残り四枚が黙って落ちる（CASE06_SLICE §2「手が足りない」）
    const here = player ? this.at(player) : null;
    const hold = here && here.s >= 0.92 ? here : null;
    let best = null, bt = 1e9;
    for (const w of this.wards) {
      if (w.torn || w === hold) continue;
      const t = life(w);
      if (t < bt) { bt = t; best = w; }
    }
    if (!best) return hold;
    // ちらつき止め。いまの目標がまだ十分あぶないなら替えない。
    // 指す先が一秒ごとに入れ替わると、線は指示ではなく雑音になる
    const cur = this.wards.find(w => w.id === this.targetId && !w.torn && w !== hold);
    if (cur && life(cur) < bt * 1.4) return cur;
    this.targetId = best.id;
    return best;
  }

  // プレイヤーがその札の前にいるか
  at(player) {
    const V = this.c.VIGIL;
    for (const w of this.wards) {
      if (w.torn) continue;
      if (Math.abs(player.x - w.x) > V.reachX) continue;
      if (player.y > w.y + V.reachY) continue;
      return w;
    }
    return null;
  }

  // 彼女が正面にいる札
  facing(yashiki) {
    let best = null, bd = 1e9;
    for (const w of this.wards) {
      if (w.torn) continue;
      const d = Math.abs(yashiki.x - w.x);
      if (d < bd) { bd = d; best = w; }
    }
    return bd <= this.c.VIGIL.nearX ? best : null;
  }

  // 返り値: 'tear'（一枚破れた） | 'lost'（二枚目） | null
  update(dt, player, yashiki) {
    if (!this.active || this.lost) return null;
    this.left = Math.max(0, this.left - dt);

    const V = this.c.VIGIL;
    const near = this.facing(yashiki);
    const here = this.at(player);
    this.repairing = here ? here.id : null;

    let ev = null;
    for (const w of this.wards) {
      if (w.torn) continue;
      w.s -= (w === near ? V.decayNear : V.decayFar) * dt;
      if (w === here) w.s += V.repair * dt;
      if (w.s >= 1) { w.s = 1; continue; }
      if (w.s <= 0) {
        w.s = 0;
        w.torn = true;
        this.torn++;
        ev = this.torn >= V.maxTorn ? 'lost' : 'tear';
        if (ev === 'lost') this.lost = true;
      }
    }
    // 一枚破れたら、ばあちゃんが残りを押さえる。
    // ここで底上げしないと、一枚目と二枚目が同じ数秒に来て
    // 「破れた」の一言を読む前に終わる。あれは警告であって死ではない
    if (ev === 'tear') {
      for (const w of this.wards) if (!w.torn) w.s = Math.max(w.s, V.floorAfterTear);
    }
    return ev;
  }

  get done() { return this.active && this.left <= 0 && !this.lost; }
}
