// 描画（SPEC §45 §46 §47 §48）
// 前景 / プレイ層 / 背景 の3レイヤーを持ち、平面的なタイル地図にしない。
import { WORLD, AREAS, GATES, SCENERY, PROPS, CHARS, SAFE_ZONE } from '../data/case01.js';

const FAR_P = 0.05;
const MID_P = 0.35;
const FORE_P = 1.24;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0; this.H = 0; this.dpr = 1;
    this.camX = 0;
    this.shake = 0;
    this.dark = 0;    // 逃走時の暗さ 0..1
    this.stars = [];
    this.resize();
    for (let i = 0; i < 60; i++) {
      this.stars.push({ x: Math.random(), y: Math.random() * 0.45, r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.6 + 0.2 });
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.dpr = dpr; this.W = w; this.H = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.groundTop = h * 0.60;
    this.groundBottom = h * 0.92;
  }

  depth(y) { return Math.max(-0.6, Math.min(1.4, y / WORLD.bandBottom)); }
  scaleAt(y) { return 0.78 + this.depth(y) * 0.36; }

  // 道を広く見せる。狭いと遠景の怪異が画面外に出てしまい、
  // 「プレイヤーが先に発見する」余地がなくなる（SPEC §26）
  sx(x, y) {
    const hs = 0.62 + this.depth(y) * 0.10;
    return this.W / 2 + (x - this.camX) * hs;
  }
  sy(y) { return this.groundTop + this.depth(y) * (this.groundBottom - this.groundTop); }
  layerX(x, p) { return this.W / 2 + (x - this.camX * p); }

  // ---------------------------------------------------------------- 背景

  drawSky() {
    const { ctx, W, H } = this;
    const g = ctx.createLinearGradient(0, 0, 0, this.groundTop + 40);
    g.addColorStop(0, '#070912');
    g.addColorStop(0.45, '#101527');
    g.addColorStop(1, '#232a3d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    for (const s of this.stars) {
      ctx.globalAlpha = s.a * (1 - this.dark * 0.5);
      ctx.fillStyle = '#cdd7ff';
      ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
    }
    ctx.restore();
  }

  drawFar() {
    const { ctx } = this;
    const base = this.groundTop + 26;
    // 遠い山
    ctx.fillStyle = '#0d1020';
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * this.W;
      ctx.lineTo(x, base - 150 - Math.sin(i * 1.7) * 62 - Math.cos(i * 0.9) * 38);
    }
    ctx.lineTo(this.W, base);
    ctx.closePath();
    ctx.fill();

    // 丘の上の赤い鳥居（A1からも見えるランドマーク・SPEC §47）
    const tx = this.layerX(SAFE_ZONE.x, FAR_P) - this.W / 2 + this.W * 0.72;
    const ty = base - 46;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#b3363f';
    ctx.fillStyle = '#b3363f';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(tx - 9, ty); ctx.lineTo(tx - 8, ty - 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx + 9, ty); ctx.lineTo(tx + 8, ty - 16); ctx.stroke();
    ctx.fillRect(tx - 13, ty - 19, 26, 2.6);
    ctx.fillRect(tx - 10, ty - 13, 20, 2);
    ctx.globalAlpha = 0.28;
    ctx.beginPath(); ctx.arc(tx, ty - 12, 16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawMid() {
    const { ctx } = this;
    const base = this.groundTop + 30;
    ctx.fillStyle = '#12162a';
    for (let i = -2; i < 40; i++) {
      const wx = i * 210;
      const x = this.layerX(wx, MID_P);
      if (x < -220 || x > this.W + 220) continue;
      const h = 120 + ((i * 71) % 150);
      ctx.fillRect(x - 55, base - h, 110, h);
      ctx.fillStyle = 'rgba(255,214,150,0.12)';
      for (let r = 0; r < Math.floor(h / 22); r++) {
        for (let c = 0; c < 3; c++) {
          if (((i + r + c) * 7) % 5 === 0) ctx.fillRect(x - 40 + c * 28, base - h + 12 + r * 22, 9, 9);
        }
      }
      ctx.fillStyle = '#12162a';
    }
    // 給水塔と団地
    for (const p of PROPS) {
      if (p.kind === 'watertower') {
        const x = this.layerX(p.x, MID_P);
        ctx.fillStyle = '#161b30';
        ctx.fillRect(x - 4, base - 78, 4, 78);
        ctx.fillRect(x + 12, base - 78, 4, 78);
        ctx.beginPath(); ctx.ellipse(x + 6, base - 84, 26, 15, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (p.kind === 'danchi') {
        const x = this.layerX(p.x, MID_P);
        ctx.fillStyle = '#141a2e';
        ctx.fillRect(x - 80, base - 104, 160, 104);
        ctx.fillStyle = 'rgba(255,214,150,0.16)';
        for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
          if (((r * 6 + c) * 3) % 4 === 0) ctx.fillRect(x - 70 + c * 24, base - 96 + r * 19, 11, 10);
        }
      }
    }
  }

  // ---------------------------------------------------------------- 道

  drawRoad() {
    const { ctx, W } = this;
    // 歩道。塀と車道のあいだを埋める
    ctx.fillStyle = '#262a33';
    ctx.fillRect(0, this.sy(-16), W, this.sy(0) - this.sy(-16) + 2);

    const yTop = this.sy(0);
    const yBot = this.sy(230);
    const g = ctx.createLinearGradient(0, yTop, 0, yBot);
    g.addColorStop(0, '#1b1e26');
    g.addColorStop(0.5, '#23262f');
    g.addColorStop(1, '#171a21');
    ctx.fillStyle = g;
    ctx.fillRect(0, yTop, W, yBot - yTop);

    // 縁石
    ctx.fillStyle = '#2f333d';
    ctx.fillRect(0, this.sy(0) - 5, W, 6);
    ctx.fillStyle = '#3a3f4b';
    ctx.fillRect(0, this.sy(0) - 7, W, 2.5);
    ctx.fillStyle = '#2b2f39';
    ctx.fillRect(0, this.sy(200), W, 7);

    // 白線
    ctx.strokeStyle = 'rgba(220,228,245,0.15)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([28, 32]);
    ctx.beginPath();
    ctx.moveTo(0, this.sy(104)); ctx.lineTo(W, this.sy(104));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(220,228,245,0.07)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, this.sy(28)); ctx.lineTo(W, this.sy(28)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, this.sy(178)); ctx.lineTo(W, this.sy(178)); ctx.stroke();

    // マンホールと路面の荒れ
    for (let i = 0; i < 30; i++) {
      const wx = i * 420 + 180;
      const x = this.sx(wx, 90);
      if (x < -40 || x > W + 40) continue;
      ctx.fillStyle = 'rgba(10,12,17,0.75)';
      ctx.beginPath(); ctx.ellipse(x, this.sy(90), 19, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(150,165,190,0.13)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, this.sy(90), 19, 8, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, this.sy(90), 12, 5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (let i = 0; i < 80; i++) {
      const wy = 30 + (i * 53) % 155;
      const wx = i * 150 + 55;
      const x = this.sx(wx, wy);
      if (x < -30 || x > W + 30) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(x, this.sy(wy), 40 + (i % 5) * 14, 1.8);
    }
    // 電柱の影を道へ落として、平らな灰色にしない
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 7;
    for (const p of SCENERY.poles) {
      const x = this.sx(p.x, 24);
      if (x < -80 || x > W + 80) continue;
      ctx.beginPath();
      ctx.moveTo(x, this.sy(24));
      ctx.lineTo(x + 74, this.sy(190));
      ctx.stroke();
    }
    ctx.restore();
  }

  drawLampPools(lamps) {
    const { ctx } = this;
    ctx.save();
    for (const l of lamps) {
      if (!l.on) continue;
      const x = this.sx(l.x, 40), y = this.sy(70);
      if (x < -160 || x > this.W + 160) continue;
      const g = ctx.createRadialGradient(x, y, 4, x, y, 116);
      g.addColorStop(0, 'rgba(255,222,164,0.20)');
      g.addColorStop(1, 'rgba(255,222,164,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, 116, 52, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // 道の奥に建物を高く積んで、空だけの画面にしない
  drawHouses() {
    const { ctx } = this;
    const baseY = this.sy(-14);
    for (const h of SCENERY.houses) {
      const x = this.sx(h.x, -14);
      if (x < -320 || x > this.W + 320) continue;
      const w = h.w * 0.86, hh = h.h;
      const t = h.tone;
      ctx.fillStyle = `rgb(${Math.round(21 * t)},${Math.round(25 * t)},${Math.round(38 * t)})`;
      ctx.fillRect(x, baseY - hh, w, hh);
      if (h.roof === 'gable') {
        ctx.beginPath();
        ctx.moveTo(x - 9, baseY - hh);
        ctx.lineTo(x + w / 2, baseY - hh - 30);
        ctx.lineTo(x + w + 9, baseY - hh);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillRect(x - 5, baseY - hh - 7, w + 10, 7);
      }
      if (h.lit) {
        for (let i = 0; i < h.windows; i++) {
          const wy = baseY - hh * 0.78 + i * (hh * 0.24);
          ctx.fillStyle = i % 2 ? 'rgba(255,206,132,0.20)' : 'rgba(190,214,255,0.13)';
          ctx.fillRect(x + w * 0.18, wy, w * 0.26, hh * 0.12);
          ctx.fillRect(x + w * 0.58, wy, w * 0.22, hh * 0.1);
        }
      }
      ctx.fillStyle = 'rgba(4,6,10,0.55)';
      ctx.fillRect(x, baseY - 5, w, 5);
    }
    // 道沿いのブロック塀。道を囲って奥行きを作る
    ctx.fillStyle = '#12161f';
    ctx.fillRect(0, baseY - 30, this.W, 30);
    ctx.fillStyle = 'rgba(120,140,170,0.05)';
    for (let i = -1; i < 60; i++) {
      const x = this.sx(i * 110 - 40, -14);
      if (x < -80 || x > this.W + 80) continue;
      ctx.fillRect(x, baseY - 30, 1.5, 30);
    }
    ctx.fillStyle = 'rgba(140,160,190,0.11)';
    ctx.fillRect(0, baseY - 31, this.W, 2.5);
    this.drawClutter(baseY);
  }

  // 塀ぎわの自転車・植木・ゴミ袋
  drawClutter(baseY) {
    const { ctx } = this;
    for (const c of SCENERY.clutter) {
      const x = this.sx(c.x, -10);
      if (x < -60 || x > this.W + 60) continue;
      const y = baseY + 3;
      if (c.kind === 'bike') {
        ctx.strokeStyle = 'rgba(150,170,200,0.30)';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x - 8, y - 6, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 8, y - 6, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 6); ctx.lineTo(x - 1, y - 15);
        ctx.lineTo(x + 8, y - 6); ctx.moveTo(x - 1, y - 15); ctx.lineTo(x + 4, y - 18);
        ctx.stroke();
      } else if (c.kind === 'plant') {
        ctx.fillStyle = '#2a2118';
        ctx.fillRect(x - 5, y - 8, 10, 8);
        ctx.fillStyle = '#1e3a28';
        ctx.beginPath(); ctx.ellipse(x, y - 14, 8, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x - 5, y - 10, 5, 5, 0, 0, Math.PI * 2); ctx.fill();
      } else if (c.kind === 'bin') {
        ctx.fillStyle = '#252b36';
        ctx.fillRect(x - 7, y - 14, 14, 14);
        ctx.fillStyle = '#323a48';
        ctx.fillRect(x - 9, y - 16, 18, 3);
      } else {
        ctx.fillStyle = '#2b3140';
        ctx.fillRect(x - 1, y - 22, 2, 22);
        ctx.fillStyle = 'rgba(190,205,230,0.22)';
        ctx.fillRect(x - 7, y - 30, 14, 9);
      }
    }
  }

  // 電線。日本の住宅街らしさと画面上部の密度を同時に作る
  drawPowerLines() {
    const { ctx } = this;
    const y0 = this.sy(24);
    ctx.save();
    ctx.strokeStyle = 'rgba(8,10,16,0.85)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < SCENERY.poles.length - 1; i++) {
      const a = SCENERY.poles[i], b = SCENERY.poles[i + 1];
      const ax = this.sx(a.x, 24), bx = this.sx(b.x, 24);
      if (bx < -80 || ax > this.W + 80) continue;
      for (const off of [0, 9, 18]) {
        ctx.beginPath();
        ctx.moveTo(ax, y0 - a.h + off);
        ctx.quadraticCurveTo((ax + bx) / 2, y0 - (a.h + b.h) / 2 + off + 20, bx, y0 - b.h + off);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawPoles() {
    const { ctx } = this;
    const y = this.sy(24);
    for (const p of SCENERY.poles) {
      const x = this.sx(p.x, 24);
      if (x < -40 || x > this.W + 40) continue;
      ctx.fillStyle = '#0b0e15';
      ctx.fillRect(x - 3.5, y - p.h, 7, p.h);
      ctx.fillRect(x - 15, y - p.h + 4, 30, 3.5);
      ctx.fillRect(x - 11, y - p.h + 16, 22, 3);
      ctx.fillStyle = '#131824';
      ctx.fillRect(x - 8, y - p.h * 0.55, 16, 22);
    }
  }

  drawLampPosts(lamps) {
    const { ctx } = this;
    for (const l of lamps) {
      const x = this.sx(l.x, 40), y = this.sy(40);
      if (x < -60 || x > this.W + 60) continue;
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(x - 2.5, y - 140, 5, 140);
      ctx.fillRect(x - 2.5, y - 140, 26, 3.5);
      ctx.beginPath();
      ctx.fillStyle = l.on ? '#ffe6b0' : '#2a2e38';
      ctx.ellipse(x + 22, y - 135, 7, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (l.on) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        const g = ctx.createRadialGradient(x + 22, y - 135, 1, x + 22, y - 135, 46);
        g.addColorStop(0, 'rgba(255,225,168,0.6)');
        g.addColorStop(1, 'rgba(255,225,168,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x + 22, y - 135, 46, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#ffe1a8';
        ctx.beginPath();
        ctx.moveTo(x + 17, y - 132); ctx.lineTo(x + 27, y - 132);
        ctx.lineTo(x + 52, y); ctx.lineTo(x - 4, y);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------- プロップ

  drawProps(state) {
    const { ctx } = this;
    for (const p of PROPS) {
      const x = this.sx(p.x, p.y);
      if (x < -560 || x > this.W + 560) continue;
      switch (p.kind) {
        case 'park': this.drawPark(p); break;
        case 'bench': this.drawBench(p); break;
        case 'store': this.drawStore(p); break;
        case 'alleywall': this.drawAlley(p); break;
        case 'aircon': this.drawAircon(p); break;
        case 'shrine': this.drawShrine(p); break;
      }
    }
    for (const g of GATES) this.drawGate(g, state.isUnlocked(g.opens));
  }

  drawPark(p) {
    const { ctx } = this;
    // 公園は道の奥側だけ。道の上まで塗りつぶさない
    const yFar = this.sy(-16), yNear = this.sy(66);
    const x0 = this.sx(p.x, 20), x1 = this.sx(p.x + p.w, 20);
    ctx.fillStyle = '#141b17';
    ctx.fillRect(x0, yFar, x1 - x0, yNear - yFar);
    ctx.fillStyle = 'rgba(90,130,100,0.05)';
    ctx.fillRect(x0, yFar, x1 - x0, (yNear - yFar) * 0.45);
    // 奥のフェンス
    ctx.strokeStyle = 'rgba(150,170,190,0.18)';
    ctx.lineWidth = 1.4;
    for (let x = x0; x < x1; x += 15) {
      ctx.beginPath(); ctx.moveTo(x, yFar - 34); ctx.lineTo(x, yFar); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x0, yFar - 34); ctx.lineTo(x1, yFar - 34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, yFar - 8); ctx.lineTo(x1, yFar - 8); ctx.stroke();
    // 縁石
    ctx.fillStyle = '#2c313a';
    ctx.fillRect(x0, yNear - 3, x1 - x0, 5);
    // ブランコ
    const bx = this.sx(1460, 45), by = this.sy(45);
    ctx.strokeStyle = '#3a4050'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx - 26, by); ctx.lineTo(bx - 16, by - 52); ctx.lineTo(bx + 16, by - 52); ctx.lineTo(bx + 26, by); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,230,245,0.5)'; ctx.lineWidth = 1.4;
    const sw = Math.sin(Date.now() / 900) * 5;
    ctx.beginPath(); ctx.moveTo(bx - 6, by - 50); ctx.lineTo(bx - 6 + sw, by - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 6, by - 50); ctx.lineTo(bx + 6 + sw, by - 20); ctx.stroke();
    ctx.fillStyle = '#e8ecf5';
    ctx.fillRect(bx - 9 + sw, by - 21, 18, 3);
  }

  drawBench(p) {
    const { ctx } = this;
    const x = this.sx(p.x, p.y), y = this.sy(p.y), s = this.scaleAt(p.y);
    ctx.fillStyle = '#2d3342';
    ctx.fillRect(x - 26 * s, y - 16 * s, 52 * s, 5 * s);
    ctx.fillRect(x - 26 * s, y - 26 * s, 52 * s, 4 * s);
    ctx.fillRect(x - 22 * s, y - 16 * s, 4 * s, 16 * s);
    ctx.fillRect(x + 18 * s, y - 16 * s, 4 * s, 16 * s);
  }

  drawStore(p) {
    const { ctx } = this;
    const y = this.sy(-8);
    const x = this.sx(p.x, -8);
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(x - 150, y - 210, 300, 210);
    // 明るいガラス面と看板
    ctx.fillStyle = 'rgba(150,240,200,0.22)';
    ctx.fillRect(x - 140, y - 132, 280, 118);
    ctx.fillStyle = 'rgba(220,255,240,0.10)';
    for (let i = 0; i < 5; i++) ctx.fillRect(x - 136 + i * 56, y - 128, 3, 110);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x - 142, y - 176, 284, 26);
    ctx.fillStyle = 'rgba(70,200,150,0.9)';
    ctx.fillRect(x - 142, y - 150, 284, 8);
    ctx.fillStyle = 'rgba(45,120,200,0.85)';
    ctx.fillRect(x - 142, y - 158, 284, 8);
    ctx.fillStyle = 'rgba(20,40,60,0.9)';
    ctx.font = '700 13px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('24H OPEN', x, y - 158);
    const g = ctx.createRadialGradient(x, y - 60, 10, x, y - 20, 190);
    g.addColorStop(0, 'rgba(150,240,200,0.14)');
    g.addColorStop(1, 'rgba(150,240,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y + 30, 190, 78, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawAlley(p) {
    const { ctx } = this;
    const yTop = this.sy(45);
    const x0 = this.sx(p.x, 45), x1 = this.sx(p.x + p.w, 45);
    ctx.fillStyle = '#10131b';
    ctx.fillRect(x0, this.sy(-60), x1 - x0, yTop - this.sy(-60));
    ctx.fillStyle = '#0d1016';
    ctx.fillRect(x0, this.sy(165), x1 - x0, this.sy(240) - this.sy(165));
    ctx.strokeStyle = 'rgba(120,140,170,0.08)';
    ctx.lineWidth = 1;
    for (let x = x0; x < x1; x += 46) {
      ctx.beginPath(); ctx.moveTo(x, this.sy(-40)); ctx.lineTo(x, yTop); ctx.stroke();
    }
  }

  drawAircon(p) {
    const { ctx } = this;
    const x = this.sx(p.x, p.y), y = this.sy(p.y), s = this.scaleAt(p.y);
    ctx.fillStyle = '#2a2f3a';
    ctx.fillRect(x - 15 * s, y - 26 * s, 30 * s, 22 * s);
    ctx.strokeStyle = 'rgba(160,175,195,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y - 15 * s, 8 * s, 0, Math.PI * 2); ctx.stroke();
  }

  drawShrine(p) {
    const { ctx } = this;
    const y = this.sy(60);
    // 石段
    const stx = this.sx(4460, 60);
    ctx.fillStyle = '#252a33';
    for (let i = 0; i < 6; i++) ctx.fillRect(stx - 40 + i * 3, y - 4 - i * 5, 80 - i * 6, 5);
    // 参道の灯籠
    for (const lx of [4900, 5060]) {
      const x = this.sx(lx, 55), ly = this.sy(55), s = this.scaleAt(55);
      ctx.fillStyle = '#31353f';
      ctx.fillRect(x - 4 * s, ly - 26 * s, 8 * s, 26 * s);
      ctx.fillStyle = '#ffd9a0';
      ctx.fillRect(x - 7 * s, ly - 36 * s, 14 * s, 10 * s);
      ctx.save();
      ctx.globalAlpha = 0.4;
      const g = ctx.createRadialGradient(x, ly - 31 * s, 2, x, ly - 31 * s, 42);
      g.addColorStop(0, 'rgba(255,205,140,0.5)');
      g.addColorStop(1, 'rgba(255,205,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, ly - 31 * s, 42, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // 鳥居（安全地点）
    this.drawTorii(SAFE_ZONE.x, SAFE_ZONE.y);
  }

  drawTorii(wx, wy) {
    const { ctx } = this;
    const x = this.sx(wx, wy), y = this.sy(wy), s = this.scaleAt(wy) * 1.5;
    ctx.save();
    ctx.fillStyle = '#c0424b';
    ctx.fillRect(x - 42 * s, y - 96 * s, 9 * s, 96 * s);
    ctx.fillRect(x + 33 * s, y - 96 * s, 9 * s, 96 * s);
    ctx.fillRect(x - 56 * s, y - 108 * s, 112 * s, 9 * s);
    ctx.fillRect(x - 60 * s, y - 112 * s, 120 * s, 5 * s);
    ctx.fillRect(x - 46 * s, y - 84 * s, 92 * s, 6 * s);
    ctx.globalAlpha = 0.22;
    const g = ctx.createRadialGradient(x, y - 60 * s, 6, x, y - 40 * s, 150);
    g.addColorStop(0, 'rgba(255,120,130,0.35)');
    g.addColorStop(1, 'rgba(255,120,130,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y - 50 * s, 150, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawGate(g, open) {
    const { ctx } = this;
    const x = this.sx(g.x, 60), y = this.sy(60), s = this.scaleAt(60);
    if (x < -200 || x > this.W + 200) return;

    if (g.kind === 'gate') {
      ctx.strokeStyle = open ? 'rgba(150,170,190,0.25)' : 'rgba(190,205,225,0.55)';
      ctx.lineWidth = 3;
      const w = 42 * s, h = 56 * s;
      ctx.save();
      if (open) {
        ctx.translate(x - w, y);
        ctx.rotate(-0.75);
        ctx.strokeRect(0, -h, w, h);
      } else {
        ctx.strokeRect(x - w, y - h, w, h);
        ctx.strokeRect(x, y - h, w, h);
      }
      ctx.restore();
    }
    if (g.kind === 'crates' && !open) {
      ctx.fillStyle = '#3b4150';
      for (let i = 0; i < 3; i++) ctx.fillRect(x - 28 * s, y - (i + 1) * 20 * s, 56 * s, 18 * s);
    }
    if (g.kind === 'door') {
      ctx.fillStyle = open ? '#05070b' : '#2c3242';
      ctx.fillRect(x - 20 * s, y - 62 * s, 40 * s, 62 * s);
      if (open) {
        ctx.fillStyle = 'rgba(10,14,20,0.95)';
        ctx.fillRect(x - 18 * s, y - 60 * s, 36 * s, 60 * s);
        ctx.fillStyle = '#2c3242';
        ctx.save();
        ctx.translate(x - 20 * s, y - 62 * s);
        ctx.transform(1, 0, -0.55, 1, 0, 0);
        ctx.fillRect(-6 * s, 0, 8 * s, 62 * s);
        ctx.restore();
      } else {
        ctx.fillStyle = '#c9cfdb';
        ctx.beginPath(); ctx.arc(x + 12 * s, y - 30 * s, 2.6 * s, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (g.kind === 'steps' && !open) {
      ctx.fillStyle = '#171b24';
      ctx.fillRect(x - 46 * s, y - 88 * s, 92 * s, 88 * s);
      ctx.strokeStyle = 'rgba(140,160,185,0.14)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 46 * s, y - 18 * s * i - 8);
        ctx.lineTo(x + 46 * s, y - 18 * s * i - 8);
        ctx.stroke();
      }
    }
  }

  drawForeground() {
    const { ctx } = this;
    const y = this.sy(215);

    // ガードレール。手前を横切らせて奥行きを作る
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, y + 4, this.W, 7);
    ctx.fillRect(0, y + 20, this.W, 5);
    for (let i = -1; i < 46; i++) {
      const x = this.layerX(i * 150 + 40, FORE_P);
      if (x < -40 || x > this.W + 40) continue;
      ctx.fillStyle = '#080b11';
      ctx.fillRect(x - 3, y + 4, 6, 34);
    }

    // 手前の電柱・植木
    for (let i = -1; i < 26; i++) {
      const wx = i * 560 + 60;
      const x = this.layerX(wx, FORE_P);
      if (x < -140 || x > this.W + 140) continue;
      ctx.fillStyle = '#04060a';
      ctx.fillRect(x - 11, y - 120, 22, this.H - y + 140);
      ctx.fillRect(x - 32, y - 112, 64, 9);
      const bx = this.layerX(wx + 260, FORE_P);
      ctx.beginPath();
      ctx.ellipse(bx, this.H - 18, 52, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 画面下の暗い縁
    const g = ctx.createLinearGradient(0, this.H * 0.84, 0, this.H);
    g.addColorStop(0, 'rgba(4,5,9,0)');
    g.addColorStop(1, 'rgba(4,5,9,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, this.H * 0.84, this.W, this.H * 0.16);
  }

  // ---------------------------------------------------------------- 人物

  // 3人。スマホでもシルエットで判別でき、暗い道の上でも沈まないように
  // 縁取りとリムライトを入れる。facing で左右を反転する。
  drawPerson(who, wx, wy, phase, facing, opts = {}) {
    const { ctx } = this;
    const def = CHARS[who];
    const x = this.sx(wx, wy), y = this.sy(wy);
    const s = this.scaleAt(wy) * def.scale * 1.24;
    const H = 56 * s;
    const swing = Math.sin(phase) * (opts.moving ? 1 : 0);
    const bob = opts.moving ? Math.abs(Math.sin(phase)) * 1.5 * s : 0;
    const headR = 10.2 * s;
    const ink = 'rgba(5,7,12,0.9)';

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(x, y, 13 * s, 4.6 * s, 0, 0, Math.PI * 2); ctx.fill();

    ctx.translate(x, -bob);
    if (facing < 0) ctx.scale(-1, 1);

    const top = y - H;
    const bodyTop = top + headR * 1.72;
    const bodyH = H - headR * 1.72 - 14 * s;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 脚（ズボン／ソックス）と靴
    ctx.strokeStyle = who === 'yotsuba' ? '#20262f' : '#232936';
    ctx.lineWidth = 4.6 * s;
    ctx.beginPath();
    ctx.moveTo(-2.8 * s, y - 14 * s); ctx.lineTo(-2.8 * s + swing * 5.5 * s, y - 2.4 * s);
    ctx.moveTo(2.8 * s, y - 14 * s);  ctx.lineTo(2.8 * s - swing * 5.5 * s, y - 2.4 * s);
    ctx.stroke();
    ctx.strokeStyle = '#0e1219';
    ctx.lineWidth = 3.4 * s;
    ctx.beginPath();
    ctx.moveTo(-3.2 * s + swing * 5.5 * s, y - 1.4 * s); ctx.lineTo(-0.6 * s + swing * 5.5 * s, y - 1.4 * s);
    ctx.moveTo(3.2 * s - swing * 5.5 * s, y - 1.4 * s);  ctx.lineTo(0.6 * s - swing * 5.5 * s, y - 1.4 * s);
    ctx.stroke();

    // ヨツバのスカート（脚より前、胴より後ろ）
    if (who === 'yotsuba') {
      ctx.beginPath();
      ctx.moveTo(-8.4 * s, bodyTop + bodyH - 4 * s);
      ctx.lineTo(8.4 * s, bodyTop + bodyH - 4 * s);
      ctx.lineTo(11.6 * s, bodyTop + bodyH + 8 * s);
      ctx.lineTo(-11.6 * s, bodyTop + bodyH + 8 * s);
      ctx.closePath();
      ctx.fillStyle = '#242b34'; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.4 * s; ctx.stroke();
    }

    // 胴
    ctx.beginPath();
    ctx.roundRect(-8.6 * s, bodyTop, 17.2 * s, bodyH, 4 * s);
    ctx.fillStyle = def.color; ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5 * s; ctx.stroke();

    if (who === 'shirou') {
      // 前を開けたジャケット。中はTシャツ
      ctx.fillStyle = '#e9edf5';
      ctx.fillRect(-3.4 * s, bodyTop + 1 * s, 6.8 * s, bodyH - 2 * s);
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.roundRect(-9.6 * s, bodyTop, 5.4 * s, bodyH * 0.96, 2.4 * s); ctx.fill();
      ctx.beginPath(); ctx.roundRect(4.2 * s, bodyTop, 5.4 * s, bodyH * 0.96, 2.4 * s); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.2 * s;
      ctx.beginPath(); ctx.moveTo(-3.4 * s, bodyTop); ctx.lineTo(-3.4 * s, bodyTop + bodyH - 2 * s);
      ctx.moveTo(3.4 * s, bodyTop); ctx.lineTo(3.4 * s, bodyTop + bodyH - 2 * s); ctx.stroke();
    }
    if (who === 'rei') {
      // 下ろしたフードと胸の紐
      ctx.fillStyle = '#33405a';
      ctx.beginPath(); ctx.ellipse(0, bodyTop + 3 * s, 9.6 * s, 5.4 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.2 * s; ctx.stroke();
      ctx.strokeStyle = '#dfe6f2'; ctx.lineWidth = 1.3 * s;
      ctx.beginPath();
      ctx.moveTo(-2.4 * s, bodyTop + 6 * s); ctx.lineTo(-2.4 * s, bodyTop + 12 * s);
      ctx.moveTo(2.4 * s, bodyTop + 6 * s); ctx.lineTo(2.4 * s, bodyTop + 12 * s);
      ctx.stroke();
    }
    if (who === 'yotsuba') {
      // セーラー襟とバッグの斜め掛け
      ctx.fillStyle = '#e9edf5';
      ctx.beginPath();
      ctx.moveTo(-8.6 * s, bodyTop + 1 * s);
      ctx.lineTo(0, bodyTop + 9 * s);
      ctx.lineTo(8.6 * s, bodyTop + 1 * s);
      ctx.lineTo(8.6 * s, bodyTop + 4.5 * s);
      ctx.lineTo(0, bodyTop + 12 * s);
      ctx.lineTo(-8.6 * s, bodyTop + 4.5 * s);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#b9903c'; ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(-6.6 * s, bodyTop + 2 * s); ctx.lineTo(8 * s, bodyTop + bodyH * 0.78); ctx.stroke();
      ctx.fillStyle = '#7d6432';
      ctx.beginPath(); ctx.roundRect(5.4 * s, bodyTop + bodyH * 0.66, 9.4 * s, 8.4 * s, 1.8 * s); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.2 * s; ctx.stroke();
    }

    // 腕
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    if (who === 'shirou' && !opts.moving) {
      ctx.moveTo(-8.2 * s, bodyTop + 5 * s); ctx.lineTo(-6.4 * s, bodyTop + bodyH * 0.74);
      ctx.moveTo(8.2 * s, bodyTop + 5 * s);  ctx.lineTo(6.4 * s, bodyTop + bodyH * 0.74);
    } else if (who === 'rei') {
      ctx.moveTo(-8.2 * s, bodyTop + 5 * s); ctx.lineTo(-9.4 * s - swing * 3 * s, bodyTop + bodyH * 0.86);
      ctx.moveTo(8.2 * s, bodyTop + 5 * s);  ctx.lineTo(5.6 * s, bodyTop + bodyH * 0.58);
    } else {
      ctx.moveTo(-8.2 * s, bodyTop + 5 * s); ctx.lineTo(-9.4 * s - swing * 3.4 * s, bodyTop + bodyH * 0.86);
      ctx.moveTo(8.2 * s, bodyTop + 5 * s);  ctx.lineTo(9.4 * s + swing * 3.4 * s, bodyTop + bodyH * 0.86);
    }
    ctx.stroke();

    // レイの携帯とその光
    if (who === 'rei' && opts.phone !== false) {
      const px = 6.4 * s, py = bodyTop + bodyH * 0.56;
      ctx.fillStyle = '#0d1420';
      ctx.beginPath(); ctx.roundRect(px - 2.4 * s, py - 3.4 * s, 4.8 * s, 7 * s, 1 * s); ctx.fill();
      ctx.fillStyle = '#9fd4ff';
      ctx.fillRect(px - 1.6 * s, py - 2.6 * s, 3.2 * s, 5.4 * s);
      ctx.save();
      ctx.globalAlpha = 0.5;
      const g = ctx.createRadialGradient(px, py, 1, px, py, 17 * s);
      g.addColorStop(0, 'rgba(150,205,255,0.8)');
      g.addColorStop(1, 'rgba(150,205,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, 17 * s, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // 首と頭
    ctx.strokeStyle = '#d8b998'; ctx.lineWidth = 3.6 * s;
    ctx.beginPath(); ctx.moveTo(0, bodyTop - 1 * s); ctx.lineTo(0, bodyTop + 2 * s); ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, top + headR, headR, 0, Math.PI * 2);
    ctx.fillStyle = '#f0d3b0'; ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5 * s; ctx.stroke();

    // 目（前を向いている側だけ）
    ctx.fillStyle = '#20242e';
    ctx.beginPath(); ctx.ellipse(3.2 * s, top + headR * 1.05, 1.15 * s, 1.7 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-2.6 * s, top + headR * 1.05, 1.05 * s, 1.6 * s, 0, 0, Math.PI * 2); ctx.fill();

    // 髪（ここで3人を見分けさせる）
    ctx.fillStyle = def.hair;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2 * s;
    if (who === 'shirou') {
      ctx.beginPath();
      ctx.moveTo(-headR * 1.06, top + headR * 1.0);
      ctx.quadraticCurveTo(-headR * 1.16, top - headR * 0.28, -headR * 0.1, top - headR * 0.2);
      for (let i = 0; i < 4; i++) {
        const bx = -headR * 0.1 + i * headR * 0.34;
        ctx.lineTo(bx + headR * 0.12, top - headR * (i % 2 ? 0.62 : 0.34));
        ctx.lineTo(bx + headR * 0.34, top + headR * 0.06);
      }
      ctx.lineTo(headR * 1.08, top + headR * 0.86);
      ctx.quadraticCurveTo(headR * 0.6, top + headR * 0.2, 0, top + headR * 0.28);
      ctx.quadraticCurveTo(-headR * 0.7, top + headR * 0.3, -headR * 1.06, top + headR * 1.0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (who === 'rei') {
      ctx.beginPath();
      ctx.moveTo(-headR * 1.14, top + headR * 3.5);
      ctx.lineTo(-headR * 1.14, top + headR * 0.8);
      ctx.quadraticCurveTo(-headR * 1.2, top - headR * 0.42, 0, top - headR * 0.4);
      ctx.quadraticCurveTo(headR * 1.2, top - headR * 0.42, headR * 1.14, top + headR * 0.8);
      ctx.lineTo(headR * 1.14, top + headR * 3.5);
      ctx.lineTo(headR * 0.62, top + headR * 3.3);
      ctx.lineTo(headR * 0.62, top + headR * 1.0);
      // 片目を隠す長い前髪
      ctx.lineTo(headR * 0.1, top + headR * 1.5);
      ctx.lineTo(-headR * 0.3, top + headR * 0.5);
      ctx.lineTo(-headR * 0.62, top + headR * 1.1);
      ctx.lineTo(-headR * 0.62, top + headR * 3.3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (who === 'yotsuba') {
      ctx.beginPath();
      ctx.arc(0, top + headR * 0.96, headR * 1.1, Math.PI * 1.02, Math.PI * 1.98);
      ctx.lineTo(headR * 1.05, top + headR * 1.3);
      ctx.quadraticCurveTo(headR * 0.5, top + headR * 0.42, -headR * 0.15, top + headR * 0.72);
      ctx.quadraticCurveTo(-headR * 0.8, top + headR * 0.9, -headR * 1.05, top + headR * 1.35);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // ポニーテール
      ctx.beginPath();
      ctx.moveTo(-headR * 0.95, top + headR * 0.75);
      ctx.quadraticCurveTo(-headR * 2.3, top + headR * 1.1, -headR * 1.75, top + headR * 3.0);
      ctx.quadraticCurveTo(-headR * 1.35, top + headR * 1.7, -headR * 0.7, top + headR * 1.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d8544f';
      ctx.beginPath(); ctx.arc(-headR * 1.06, top + headR * 0.98, 1.7 * s, 0, Math.PI * 2); ctx.fill();
    }

    // 暗い道から浮かせるリムライト
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = '#cfe0ff';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.arc(0, top + headR, headR, -Math.PI * 0.85, -Math.PI * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8.6 * s, bodyTop + 3 * s);
    ctx.lineTo(-8.6 * s, bodyTop + bodyH - 3 * s);
    ctx.stroke();
    ctx.restore();

    // 立ち止まって振り返る合図（SPEC §28）
    if (opts.lookBack) {
      ctx.strokeStyle = 'rgba(225,238,255,0.55)';
      ctx.lineWidth = 1.4 * s;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(-headR * 1.1, top + headR * 0.8, headR * (0.55 + i * 0.4), Math.PI * 0.62, Math.PI * 1.38);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawAnomaly(a) {
    if (a.fade <= 0.02) return;
    const { ctx } = this;
    const wy = a.high ? a.y : a.y;
    const x = this.sx(a.x, wy);
    const y = a.high ? this.sy(wy) - 108 : this.sy(wy);
    // 遠いほど小さく。遠景に立っているのが一目で分かるようにする
    const far = Math.max(0.34, 1 - Math.abs(a.x - this.camX) / 780);
    const s = this.scaleAt(wy) * 1.5 * far;
    const H = 66 * s;
    const sway = Math.sin(a.sway * 1.4) * 1.2 * s;

    ctx.save();
    ctx.globalAlpha = a.fade * (a.chasing ? 1 : 0.92);

    if (!a.high) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(x, y, 14 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
    }

    const top = y - H;
    const headR = 9 * s;

    // コート
    ctx.fillStyle = '#cfc5b6';
    ctx.beginPath();
    ctx.moveTo(x - 11 * s + sway, top + headR * 1.8);
    ctx.lineTo(x + 11 * s + sway, top + headR * 1.8);
    ctx.lineTo(x + 14 * s, y);
    ctx.lineTo(x - 14 * s, y);
    ctx.closePath(); ctx.fill();

    // 腕
    ctx.strokeStyle = '#c3b9aa';
    ctx.lineWidth = 3.4 * s;
    ctx.lineCap = 'round';
    const arm = a.chasing ? Math.sin(a.sway * 9) * 6 * s : 0;
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, top + headR * 2.2); ctx.lineTo(x - 12 * s + arm, y - 16 * s);
    ctx.moveTo(x + 10 * s, top + headR * 2.2); ctx.lineTo(x + 12 * s - arm, y - 16 * s);
    ctx.stroke();

    // 頭と長い髪
    ctx.fillStyle = '#e8d9c6';
    ctx.beginPath(); ctx.arc(x + sway, top + headR, headR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b0a0c';
    ctx.beginPath();
    ctx.moveTo(x - headR * 1.25 + sway, top + headR * 0.6);
    ctx.quadraticCurveTo(x + sway, top - headR * 0.9, x + headR * 1.25 + sway, top + headR * 0.6);
    ctx.lineTo(x + headR * 1.35 + sway, top + headR * 4.4);
    ctx.lineTo(x - headR * 1.35 + sway, top + headR * 4.4);
    ctx.closePath(); ctx.fill();

    if (a.masked) {
      ctx.fillStyle = '#f2f4f7';
      ctx.fillRect(x - headR * 0.78 + sway, top + headR * 0.95, headR * 1.56, headR * 0.95);
    } else {
      ctx.strokeStyle = '#8d1d24';
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.moveTo(x - headR * 0.95 + sway, top + headR * 1.25);
      ctx.lineTo(x + headR * 0.95 + sway, top + headR * 1.25);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(141,29,36,0.55)';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(x - headR * 0.95 + sway, top + headR * 1.25); ctx.lineTo(x - headR * 1.5 + sway, top + headR * 0.5);
      ctx.moveTo(x + headR * 0.95 + sway, top + headR * 1.25); ctx.lineTo(x + headR * 1.5 + sway, top + headR * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- 緑ライン

  drawGuideLine(path, t, mode) {
    if (!path || path.length < 2) return;
    const { ctx } = this;
    const escape = mode === 'escape';
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      ctx.moveTo(this.sx(path[0].x, path[0].y), this.sy(path[0].y) - 1);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(this.sx(path[i].x, path[i].y), this.sy(path[i].y) - 1);
      }
      // 世界の上に乗る細い光にする。太いと絵を殺す
      if (pass === 0) {
        ctx.strokeStyle = escape ? 'rgba(130,255,190,0.10)' : 'rgba(90,230,150,0.07)';
        ctx.lineWidth = escape ? 9 : 7;
        ctx.setLineDash([]);
        ctx.stroke();
      } else {
        ctx.strokeStyle = escape ? 'rgba(185,255,212,0.78)' : 'rgba(104,238,160,0.52)';
        ctx.lineWidth = escape ? 3 : 2;
        ctx.setLineDash(escape ? [16, 12] : [11, 12]);
        ctx.lineDashOffset = -t * (escape ? 150 : 58);
        ctx.shadowColor = escape ? 'rgba(160,255,205,0.6)' : 'rgba(80,235,150,0.35)';
        ctx.shadowBlur = escape ? 9 : 5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawMark(p, t, alpha = 1) {
    const { ctx } = this;
    const x = this.sx(p.x, p.y), y = this.sy(p.y);
    const s = this.scaleAt(p.y);
    const bob = Math.sin(t * 2.4 + p.x) * 3.4;
    const my = y - 56 * s + bob;
    ctx.save();
    ctx.globalAlpha = alpha;
    const pulse = 0.5 + Math.sin(t * 3) * 0.5;
    ctx.strokeStyle = `rgba(120,235,255,${0.16 + pulse * 0.2})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(x, y - 2, (16 + pulse * 8) * s, (5.5 + pulse * 3) * s, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,235,255,0.28)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, my + 9); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(8,16,22,0.82)';
    ctx.beginPath(); ctx.arc(x, my, 13 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(140,242,255,0.9)';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(x, my, 13 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c9f6ff';
    ctx.font = `${Math.round(15 * s)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.mark, x, my + 0.5);
    ctx.restore();
  }

  // ---------------------------------------------------------------- 吹き出し

  drawBubble(text, who, wx, wy) {
    const { ctx, W } = this;
    const def = CHARS[who] || { label: '', color: '#dfe6f2' };
    const x = this.sx(wx, wy);
    const y = this.sy(wy) - 76 * this.scaleAt(wy);

    ctx.save();
    ctx.font = '600 14px ui-sans-serif, system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';
    const maxW = Math.min(W - 44, 300);
    const words = [...text];
    const lines = [];
    let line = '';
    for (const ch of words) {
      if (ctx.measureText(line + ch).width > maxW - 26) { lines.push(line); line = ch; }
      else line += ch;
    }
    if (line) lines.push(line);

    const tw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 26;
    const th = lines.length * 20 + 26;
    let bx = Math.max(12, Math.min(W - tw - 12, x - tw / 2));
    let by = Math.max(56, y - th);

    ctx.fillStyle = 'rgba(9,12,18,0.93)';
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.roundRect(bx, by, tw, th, 10); ctx.fill(); ctx.stroke();

    ctx.beginPath();
    const tipX = Math.max(bx + 14, Math.min(bx + tw - 14, x));
    ctx.moveTo(tipX - 6, by + th);
    ctx.lineTo(tipX, by + th + 9);
    ctx.lineTo(tipX + 6, by + th);
    ctx.closePath();
    ctx.fillStyle = 'rgba(9,12,18,0.93)'; ctx.fill();

    ctx.fillStyle = def.color;
    ctx.font = '700 10px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(def.label, bx + 12, by + 13);

    ctx.fillStyle = '#e9eef7';
    ctx.font = '600 14px ui-sans-serif, system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';
    lines.forEach((l, i) => ctx.fillText(l, bx + 12, by + 32 + i * 20));
    ctx.restore();
  }

  drawStick(input) {
    if (!input.active) return;
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = '#8ef0b8';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(input.origin.x, input.origin.y, 42, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(142,240,184,0.45)';
    ctx.beginPath();
    ctx.arc(input.origin.x + input.vx * 42, input.origin.y + input.vy * 42, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawVignette(strength) {
    if (strength <= 0) return;
    const { ctx, W, H } = this;
    const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.22, W / 2, H * 0.55, H * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.85 * strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  drawAreaName(name, alpha) {
    if (alpha <= 0.01) return;
    const { ctx, W } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(230,240,255,0.85)';
    ctx.font = '700 13px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(name, W / 2, 84);
    ctx.strokeStyle = 'rgba(230,240,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2 - 34, 92); ctx.lineTo(W / 2 + 34, 92); ctx.stroke();
    ctx.restore();
  }
}
