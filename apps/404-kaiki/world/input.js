// 操作は「移動」だけ（SPEC §11）。触った場所に出る可変スティック。
export class Input {
  constructor(canvas) {
    this.vx = 0;
    this.vy = 0;
    this.active = false;
    this.origin = { x: 0, y: 0 };
    this.point = { x: 0, y: 0 };
    this.enabled = true;
    this.tapped = false;
    this.keys = new Set();
    this._attach(canvas);
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) { this.vx = 0; this.vy = 0; this.active = false; }
  }

  consumeTap() { const t = this.tapped; this.tapped = false; return t; }

  _attach(canvas) {
    const R = 56;
    const start = (x, y) => {
      this.tapped = true;
      if (!this.enabled) return;
      this.active = true;
      this.origin = { x, y };
      this.point = { x, y };
    };
    const move = (x, y) => {
      if (!this.active || !this.enabled) return;
      this.point = { x, y };
      let dx = x - this.origin.x, dy = y - this.origin.y;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = dx / d * R; dy = dy / d * R; this.origin = { x: x - dx, y: y - dy }; }
      const dead = 6;
      const m = Math.hypot(dx, dy);
      if (m < dead) { this.vx = 0; this.vy = 0; return; }
      const k = Math.min(1, (m - dead) / (R - dead));
      this.vx = (dx / m) * k;
      this.vy = (dy / m) * k;
    };
    const end = () => { this.active = false; this.vx = 0; this.vy = 0; };

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      start(t.clientX, t.clientY);
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      move(t.clientX, t.clientY);
    }, { passive: false });
    canvas.addEventListener('touchend', e => { e.preventDefault(); end(); }, { passive: false });
    canvas.addEventListener('touchcancel', () => end());

    canvas.addEventListener('mousedown', e => start(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => end());

    window.addEventListener('keydown', e => {
      this.keys.add(e.key);
      if (e.key === ' ' || e.key === 'Enter') this.tapped = true;
      this._fromKeys();
    });
    window.addEventListener('keyup', e => { this.keys.delete(e.key); this._fromKeys(); });
  }

  _fromKeys() {
    if (!this.enabled) return;
    const k = this.keys;
    let x = 0, y = 0;
    if (k.has('ArrowLeft') || k.has('a')) x -= 1;
    if (k.has('ArrowRight') || k.has('d')) x += 1;
    if (k.has('ArrowUp') || k.has('w')) y -= 1;
    if (k.has('ArrowDown') || k.has('s')) y += 1;
    if (x || y) {
      const m = Math.hypot(x, y);
      this.vx = x / m; this.vy = y / m;
    } else if (!this.active) { this.vx = 0; this.vy = 0; }
  }
}
