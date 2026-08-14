// 緑のガイドライン用の経路（SPEC §15 §16 §17）
// プレイヤーから目的地まで、道なりに折れる折線を作る
export function buildPath(from, to, WAYPOINTS) {
  if (!to) return [];
  const forward = to.x >= from.x;
  const mid = WAYPOINTS.filter(w =>
    forward ? (w.x > from.x + 40 && w.x < to.x - 40)
            : (w.x < from.x - 40 && w.x > to.x + 40));
  if (!forward) mid.reverse();
  return [{ x: from.x, y: from.y }, ...mid.map(w => ({ x: w.x, y: w.y })), { x: to.x, y: to.y }];
}

// 手前から一定割合だけ描く（怪異接近時に途切れさせる）
export function truncate(path, ratio) {
  if (ratio >= 1 || path.length < 2) return path;
  const lens = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    lens.push(d); total += d;
  }
  let want = total * ratio;
  const out = [path[0]];
  for (let i = 0; i < lens.length; i++) {
    if (want <= 0) break;
    if (lens[i] <= want) { out.push(path[i + 1]); want -= lens[i]; }
    else {
      const t = want / lens[i];
      out.push({
        x: path[i].x + (path[i + 1].x - path[i].x) * t,
        y: path[i].y + (path[i + 1].y - path[i].y) * t,
      });
      break;
    }
  }
  return out;
}
