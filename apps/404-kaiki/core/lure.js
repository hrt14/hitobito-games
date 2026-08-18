// 嘘のライン（CASE 04）
// このCASEは新しい描画を持たない。緑のラインが指す先を差し替えるだけ。
// 見分けがつかないことが仕掛けそのものなので、色も動きも本物と同じにする。
//
// 時間ではなく「位置」で嘘をつく。路地に近づいた時だけ線が曲がるので、
// **路地ひとつが判断ひとつ**になる。時間で回すと、判断の無い場所で嘘をついて
// 何も起きないまま終わってしまう。

export class Lure {
  constructor(caseData) {
    this.c = caseData;
    this.active = false;
    this.lying = false;
    this.target = null;   // 誘い込もうとしている路地
    this.used = new Set();
    this.count = 0;
  }

  start(fresh = true) {
    this.active = true;
    this.lying = false;
    this.target = null;
    if (fresh) { this.used = new Set(); this.count = 0; }
  }

  stop() { this.active = false; this.lying = false; this.target = null; }

  // 状態が変わったフレームだけ 'lie' / 'truth' を返す
  update(dt, player) {
    if (!this.active) return null;
    const L = this.c.LURE;

    if (this.lying) {
      if (player.x > this.target.x + L.past) {
        this.used.add(this.target.id);
        this.lying = false;
        this.target = null;
        this.count++;
        return 'truth';
      }
      return null;
    }

    // 正直な路地は、何も言わずに通り過ぎさせる。
    // 「路地＝必ず嘘」だと覚えられると、線を見なくなる
    for (const h of this.c.ALLEYS) {
      if (!this.used.has(h.id) && h.honest && player.x > h.x + L.past) this.used.add(h.id);
    }

    const a = this.c.ALLEYS.find(k =>
      !this.used.has(k.id) && !k.honest &&
      player.x > k.x - L.near && player.x < k.x + L.past);
    if (a) { this.lying = true; this.target = a; return 'lie'; }
    return null;
  }

  // 緑のラインが指す先。嘘のときは路地の奥
  objective(truth) {
    if (!this.lying || !this.target) return truth;
    const a = this.target;
    return { x: a.x, y: a.deep + 18 };
  }

  // 路地の奥まで入ってしまったか
  caught(player) {
    if (!this.active) return null;
    for (const a of this.c.ALLEYS) {
      if (Math.abs(player.x - a.x) > a.w / 2) continue;
      if (player.y > a.deep + this.c.LURE.depth) continue;
      return a;
    }
    return null;
  }
}
