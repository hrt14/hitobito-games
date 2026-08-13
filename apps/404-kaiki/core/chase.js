// Chase System（SPEC §29 §30 §35）
// 最短距離ではなく、プレイヤーが通った経路を遅れて追う。
import { SPEED } from '../data/case01.js';

const CONTACT = 34;
const TRAIL_STEP = 0.06;

export class Chase {
  constructor() {
    this.active = false;
    this.trail = [];
    this.timer = 0;
    this.caught = false;
    this.cutIndex = 0;
    this.block = 0;
    this.elapsed = 0;
  }

  start(anomaly, player, behind) {
    this.active = true;
    this.caught = false;
    this.trail = [];
    this.timer = 0;
    this.elapsed = 0;
    this.cutIndex = 0;
    this.block = 0;
    anomaly.chasing = true;
    anomaly.visible = true;
    anomaly.x = player.x + behind;
    anomaly.y = 105;
  }

  stop(anomaly) {
    this.active = false;
    if (anomaly) anomaly.chasing = false;
  }

  // 先回り。追尾ではなく「立ちふさがる」。
  // 正面から突っ込んでくると避けようがなく理不尽になるため、一定時間その場に止まる。
  cutAhead(anomaly, player, dir, distance) {
    anomaly.x = player.x + dir * distance;
    anomaly.y = 100;
    anomaly.chasing = false;
    this.trail = [];
    this.block = 2.6;
    this.cutIndex++;
    return true;
  }

  update(dt, anomaly, player) {
    if (!this.active) return;
    this.elapsed += dt;

    // ふさいでいる間は動かない。プレイヤーは横に回り込んで抜ける
    if (this.block > 0) {
      this.block -= dt;
      if (this.block <= 0) { anomaly.chasing = true; this.trail = []; }
      if (Math.hypot(player.x - anomaly.x, player.y - anomaly.y) < CONTACT) this.caught = true;
      return;
    }

    this.timer += dt;
    if (this.timer >= TRAIL_STEP) {
      this.timer = 0;
      this.trail.push({ x: player.x, y: player.y });
      if (this.trail.length > 240) this.trail.shift();
    }

    // 追う先はプレイヤー本人ではなく、少し前の足跡
    const lag = Math.min(this.trail.length - 1, 8);
    const target = this.trail.length ? this.trail[Math.max(0, this.trail.length - 1 - lag)] : player;

    const dx = target.x - anomaly.x;
    const dy = target.y - anomaly.y;
    const len = Math.hypot(dx, dy) || 1;
    const step = SPEED.anomaly * dt;
    anomaly.x += (dx / len) * step;
    anomaly.y += (dy / len) * step;

    if (Math.hypot(player.x - anomaly.x, player.y - anomaly.y) < CONTACT) {
      this.caught = true;
    }
  }
}
