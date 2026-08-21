// CASE 06 の描画：真夏の真昼の集落と、祖父母の家の中。
// 01夜 / 02夕方 / 03放課後 / 04夜 / 05深夜。**5本とも暗かった。**
// 6本目は白飛びするほど明るい真昼から始めて、夜まで落とす。
import { Renderer } from './render.js';

export class VillageRenderer extends Renderer {
  constructor(canvas, caseData) {
    super(canvas, caseData);
    this.light = 1;        // 1=真昼 0=夜
    this.wards = null;
    this.repairing = null;
    this.inside = false;
    this.yashiki = null;   // 窓の向こうを通す用
    this.house = null;     // 屋根を人物の後に描くための座標
  }

  resize() {
    super.resize();
    const h = this.canvas.clientHeight || window.innerHeight;
    this.groundTop = h * 0.58;
    this.groundBottom = h * 0.94;
    this.horizonY = this.groundTop - h * 0.16;
  }

  drawWorldBack(g) {
    this.drawVillageBack();
    this.drawVillageGates(g.state);
    this.drawVillageProps();
    this.drawInterior();
  }

  drawVillageBack() {
    this.drawNoonSky();
    this.drawHills();
    this.drawPaddies();
    this.drawLane();
    this.drawVillagePoles();
  }

  drawWorldFront() {
    this.drawHouseRoof();
    this.drawVillageForeground();
  }

