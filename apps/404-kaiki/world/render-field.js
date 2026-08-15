// CASE 02 の描画：夏の夕方の田園。
// CASE 01 の夜の住宅街と、色・広さ・明るさをすべて逆にする（CASE02_SLICE §0）。
import { Renderer } from './render.js';

export class FieldRenderer extends Renderer {
  constructor(canvas, caseData) {
    super(canvas, caseData);
    this.dusk = 0;          // 0=夕方 1=日が落ちる。PHASE で上げる
    this.understanding = 0; // 画面の歪み量
    this.sightActive = false;  // 理解度システムが動いているか
    this.coverId = null;       // いま入っている陰
  }

  resize() {
    super.resize();
    // 空を広く取る。田園は「広い」ことが怖さになる。
    // groundTop は「農道の奥端」。田はそこから horizonY までの帯に載る。
    const h = this.canvas.clientHeight || window.innerHeight;
    this.groundTop = h * 0.60;
    this.groundBottom = h * 0.95;
    this.horizonY = this.groundTop - h * 0.17;
  }

  drawWorldBack(g) {
    this.drawDuskSky();
    this.drawMountains();
    this.drawPaddies();
    this.drawFarmRoad();
    this.drawFieldProps(g);
    this.drawFieldGates(g.state);
    this.drawCovers();
    this.drawFieldPoles();
    this.drawFieldWires();
  }

  drawWorldFront() { this.drawFieldForeground(); }

  // ---------------------------------------------------------------- 空

