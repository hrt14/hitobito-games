// CASE 04 の描画：閉店後のアーケード商店街。
// 01 の夜は空があった。ここは**天井がある夜**。4本目にしてやっと屋内寄りになる。
import { Renderer } from './render.js';

export class ArcadeRenderer extends Renderer {
  constructor(canvas, caseData) {
    super(canvas, caseData);
    this.dusk = 0;      // 0=まだ明るい 1=蛍光灯が死んでいる
    this.lying = false; // 線が嘘をついている（絵は変えない。デバッグ用）
  }

  resize() {
    super.resize();
    const h = this.canvas.clientHeight || window.innerHeight;
    this.groundTop = h * 0.56;
    this.groundBottom = h * 0.94;
  }

  drawWorldBack(g) {
    this.drawNightSky();
    this.drawFarKoban();
    this.drawAlleys();
    this.drawShops();
    this.drawStreet();
    this.drawArcadeGates(g.state);
    this.drawArcadeProps();
    this.drawArcade();
  }

  drawWorldFront() { this.drawArcadeForeground(); }

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

  // アーケードの下にいるか。ここでは空が見えない
  underRoof(x) {
    const a = this.c.PROPS.find(p => p.kind === 'arcade');
    return a && x > a.x && x < a.x + a.w;
  }

  // ---------------------------------------------------------------- 空

  drawNightSky() {
    const { ctx, W, H } = this;
    const g = ctx.createLinearGradient(0, 0, 0, this.groundTop + 40);
    g.addColorStop(0, '#080a12');
    g.addColorStop(0.5, '#101423');
    g.addColorStop(1, '#1b2030');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    for (const s of this.stars) {
      ctx.globalAlpha = s.a * 0.7;
      ctx.fillStyle = '#c8d2f0';
      ctx.fillRect(s.x * W, s.y * H * 0.6, s.r, s.r);
    }
    ctx.restore();
  }

