// CASE 03 の描画：秋の放課後の学校と線路。
// 01 の夜（紺＋街灯）、02 の夕暮れ（金）に対して、
// ここは灰と鉄と蛍光灯の緑。3本目にしてやっと人工物の中に入る。
import { Renderer } from './render.js';

export class SchoolRenderer extends Renderer {
  constructor(canvas, caseData) {
    super(canvas, caseData);
    this.dusk = 0;        // 0=放課後 1=日没
    this.bell = 0;        // 踏切の警告 0..1
    this.crossing = false;
  }

  resize() {
    super.resize();
    const h = this.canvas.clientHeight || window.innerHeight;
    this.groundTop = h * 0.58;
    this.groundBottom = h * 0.94;
    this.horizonY = this.groundTop - h * 0.05;
  }

  drawWorldBack(g) {
    this.drawEveningSky();
    this.drawFarTown();
    this.drawSchoolProps(g);
    this.drawGround();
    this.drawSchoolGates(g.state);
    this.drawPlatforms();
    this.drawSchoolPoles();
  }

  drawWorldFront() { this.drawSchoolForeground(); }

  mix(a, b, t) {
    const parse = c => {
      if (c[0] === '#') {
        return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 1];
      }
      const n = c.slice(c.indexOf('(') + 1, c.lastIndexOf(')')).split(',').map(Number);
      return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
    };
    const A = parse(a), B = parse(b);
    const v = i => Math.round(A[i] + (B[i] - A[i]) * t);
    const al = +(A[3] + (B[3] - A[3]) * t).toFixed(3);
    return `rgba(${v(0)},${v(1)},${v(2)},${al})`;
  }

  tSec() { return performance.now() / 1000; }

  // ---------------------------------------------------------------- 空

  drawEveningSky() {
    const { ctx, W, H } = this;
    const d = this.dusk;
    const g = ctx.createLinearGradient(0, 0, 0, this.horizonY + 30);
    g.addColorStop(0, this.mix('#9fb0bd', '#1c2230', d));
    g.addColorStop(0.6, this.mix('#c3c6c2', '#41414f', d));
    g.addColorStop(1, this.mix('#e4d3b4', '#8e5f52', d));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // カラス。放課後の音の担当（絵の側でも出しておく）
    ctx.save();
    ctx.globalAlpha = 0.35 - d * 0.2;
    ctx.strokeStyle = '#20242c';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      const bx = this.layerX(i * 900 + 300, 0.06);
      const by = this.horizonY - 190 - (i % 3) * 44;
      const f = Math.sin(this.tSec() * 2.2 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(bx - 7, by + f); ctx.quadraticCurveTo(bx, by - 4 + f, bx + 7, by + f);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 遠景。空だけの画面にしない。校舎と跨線橋は A1 からも見える（SPEC §33 §47）
  drawFarTown() {
    const { ctx, W } = this;
    const d = this.dusk;
    const base = this.horizonY + 10;

    // 一番奥の稜線
    ctx.fillStyle = this.mix('#9aa3ab', '#262b36', d);
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let i = 0; i <= 14; i++) {
      const x = (i / 14) * W;
      ctx.lineTo(x, base - 96 - Math.sin(i * 1.5) * 34 - Math.cos(i * 0.7) * 22);
    }
    ctx.lineTo(W, base); ctx.closePath(); ctx.fill();

    // 町並み
    ctx.fillStyle = this.mix('#7f858c', '#1e222c', d);
    for (let i = -2; i < 40; i++) {
      const x = this.layerX(i * 190, 0.32);
      if (x < -140 || x > W + 140) continue;
      const h = 46 + ((i * 53) % 78);
      ctx.fillRect(x - 44, base - h, 88, h);
    }

    // 校舎。町のどこからでも見える一番大きい箱
    const sx = this.layerX(2100, 0.32);
    if (sx > -420 && sx < W + 420) {
      ctx.fillStyle = this.mix('#8f959b', '#242832', d);
      ctx.fillRect(sx - 200, base - 150, 400, 150);
      ctx.fillRect(sx - 30, base - 176, 60, 28);
      ctx.fillStyle = `rgba(214,238,214,${0.18 + d * 0.5})`;
      for (let f = 0; f < 4; f++) {
        for (let i = 0; i < 9; i++) {
          if (((f * 9 + i) * 7) % 5 !== 0) continue;
          ctx.fillRect(sx - 182 + i * 42, base - 138 + f * 34, 22, 16);
        }
      }
    }
    // 跨線橋。目的地を最初から見せておく
    const bx = this.layerX(this.c.SAFE_ZONE.x, 0.32);
    if (bx > -160 && bx < W + 160) {
      ctx.fillStyle = this.mix('#77808a', '#1b1f28', d);
      ctx.fillRect(bx - 54, base - 62, 108, 6);
      ctx.fillRect(bx - 50, base - 62, 6, 62);
      ctx.fillRect(bx + 44, base - 62, 6, 62);
      ctx.fillRect(bx - 58, base - 84, 116, 4);
      ctx.strokeStyle = this.mix('rgba(140,148,156,0.6)', 'rgba(60,66,74,0.6)', d);
      ctx.lineWidth = 1.4;
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(bx + i * 12, base - 84); ctx.lineTo(bx + i * 12, base - 62);
        ctx.stroke();
      }
    }
  }

  // ---------------------------------------------------------------- 地面

  drawGround() {
    const { ctx, W } = this;
    const d = this.dusk;
    const top = this.sy(0), bot = this.sy(212);
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, this.mix('#8e8b83', '#3c3b39', d));
    g.addColorStop(1, this.mix('#7d7a72', '#333230', d));
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, bot - top);

    // 線路（A4 以降）。枕木とレールを2本
    const rails = this.c.PROPS.find(p => p.kind === 'rails');
    const rx0 = rails ? Math.max(0, this.sx(rails.x, -30)) : 0;
    if (rails && rx0 < W) {
      const ry = this.sy(-30);
      const rw = W - rx0;
      ctx.fillStyle = this.mix('#6b6459', '#2b2924', d);
      ctx.fillRect(rx0, ry - 4, rw, 26);
      ctx.fillStyle = this.mix('#4e4740', '#1f1d1a', d);
      for (const s of this.c.SCENERY.sleepers) {
        if (s.x < rails.x) continue;
        const x = this.sx(s.x, -30);
        if (x < rx0 - 20 || x > W + 20) continue;
        ctx.fillRect(x - 7, ry - 2, 14, 22);
      }
      ctx.fillStyle = this.mix('#b9bcbe', '#5a5d60', d);
      ctx.fillRect(rx0, ry + 1, rw, 3.2);
      ctx.fillRect(rx0, ry + 15, rw, 3.2);
    }

    // 白線・轍・砂利
    ctx.strokeStyle = this.mix('rgba(228,228,224,0.45)', 'rgba(120,120,118,0.45)', d);
    ctx.lineWidth = 2.4;
    ctx.setLineDash([26, 30]);
    ctx.beginPath(); ctx.moveTo(0, this.sy(108)); ctx.lineTo(W, this.sy(108)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = this.mix('#6d6a63', '#2c2b29', d);
    ctx.fillRect(0, top - 5, W, 6);
    ctx.fillRect(0, bot - 3, W, 9);

    for (const c of this.c.SCENERY.clutter) {
      const wy = c.kind === 'stone' ? 186 : 10;
      const x = this.sx(c.x, wy);
      if (x < -20 || x > W + 20) continue;
      const y = this.sy(wy);
      if (c.kind === 'weed') {
        ctx.strokeStyle = this.mix('#6c7549', '#2e332a', d);
        ctx.lineWidth = 1.6;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath(); ctx.moveTo(x + k * 2, y); ctx.lineTo(x + k * 4, y - 11 - Math.abs(k)); ctx.stroke();
        }
      } else if (c.kind === 'cone') {
        ctx.fillStyle = this.mix('#c9642f', '#5a3722', d);
        ctx.beginPath();
        ctx.moveTo(x, y - 22); ctx.lineTo(x + 8, y); ctx.lineTo(x - 8, y);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = this.mix('#8d8a84', '#3a3937', d);
        ctx.beginPath(); ctx.ellipse(x, y, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  drawSchoolPoles() {
    const { ctx } = this;
    const d = this.dusk;
    const y = this.sy(6);
    ctx.fillStyle = this.mix('#54524b', '#1e1d1b', d);
    for (const p of this.c.SCENERY.poles) {
      const x = this.sx(p.x, 6);
      if (x < -30 || x > this.W + 30) continue;
      ctx.fillRect(x - 3, y - p.h, 6, p.h);
      ctx.fillRect(x - 12, y - p.h + 8, 24, 3);
    }
  }

  // ---------------------------------------------------------------- 建物

  drawSchoolProps(g) {
    const { ctx } = this;
    const d = this.dusk;
    for (const p of this.c.PROPS) {
      if (p.kind === 'rails') continue;   // 地面側で描く
      const x = this.sx(p.x, p.y);
      if (p.w && (x > this.W + 900 || this.sx(p.x + p.w, p.y) < -900)) continue;
      if (!p.w && (x < -600 || x > this.W + 600)) continue;

      if (p.kind === 'houses') {
        const y = this.sy(p.y);
        for (let i = 0; i < 7; i++) {
          const hx = this.sx(p.x + i * 170, p.y);
          if (hx < -140 || hx > this.W + 140) continue;
          const hh = 92 + (i % 3) * 22;
          ctx.fillStyle = this.mix('#9a958c', '#3a3936', d);
          ctx.fillRect(hx - 52, y - hh, 104, hh);
          ctx.fillStyle = this.mix('#5b5750', '#26251f', d);
          ctx.beginPath();
          ctx.moveTo(hx - 62, y - hh); ctx.lineTo(hx, y - hh - 26); ctx.lineTo(hx + 62, y - hh);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = `rgba(255,214,140,${0.12 + d * 0.55})`;
          ctx.fillRect(hx - 26, y - hh * 0.7, 20, 15);
        }
      }

      if (p.kind === 'school') {
        // 4階建ての校舎。窓の格子で「学校」を出す
        const y = this.sy(p.y);
        const x0 = this.sx(p.x, p.y), x1 = this.sx(p.x + p.w, p.y);
        const hh = 210;
        ctx.fillStyle = this.mix('#b3aea2', '#403f3b', d);
        ctx.fillRect(x0, y - hh, x1 - x0, hh);
        ctx.fillStyle = this.mix('#8d887c', '#2f2e2b', d);
        ctx.fillRect(x0, y - hh - 10, x1 - x0, 12);
        for (let f = 0; f < 4; f++) {
          const fy = y - hh + 18 + f * 48;
          ctx.fillStyle = this.mix('#6d6a62', '#232320', d);
          ctx.fillRect(x0, fy + 34, x1 - x0, 4);
          for (let i = 0; i < 26; i++) {
            const wx = this.sx(p.x + 60 + i * 82, p.y);
            if (wx < x0 - 40 || wx > x1 + 40 || wx < -60 || wx > this.W + 60) continue;
            // 一つだけ蛍光灯がついている
            const lit = (f === 2 && i === 11);
            ctx.fillStyle = lit
              ? `rgba(214,238,214,${0.55 + d * 0.4})`
              : this.mix('rgba(126,138,142,0.75)', 'rgba(40,44,48,0.8)', d);
            ctx.fillRect(wx - 26, fy, 52, 32);
            ctx.strokeStyle = this.mix('rgba(90,88,80,0.5)', 'rgba(20,20,18,0.6)', d);
            ctx.lineWidth = 1.4;
            ctx.strokeRect(wx - 26, fy, 52, 32);
            ctx.beginPath();
            ctx.moveTo(wx, fy); ctx.lineTo(wx, fy + 32);
            ctx.stroke();
          }
        }
      }

      if (p.kind === 'corridor') {
        // 渡り廊下。柱と手すりだけの薄い構造
        const y = this.sy(p.y);
        const x0 = this.sx(p.x, p.y), x1 = this.sx(p.x + p.w, p.y);
        ctx.fillStyle = this.mix('#a29d92', '#38372f', d);
        ctx.fillRect(x0, y - 86, x1 - x0, 8);
        for (let i = 0; i < 10; i++) {
          const cx = this.sx(p.x + i * 110, p.y);
          if (cx < -40 || cx > this.W + 40) continue;
          ctx.fillStyle = this.mix('#8b867b', '#2f2e2a', d);
          ctx.fillRect(cx - 4, y - 86, 8, 86);
        }
        ctx.strokeStyle = this.mix('rgba(150,146,136,0.7)', 'rgba(50,50,46,0.7)', d);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, y - 52); ctx.lineTo(x1, y - 52); ctx.stroke();
      }

      if (p.kind === 'crossing') this.drawCrossing(p);
      if (p.kind === 'overpass') this.drawOverpass(p);
    }
  }

  // 踏切。鳴っている間だけ赤が交互に光る
  drawCrossing(p) {
    const { ctx } = this;
    const d = this.dusk;
    const y = this.sy(p.y), s = this.scaleAt(p.y);
    const blink = this.bell > 0 || this.crossing;
    for (const side of [-1, 1]) {
      const x = this.sx(p.x + side * 150, p.y);
      if (x < -80 || x > this.W + 80) continue;
      ctx.fillStyle = this.mix('#5a5750', '#232220', d);
      ctx.fillRect(x - 4 * s, y - 96 * s, 8 * s, 96 * s);
      // ×印
      ctx.strokeStyle = this.mix('#d8d4c8', '#6a6862', d);
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.moveTo(x - 20 * s, y - 112 * s); ctx.lineTo(x + 20 * s, y - 78 * s);
      ctx.moveTo(x + 20 * s, y - 112 * s); ctx.lineTo(x - 20 * s, y - 78 * s);
      ctx.stroke();
      // 警告灯
      const on = blink && (Math.floor(this.tSec() * 3.2) % 2 === (side > 0 ? 0 : 1));
      for (const k of [-1, 1]) {
        ctx.beginPath();
        ctx.fillStyle = on && k < 0 ? '#ff4436' : (on && k > 0 ? '#3a1512' : this.mix('#7c3a34', '#3a1c19', d));
        ctx.arc(x + k * 13 * s, y - 66 * s, 6.5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      if (on) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        const g = ctx.createRadialGradient(x - 13 * s, y - 66 * s, 2, x - 13 * s, y - 66 * s, 54);
        g.addColorStop(0, 'rgba(255,80,60,0.7)');
        g.addColorStop(1, 'rgba(255,80,60,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x - 13 * s, y - 66 * s, 54, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  }

  // 跨線橋。生還地点。遠くからでも見えるランドマークにする（SPEC §33 §47）
  drawOverpass(p) {
    const { ctx } = this;
    const d = this.dusk;
    const x = this.sx(p.x, p.y), y = this.sy(p.y), s = this.scaleAt(p.y);
    const H = 96 * s;
    ctx.fillStyle = this.mix('#8f9498', '#35393c', d);
    // 脚
    ctx.fillRect(x - 66 * s, y - H, 10 * s, H);
    ctx.fillRect(x + 56 * s, y - H, 10 * s, H);
    // 床
    ctx.fillRect(x - 74 * s, y - H - 9 * s, 148 * s, 9 * s);
    // 階段
    ctx.fillStyle = this.mix('#7d8286', '#2c3033', d);
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(x - 74 * s + i * 9 * s, y - (i + 1) * 12 * s, 11 * s, 12 * s);
    }
    // 手すり
    ctx.strokeStyle = this.mix('#a8adb0', '#454a4d', d);
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    ctx.moveTo(x - 74 * s, y - H - 9 * s); ctx.lineTo(x - 74 * s, y - H - 44 * s);
    ctx.lineTo(x + 74 * s, y - H - 44 * s); ctx.lineTo(x + 74 * s, y - H - 9 * s);
    ctx.stroke();
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 12 * s, y - H - 9 * s); ctx.lineTo(x + i * 12 * s, y - H - 42 * s);
      ctx.stroke();
    }
  }

  // 開放は文字で伝えない。世界が変わる（SPEC §20）
  drawSchoolGates(state) {
    const { ctx } = this;
    const d = this.dusk;
    for (const g of this.c.GATES) {
      const open = state.isUnlocked(g.opens);
      const x = this.sx(g.x, 50), y = this.sy(50), s = this.scaleAt(50);
      if (x < -200 || x > this.W + 200) continue;

      if (g.kind === 'schoolgate') {
        ctx.fillStyle = this.mix('#7b776e', '#2c2b27', d);
        ctx.fillRect(x - 62 * s, y - 92 * s, 9 * s, 92 * s);
        ctx.fillRect(x + 53 * s, y - 92 * s, 9 * s, 92 * s);
        ctx.strokeStyle = this.mix('#6f6b62', '#26251f', d);
        ctx.lineWidth = 2.4 * s;
        ctx.save();
        if (open) { ctx.translate(x - 54 * s, y); ctx.rotate(-1.0); }
        else ctx.translate(x - 54 * s, y);
        for (let i = 0; i <= 8; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 13 * s, 0); ctx.lineTo(i * 13 * s, -74 * s);
          ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(0, -70 * s); ctx.lineTo(104 * s, -70 * s); ctx.stroke();
        ctx.restore();
      }
      if (g.kind === 'net') {
        // 防球ネット。開くとめくれて隙間ができる
        ctx.strokeStyle = this.mix('rgba(90,110,88,0.55)', 'rgba(34,42,34,0.6)', d);
        ctx.lineWidth = 1;
        const top = y - 150 * s;
        for (let i = -5; i <= 5; i++) {
          if (open && Math.abs(i) < 2) continue;
          ctx.beginPath(); ctx.moveTo(x + i * 15 * s, top); ctx.lineTo(x + i * 15 * s, y); ctx.stroke();
        }
        for (let k = 0; k < 10; k++) {
          ctx.beginPath();
          ctx.moveTo(x - 75 * s, top + k * 15 * s);
          ctx.lineTo(x + (open ? -30 : 75) * s, top + k * 15 * s);
          ctx.stroke();
          if (open) {
            ctx.beginPath();
            ctx.moveTo(x + 30 * s, top + k * 15 * s); ctx.lineTo(x + 75 * s, top + k * 15 * s);
            ctx.stroke();
          }
        }
        ctx.fillStyle = this.mix('#6b6f62', '#25281f', d);
        ctx.fillRect(x - 78 * s, top, 5 * s, 150 * s);
        ctx.fillRect(x + 73 * s, top, 5 * s, 150 * s);
      }
      if (g.kind === 'shutter') {
        ctx.fillStyle = this.mix('#94918a', '#34332f', d);
        const h = open ? 16 : 96;
        ctx.fillRect(x - 56 * s, y - 96 * s, 112 * s, h * s);
        ctx.strokeStyle = this.mix('rgba(70,68,62,0.5)', 'rgba(18,18,16,0.6)', d);
        ctx.lineWidth = 1.2;
        for (let i = 0; i < h / 10; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 56 * s, y - 96 * s + i * 10 * s);
          ctx.lineTo(x + 56 * s, y - 96 * s + i * 10 * s);
          ctx.stroke();
        }
      }
      if (g.kind === 'barrier') {
        // 遮断機。開放されると上がる
        ctx.fillStyle = this.mix('#5a5750', '#232220', d);
        ctx.fillRect(x - 5 * s, y - 60 * s, 10 * s, 60 * s);
        ctx.save();
        ctx.translate(x, y - 54 * s);
        ctx.rotate(open ? -1.35 : 0);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? '#e8e4d8' : '#c0342c';
          ctx.fillRect(i * 22 * s, -4 * s, 22 * s, 8 * s);
        }
        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------- 台

  // 台は「乗れるもの」に見えないといけない。
  // 高さは数字で出さず、影の落ち方と側面の見え方で伝える
  drawPlatforms() {
    const { ctx } = this;
    const d = this.dusk;
    const reach = this.c.TEKETEKE.reach;
    for (const t of this.c.PLATFORMS) {
      const half = t.w / 2;
      const xL = this.sx(t.x - half, t.y + t.d), xR = this.sx(t.x + half, t.y + t.d);
      if (xR < -80 || xL > this.W + 80) continue;
      const s = this.scaleAt(t.y + t.d);
      const yBase = this.sy(t.y + t.d);
      const yFar = this.sy(t.y);
      const top = yBase - t.h * s;
      const topFar = yFar - t.h * s;
      const xLf = this.sx(t.x - half, t.y), xRf = this.sx(t.x + half, t.y);

      // 接地の影
      ctx.fillStyle = `rgba(0,0,0,${0.3 - d * 0.1})`;
      ctx.beginPath();
      ctx.ellipse((xL + xR) / 2, yBase, (xR - xL) * 0.55, 7 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      // 低い台は色でも分けない。形だけで判断させる（§12 §17）
      const body = t.h <= reach
        ? this.mix('#8c877c', '#332f2b', d)
        : this.mix('#a49f92', '#403c36', d);
      const face = t.h <= reach
        ? this.mix('#6f6a60', '#242220', d)
        : this.mix('#7f7a6f', '#2b2926', d);

      // 天板
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(xLf, topFar); ctx.lineTo(xRf, topFar);
      ctx.lineTo(xR, top); ctx.lineTo(xL, top);
      ctx.closePath(); ctx.fill();
      // 側面
      ctx.fillStyle = face;
      ctx.fillRect(xL, top, xR - xL, yBase - top);
      ctx.strokeStyle = this.mix('rgba(50,48,44,0.5)', 'rgba(12,12,11,0.6)', d);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(xL, top, xR - xL, yBase - top);

      this.decorPlatform(t, xL, xR, top, yBase, s, d);
    }
  }

  decorPlatform(t, xL, xR, top, yBase, s, d) {
    const { ctx } = this;
    const cx = (xL + xR) / 2;
    if (t.kind === 'bar') {
      // 鉄棒。天板ではなく棒。乗れるのは棒の高さ
      ctx.strokeStyle = this.mix('#c4c8ca', '#4e5254', d);
      ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.moveTo(xL, top); ctx.lineTo(xR, top); ctx.stroke();
    } else if (t.kind === 'jungle') {
      ctx.strokeStyle = this.mix('#7f8a8e', '#2e3336', d);
      ctx.lineWidth = 2.4 * s;
      for (let i = 0; i <= 3; i++) {
        const gx = xL + (xR - xL) * (i / 3);
        ctx.beginPath(); ctx.moveTo(gx, top); ctx.lineTo(gx, yBase); ctx.stroke();
      }
      for (let k = 0; k <= 3; k++) {
        const gy = top + (yBase - top) * (k / 3);
        ctx.beginPath(); ctx.moveTo(xL, gy); ctx.lineTo(xR, gy); ctx.stroke();
      }
    } else if (t.kind === 'stairs') {
      ctx.fillStyle = this.mix('#8f8a7e', '#2f2d29', d);
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(xL + i * (xR - xL) / 6, yBase - (i + 1) * (yBase - top) / 5,
                     (xR - xL) / 6 + 2, (yBase - top) / 5);
      }
    } else if (t.kind === 'aircon') {
      ctx.strokeStyle = this.mix('rgba(60,58,54,0.6)', 'rgba(16,16,14,0.6)', d);
      ctx.lineWidth = 1.2;
      for (let i = 1; i < 5; i++) {
        const gy = top + (yBase - top) * (i / 5);
        ctx.beginPath(); ctx.moveTo(xL + 4, gy); ctx.lineTo(xR - 4, gy); ctx.stroke();
      }
    } else if (t.kind === 'vault') {
      ctx.strokeStyle = this.mix('rgba(70,60,44,0.6)', 'rgba(20,18,14,0.6)', d);
      ctx.lineWidth = 1.6;
      for (let i = 1; i < 4; i++) {
        const gy = top + (yBase - top) * (i / 4);
        ctx.beginPath(); ctx.moveTo(xL, gy); ctx.lineTo(xR, gy); ctx.stroke();
      }
    } else if (t.kind === 'shed' || t.kind === 'hut') {
      // 屋根は天板の奥側だけに置く。手前を塞ぐと「乗れる面」が見えなくなる
      ctx.fillStyle = this.mix('#6a6b63', '#262723', d);
      ctx.fillRect(xL - 6, top - 7 * s, (xR - xL) + 12, 7 * s);
      ctx.fillStyle = this.mix('#565750', '#1e1f1c', d);
      ctx.fillRect(xL + 6, top + (yBase - top) * 0.35, (xR - xL) * 0.28, (yBase - top) * 0.6);
    } else if (t.kind === 'signal') {
      ctx.fillStyle = this.mix('#4d5154', '#1c1f21', d);
      ctx.fillRect(cx - 3 * s, top - 54 * s, 6 * s, 54 * s);
      ctx.beginPath(); ctx.arc(cx, top - 58 * s, 7 * s, 0, Math.PI * 2);
      ctx.fillStyle = '#2c6b3a'; ctx.fill();
    } else if (t.kind === 'sleepers') {
      ctx.strokeStyle = this.mix('rgba(50,44,36,0.6)', 'rgba(14,13,11,0.6)', d);
      ctx.lineWidth = 1.6;
      for (let i = 1; i < 5; i++) {
        const gy = top + (yBase - top) * (i / 5);
        ctx.beginPath(); ctx.moveTo(xL, gy); ctx.lineTo(xR, gy); ctx.stroke();
      }
    }
  }

  drawSchoolForeground() {
    const { ctx, W, H } = this;
    const d = this.dusk;
    const y = Math.min(this.sy(208), H - 70);
    // 手前のフェンス。金網ごしに見ている絵にする
    ctx.fillStyle = this.mix('#5d5b55', '#232220', d);
    ctx.fillRect(0, y + 40, W, H - y);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = this.mix('#7e8079', '#2a2c28', d);
    ctx.lineWidth = 1.8;
    for (let i = -1; i < 60; i++) {
      const x = this.layerX(i * 60 - 200, 1.3);
      if (x < -30 || x > W + 30) continue;
      ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 22, y + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 22, H); ctx.lineTo(x, y + 6); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = this.mix('#4c4a45', '#1b1a19', d);
    ctx.fillRect(0, y + 2, W, 7);
  }

  // ---------------------------------------------------------------- テケテケ

  drawTekeTeke(k) {
    if (!k.visible) return;
    const { ctx } = this;
    const x = this.sx(k.x, k.y), y = this.sy(k.y);
    const s = this.scaleAt(k.y) * 1.5;
    const reach = this.c.TEKETEKE.reach * this.scaleAt(k.y);
    const f = k.dir;
    const drag = Math.sin(k.t * 22) * 2.4 * s;

    ctx.save();
    // 走った跡。速さは残像で出す。止まって見えると怖くない
    ctx.lineCap = 'round';
    for (let i = 1; i <= 3; i++) {
      ctx.globalAlpha = 0.16 / i;
      ctx.strokeStyle = '#e8eaef';
      ctx.lineWidth = (16 - i * 3) * s;
      ctx.beginPath();
      ctx.moveTo(x - f * (40 + i * 46) * s, y - 16 * s);
      ctx.lineTo(x - f * 12 * s, y - 16 * s);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath(); ctx.ellipse(x, y, 22 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();

    ctx.translate(x, y + drag);
    ctx.scale(f, 1);

    const ink = 'rgba(6,7,10,0.92)';
    // 上半身だけ。腰から下は無い
    ctx.beginPath();
    ctx.moveTo(-13 * s, -2 * s);
    ctx.lineTo(-9 * s, -30 * s);
    ctx.quadraticCurveTo(0, -38 * s, 10 * s, -29 * s);
    ctx.lineTo(13 * s, -3 * s);
    ctx.closePath();
    ctx.fillStyle = '#cfd3d8'; ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6 * s; ctx.stroke();
    // 断面
    ctx.fillStyle = '#8d2f31';
    ctx.beginPath(); ctx.ellipse(0, -2 * s, 13 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill();

    // 頭。顔は描かない。速すぎて見えない
    ctx.beginPath(); ctx.arc(1 * s, -44 * s, 10 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#e6e2dc'; ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6 * s; ctx.stroke();
    ctx.fillStyle = '#141518';
    ctx.beginPath();
    ctx.moveTo(-10 * s, -50 * s); ctx.quadraticCurveTo(1 * s, -58 * s, 11 * s, -48 * s);
    ctx.lineTo(9 * s, -38 * s); ctx.quadraticCurveTo(1 * s, -44 * s, -9 * s, -38 * s);
    ctx.closePath(); ctx.fill();

    // 腕。地面を掻いて進む。通り過ぎる瞬間だけ上へ伸ばす
    const up = k.armT > 0 ? Math.sin((1 - k.armT / 0.42) * Math.PI) : 0;
    ctx.strokeStyle = '#dfe2e6';
    ctx.lineWidth = 5.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6 * s, -26 * s);
    ctx.lineTo(-22 * s - drag, -4 * s);
    ctx.moveTo(8 * s, -26 * s);
    ctx.lineTo(24 * s + drag, -4 * s - reach * up);
    ctx.stroke();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.3 * s;
    ctx.beginPath();
    ctx.moveTo(8 * s, -26 * s); ctx.lineTo(24 * s + drag, -4 * s - reach * up);
    ctx.stroke();
    ctx.restore();
  }

  // 踏切が鳴っている。四郎に聞こえなくなるので、画面の縁は必ず残す（§17）
  drawBell(p) {
    if (p <= 0.01) return;
    const { ctx, W, H } = this;
    const beat = 0.5 + Math.sin(this.tSec() * 12) * 0.5;
    const a = (0.12 + 0.5 * p) * (0.55 + beat * 0.45);
    ctx.save();
    const g = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.3, W / 2, H * 0.5, H * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(196,44,34,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