  // 明るさ 1..0 で昼と夜を混ぜる。#rrggbb と rgba(...) の両方を受ける
  lit(day, night) {
    const t = 1 - this.light;
    const parse = c => {
      if (c[0] === '#') {
        return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 1];
      }
      const n = c.slice(c.indexOf('(') + 1, c.lastIndexOf(')')).split(',').map(Number);
      return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
    };
    const A = parse(day), B = parse(night);
    const v = i => Math.round(A[i] + (B[i] - A[i]) * t);
    const al = +(A[3] + (B[3] - A[3]) * t).toFixed(3);
    return `rgba(${v(0)},${v(1)},${v(2)},${al})`;
  }

  tSec() { return performance.now() / 1000; }

  // ---------------------------------------------------------------- 空

  drawNoonSky() {
    const { ctx, W, H } = this;
    const g = ctx.createLinearGradient(0, 0, 0, this.horizonY + 40);
    g.addColorStop(0, this.lit('#7fb2dd', '#0a0f1c'));
    g.addColorStop(0.6, this.lit('#b8d8ee', '#141a2b'));
    g.addColorStop(1, this.lit('#e9f2f6', '#232a3c'));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 入道雲。真昼の記号。
    // layerX は奥行きで縮まないので、間隔は**画面幅**で決める。
    // 世界座標の間隔で置くと画面上でも同じ px 間隔になり、一個も映らない
    ctx.save();
    ctx.globalAlpha = 0.42 * this.light;
    ctx.fillStyle = '#ffffff';
    const step = 340, drift = this.camX * 0.05;
    const i0 = Math.floor((drift - W / 2 - 200) / step);
    const i1 = Math.ceil((drift + W / 2 + 200) / step);
    for (let i = i0; i <= i1; i++) {
      const cx = W / 2 + i * step - drift;
      const k = ((i * 2654435761) >>> 0) / 4294967296;   // 大きさと高さを散らす
      const r = 0.6 + k * 0.4;
      const cy = this.horizonY - 208 - k * 74;
      // 一つのパスにまとめて一度だけ塗る。
      // 円ごとに塗ると半透明の重なりが継ぎ目として出て、雲が団子に見える
      ctx.beginPath();
      for (const [ox, oy, rr] of [[-70, 30, 52], [0, -14, 74], [64, 24, 58], [-24, -46, 46], [34, -40, 42]]) {
        ctx.moveTo(cx + ox * r + rr * r, cy + oy * r);
        ctx.arc(cx + ox * r, cy + oy * r, rr * r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.restore();

    // 星。夜になったぶんだけ出る
    if (this.light < 0.5) {
      ctx.save();
      for (const s of this.stars) {
        ctx.globalAlpha = s.a * (1 - this.light * 2) * 0.8;
        ctx.fillStyle = '#cdd7ff';
        ctx.fillRect(s.x * W, s.y * H * 0.7, s.r, s.r);
      }
      ctx.restore();
    }
  }

  drawHills() {
    const { ctx, W } = this;
    const base = this.horizonY + 4;
    ctx.fillStyle = this.lit('#7d9a86', '#1d2630');
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let i = 0; i <= 14; i++) {
      const x = (i / 14) * W;
      ctx.lineTo(x, base - 74 - Math.sin(i * 1.4) * 30 - Math.cos(i * 0.8) * 20);
    }
    ctx.lineTo(W, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = this.lit('#5f8062', '#16202a');
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let i = 0; i <= 11; i++) {
      const x = (i / 11) * W;
      ctx.lineTo(x, base - 28 - Math.sin(i * 2.1 + 1) * 16);
    }
    ctx.lineTo(W, base); ctx.closePath(); ctx.fill();
  }

  drawPaddies() {
    const { ctx, W } = this;
    const horizon = this.horizonY;
    const near = this.sy(-2);
    const g = ctx.createLinearGradient(0, horizon, 0, near);
    g.addColorStop(0, this.lit('#8fc06a', '#1d2a22'));
    g.addColorStop(1, this.lit('#a8cf62', '#253224'));
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon, W, near - horizon);

    for (const p of this.c.SCENERY.paddies) {
      const d0 = p.depth, d1 = p.depth - p.span;
      const y0 = this.sy(d0), y1 = this.sy(d1);
      if (y0 < horizon || y1 > near) continue;
      const x0n = this.sx(p.x - p.w / 2, d0), x1n = this.sx(p.x + p.w / 2, d0);
      const x0f = this.sx(p.x - p.w / 2, d1), x1f = this.sx(p.x + p.w / 2, d1);
      if (Math.max(x1n, x1f) < -60 || Math.min(x0n, x0f) > W + 60) continue;
      const t = p.tone;
      ctx.fillStyle = this.lit(
        `rgba(${Math.round(140 * t)},${Math.round(186 * t)},${Math.round(92 * t)},1)`,
        'rgba(30,40,32,1)');
      ctx.beginPath();
      ctx.moveTo(x0n, y0); ctx.lineTo(x1n, y0); ctx.lineTo(x1f, y1); ctx.lineTo(x0f, y1);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = this.lit('rgba(150,140,96,0.6)', 'rgba(40,44,36,0.6)');
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0n, y0); ctx.lineTo(x1n, y0); ctx.stroke();
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x0n, y0); ctx.lineTo(x0f, y1); ctx.stroke();
    }
  }

  drawLane() {
    const { ctx, W } = this;
    const top = this.sy(0), bot = this.sy(212);
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, this.lit('#cfc7b4', '#2c2e2c'));
    g.addColorStop(1, this.lit('#bdb49f', '#242624'));
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, bot - top);
    ctx.fillStyle = this.lit('#8fa05c', '#1e241c');
    ctx.fillRect(0, top - 6, W, 7);
    ctx.fillRect(0, bot - 2, W, 9);
    // 真昼の濃い影。電柱の影が道を斜めに横切る。
    // 傾きが浅いと電柱がそのまま伸びているようにしか見えない
    ctx.save();
    ctx.globalAlpha = 0.3 * this.light;
    ctx.fillStyle = '#2b2f28';
    for (const p of this.c.SCENERY.poles) {
      const x = this.sx(p.x, 10);
      if (x < -260 || x > W + 260) continue;
      const y0 = this.sy(10), y1 = this.sy(190);
      const dx = 168;
      ctx.beginPath();
      ctx.moveTo(x - 4, y0); ctx.lineTo(x + 4, y0);
      ctx.lineTo(x + dx + 9, y1); ctx.lineTo(x + dx - 9, y1);
      ctx.closePath(); ctx.fill();
      // 腕木の影
      ctx.beginPath();
      ctx.moveTo(x + dx * 0.62 - 26, y0 + (y1 - y0) * 0.62);
      ctx.lineTo(x + dx * 0.62 + 26, y0 + (y1 - y0) * 0.62);
      ctx.lineTo(x + dx * 0.62 + 26, y0 + (y1 - y0) * 0.62 + 5);
      ctx.lineTo(x + dx * 0.62 - 26, y0 + (y1 - y0) * 0.62 + 5);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    for (const c of this.c.SCENERY.clutter) {
      const wy = c.kind === 'stone' ? 188 : 8;
      const x = this.sx(c.x, wy);
      if (x < -20 || x > W + 20) continue;
      const y = this.sy(wy);
      if (c.kind === 'weed') {
        ctx.strokeStyle = this.lit('#6d8a3e', '#1f2a1c');
        ctx.lineWidth = 1.7;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath(); ctx.moveTo(x + k * 2, y); ctx.lineTo(x + k * 4, y - 12 - Math.abs(k)); ctx.stroke();
        }
      } else if (c.kind === 'post') {
        ctx.fillStyle = this.lit('#8a7550', '#231f18');
        ctx.fillRect(x - 2, y - 24, 4, 24);
      } else {
        ctx.fillStyle = this.lit('#b3ad9e', '#2a2b28');
        ctx.beginPath(); ctx.ellipse(x, y, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  drawVillagePoles() {
    const { ctx } = this;
    const y = this.sy(10);
    ctx.fillStyle = this.lit('#7d6f56', '#161a18');
    for (const p of this.c.SCENERY.poles) {
      const x = this.sx(p.x, 10);
      if (x < -30 || x > this.W + 30) continue;
      ctx.fillRect(x - 3, y - p.h, 6, p.h);
      ctx.fillRect(x - 13, y - p.h + 8, 26, 3);
    }
  }

  // ---------------------------------------------------------------- 集落

  drawVillageProps() {
    const { ctx } = this;
    // 家並み
    const baseY = this.sy(-8);
    for (const h of this.c.SCENERY.houses) {
      const x = this.sx(h.x, -8);
      if (x < -200 || x > this.W + 200) continue;
      const t = h.tone;
      ctx.fillStyle = this.lit(
        `rgba(${Math.round(206 * t)},${Math.round(198 * t)},${Math.round(180 * t)},1)`,
        'rgba(34,34,32,1)');
      ctx.fillRect(x - h.w / 2, baseY - h.h, h.w, h.h);
      ctx.fillStyle = this.lit('#4c4a44', '#1a1a18');
      ctx.beginPath();
      ctx.moveTo(x - h.w / 2 - 14, baseY - h.h);
      ctx.lineTo(x, baseY - h.h - 30);
      ctx.lineTo(x + h.w / 2 + 14, baseY - h.h);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = this.lit('rgba(70,72,66,0.5)', 'rgba(240,214,150,0.55)');
      ctx.fillRect(x - h.w * 0.28, baseY - h.h * 0.62, h.w * 0.24, h.h * 0.22);
    }

    for (const p of this.c.PROPS) {
      if (p.kind === 'interior') continue;
      const x = this.sx(p.x, p.y);
      if (x < -420 || x > this.W + 420) continue;
      const y = this.sy(p.y), s = this.scaleAt(p.y);

      if (p.kind === 'shrine') {
        // 石段と鳥居。CASE 01 の鳥居と同じ形にする（§42 同じ町）
        ctx.fillStyle = this.lit('#b9b3a4', '#26262a');
        for (let i = 0; i < 6; i++) ctx.fillRect(x - 70 * s + i * 6 * s, y - (i + 1) * 11 * s, 140 * s - i * 12 * s, 11 * s);
        const ty = y - 70 * s;
        ctx.fillStyle = this.lit('#b8484f', '#3c1c20');
        ctx.fillRect(x - 44 * s, ty - 92 * s, 9 * s, 92 * s);
        ctx.fillRect(x + 35 * s, ty - 92 * s, 9 * s, 92 * s);
        ctx.fillRect(x - 58 * s, ty - 104 * s, 116 * s, 9 * s);
        ctx.fillRect(x - 62 * s, ty - 110 * s, 124 * s, 5 * s);
        ctx.fillRect(x - 48 * s, ty - 82 * s, 96 * s, 6 * s);
      }
      if (p.kind === 'canal') {
        const yTop = this.sy(-16), yBot = this.sy(4);
        const x0 = this.sx(p.x, -6), x1 = this.sx(p.x + p.w, -6);
        ctx.fillStyle = this.lit('#a8a293', '#26262a');
        ctx.fillRect(x0, yTop - 8, x1 - x0, 10);
        ctx.fillStyle = this.lit('#79a8b4', '#18242a');
        ctx.fillRect(x0, yTop + 2, x1 - x0, yBot - yTop);
      }
    }
  }

  // 家の中。ここだけ絵が変わる（CASE 04 のアーケード、05 の地下道と同じやり方）。
  // 断面図として描く：手前が廊下の畳、その奥が窓のある壁、壁の上に屋根。
  // 屋根は drawWorldFront で**もう一度**描いて八尺様の体を隠す。
  // 見えるのは帽子だけ。八尺だから屋根越しに見える（CASE06_SLICE §2）
  drawInterior() {
    const { ctx, W, H } = this;
    this.house = null;
    // 中に入るまでは家は集落の一軒でしかない。
    // エリアの x 範囲で塗ると、玄関の前に立った時点で
    // 画面の端に廊下が覗いてしまう（05 の地下道は通り抜ける場所なので事情が違う）
    if (!this.inside) return;
    const it = this.c.PROPS.find(p => p.kind === 'interior');
    if (!it) return;
    const x0 = this.sx(it.x, 0), x1 = this.sx(it.x + it.w, 0);
    if (x1 < -60 || x0 > W + 60) return;
    const L = Math.max(-60, x0), R = Math.min(W + 60, x1);

    const wallBot = this.sy(70);
    const wallTop = wallBot - 150;
    const roofTop = wallTop - 62;
    this.house = { L, R, wallTop, roofTop };

    // 屋根から上は塗らない。外の田と山と空がそのまま残り、
    // 八尺様はそこに立っている。見えるのは屋根に隠れ残った帽子だけ
    ctx.fillStyle = this.lit('#c8bc9c', '#2a2620');
    ctx.fillRect(L, wallTop, R - L, 150);
    // 長押と幅木
    ctx.fillStyle = this.lit('#6d5a3c', '#221c14');
    ctx.fillRect(L, wallTop - 6, R - L, 8);
    ctx.fillRect(L, wallBot - 14, R - L, 16);

    // 畳
    const fg = ctx.createLinearGradient(0, wallBot, 0, this.sy(212));
    fg.addColorStop(0, this.lit('#b9b078', '#241f18'));
    fg.addColorStop(1, this.lit('#a49b66', '#1c1813'));
    ctx.fillStyle = fg;
    ctx.fillRect(L, wallBot, R - L, this.sy(212) - wallBot);
    ctx.strokeStyle = this.lit('rgba(60,52,34,0.35)', 'rgba(10,8,6,0.5)');
    ctx.lineWidth = 2;
    for (let i = -2; i < 40; i++) {
      const tx = this.sx(it.x + i * 120, 0);
      if (tx < L || tx > R) continue;
      ctx.beginPath(); ctx.moveTo(tx, wallBot); ctx.lineTo(tx, this.sy(212)); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(L, this.sy(150)); ctx.lineTo(R, this.sy(150)); ctx.stroke();

    // 裸電球。夜の唯一の光
    for (let i = 0; i < 14; i++) {
      const bx = this.sx(it.x + 300 + i * 165, 0);
      if (bx < L - 40 || bx > R + 40) continue;
      const top = wallBot - 150;
      ctx.fillStyle = '#2a231a';
      ctx.fillRect(bx - 1.5, top, 3, 24);
      ctx.fillStyle = `rgba(255,232,176,${0.35 + (1 - this.light) * 0.6})`;
      ctx.beginPath(); ctx.arc(bx, top + 30, 7, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      // 朝には光の筋が消える。明るい部屋で光条が残ると作り物に見える
      ctx.globalAlpha = 0.05 + (1 - this.light) * 0.62;
      const g = ctx.createLinearGradient(bx, top + 30, bx, this.sy(190));
      g.addColorStop(0, 'rgba(255,226,160,0.24)');
      g.addColorStop(1, 'rgba(255,226,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(bx - 26, top + 34); ctx.lineTo(bx + 26, top + 34);
      ctx.lineTo(bx + 96, this.sy(200)); ctx.lineTo(bx - 96, this.sy(200));
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    this.drawWards(wallBot);

    // 手前の縁を締める
    ctx.fillStyle = this.lit('rgba(40,32,22,0.28)', 'rgba(6,5,4,0.5)');
    ctx.fillRect(L, this.sy(198), R - L, H - this.sy(198));
  }

  // 屋根。人物より**後**に描いて八尺様の体を隠す（帽子だけ残す）
  drawHouseRoof() {
    const h = this.house;
    if (!h) return;
    const { ctx } = this;
    const { L, R, wallTop, roofTop } = h;

    const face = () => {
      ctx.beginPath();
      ctx.moveTo(L - 16, wallTop + 4);
      ctx.lineTo(L + 26, roofTop);
      ctx.lineTo(R - 26, roofTop);
      ctx.lineTo(R + 16, wallTop + 4);
      ctx.closePath();
    };
    ctx.fillStyle = this.lit('#4a4740', '#141414');
    face(); ctx.fill();
    // 瓦の筋。屋根の形で切る。切らないと軒の外の空に線が伸びる
    ctx.save();
    face(); ctx.clip();
    ctx.strokeStyle = this.lit('rgba(30,28,24,0.35)', 'rgba(0,0,0,0.45)');
    ctx.lineWidth = 1.6;
    for (let i = 1; i < 4; i++) {
      const y = roofTop + (wallTop - roofTop) * (i / 4);
      ctx.beginPath(); ctx.moveTo(L - 20, y); ctx.lineTo(R + 20, y); ctx.stroke();
    }
    ctx.restore();
    // 棟。屋根の上端にだけ載せる
    ctx.fillStyle = this.lit('#5b574d', '#1c1c1a');
    ctx.fillRect(L + 26, roofTop - 7, Math.max(0, (R - 26) - (L + 26)), 8);
    // 軒の影
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.fillRect(L - 16, wallTop + 2, R - L + 32, 9);
  }

  // 窓と戸と、お札。守れているかは**札の色と剥がれ方**で出す（§12 §17）
  drawWards(wallBot) {
    if (!this.wards) return;
    const { ctx } = this;
    for (const w of this.wards) {
      const x = this.sx(w.x, w.y);
      if (x < -120 || x > this.W + 120) continue;
      const top = wallBot - 140;
      const isDoor = w.kind === 'door';
      const ww = isDoor ? 74 : 88;
      const hh = isDoor ? 130 : 84;
      const wy = isDoor ? wallBot - hh : top + 16;

      // 枠と、その向こうの外
      ctx.fillStyle = this.lit('rgba(150,182,196,0.9)', 'rgba(8,10,14,0.95)');
      ctx.fillRect(x - ww / 2, wy, ww, hh);

      // ガラスの向こうを白いものが通る。どの札の前に居るかは**これ**で分かる
      const k = this.yashiki;
      if (k && k.fade > 0.1) {
        const kx = this.sx(k.x, w.y);
        const reach = ww * 0.8;
        const d = Math.abs(kx - x);
        if (d < reach) {
          ctx.save();
          ctx.beginPath(); ctx.rect(x - ww / 2 + 2, wy + 2, ww - 4, hh - 4); ctx.clip();
          ctx.globalAlpha = (1 - d / reach) * 0.8 * k.fade;
          ctx.fillStyle = 'rgba(236,236,232,1)';
          ctx.beginPath();
          ctx.moveTo(kx - 11, wy + hh);
          ctx.lineTo(kx - 8, wy - 4);
          ctx.quadraticCurveTo(kx, wy - 12, kx + 8, wy - 4);
          ctx.lineTo(kx + 11, wy + hh);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }

      ctx.strokeStyle = this.lit('#6d5a3c', '#221c14');
      ctx.lineWidth = 5;
      ctx.strokeRect(x - ww / 2, wy, ww, hh);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, wy); ctx.lineTo(x, wy + hh);
      ctx.moveTo(x - ww / 2, wy + hh / 2); ctx.lineTo(x + ww / 2, wy + hh / 2);
      ctx.stroke();

      // お札。弱ると端から剥がれて垂れる
      const s = w.torn ? 0 : w.s;
      const cx = x, cy = wy + hh / 2;
      if (w.torn) {
        ctx.save();
        ctx.translate(cx - 8, cy + 16);
        ctx.rotate(0.9);
        ctx.fillStyle = 'rgba(226,220,196,0.55)';
        ctx.fillRect(-9, -14, 18, 28);
        ctx.restore();
      } else {
        const peel = (1 - s) * 22;
        ctx.save();
        ctx.translate(cx, cy - 26);
        ctx.rotate(peel * 0.014);
        ctx.fillStyle = s > 0.5 ? '#f0ead6' : `rgba(240,234,214,${0.55 + s * 0.45})`;
        ctx.fillRect(-11, 0, 22, 52 - peel * 0.5);
        ctx.strokeStyle = 'rgba(150,40,40,0.7)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, 8); ctx.lineTo(0, 40 - peel * 0.4);
        ctx.moveTo(-6, 16); ctx.lineTo(6, 16);
        ctx.moveTo(-6, 26); ctx.lineTo(6, 26);
        ctx.stroke();
        ctx.restore();
        // いま貼り直している札
        if (this.repairing === w.id) {
          ctx.save();
          ctx.globalAlpha = 0.5 + Math.sin(this.tSec() * 8) * 0.3;
          ctx.strokeStyle = 'rgba(150,230,255,0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([7, 6]);
          ctx.strokeRect(x - ww / 2 - 5, wy - 5, ww + 10, hh + 10);
          ctx.restore();
        }
      }
    }
  }

  // 開放は文字で伝えない。世界が変わる（SPEC §20）
  drawVillageGates(state) {
    const { ctx } = this;
    for (const g of this.c.GATES) {
      const open = state.isUnlocked(g.opens);
      const x = this.sx(g.x, 60), y = this.sy(60), s = this.scaleAt(60);
      if (x < -200 || x > this.W + 200) continue;

      if (g.kind === 'gate') {
        ctx.strokeStyle = this.lit(open ? 'rgba(120,110,80,0.3)' : 'rgba(90,80,56,0.85)', 'rgba(40,38,30,0.8)');
        ctx.lineWidth = 4 * s;
        ctx.save();
        if (open) { ctx.translate(x - 36 * s, y); ctx.rotate(-0.95); ctx.strokeRect(0, -54 * s, 36 * s, 54 * s); }
        else { ctx.strokeRect(x - 36 * s, y - 54 * s, 36 * s, 54 * s); ctx.strokeRect(x, y - 54 * s, 36 * s, 54 * s); }
        ctx.restore();
      }
      if (g.kind === 'steps' && !open) {
        ctx.fillStyle = this.lit('#9a9484', '#22221f');
        ctx.fillRect(x - 44 * s, y - 90 * s, 88 * s, 90 * s);
      }
      if (g.kind === 'plank') {
        ctx.fillStyle = this.lit('#b39a6d', '#241f18');
        if (open) ctx.fillRect(x - 36 * s, y - 8 * s, 72 * s, 12 * s);
        else {
          ctx.save(); ctx.translate(x - 40 * s, y); ctx.rotate(-0.5);
          ctx.fillRect(0, -8 * s, 76 * s, 8 * s); ctx.restore();
        }
      }
      if (g.kind === 'door') {
        ctx.fillStyle = this.lit(open ? '#3a3026' : '#c9bc98', '#191512');
        ctx.fillRect(x - 30 * s, y - 84 * s, 60 * s, 84 * s);
        ctx.strokeStyle = this.lit('#6d5a3c', '#221c14');
        ctx.lineWidth = 4 * s;
        ctx.strokeRect(x - 30 * s, y - 84 * s, 60 * s, 84 * s);
      }
    }
  }

  drawVillageForeground() {
    const { ctx, W, H } = this;
    const y = this.sy(214);
    if (this.inside) {
      // 家の中では手前に何も置かない。狭さを見せたい
      ctx.fillStyle = this.lit('rgba(60,48,32,0.5)', 'rgba(6,5,4,0.72)');
      ctx.fillRect(0, H * 0.9, W, H * 0.1);
      return;
    }
    ctx.fillStyle = this.lit('#6f8a3e', '#151d14');
    ctx.fillRect(0, y + 26, W, H - y);
    ctx.strokeStyle = this.lit('#8fae4e', '#1c2618');
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 120; i++) {
      const x = this.layerX(i * 70 - 300, 1.3);
      if (x < -20 || x > W + 20) continue;
      const sway = Math.sin(this.tSec() * 1.4 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.quadraticCurveTo(x + sway, y + 40, x + sway * 2, y + 22 - ((i * 31) % 30));
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  // ---------------------------------------------------------------- 八尺様

  // 背が高い。顔は帽子の影で見えない。走らない。止まらない
  drawYashiki(k) {
    if (k.fade <= 0.02) return;
    const { ctx } = this;
    const x = this.sx(k.x, k.y), y = this.sy(k.y);
    const far = Math.max(0.6, 1 - Math.abs(k.x - this.camX) / 1600);
    const s = this.scaleAt(k.y) * this.c.YASHIKI.scale * far;
    const sway = Math.sin(k.t * 1.1) * 2.2;

    ctx.save();
    ctx.globalAlpha = k.fade;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x, y, 15 * s, 4.5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(x + sway, y);

    const ink = 'rgba(20,18,20,0.9)';
    // 白いワンピース。細長い
    ctx.beginPath();
    ctx.moveTo(-9 * s, 0);
    ctx.lineTo(-7 * s, -54 * s);
    ctx.quadraticCurveTo(0, -60 * s, 7 * s, -54 * s);
    ctx.lineTo(9 * s, 0);
    ctx.closePath();
    ctx.fillStyle = this.lit('#f4f2ee', '#cfd0d2'); ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.3 * s; ctx.stroke();
    // 腕。体に沿って垂れている
    ctx.strokeStyle = this.lit('#efece6', '#c6c8ca');
    ctx.lineWidth = 3.6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7 * s, -50 * s); ctx.lineTo(-10 * s, -22 * s);
    ctx.moveTo(7 * s, -50 * s);  ctx.lineTo(10 * s, -22 * s);
    ctx.stroke();
    // 首と頭
    ctx.fillStyle = this.lit('#e6dccb', '#b9b6ae');
    ctx.beginPath(); ctx.arc(0, -66 * s, 7.4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2 * s; ctx.stroke();
    // 顔は帽子の影。目も口も描かない
    ctx.fillStyle = 'rgba(24,22,24,0.85)';
    ctx.beginPath();
    ctx.ellipse(0, -64 * s, 7.4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // つばの広い帽子
    ctx.fillStyle = this.lit('#f2efe8', '#c8cacb');
    ctx.beginPath();
    ctx.ellipse(0, -72 * s, 19 * s, 5.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2 * s; ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -77 * s, 8 * s, 5.6 * s, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // 祖母。3人より小さく、前かがみ
  drawGranny(g0) {
    const { ctx } = this;
    const x = this.sx(g0.x, g0.y), y = this.sy(g0.y);
    const s = this.scaleAt(g0.y) * 0.94;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(x, y, 12 * s, 4.4 * s, 0, 0, Math.PI * 2); ctx.fill();
    const ink = 'rgba(5,7,12,0.9)';
    ctx.translate(x, 0);
    ctx.beginPath();
    ctx.roundRect(-9 * s, y - 40 * s, 18 * s, 30 * s, 4 * s);
    ctx.fillStyle = '#8a7a5e'; ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.4 * s; ctx.stroke();
    ctx.strokeStyle = '#20262f'; ctx.lineWidth = 4.4 * s;
    ctx.beginPath();
    ctx.moveTo(-3 * s, y - 12 * s); ctx.lineTo(-3.4 * s, y - 2 * s);
    ctx.moveTo(3 * s, y - 12 * s);  ctx.lineTo(3.4 * s, y - 2 * s);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, y - 50 * s, 9 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#f0dcc4'; ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.4 * s; ctx.stroke();
    ctx.fillStyle = '#c9c4bc';
    ctx.beginPath();
    ctx.arc(0, y - 53 * s, 9.4 * s, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
    ctx.fillStyle = '#14161c';
    ctx.beginPath(); ctx.ellipse(-3.4 * s, y - 49 * s, 1.3 * s, 1.1 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3.4 * s, y - 49 * s, 1.3 * s, 1.1 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // 夜の残りと、五枚の札の状態。数字は出さない（§12 §17）
  drawNightBar(left, wards) {
    const { ctx, W } = this;
    ctx.save();
    // 夜。左から右へ減っていく
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, W, 3);
    ctx.fillStyle = 'rgba(196,214,255,0.55)';
    ctx.fillRect(0, 0, W * Math.max(0, left), 3);
    // 五枚の札
    if (wards) {
      const bw = 26, gap = 7;
      const total = wards.length * bw + (wards.length - 1) * gap;
      let bx = (W - total) / 2;
      for (const w of wards) {
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(bx, 10, bw, 4);
        if (!w.torn) {
          const s = w.s;
          ctx.fillStyle = s > 0.5 ? 'rgba(226,222,200,0.85)'
            : s > 0.25 ? 'rgba(232,186,110,0.9)' : 'rgba(226,86,72,0.95)';
          ctx.fillRect(bx, 10, bw * s, 4);
        } else {
          ctx.fillStyle = 'rgba(226,86,72,0.35)';
          ctx.fillRect(bx, 10, bw, 4);
          ctx.fillStyle = 'rgba(10,10,12,0.9)';
          ctx.fillRect(bx + bw / 2 - 1, 9, 2, 6);
        }
        bx += bw + gap;
      }
    }
    ctx.restore();
  }
}