  // 交番の赤い灯り。線が嘘をついても、これだけは動かない。
  // 「何を信じるか」の答えを絵として常に置いておく（SPEC §33 §47）
  drawFarKoban() {
    const { ctx, W } = this;
    const S = this.c.SAFE_ZONE;
    if (this.camX > S.x - 900) return;   // 近づいたら本物に任せる
    // 通りの消失点あたりに置く。遠いほど右端へ寄る
    const far = Math.max(0, Math.min(1, (S.x - this.camX) / this.c.WORLD.length));
    const x = W * (0.62 + far * 0.3);
    const y = this.sy(-8) - 108;
    const blink = 0.55 + Math.sin(this.tSec() * 2.2) * 0.45;
    const sz = 4 + (1 - far) * 5;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 1, x, y, 46 + (1 - far) * 40);
    g.addColorStop(0, `rgba(240,74,60,${0.42 * blink})`);
    g.addColorStop(1, 'rgba(240,74,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 46 + (1 - far) * 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,132,110,${0.6 + blink * 0.4})`;
    ctx.beginPath(); ctx.arc(x, y, sz, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- 路地

  // 路地は「入れる場所」に見えないといけない。店の列を切って穴を開ける
  drawAlleys() {
    const { ctx } = this;
    for (const a of this.c.ALLEYS) {
      const half = a.w / 2;
      const xNear0 = this.sx(a.x - half, 0), xNear1 = this.sx(a.x + half, 0);
      if (xNear1 < -80 || xNear0 > this.W + 80) continue;
      const xFar0 = this.sx(a.x - half * 0.62, a.deep);
      const xFar1 = this.sx(a.x + half * 0.62, a.deep);
      const yNear = this.sy(4), yFar = this.sy(a.deep);
      // 壁は店の屋根の高さで止める。伸ばすと空に黒い箱が浮く
      const roof = this.sy(-8) - 150;
      const topFar = Math.max(yFar - 78, roof);

      // 奥ほど暗い床
      const g = ctx.createLinearGradient(0, yFar, 0, yNear);
      g.addColorStop(0, '#05070b');
      g.addColorStop(1, '#171c26');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(xFar0, yFar); ctx.lineTo(xFar1, yFar);
      ctx.lineTo(xNear1, yNear); ctx.lineTo(xNear0, yNear);
      ctx.closePath(); ctx.fill();

      // 両側の壁
      ctx.fillStyle = '#0d1017';
      ctx.beginPath();
      ctx.moveTo(xNear0, yNear); ctx.lineTo(xFar0, yFar);
      ctx.lineTo(xFar0, topFar); ctx.lineTo(xNear0, roof);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(xNear1, yNear); ctx.lineTo(xFar1, yFar);
      ctx.lineTo(xFar1, topFar); ctx.lineTo(xNear1, roof);
      ctx.closePath(); ctx.fill();

      // 奥の壁。ここが行き止まり
      ctx.fillStyle = '#080a10';
      ctx.fillRect(xFar0, topFar, xFar1 - xFar0, yFar - topFar);
      // 一本だけ光が漏れている。入りたくなる明るさにしておく
      ctx.save();
      ctx.globalAlpha = 0.5;
      const lg = ctx.createRadialGradient((xFar0 + xFar1) / 2, yFar - 30, 3, (xFar0 + xFar1) / 2, yFar - 30, 90);
      lg.addColorStop(0, 'rgba(210,180,120,0.35)');
      lg.addColorStop(1, 'rgba(210,180,120,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc((xFar0 + xFar1) / 2, yFar - 30, 90, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- 店

  drawShops() {
    const { ctx } = this;
    const d = this.dusk;
    const baseY = this.sy(-8);
    for (const s of this.c.SCENERY.shops) {
      // 路地の口には店を建てない
      if (this.c.ALLEYS.some(a => Math.abs(s.x + s.w / 2 - a.x) < a.w / 2 + 30)) continue;
      const x0 = this.sx(s.x, -8), x1 = this.sx(s.x + s.w, -8);
      if (x1 < -160 || x0 > this.W + 160) continue;
      const h = 150;
      const t = s.tone;
      ctx.fillStyle = `rgb(${Math.round(26 * t)},${Math.round(29 * t)},${Math.round(38 * t)})`;
      ctx.fillRect(x0, baseY - h, x1 - x0, h);

      if (s.kind === 'shutter') {
        ctx.fillStyle = this.mix('#2b3140', '#1a1f28', d);
        ctx.fillRect(x0 + 6, baseY - 78, x1 - x0 - 12, 78);
        ctx.strokeStyle = 'rgba(150,165,190,0.10)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 9; i++) {
          ctx.beginPath();
          ctx.moveTo(x0 + 6, baseY - 76 + i * 9); ctx.lineTo(x1 - 6, baseY - 76 + i * 9);
          ctx.stroke();
        }
      } else if (s.kind === 'glass') {
        ctx.fillStyle = 'rgba(120,150,180,0.10)';
        ctx.fillRect(x0 + 8, baseY - 74, x1 - x0 - 16, 74);
        ctx.strokeStyle = 'rgba(160,185,215,0.18)';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(x0 + 8, baseY - 74, x1 - x0 - 16, 74);
      } else {
        // 日よけ
        ctx.fillStyle = this.mix('#5a3038', '#2e1a20', d);
        ctx.beginPath();
        ctx.moveTo(x0 + 2, baseY - 82); ctx.lineTo(x1 - 2, baseY - 82);
        ctx.lineTo(x1 - 12, baseY - 60); ctx.lineTo(x0 + 12, baseY - 60);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#171b24';
        ctx.fillRect(x0 + 10, baseY - 60, x1 - x0 - 20, 60);
      }

      // 袖看板。商店街の密度はこれで出る
      if (s.sign) {
        const sx = x1 - 6;
        ctx.fillStyle = this.mix('#3a4152', '#20242e', d);
        ctx.fillRect(sx, baseY - 132, 12, 46);
        ctx.fillStyle = `rgba(226,206,150,${0.10 + (1 - d) * 0.12})`;
        ctx.fillRect(sx + 2, baseY - 129, 8, 40);
      }
    }
    // 店の上の暗い帯。天井までを埋める
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, baseY - 190, this.W, 42);
  }

  // ---------------------------------------------------------------- 通り

  drawStreet() {
    const { ctx, W } = this;
    const d = this.dusk;
    const top = this.sy(0), bot = this.sy(214);
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, this.mix('#262b36', '#181c24', d));
    g.addColorStop(1, this.mix('#1d222c', '#12151b', d));
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, bot - top);

    // タイル。商店街の床は舗装がタイル
    ctx.strokeStyle = this.mix('rgba(150,165,190,0.09)', 'rgba(90,100,120,0.07)', d);
    ctx.lineWidth = 1;
    for (const wy of [30, 78, 126, 174]) {
      ctx.beginPath(); ctx.moveTo(0, this.sy(wy)); ctx.lineTo(W, this.sy(wy)); ctx.stroke();
    }
    for (let i = -2; i < 60; i++) {
      const wx = i * 120;
      const x0 = this.sx(wx, 0), x1 = this.sx(wx, 214);
      if (Math.max(x0, x1) < -40 || Math.min(x0, x1) > W + 40) continue;
      ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x1, bot); ctx.stroke();
    }

    for (const c of this.c.SCENERY.clutter) {
      const x = this.sx(c.x, 16);
      if (x < -30 || x > W + 30) continue;
      const y = this.sy(16);
      if (c.kind === 'bin') {
        ctx.fillStyle = '#242a35';
        ctx.fillRect(x - 9, y - 20, 18, 20);
        ctx.fillStyle = '#323a48';
        ctx.fillRect(x - 11, y - 23, 22, 4);
      } else if (c.kind === 'crate') {
        ctx.fillStyle = '#33302a';
        ctx.fillRect(x - 12, y - 14, 24, 14);
        ctx.strokeStyle = 'rgba(180,170,150,0.14)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 12, y - 14, 24, 14);
      } else {
        ctx.strokeStyle = 'rgba(150,170,200,0.24)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x - 8, y - 6, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 8, y - 6, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 6); ctx.lineTo(x - 1, y - 15); ctx.lineTo(x + 8, y - 6);
        ctx.stroke();
      }
    }
  }

