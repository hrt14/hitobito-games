// Investigation System（SPEC §12 §14）
// 「調べる」ボタンは作らない。近づくだけで発火する。
// 道は横に長いので判定は楕円にする。奥行き方向にも十分な余裕を持たせ、
// 「マークの近くまで歩いたのに何も起きない」を作らない。
export const RADIUS_X = 74;
export const RADIUS_Y = 58;
export const HIDDEN_REVEAL = 150; // 隠し調査のマークが見え始める距離

export function distance(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function inRange(p, player) {
  const dx = (p.x - player.x) / RADIUS_X;
  const dy = (p.y - player.y) / RADIUS_Y;
  return dx * dx + dy * dy <= 1;
}

// マークを描画すべき調査ポイント
export function visiblePoints(state, player) {
  return state.c.POINTS.filter(p => {
    if (state.isDone(p.id)) return false;
    if (!state.isUnlocked(p.area)) return false;
    if (p.hidden && distance(p, player) > HIDDEN_REVEAL) return false;
    return true;
  });
}

// 発火すべき調査ポイント（無ければ null）
export function findTrigger(state, player) {
  for (const p of state.c.POINTS) {
    if (state.isDone(p.id)) continue;
    if (!state.isUnlocked(p.area)) continue;
    if (inRange(p, player)) return p;
  }
  return null;
}

// 次の必須目的地。緑ラインはここへ伸びる
export function nextRequired(state) {
  return state.c.POINTS.find(p => p.required && !state.isDone(p.id) && state.isUnlocked(p.area)) || null;
}