  drawDuskSky() {
    const { ctx, W, H } = this;
    const d = this.dusk;
    const g = ctx.createLinearGradient(0, 0, 0, this.horizonY + 20);
    // 上は薄い青、地平は金。日が落ちるほど赤く沈む
    g.addColorStop(0, this.mix('#8fb4d6', '#2b3550', d));
    g.addColorStop(0.55, this.mix('#d9dbc8', '#6a5a63', d));
    g.addColorStop(1, this.mix('#f6dda6', '#c9764f', d));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 太陽。低い位置に大きく
    const sx = this.layerX(5200, 0.04);
    const sy = this.horizonY - 40 + d * 30;
    ctx.save();
    ctx.globalAlpha = 0.85 - d * 0.35;
    const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 120);
    sg.addColorStop(0, 'rgba(255,244,206,0.95)');
    sg.addColorStop(0.35, 'rgba(255,206,130,0.5)');
    sg.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, sy, 120, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,225,0.95)';
    ctx.beginPath(); ctx.arc(sx, sy, 17, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

  }

  // 夕方から日没まで、色を一本の t で動かす。
  // #rrggbb と rgba(...) の両方を受ける（片方だけだと NaN になって
  // 直前の fillStyle がそのまま残り、原因の分かりにくい描画崩れになる）
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

  drawMountains() {
    const { ctx, W } = this;
    const base = this.horizonY + 2;
    const d = this.dusk;
    // 奥の山
    ctx.fillStyle = this.mix('#8894a6', '#3a4152', d);
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let i = 0; i <= 16; i++) {
      const x = (i / 16) * W;
      ctx.lineTo(x, base - 62 - Math.sin(i * 1.3) * 26 - Math.cos(i * 0.6) * 18);
    }
    ctx.lineTo(W, base); ctx.closePath(); ctx.fill();
    // 手前の山
    ctx.fillStyle = this.mix('#5d7060', '#28322c', d);
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * W;
      ctx.lineTo(x, base - 26 - Math.sin(i * 1.9 + 1) * 16);
    }
    ctx.lineTo(W, base); ctx.closePath(); ctx.fill();
    // 集落の屋根の連なり
    ctx.fillStyle = this.mix('#4a4f52', '#22262a', d);
    for (let i = -1; i < 26; i++) {
      const x = this.layerX(i * 240, 0.3);
      if (x < -60 || x > W + 60) continue;
      ctx.fillRect(x - 22, base - 16, 44, 16);
      ctx.beginPath();
      ctx.moveTo(x - 28, base - 16); ctx.lineTo(x, base - 27); ctx.lineTo(x + 28, base - 16);
      ctx.closePath(); ctx.fill();
    }
  }

  // ---------------------------------------------------------------- 田

  drawPaddies() {
    const { ctx, W } = this;
    const d = this.dusk;
    const horizon = this.horizonY;
    const near = this.sy(-2);
    // 田の面
    const g = ctx.createLinearGradient(0, horizon, 0, near);
    g.addColorStop(0, this.mix('#9aa86a', '#4b5340', d));
    g.addColorStop(1, this.mix('#c3bd63', '#6b6440', d));
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon, W, near - horizon);

    // 田は一枚ずつ違う。区画で塗り分けて、平らな緑の板にしない（SPEC §45）
    for (const p of this.c.SCENERY.paddies) {
      const d0 = p.depth, d1 = p.depth - p.span;
      const y0 = this.sy(d0), y1 = this.sy(d1);
      if (y0 < horizon || y1 > near) continue;
      const x0n = this.sx(p.x - p.w / 2, d0), x1n = this.sx(p.x + p.w / 2, d0);
      const x0f = this.sx(p.x - p.w / 2, d1), x1f = this.sx(p.x + p.w / 2, d1);
      if (Math.max(x1n, x1f) < -60 || Math.min(x0n, x0f) > W + 60) continue;
      const t = p.tone;
      const base = p.water
        ? this.mix(`rgba(${Math.round(196 * t)},${Math.round(186 * t)},${Math.round(150 * t)},1)`,
                   'rgba(74,72,66,1)', d)
        : this.mix(`rgba(${Math.round(158 * t)},${Math.round(172 * t)},${Math.round(96 * t)},1)`,
                   'rgba(66,72,54,1)', d);
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.moveTo(x0n, y0); ctx.lineTo(x1n, y0); ctx.lineTo(x1f, y1); ctx.lineTo(x0f, y1);
      ctx.closePath(); ctx.fill();
      // 手前の畦。土の盛り上がり
      ctx.strokeStyle = this.mix('rgba(150,142,96,0.65)', 'rgba(74,70,52,0.7)', d);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0n, y0); ctx.lineTo(x1n, y0); ctx.stroke();
      // 奥へ向かう畦。ここで田に奥行きが出る
      ctx.strokeStyle = this.mix('rgba(150,142,96,0.35)', 'rgba(66,62,46,0.45)', d);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0n, y0); ctx.lineTo(x0f, y1); ctx.stroke();
    }

    // 稲の質感
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = this.mix('#e2dd94', '#8a8352', d);
    ctx.lineWidth = 1;
    for (let i = 0; i < 260; i++) {
      const wy = -4 - (i * 37) % 116;
      const y = this.sy(wy);
      if (y < horizon || y > near) continue;
      const x = this.sx((i * 211) % this.c.WORLD.length, wy);
      if (x < -10 || x > W + 10) continue;
      const sway = Math.sin(this.tSec() * 1.1 + i) * 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sway, y - 5); ctx.stroke();
    }
    ctx.restore();
  }

  tSec() { return performance.now() / 1000; }

  drawFarmRoad() {
    const { ctx, W } = this;
    const d = this.dusk;
    const top = this.sy(0), bot = this.sy(210);
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, this.mix('#b9ac8e', '#5a5344', d));
    g.addColorStop(1, this.mix('#a2957a', '#4b4539', d));
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, bot - top);
    // 轍
    ctx.strokeStyle = this.mix('rgba(120,110,86,0.55)', 'rgba(40,38,30,0.6)', d);
    ctx.lineWidth = 5;
    for (const wy of [70, 140]) {
      ctx.beginPath(); ctx.moveTo(0, this.sy(wy)); ctx.lineTo(W, this.sy(wy)); ctx.stroke();
    }
    // 路肩の草
    ctx.fillStyle = this.mix('#7f8c50', '#3a4030', d);
    ctx.fillRect(0, top - 5, W, 6);
    ctx.fillRect(0, bot - 2, W, 8);
    for (const c of this.c.SCENERY.clutter) {
      const x = this.sx(c.x, c.kind === 'rock' ? 190 : 8);
      if (x < -20 || x > W + 20) continue;
      const y = this.sy(c.kind === 'rock' ? 190 : 8);
      if (c.kind === 'weed') {
        ctx.strokeStyle = this.mix('#6f7d45', '#333a28', d);
        ctx.lineWidth = 1.6;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath(); ctx.moveTo(x + k * 2, y); ctx.lineTo(x + k * 4, y - 12 - Math.abs(k)); ctx.stroke();
        }
      } else if (c.kind === 'post') {
        ctx.fillStyle = this.mix('#7a6a4c', '#332e24', d);
        ctx.fillRect(x - 2, y - 22, 4, 22);
      } else {
        ctx.fillStyle = this.mix('#9a9384', '#40403a', d);
        ctx.beginPath(); ctx.ellipse(x, y, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  drawFieldPoles() {
    const { ctx } = this;
    const d = this.dusk;
    const y = this.sy(10);
    ctx.fillStyle = this.mix('#4a4438', '#1d1c18', d);
    for (const p of this.c.SCENERY.poles) {
      const x = this.sx(p.x, 10);
      if (x < -30 || x > this.W + 30) continue;
      ctx.fillRect(x - 3, y - p.h, 6, p.h);
      ctx.fillRect(x - 13, y - p.h + 6, 26, 3);
    }
  }

  drawFieldWires() {
    const { ctx } = this;
    const d = this.dusk;
    const y0 = this.sy(10);
    const poles = this.c.SCENERY.poles;
    ctx.save();
    ctx.strokeStyle = this.mix('rgba(60,56,48,0.75)', 'rgba(14,14,16,0.85)', d);
    ctx.lineWidth = 1.3;
    for (let i = 0; i < poles.length - 1; i++) {
      const a = poles[i], b = poles[i + 1];
      const ax = this.sx(a.x, 10), bx = this.sx(b.x, 10);
      if (bx < -60 || ax > this.W + 60) continue;
      for (const off of [0, 7]) {
        ctx.beginPath();
        ctx.moveTo(ax, y0 - a.h + off);
        ctx.quadraticCurveTo((ax + bx) / 2, y0 - (a.h + b.h) / 2 + off + 26, bx, y0 - b.h + off);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- 施設

  drawFieldProps(g) {
    const { ctx } = this;
    const d = this.dusk;
    for (const p of this.c.PROPS) {
      const x = this.sx(p.x, p.y);
      if (x < -700 || x > this.W + 700) continue;
      if (p.kind === 'busstop') {
        const y = this.sy(p.y);
        ctx.fillStyle = this.mix('#6f7480', '#2f333c', d);
        ctx.fillRect(x - 46, y - 74, 92, 6);
        ctx.fillRect(x - 44, y - 68, 5, 68);
        ctx.fillRect(x + 39, y - 68, 5, 68);
        ctx.fillStyle = this.mix('#8b9098', '#3a3e46', d);
        ctx.fillRect(x - 40, y - 34, 76, 8);
        ctx.fillStyle = this.mix('#e8e4d6', '#5c5a52', d);
        ctx.fillRect(x - 12, y - 62, 24, 20);
      }
      if (p.kind === 'canal') {
        const yTop = this.sy(-14), yBot = this.sy(6);
        const x0 = this.sx(p.x, -4), x1 = this.sx(p.x + p.w, -4);
        ctx.fillStyle = this.mix('#8d8570', '#3c382e', d);
        ctx.fillRect(x0, yTop - 8, x1 - x0, 10);
        ctx.fillStyle = this.mix('#5f7f8c', '#25333c', d);
        ctx.fillRect(x0, yTop + 2, x1 - x0, yBot - yTop);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = 'rgba(230,244,250,0.6)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 40; i++) {
          const wx = p.x + (i * 31 + (this.tSec() * 60) % 31) % p.w;
          const sxx = this.sx(wx, -4);
          if (sxx < x0 || sxx > x1) continue;
          ctx.beginPath();
          ctx.moveTo(sxx, yTop + 10 + (i % 3) * 6);
          ctx.lineTo(sxx + 9, yTop + 10 + (i % 3) * 6);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (p.kind === 'greenhouses') {
        for (let i = 0; i < 3; i++) {
          const hx = this.sx(p.x + 120 + i * 440, 50);
          const hy = this.sy(50);
          if (hx < -260 || hx > this.W + 260) continue;
          ctx.fillStyle = this.mix('rgba(238,241,236,0.9)', 'rgba(120,124,124,0.9)', d);
          ctx.beginPath();
          ctx.moveTo(hx - 130, hy);
          ctx.lineTo(hx - 130, hy - 44);
          ctx.quadraticCurveTo(hx, hy - 104, hx + 130, hy - 44);
          ctx.lineTo(hx + 130, hy);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(90,96,92,0.35)';
          ctx.lineWidth = 1.2;
          for (let k = -2; k <= 2; k++) {
            ctx.beginPath();
            ctx.moveTo(hx + k * 52, hy);
            ctx.lineTo(hx + k * 52, hy - 52 - (2 - Math.abs(k)) * 16);
            ctx.stroke();
          }
        }
      }
      if (p.kind === 'scarecrow') {
        const y = this.sy(p.y), s = this.scaleAt(p.y);
        ctx.strokeStyle = this.mix('#6d5c3f', '#2b261c', d);
        ctx.lineWidth = 3.4 * s;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x, y - 54 * s);
        ctx.moveTo(x - 22 * s, y - 40 * s); ctx.lineTo(x + 22 * s, y - 40 * s);
        ctx.stroke();
        ctx.fillStyle = this.mix('#b5754a', '#4a3526', d);
        ctx.fillRect(x - 14 * s, y - 44 * s, 28 * s, 22 * s);
        ctx.fillStyle = this.mix('#d9cba0', '#5a5344', d);
        ctx.beginPath(); ctx.arc(x, y - 54 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#20201c';
        ctx.fillRect(x - 12 * s, y - 62 * s, 24 * s, 3 * s);
      }
      if (p.kind === 'village') {
        const y = this.sy(p.y);
        for (let i = 0; i < 4; i++) {
          const hx = this.sx(p.x + i * 190, p.y);
          if (hx < -160 || hx > this.W + 160) continue;
          const hh = 74 + (i % 2) * 20;
          ctx.fillStyle = this.mix('#8d8878', '#3b3931', d);
          ctx.fillRect(hx - 52, y - hh, 104, hh);
          ctx.fillStyle = this.mix('#4c4b47', '#232320', d);
          ctx.beginPath();
          ctx.moveTo(hx - 62, y - hh); ctx.lineTo(hx, y - hh - 30); ctx.lineTo(hx + 62, y - hh);
          ctx.closePath(); ctx.fill();
          // 灯り。日が落ちるほど目立つ
          ctx.fillStyle = `rgba(255,214,140,${0.2 + d * 0.65})`;
          ctx.fillRect(hx - 24, y - hh * 0.66, 20, 16);
          ctx.fillRect(hx + 8, y - hh * 0.66, 20, 16);
        }
      }
    }
  }

  // 開放は文字で伝えない。世界が変わる（SPEC §20）
  drawFieldGates(state) {
    const { ctx } = this;
    const d = this.dusk;
    for (const g of this.c.GATES) {
      const open = state.isUnlocked(g.opens);
      const x = this.sx(g.x, 60), y = this.sy(60), s = this.scaleAt(60);
      if (x < -200 || x > this.W + 200) continue;

      if (g.kind === 'chain') {
        // 通行止めのチェーン。外れると片側に垂れる
        ctx.fillStyle = this.mix('#8a7f66', '#38342a', d);
        ctx.fillRect(x - 44 * s, y - 46 * s, 5 * s, 46 * s);
        ctx.fillRect(x + 39 * s, y - 46 * s, 5 * s, 46 * s);
        ctx.strokeStyle = this.mix('#6d6455', '#2a2822', d);
        ctx.lineWidth = 2.6 * s;
        ctx.beginPath();
        if (open) {
          ctx.moveTo(x + 41 * s, y - 44 * s);
          ctx.quadraticCurveTo(x + 46 * s, y - 16 * s, x + 44 * s, y - 2 * s);
        } else {
          ctx.moveTo(x - 42 * s, y - 40 * s);
          ctx.quadraticCurveTo(x, y - 22 * s, x + 41 * s, y - 40 * s);
        }
        ctx.stroke();
      }
      if (g.kind === 'plank') {
        // 用水路に板が渡る
        const yT = this.sy(18), yB = this.sy(46);
        if (open) {
          ctx.fillStyle = this.mix('#b39a6d', '#4a4132', d);
          ctx.fillRect(x - 34 * s, yT - 4, 68 * s, yB - yT + 10);
          ctx.fillStyle = this.mix('#8d7852', '#383124', d);
          ctx.fillRect(x - 34 * s, yT - 4, 68 * s, 4);
        } else {
          ctx.fillStyle = this.mix('#b39a6d', '#4a4132', d);
          ctx.save();
          ctx.translate(x - 40 * s, y);
          ctx.rotate(-0.5);
          ctx.fillRect(0, -8 * s, 74 * s, 8 * s);
          ctx.restore();
        }
      }
      if (g.kind === 'gateway' && !open) {
        // ハウスのあいだが資材で塞がっている
        ctx.fillStyle = this.mix('#8d8878', '#3a3830', d);
        for (let i = 0; i < 3; i++) ctx.fillRect(x - 30 * s, y - (i + 1) * 17 * s, 60 * s, 15 * s);
        ctx.fillStyle = this.mix('rgba(60,55,45,0.5)', 'rgba(20,20,16,0.5)', d);
        ctx.fillRect(x - 30 * s, y - 2 * s, 60 * s, 3 * s);
      }
      if (g.kind === 'fence') {
        // 柵。一枚外れて人ひとり分の隙間ができる
        ctx.fillStyle = this.mix('#9a8f76', '#3c3830', d);
        for (let i = -3; i <= 3; i++) {
          if (open && i === 0) continue;
          ctx.fillRect(x + i * 15 * s - 2 * s, y - 40 * s, 4 * s, 40 * s);
        }
        ctx.fillRect(x - 48 * s, y - 34 * s, 96 * s, 3.5 * s);
        if (open) {
          ctx.save();
          ctx.translate(x + 26 * s, y);
          ctx.rotate(0.9);
          ctx.fillRect(0, -4 * s, 40 * s, 4 * s);
          ctx.restore();
        }
      }
    }
  }

  // 遮蔽の陰。どこが安全かは文字で説明せず、地面の帯で見せる
  drawCovers() {
    const { ctx } = this;
    const active = this.sightActive;
    for (const c of this.c.COVERS) {
      const x0 = this.sx(c.x - c.w / 2, c.y);
      const x1 = this.sx(c.x + c.w / 2, c.y);
      if (x1 < -60 || x0 > this.W + 60) continue;
      const reach = c.reach || 130;
      const yTop = this.sy(c.y + 6);
      const yBot = this.sy(c.y + reach);
      const here = active && this.coverId === c.id;
      ctx.save();
      const grd = ctx.createLinearGradient(0, yTop, 0, yBot);
      // 陰にいるかどうかは、この CASE の生死そのもの。文字で出さない分、濃さで断言する
      const a = active ? (here ? 0.66 : 0.34) : 0.16;
      grd.addColorStop(0, `rgba(14,18,26,${a})`);
      grd.addColorStop(0.75, `rgba(14,18,26,${a * (here ? 0.8 : 0.45)})`);
      grd.addColorStop(1, 'rgba(14,18,26,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(x0, yTop);
      ctx.lineTo(x1, yTop);
      ctx.lineTo(this.sx(c.x + c.w / 2 + 26, c.y + reach), yBot);
      ctx.lineTo(this.sx(c.x - c.w / 2 - 26, c.y + reach), yBot);
      ctx.closePath();
      ctx.fill();
      if (here) {
        const pulse = 0.5 + Math.sin(this.tSec() * 3.1) * 0.5;
        ctx.strokeStyle = `rgba(150,220,255,${0.34 + pulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([9, 7]);
        ctx.lineDashOffset = -this.tSec() * 26;
        ctx.stroke();
      }
      ctx.restore();
      this.drawCoverObject(c);
    }
  }

  drawCoverObject(c) {
    const { ctx } = this;
    const d = this.dusk;
    const x = this.sx(c.x, c.y), y = this.sy(c.y), s = this.scaleAt(c.y);
    if (c.kind === 'hasa') {
      // 稲架。横木に稲を掛けたもの
      ctx.fillStyle = this.mix('#6d5c3f', '#2b261c', d);
      ctx.fillRect(x - 46 * s, y - 52 * s, 4 * s, 52 * s);
      ctx.fillRect(x + 42 * s, y - 52 * s, 4 * s, 52 * s);
      ctx.fillRect(x - 48 * s, y - 50 * s, 96 * s, 4 * s);
      ctx.fillStyle = this.mix('#cbb96a', '#5f5738', d);
      for (let i = 0; i < 9; i++) {
        ctx.fillRect(x - 44 * s + i * 10 * s, y - 48 * s, 7 * s, 30 * s);
      }
    } else if (c.kind === 'truck') {
      ctx.fillStyle = this.mix('#c8d0d2', '#4c5153', d);
      ctx.fillRect(x - 44 * s, y - 34 * s, 52 * s, 22 * s);
      ctx.fillRect(x + 4 * s, y - 46 * s, 34 * s, 34 * s);
      ctx.fillStyle = this.mix('#8fa3ae', '#39424a', d);
      ctx.fillRect(x + 9 * s, y - 42 * s, 24 * s, 15 * s);
      ctx.fillStyle = '#1c1c1e';
      ctx.beginPath(); ctx.arc(x - 28 * s, y - 10 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 26 * s, y - 10 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
    } else if (c.kind === 'wall') {
      ctx.fillStyle = this.mix('#a49b86', '#413d34', d);
      ctx.fillRect(x - c.w * 0.5 * 0.62, y - 44 * s, c.w * 0.62, 44 * s);
      ctx.fillStyle = this.mix('#6b6250', '#2a271f', d);
      ctx.fillRect(x - c.w * 0.5 * 0.62, y - 48 * s, c.w * 0.62, 5 * s);
    } else if (c.kind === 'jizo') {
      ctx.fillStyle = this.mix('#9e9c94', '#3f3f3b', d);
      ctx.beginPath();
      ctx.roundRect(x - 9 * s, y - 34 * s, 18 * s, 34 * s, 8 * s);
      ctx.fill();
      ctx.fillStyle = '#c0504a';
      ctx.fillRect(x - 10 * s, y - 20 * s, 20 * s, 9 * s);
    } else if (c.kind === 'bank') {
      // 用水路の土手。道より一段高い土の壁
      const x0 = this.sx(c.x - c.w / 2, c.y), x1 = this.sx(c.x + c.w / 2, c.y);
      ctx.fillStyle = this.mix('#8d8264', '#3a3629', d);
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + 14, y - 30 * s);
      ctx.lineTo(x1 - 14, y - 30 * s);
      ctx.lineTo(x1, y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = this.mix('#7f8c50', '#333a26', d);
      ctx.fillRect(x0 + 12, y - 33 * s, x1 - x0 - 24, 4 * s);
    }
    // shelter / greenhouse は drawFieldProps 側で本体を描く
  }

  drawFieldForeground() {
    const { ctx, W, H } = this;
    const d = this.dusk;
    const y = Math.min(this.sy(206), H - 90);
    // 手前の稲。画面下を稲穂で埋めて奥行きを作る（3層のうちの前景・SPEC §46）
    ctx.fillStyle = this.mix('#5f6c3a', '#262b1f', d);
    ctx.fillRect(0, y + 34, W, H - y);
    ctx.strokeStyle = this.mix('#8d9b4e', '#333a26', d);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 140; i++) {
      const x = this.layerX(i * 62 - 400, 1.3);
      if (x < -20 || x > W + 20) continue;
      const sway = Math.sin(this.tSec() * 1.3 + i) * 5;
      const h = 46 + (i * 37) % 26;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.quadraticCurveTo(x + sway, y + 40, x + sway * 2, y + 52 - h);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  // ---------------------------------------------------------------- くねくね

  drawKunekune(k, understanding) {
    if (k.fade <= 0.02) return;
    const { ctx } = this;
    const x = this.sx(k.x, k.y);
    const y = this.sy(k.y);
    // 田の向こうに立っているので常に小さい。近づくのは x ではなく理解度
    const far = Math.max(0.55, 1 - Math.abs(k.x - this.camX) / 1400);
    const s = this.scaleAt(k.y) * far;
    const H = 96 * s;
    const joints = k.joints(understanding);

    ctx.save();
    ctx.globalAlpha = k.fade;

    // 白い、細い、関節の無い体
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 1; i < joints.length; i++) {
        const j = joints[i];
        const py = y - H * j.u;
        const prev = joints[i - 1];
        const pyPrev = y - H * prev.u;
        ctx.quadraticCurveTo(
          x + prev.dx * s, (py + pyPrev) / 2,
          x + j.dx * s, py
        );
      }
      if (pass === 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.30)';
        ctx.lineWidth = 13 * s;
      } else {
        ctx.strokeStyle = '#f7f6f1';
        ctx.lineWidth = 6.5 * s;
      }
      ctx.stroke();
    }
    // 先端。顔は無い
    const tip = joints[joints.length - 1];
    ctx.fillStyle = '#fbfaf6';
    ctx.beginPath();
    ctx.ellipse(x + tip.dx * s, y - H, 5.5 * s, 8 * s, tip.dx * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 双眼鏡。覗いた瞬間だけ視界が絞られる。距離が消えるのが怖い
  drawBinoculars(a) {
    const { ctx, W, H } = this;
    const cx = W / 2, cy = H * 0.44;
    const r = Math.min(W, H) * 0.24 * (0.86 + a * 0.14);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(cx - r * 0.62, cy, r, 0, Math.PI * 2, true);
    ctx.arc(cx + r * 0.62, cy, r, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(6,8,10,0.94)';
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(cx - r * 0.62, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + r * 0.62, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // 理解度は文字で出さない。画面の歪みで伝える
  drawUnderstanding(u) {
    if (u <= 0.01) return;
    const { ctx, W, H } = this;
    ctx.save();
    // 縁がにじむ
    const g = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.16, W / 2, H * 0.5, H * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(232,236,246,${0.5 * u * u})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // 画面自体がくねる
    ctx.globalAlpha = 0.16 * u;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 7; i++) {
      const yy = (i / 6) * H;
      ctx.beginPath();
      for (let xx = 0; xx <= W; xx += 14) {
        const w = Math.sin(xx * 0.02 + this.tSec() * 2.4 + i) * 9 * u;
        xx ? ctx.lineTo(xx, yy + w) : ctx.moveTo(xx, yy + w);
      }
      ctx.stroke();
    }
    ctx.restore();
    // 画面上端の細い帯だけは残す。回復できることが分からないと理不尽になる
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(0, 0, W, 3);
    ctx.fillStyle = u > 0.7 ? `rgba(255,236,236,${0.5 + 0.45 * u})` : `rgba(250,250,255,${0.3 + 0.4 * u})`;
    ctx.fillRect(0, 0, W * u, 3);
    ctx.restore();
  }
}