  // 天井。空を消すのがこのCASEの絵の要
  drawArcade() {
    const { ctx, W } = this;
    const d = this.dusk;
    const a = this.c.PROPS.find(p => p.kind === 'arcade');
    if (!a) return;
    const x0 = Math.max(-40, this.sx(a.x, 0));
    const x1 = Math.min(W + 40, this.sx(a.x + a.w, 0));
    if (x1 < 0 || x0 > W) return;
    const topY = this.sy(-8) - 190;

    // 天井から上は空ではない。アーケードの中では星を消す。
    // 「空が無い夜」がこのCASEの絵の要（CASE04_SLICE §0）
    ctx.fillStyle = '#06080d';
    ctx.fillRect(x0, 0, x1 - x0, topY + 4);

    // アーチの梁
    ctx.fillStyle = '#0b0e15';
    ctx.fillRect(x0, topY - 46, x1 - x0, 50);
    // 梁のあいだに見えるトタン
    ctx.fillStyle = '#0e1219';
    ctx.fillRect(x0, topY - 96, x1 - x0, 50);
    ctx.strokeStyle = 'rgba(130,148,175,0.07)';
    ctx.lineWidth = 1;
    for (let i = -2; i < 60; i++) {
      const bx = this.sx(a.x + i * 74, 0);
      if (bx < x0 || bx > x1) continue;
      ctx.beginPath(); ctx.moveTo(bx, topY - 96); ctx.lineTo(bx, topY - 46); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(140,158,185,0.10)';
    ctx.lineWidth = 1.4;
    for (let i = -2; i < 46; i++) {
      const bx = this.sx(a.x + i * 150, 0);
      if (bx < x0 - 20 || bx > x1 + 20) continue;
      ctx.beginPath();
      ctx.moveTo(bx, topY - 46); ctx.lineTo(bx, topY + 4);
      ctx.stroke();
    }
    ctx.fillStyle = '#080b11';
    ctx.fillRect(x0, topY + 2, x1 - x0, 6);

    // 蛍光灯。切れているものは光らない
    for (const l of this.c.SCENERY.lights) {
      const lx = this.sx(l.x, 0);
      if (lx < x0 - 30 || lx > x1 + 30) continue;
      const dead = l.dead && d > 0.45;
      const flick = dead ? 0 : (Math.sin(this.tSec() * 30 + l.x) > 0.93 ? 0.35 : 1);
      ctx.fillStyle = dead ? '#1b1f28' : `rgba(226,240,226,${0.6 * flick})`;
      ctx.fillRect(lx - 26, topY - 6, 52, 5);
      if (!dead) {
        ctx.save();
        ctx.globalAlpha = 0.5 * flick;
        const g = ctx.createLinearGradient(lx, topY, lx, this.sy(120));
        g.addColorStop(0, 'rgba(214,236,214,0.16)');
        g.addColorStop(1, 'rgba(214,236,214,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(lx - 30, topY); ctx.lineTo(lx + 30, topY);
        ctx.lineTo(lx + 92, this.sy(140)); ctx.lineTo(lx - 92, this.sy(140));
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
  }

  drawArcadeProps() {
    const { ctx } = this;
    const d = this.dusk;
    for (const p of this.c.PROPS) {
      if (p.kind === 'arcade') continue;
      const x = this.sx(p.x, p.y);
      if (x < -300 || x > this.W + 300) continue;
      const y = this.sy(p.y), s = this.scaleAt(p.y);

      if (p.kind === 'vending') {
        // 自販機。商店街で一番明るいもの
        ctx.fillStyle = '#1d2530';
        ctx.fillRect(x - 30 * s, y - 92 * s, 60 * s, 92 * s);
        ctx.fillStyle = '#d8412f';
        ctx.fillRect(x - 26 * s, y - 88 * s, 52 * s, 40 * s);
        ctx.fillStyle = 'rgba(255,246,214,0.85)';
        ctx.fillRect(x - 24 * s, y - 46 * s, 48 * s, 22 * s);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 ? '#2f6ea8' : '#c9a24a';
          ctx.fillRect(x - 22 * s + i * 12 * s, y - 84 * s, 8 * s, 30 * s);
        }
        ctx.save();
        ctx.globalAlpha = 0.55;
        const g = ctx.createRadialGradient(x, y - 46 * s, 6, x, y - 30 * s, 190);
        g.addColorStop(0, 'rgba(255,238,190,0.45)');
        g.addColorStop(1, 'rgba(255,238,190,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x, y + 10, 190, 78, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      if (p.kind === 'koban') {
        // 交番。生還地点。赤い灯りは遠景にも出す（SPEC §33 §47）
        ctx.fillStyle = this.mix('#3b4250', '#2b3140', d);
        ctx.fillRect(x - 66 * s, y - 118 * s, 132 * s, 118 * s);
        ctx.fillStyle = '#232935';
        ctx.fillRect(x - 74 * s, y - 128 * s, 148 * s, 12 * s);
        // 窓の白い光
        ctx.fillStyle = 'rgba(238,246,255,0.82)';
        ctx.fillRect(x - 50 * s, y - 100 * s, 44 * s, 40 * s);
        ctx.fillRect(x + 8 * s, y - 100 * s, 44 * s, 40 * s);
        ctx.fillStyle = '#141922';
        ctx.fillRect(x - 20 * s, y - 56 * s, 40 * s, 56 * s);
        // 赤色灯
        const blink = 0.55 + Math.sin(this.tSec() * 2.2) * 0.45;
        ctx.fillStyle = `rgba(226,58,48,${0.65 + blink * 0.35})`;
        ctx.beginPath(); ctx.arc(x, y - 140 * s, 11 * s, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.globalAlpha = 0.6;
        const g = ctx.createRadialGradient(x, y - 140 * s, 4, x, y - 140 * s, 120);
        g.addColorStop(0, `rgba(240,70,58,${0.5 * blink})`);
        g.addColorStop(1, 'rgba(240,70,58,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y - 140 * s, 120, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // 足元の光だまり
        ctx.save();
        ctx.globalAlpha = 0.5;
        const fg = ctx.createRadialGradient(x, y, 8, x, y, 180);
        fg.addColorStop(0, 'rgba(236,244,255,0.32)');
        fg.addColorStop(1, 'rgba(236,244,255,0)');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.ellipse(x, y + 20, 180, 74, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  }

  // 開放は文字で伝えない。世界が変わる（SPEC §20）
  drawArcadeGates(state) {
    const { ctx } = this;
    const d = this.dusk;
    for (const g of this.c.GATES) {
      const open = state.isUnlocked(g.opens);
      const x = this.sx(g.x, 60), y = this.sy(60), s = this.scaleAt(60);
      if (x < -200 || x > this.W + 200) continue;

      if (g.kind === 'arcade') {
        // アーケードの入口ゲート。開放されると看板に灯がともる
        ctx.fillStyle = '#171c26';
        ctx.fillRect(x - 84 * s, y - 176 * s, 10 * s, 176 * s);
        ctx.fillRect(x + 74 * s, y - 176 * s, 10 * s, 176 * s);
        ctx.fillRect(x - 90 * s, y - 190 * s, 180 * s, 20 * s);
        ctx.fillStyle = open ? 'rgba(240,214,140,0.85)' : 'rgba(70,74,86,0.7)';
        ctx.fillRect(x - 74 * s, y - 186 * s, 148 * s, 12 * s);
      }
      if (g.kind === 'cart' && !open) {
        ctx.fillStyle = '#2c3140';
        ctx.fillRect(x - 40 * s, y - 44 * s, 80 * s, 34 * s);
        ctx.fillStyle = '#1a1e28';
        ctx.beginPath(); ctx.arc(x - 26 * s, y - 6 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 26 * s, y - 6 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
      }
      if (g.kind === 'shutter') {
        ctx.fillStyle = this.mix('#2b3140', '#1a1f28', d);
        const h = open ? 34 : 128;
        ctx.fillRect(x - 62 * s, y - 128 * s, 124 * s, h * s);
        ctx.strokeStyle = 'rgba(150,165,190,0.12)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < h / 11; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 62 * s, y - 128 * s + i * 11 * s);
          ctx.lineTo(x + 62 * s, y - 128 * s + i * 11 * s);
          ctx.stroke();
        }
      }
      if (g.kind === 'cones') {
        for (let i = -1; i <= 1; i++) {
          if (open && i === 0) continue;
          const cx = x + i * 34 * s + (open ? i * 26 * s : 0);
          ctx.fillStyle = '#c9642f';
          ctx.beginPath();
          ctx.moveTo(cx, y - 30 * s); ctx.lineTo(cx + 11 * s, y); ctx.lineTo(cx - 11 * s, y);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#e8e4d8';
          ctx.fillRect(cx - 7 * s, y - 18 * s, 14 * s, 4 * s);
        }
      }
    }
  }

  drawArcadeForeground() {
    const { ctx, W, H } = this;
    const y = this.sy(216);
    // 手前を横切る店先の庇と自転車。奥行きを作る（SPEC §46）
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, y + 26, W, H - y);
    for (let i = -1; i < 22; i++) {
      const x = this.layerX(i * 620 + 80, 1.26);
      if (x < -160 || x > W + 160) continue;
      ctx.fillStyle = '#04060a';
      ctx.fillRect(x - 13, y - 90, 26, H - y + 120);
    }
    const g = ctx.createLinearGradient(0, H * 0.82, 0, H);
    g.addColorStop(0, 'rgba(4,5,9,0)');
    g.addColorStop(1, 'rgba(4,5,9,0.8)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.82, W, H * 0.18);
  }

  // ---------------------------------------------------------------- 人面犬

  // 体は影で済ませ、顔だけ描き込む。姿勢が低いので光を下から受ける
  drawNinmenken(k) {
    if (k.fade <= 0.02) return;
    const { ctx } = this;
    const x = this.sx(k.x, k.y), y = this.sy(k.y);
    const s = this.scaleAt(k.y) * 1.12;
    const f = k.facing;
    const step = k.mode === 'walk' ? Math.sin(k.t * 7) : 0;

    ctx.save();
    ctx.globalAlpha = k.fade;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(x, y, 24 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();

    ctx.translate(x, y);
    ctx.scale(f, 1);

    const ink = 'rgba(4,6,10,0.95)';
    const fur = '#2a2721';

    // 脚。4本。歩幅を小さく
    ctx.strokeStyle = fur;
    ctx.lineWidth = 4.4 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-15 * s, -24 * s); ctx.lineTo(-15 * s + step * 5 * s, -2 * s);
    ctx.moveTo(-8 * s, -24 * s);  ctx.lineTo(-8 * s - step * 5 * s, -2 * s);
    ctx.moveTo(13 * s, -24 * s);  ctx.lineTo(13 * s - step * 5 * s, -2 * s);
    ctx.moveTo(20 * s, -24 * s);  ctx.lineTo(20 * s + step * 5 * s, -2 * s);
    ctx.stroke();

    // 胴。犬の形。塗りは暗く、輪郭だけ拾う
    ctx.beginPath();
    ctx.moveTo(-20 * s, -26 * s);
    ctx.quadraticCurveTo(0, -42 * s, 22 * s, -30 * s);
    ctx.quadraticCurveTo(28 * s, -22 * s, 20 * s, -20 * s);
    ctx.lineTo(-18 * s, -18 * s);
    ctx.closePath();
    ctx.fillStyle = fur; ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5 * s; ctx.stroke();
    // 尾
    ctx.strokeStyle = fur; ctx.lineWidth = 3.4 * s;
    ctx.beginPath();
    ctx.moveTo(-19 * s, -28 * s);
    ctx.quadraticCurveTo(-32 * s, -34 * s, -30 * s, -46 * s);
    ctx.stroke();

    // 首。短く太く。長いと首長竜になる
    ctx.strokeStyle = fur; ctx.lineWidth = 9 * s;
    ctx.beginPath();
    ctx.moveTo(19 * s, -30 * s); ctx.lineTo(24 * s, -40 * s);
    ctx.stroke();

    // 顔。ここだけ描き込む。犬の上に人の頭が載っているのが一目で分かること
    const hx = 26 * s, hy = -50 * s, hr = 10.5 * s;
    // 襟足の影。顔を背景から浮かせる
    ctx.fillStyle = '#0d0b0a';
    ctx.beginPath(); ctx.arc(hx, hy, hr * 1.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fillStyle = '#cbb9a0'; ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5 * s; ctx.stroke();
    // 髪。犬に生えていてはいけないもの。輪郭からはみ出させて silhouette で見せる
    ctx.fillStyle = '#171310';
    ctx.beginPath();
    ctx.moveTo(hx - hr * 1.08, hy + 1 * s);
    ctx.quadraticCurveTo(hx - hr * 1.2, hy - hr * 1.5, hx + hr * 0.2, hy - hr * 1.42);
    ctx.quadraticCurveTo(hx + hr * 1.18, hy - hr * 1.3, hx + hr * 1.02, hy - hr * 0.1);
    ctx.lineTo(hx + hr * 0.72, hy - hr * 0.34);
    ctx.quadraticCurveTo(hx + hr * 0.2, hy - hr * 0.86, hx - hr * 0.62, hy - hr * 0.5);
    ctx.closePath(); ctx.fill();
    // 眉と目。人の顔だと分かるのは眉があるから
    ctx.strokeStyle = '#2b211c'; ctx.lineWidth = 1.3 * s;
    ctx.beginPath();
    ctx.moveTo(hx - 6.4 * s, hy - 3.4 * s); ctx.lineTo(hx - 1.6 * s, hy - 4.2 * s);
    ctx.moveTo(hx + 1.8 * s, hy - 4.6 * s); ctx.lineTo(hx + 6.6 * s, hy - 3.6 * s);
    ctx.stroke();
    ctx.fillStyle = '#14161c';
    ctx.beginPath(); ctx.ellipse(hx - 4 * s, hy - 0.4 * s, 1.7 * s, 2.1 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx + 4.2 * s, hy - 1.2 * s, 1.7 * s, 2.1 * s, 0, 0, Math.PI * 2); ctx.fill();
    // 鼻
    ctx.strokeStyle = '#8d7a66'; ctx.lineWidth = 1.1 * s;
    ctx.beginPath();
    ctx.moveTo(hx + 0.6 * s, hy - 0.4 * s); ctx.lineTo(hx + 1.4 * s, hy + 3 * s);
    ctx.stroke();
    // 口。喋っている間だけ動く
    const open = k.talkT > 0 ? 1.2 + Math.abs(Math.sin(k.t * 16)) * 2.2 : 0.5;
    ctx.fillStyle = '#241a17';
    ctx.beginPath();
    ctx.ellipse(hx + 0.8 * s, hy + 5.6 * s, 3.1 * s, open * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
