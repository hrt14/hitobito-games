// Anomaly Spawn System（SPEC §25 §26 §27）
// 真横へスポーンさせない。必ず「少し遠い場所」から。
import { SPAWNS, WORLD } from '../data/case01.js';

// 真横は禁止。ただし遠すぎて画面外になると発見できないので、
// 「見えるが遠い」帯の中から選ぶ。
const MIN_DISTANCE = 190;
const MAX_DISTANCE = 296; // これ以上離すと縦画面の外へ出て、発見できなくなる

export class Anomaly {
  constructor() {
    this.phase = 0;
    this.visible = false;
    this.x = 0;
    this.y = 0;
    this.high = false;      // 窓・屋上など高所
    this.masked = true;     // PHASE 4 で外れる
    this.lastSpawn = null;
    this.sightings = 0;
    this.sway = 0;
    this.fade = 0;          // 0..1 表示の濃さ
    this.chasing = false;
  }

  setPhase(n) { this.phase = n; }

  // どの候補地点かをランダムに選び（＝どこに出るかは毎回変わる）、
  // 実際の位置は「画面内だが遠い」帯に置く。
  // 候補の絶対座標をそのまま使うと縦画面の外に出てしまい、
  // プレイヤーが先に発見する余地が消えるため。
  spawn(list, player, dir) {
    const fresh = list.filter(s => s.at !== this.lastSpawn);
    const pool = fresh.length ? fresh : list;
    if (!pool.length) return null;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.lastSpawn = pick.at;

    const away = dir || (pick.x >= player.x ? 1 : -1);
    const dist = MIN_DISTANCE + Math.random() * (MAX_DISTANCE - MIN_DISTANCE);
    this.x = Math.max(70, Math.min(WORLD.length - 70, player.x + away * dist));
    this.y = pick.y;
    this.high = !!pick.high;
    this.visible = true;
    this.fade = 0;
    return pick;
  }

  showFar(player, dir) { return this.spawn(SPAWNS.phase2, player, dir); }

  showNear(player, dir) {
    this.sightings++;
    return this.spawn(SPAWNS.phase3, player, dir);
  }

  // 完全出現。プレイヤーの進行方向の先に立ちふさがる。
  // マスクはまだ外さない。「わたし、きれい？」の後に外す（setPhase より後で unmask）
  appear(player, towardX) {
    this.visible = true;
    this.high = false;
    this.chasing = false;
    this.fade = 0;
    this.x = towardX;
    this.y = 105;
    this.phase = 4;
    this.masked = true;
  }

  unmask() { this.masked = false; }

  hide() { this.visible = false; this.chasing = false; }

  update(dt) {
    this.sway += dt;
    const target = this.visible ? 1 : 0;
    this.fade += (target - this.fade) * Math.min(1, dt * 3.2);
  }
}
