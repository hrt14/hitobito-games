// CASE 05 の描画：終電後の無人駅。
// 01の紺、02の金、03の灰、04の天井のある夜。ここは**蛍光灯の冷たい白と緑**。
// 空はほとんど無い。屋根と地下道で塞がっている。
import { Renderer } from './render.js';

export class StationRenderer extends Renderer {
  constructor(canvas, caseData) {
    super(canvas, caseData);
    this.decay = 0;       // 駅の壊れ具合 0..1。蛍光灯が落ちていく
    this.change = null;   // いま違っているもの
    this.noticed = 0;
    this.exitOpen = false;
    this.trainT = 0;
  }

  resize() {
    super.resize();
    const h = this.canvas.clientHeight || window.innerHeight;
    this.groundTop = h * 0.54;
    this.groundBottom = h * 0.93;
  }

  drawWorldBack(g) {
    this.trainT = g.dir.trainT || 0;
    this.drawStationBack();
    this.drawStationGates(g.state);
    this.drawStationProps();
    this.drawRoof();
  }

  // タイトル背景と本編で共有する土台
  drawStationBack() {
    this.drawNightGap();
    this.drawTracks();
    this.drawPlatform();
    this.drawPillars();
    this.drawTunnel();
  }

  // 地下道。ホームの絵の上から塗りつぶす。
  // ここには線路も空も無い。**縫い目を隠すのはこの一番暗い場所**（CASE05_SLICE §3）
  drawTunnel() {
    const { ctx, W, H } = this;
    const tun = this.c.PROPS.find(p => p.kind === 'tunnel');
    if (!tun) return;
    const x0 = this.sx(tun.x, 0), x1 = this.sx(tun.x + tun.w, 0);
    if (x1 < -60 || x0 > W + 60) return;
    const L = Math.max(-60, x0), R = Math.min(W + 60, x1);

    // 奥の壁。タイル
    const wallBot = this.sy(60);
    ctx.fillStyle = '#141821';
    ctx.fillRect(L, 0, R - L, wallBot);
    ctx.fillStyle = '#1b212c';
    ctx.fillRect(L, wallBot - 150, R - L, 150);
    ctx.strokeStyle = 'rgba(140,160,190,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const ty = wallBot - 150 + i * 19;
      ctx.beginPath(); ctx.moveTo(L, ty); ctx.lineTo(R, ty); ctx.stroke();
    }
    for (let i = -2; i < 60; i++) {
      const tx = this.sx(tun.x + i * 46, 0);
      if (tx < L || tx > R) continue;
      ctx.beginPath(); ctx.moveTo(tx, wallBot - 150); ctx.lineTo(tx, wallBot); ctx.stroke();
    }
    // 幅木
    ctx.fillStyle = '#0f131a';
    ctx.fillRect(L, wallBot - 14, R - L, 16);

    // 床
    const fg = ctx.createLinearGradient(0, wallBot, 0, this.sy(212));
    fg.addColorStop(0, '#1d222b');
    fg.addColorStop(1, '#12161d');
    ctx.fillStyle = fg;
    ctx.fillRect(L, wallBot, R - L, this.sy(212) - wallBot);

    // 天井と配管
    ctx.fillStyle = '#0a0d13';
    ctx.fillRect(L, 0, R - L, wallBot - 150);
    ctx.fillStyle = '#171d26';
    ctx.fillRect(L, wallBot - 162, R - L, 12);
    ctx.fillStyle = '#232b36';
    ctx.fillRect(L, wallBot - 190, R - L, 7);

    // 天井灯。地下道は蛍光灯が裸で並ぶ
    for (const l of this.c.SCENERY.lights) {
      if (l.x < tun.x - 60 || l.x > tun.x + tun.w + 60) continue;
      const x = this.sx(l.x, 0);
      if (x < L - 40 || x > R + 40) continue;
      const on = this.lit(l);
      ctx.fillStyle = on ? 'rgba(228,244,232,0.8)' : '#171c25';
      ctx.fillRect(x - 22, wallBot - 176, 44, 4);
    }
    // 手前の縁を締める
    ctx.fillStyle = 'rgba(4,6,10,0.45)';
    ctx.fillRect(L, this.sy(200), R - L, H - this.sy(200));
  }

  drawWorldFront() { this.drawStationForeground(); }

  tSec() { return performance.now() / 1000; }

  // 蛍光灯が生きているか。壊れるほど端から落ちる
  lit(l) { return l.order > this.decay * 0.9; }

  // ---------------------------------------------------------------- 線路の向こう

  // 空はここだけ。しかも町の灯りが無い（PHASE 2）
  drawNightGap() {
    const { ctx, W } = this;
    const top = 0, bot = this.sy(-52);
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, '#04050a');
    g.addColorStop(1, '#0a0d14');
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, bot - top);
    // 向かいのホームの上屋。奥行きを止める壁になる
    ctx.fillStyle = '#0d1017';
    ctx.fillRect(0, bot - 58, W, 60);
    ctx.fillStyle = '#12161f';
    ctx.fillRect(0, bot - 62, W, 5);
    // 向かいの蛍光灯
    for (const l of this.c.SCENERY.lights) {
      const x = this.sx(l.x, -52);
      if (x < -40 || x > W + 40) continue;
      if (!this.lit(l)) continue;
      ctx.fillStyle = 'rgba(222,238,226,0.5)';
      ctx.fillRect(x - 20, bot - 50, 40, 3);
    }
  }

  drawTracks() {
    const { ctx, W } = this;
    const yTop = this.sy(-46), yBot = this.sy(-6);
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, yTop, W, yBot - yTop);
    // バラスト
    ctx.fillStyle = '#171a20';
    ctx.fillRect(0, yTop + 6, W, yBot - yTop - 10);
    // 枕木
    ctx.fillStyle = '#0e1014';
    for (let i = -2; i < 200; i++) {
      const x = this.sx(i * 34, -26);
      if (x < -20 || x > W + 20) continue;
      ctx.fillRect(x - 7, yTop + 10, 14, yBot - yTop - 18);
    }
    // レール
    ctx.fillStyle = '#5f666c';
    ctx.fillRect(0, yTop + 14, W, 3);
    ctx.fillRect(0, yBot - 14, W, 3);

    // 電車。PHASE 3 でだけ入ってきて、行ってしまう
    if (this.trainT > 0) {
      const k = Math.min(1, Math.max(0, (9 - this.trainT) / 1.6));
      const slide = (1 - k) * -1400 + (this.trainT < 2 ? (2 - this.trainT) * 900 : 0);
      ctx.save();
      ctx.translate(slide, 0);
      ctx.fillStyle = '#1c222c';
      ctx.fillRect(-200, yTop - 66, W + 500, 78);
      ctx.fillStyle = '#2a3240';
      ctx.fillRect(-200, yTop - 66, W + 500, 6);
      for (let i = 0; i < 14; i++) {
        const wx = -160 + i * 120;
        ctx.fillStyle = 'rgba(226,240,230,0.72)';
        ctx.fillRect(wx, yTop - 56, 84, 34);
      }
      ctx.fillStyle = '#0e1218';
      for (let i = 0; i < 5; i++) ctx.fillRect(-140 + i * 340, yTop - 62, 12, 70);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- ホーム

  drawPlatform() {
    const { ctx, W } = this;
    const edge = this.sy(-4), bot = this.sy(212);
    // ホーム面
    const g = ctx.createLinearGradient(0, edge, 0, bot);
    g.addColorStop(0, '#252a33');
    g.addColorStop(1, '#1a1e26');
    ctx.fillStyle = g;
    ctx.fillRect(0, edge, W, bot - edge);
    // 端の黄色い線。駅の記号
    ctx.fillStyle = `rgba(214,178,60,${0.5 - this.decay * 0.3})`;
    ctx.fillRect(0, edge + 8, W, 5);
    ctx.fillStyle = 'rgba(226,232,240,0.10)';
    ctx.fillRect(0, edge, W, 3);
    // 点字ブロック
    ctx.fillStyle = `rgba(200,168,58,${0.22 - this.decay * 0.14})`;
    for (let i = -2; i < 160; i++) {
      const x = this.sx(i * 30, 20);
      if (x < -20 || x > W + 20) continue;
      ctx.fillRect(x - 10, this.sy(20), 20, 7);
    }
    // 床の目地
    ctx.strokeStyle = 'rgba(150,165,190,0.06)';
    ctx.lineWidth = 1;
    for (const wy of [70, 130, 180]) {
      ctx.beginPath(); ctx.moveTo(0, this.sy(wy)); ctx.lineTo(W, this.sy(wy)); ctx.stroke();
    }
    // 奥の壁（ホーム裏）
    ctx.fillStyle = '#141821';
    ctx.fillRect(0, this.sy(200), W, bot - this.sy(200) + 40);
  }

  drawPillars() {
    const { ctx } = this;
    const y = this.sy(40);
    for (const p of this.c.SCENERY.pillars) {
      const x = this.sx(p.x, 40);
      if (x < -40 || x > this.W + 40) continue;
      ctx.fillStyle = '#2b323d';
      ctx.fillRect(x - 9, y - 150, 18, 150);
      ctx.fillStyle = '#39424f';
      ctx.fillRect(x - 11, y - 154, 22, 6);
      ctx.fillStyle = 'rgba(10,12,16,0.5)';
      ctx.fillRect(x + 4, y - 150, 5, 150);
    }
  }

  // 屋根と蛍光灯。地下道の区間は屋根ではなく天井
  drawRoof() {
    const { ctx, W } = this;
    const roof = this.c.PROPS.find(p => p.kind === 'roof');
    const topY = this.sy(40) - 150;
    if (roof) {
      const x0 = Math.max(-40, this.sx(roof.x, 0));
      const x1 = Math.min(W + 40, this.sx(roof.x + roof.w, 0));
      if (x1 > 0 && x0 < W) {
        // 上屋の裏側。空にせず、波板と梁で埋める（SPEC §45 §46）
        ctx.fillStyle = '#0b0e14';
        ctx.fillRect(x0, 0, x1 - x0, topY + 8);
        ctx.fillStyle = '#101520';
        ctx.fillRect(x0, topY - 96, x1 - x0, 92);
        ctx.strokeStyle = 'rgba(130,150,180,0.06)';
        ctx.lineWidth = 1;
        for (let i = -2; i < 90; i++) {
          const bx = this.sx(i * 52, 0);
          if (bx < x0 || bx > x1) continue;
          ctx.beginPath(); ctx.moveTo(bx, topY - 96); ctx.lineTo(bx, topY - 4); ctx.stroke();
        }
        // 梁
        ctx.fillStyle = '#161b24';
        ctx.fillRect(x0, topY - 10, x1 - x0, 16);
        ctx.fillStyle = '#1b2230';
        ctx.fillRect(x0, topY - 100, x1 - x0, 8);
        for (const p of this.c.SCENERY.pillars) {
          const bx = this.sx(p.x, 40);
          if (bx < x0 - 30 || bx > x1 + 30) continue;
          ctx.fillStyle = '#1a212c';
          ctx.fillRect(bx - 7, topY - 96, 14, 96);
        }
        // 吊り下げの案内板。駅であることは文字でなく形で出す
        for (let i = -1; i < 24; i++) {
          const hx = this.sx(i * 620 + 180, 0);
          if (hx < x0 - 80 || hx > x1 + 80) continue;
          ctx.fillStyle = '#2b323d';
          ctx.fillRect(hx - 3, topY - 4, 6, 26);
          ctx.fillStyle = `rgba(46,78,120,${0.85 - this.decay * 0.5})`;
          ctx.fillRect(hx - 56, topY + 20, 112, 34);
          ctx.fillStyle = `rgba(226,240,250,${0.55 - this.decay * 0.4})`;
          ctx.fillRect(hx - 44, topY + 30, 34, 6);
          ctx.fillRect(hx - 4, topY + 30, 46, 6);
          ctx.fillRect(hx - 44, topY + 41, 62, 4);
        }
      }
    }
    // 地下道は全部天井
    const tun = this.c.PROPS.find(p => p.kind === 'tunnel');
    if (tun) {
      const x0 = Math.max(-40, this.sx(tun.x, 0));
      const x1 = Math.min(W + 40, this.sx(tun.x + tun.w, 0));
      if (x1 > 0 && x0 < W) {
        ctx.fillStyle = '#070910';
        ctx.fillRect(x0, 0, x1 - x0, this.sy(40) - 104);
        ctx.fillStyle = '#10141c';
        ctx.fillRect(x0, this.sy(40) - 108, x1 - x0, 10);
      }
    }

    // 蛍光灯。悪化すると端から落ちる
    for (const l of this.c.SCENERY.lights) {
      const x = this.sx(l.x, 40);
      if (x < -60 || x > W + 60) continue;
      const on = this.lit(l);
      const flick = on && Math.sin(this.tSec() * 26 + l.x) > 0.94 ? 0.3 : 1;
      ctx.fillStyle = on ? `rgba(228,244,232,${0.72 * flick})` : '#1a1f28';
      ctx.fillRect(x - 30, topY + 2, 60, 5);
      if (!on) continue;
      ctx.save();
      ctx.globalAlpha = 0.42 * flick;
      const g = ctx.createLinearGradient(x, topY, x, this.sy(150));
      g.addColorStop(0, 'rgba(216,240,222,0.20)');
      g.addColorStop(1, 'rgba(216,240,222,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 34, topY + 6); ctx.lineTo(x + 34, topY + 6);
      ctx.lineTo(x + 104, this.sy(170)); ctx.lineTo(x - 104, this.sy(170));
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- 設備

  drawStationProps() {
    const { ctx } = this;
    for (const p of this.c.PROPS) {
      if (p.kind === 'rails' || p.kind === 'roof' || p.kind === 'tunnel') continue;
      const x = this.sx(p.x, p.y);
      if (x < -320 || x > this.W + 320) continue;
      const y = this.sy(p.y), s = this.scaleAt(p.y);

      if (p.kind === 'gatehall') {
        // 改札。抜けたはずなのにホームに戻る場所
        ctx.fillStyle = '#1c222c';
        ctx.fillRect(x - 90 * s, y - 130 * s, 180 * s, 130 * s);
        ctx.fillStyle = '#0a0d13';
        ctx.fillRect(x - 62 * s, y - 96 * s, 124 * s, 96 * s);
        for (const k of [-1, 1]) {
          ctx.fillStyle = '#2f3846';
          ctx.fillRect(x + k * 34 * s - 9 * s, y - 40 * s, 18 * s, 40 * s);
          ctx.fillStyle = `rgba(120,220,160,${0.5 - this.decay * 0.4})`;
          ctx.fillRect(x + k * 34 * s - 5 * s, y - 34 * s, 10 * s, 4 * s);
        }
        ctx.fillStyle = `rgba(226,240,232,${0.3 - this.decay * 0.2})`;
        ctx.fillRect(x - 40 * s, y - 122 * s, 80 * s, 16 * s);
      }

      if (p.kind === 'waiting') {
        // 待合室。中だけ少し暖かい色
        ctx.fillStyle = '#20262f';
        ctx.fillRect(x - 84 * s, y - 118 * s, 168 * s, 118 * s);
        ctx.fillStyle = `rgba(238,214,164,${0.30 - this.decay * 0.2})`;
        ctx.fillRect(x - 68 * s, y - 100 * s, 136 * s, 66 * s);
        ctx.strokeStyle = '#39424f'; ctx.lineWidth = 3 * s;
        ctx.strokeRect(x - 68 * s, y - 100 * s, 136 * s, 66 * s);
        ctx.beginPath();
        ctx.moveTo(x, y - 100 * s); ctx.lineTo(x, y - 34 * s);
        ctx.stroke();
      }

      if (p.kind === 'exit') {
        // 無かったはずの階段。輪が切れるまで描かない（SPEC §20）
        if (!this.exitOpen) continue;
        ctx.fillStyle = '#2c333e';
        for (let i = 0; i < 7; i++) {
          ctx.fillRect(x - 52 * s + i * 6 * s, y - (i + 1) * 15 * s, 104 * s - i * 12 * s, 15 * s);
        }
        ctx.save();
        ctx.globalAlpha = 0.6;
        const g = ctx.createRadialGradient(x, y - 90 * s, 6, x, y - 60 * s, 170);
        g.addColorStop(0, 'rgba(236,246,255,0.5)');
        g.addColorStop(1, 'rgba(236,246,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x, y - 30 * s, 170, 90, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    this.drawClutter();
    this.drawChange();
  }

  // ベンチ・ゴミ箱・案内板
  drawClutter() {
    const { ctx } = this;
    for (const c of this.c.SCENERY.clutter) {
      const x = this.sx(c.x, 150);
      if (x < -40 || x > this.W + 40) continue;
      const y = this.sy(150), s = this.scaleAt(150);
      if (c.kind === 'bench') {
        ctx.fillStyle = '#2e3540';
        ctx.fillRect(x - 34 * s, y - 20 * s, 68 * s, 6 * s);
        ctx.fillRect(x - 34 * s, y - 34 * s, 68 * s, 5 * s);
        ctx.fillStyle = '#232933';
        ctx.fillRect(x - 28 * s, y - 20 * s, 5 * s, 20 * s);
        ctx.fillRect(x + 23 * s, y - 20 * s, 5 * s, 20 * s);
      } else if (c.kind === 'bin') {
        ctx.fillStyle = '#262c36';
        ctx.fillRect(x - 12 * s, y - 26 * s, 24 * s, 26 * s);
        ctx.fillStyle = '#333b47';
        ctx.fillRect(x - 14 * s, y - 30 * s, 28 * s, 5 * s);
      } else {
        ctx.fillStyle = '#2a313c';
        ctx.fillRect(x - 2 * s, y - 44 * s, 4 * s, 44 * s);
        ctx.fillStyle = `rgba(150,190,220,${0.18 - this.decay * 0.1})`;
        ctx.fillRect(x - 18 * s, y - 62 * s, 36 * s, 20 * s);
      }
    }
  }

  // 今週回で「違っている」もの。
  // 光らせない。目立たせない。気づかせるのはプレイヤーの仕事（§12 §17）
  drawChange() {
    const ch = this.change;
    if (!ch) return;
    const { ctx } = this;
    const x = this.sx(ch.x, ch.y), y = this.sy(ch.y), s = this.scaleAt(ch.y);
    if (x < -200 || x > this.W + 200) return;

    if (ch.kind === 'timetable') {
      // 白紙の時刻表
      ctx.fillStyle = '#2b323d';
      ctx.fillRect(x - 34 * s, y - 96 * s, 68 * s, 62 * s);
      ctx.fillStyle = '#e8eef4';
      ctx.fillRect(x - 29 * s, y - 91 * s, 58 * s, 52 * s);
      ctx.fillStyle = '#2a313c';
      ctx.fillRect(x - 3 * s, y - 34 * s, 6 * s, 34 * s);
    } else if (ch.kind === 'sitter') {
      // ベンチに座っている誰か。顔は描かない
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(x, y, 16 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#12151b';
      ctx.beginPath();
      ctx.roundRect(x - 12 * s, y - 46 * s, 24 * s, 32 * s, 5 * s);
      ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - 54 * s, 10 * s, 0, Math.PI * 2); ctx.fill();
      // 傘。M1 で見たもの
      ctx.strokeStyle = '#3a4250'; ctx.lineWidth = 2.4 * s;
      ctx.beginPath();
      ctx.moveTo(x + 14 * s, y - 30 * s); ctx.lineTo(x + 20 * s, y - 2 * s);
      ctx.stroke();
    } else if (ch.kind === 'signboard') {
      // 駅名標。「きさらぎ」
      ctx.fillStyle = '#2b323d';
      ctx.fillRect(x - 60 * s, y - 92 * s, 120 * s, 44 * s);
      ctx.fillStyle = '#eef2f6';
      ctx.fillRect(x - 56 * s, y - 88 * s, 112 * s, 36 * s);
      ctx.fillStyle = '#1a1f28';
      ctx.font = `700 ${Math.round(17 * s)}px ui-sans-serif, system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('きさらぎ', x, y - 70 * s);
      ctx.fillStyle = '#2a313c';
      ctx.fillRect(x - 4 * s, y - 48 * s, 8 * s, 48 * s);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    } else if (ch.kind === 'shadows') {
      // 影が四つ。人物は Game 側が描くので、余った一つだけを置く
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, y, 14 * s, 5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 開放は文字で伝えない。世界が変わる（SPEC §20）
  drawStationGates(state) {
    const { ctx } = this;
    for (const g of this.c.GATES) {
      const open = state.isUnlocked(g.opens);
      const x = this.sx(g.x, 70), y = this.sy(70), s = this.scaleAt(70);
      if (x < -200 || x > this.W + 200) continue;

      if (g.kind === 'chain') {
        ctx.fillStyle = '#39424f';
        ctx.fillRect(x - 40 * s, y - 44 * s, 5 * s, 44 * s);
        ctx.fillRect(x + 35 * s, y - 44 * s, 5 * s, 44 * s);
        ctx.strokeStyle = '#4c5666'; ctx.lineWidth = 2.4 * s;
        ctx.beginPath();
        if (open) { ctx.moveTo(x + 37 * s, y - 42 * s); ctx.quadraticCurveTo(x + 43 * s, y - 16 * s, x + 41 * s, y - 2 * s); }
        else { ctx.moveTo(x - 38 * s, y - 38 * s); ctx.quadraticCurveTo(x, y - 20 * s, x + 37 * s, y - 38 * s); }
        ctx.stroke();
      }
      if (g.kind === 'gate') {
        ctx.strokeStyle = open ? 'rgba(120,140,170,0.25)' : 'rgba(170,190,215,0.6)';
        ctx.lineWidth = 3 * s;
        ctx.save();
        if (open) { ctx.translate(x - 34 * s, y); ctx.rotate(-0.85); ctx.strokeRect(0, -52 * s, 34 * s, 52 * s); }
        else { ctx.strokeRect(x - 34 * s, y - 52 * s, 34 * s, 52 * s); ctx.strokeRect(x, y - 52 * s, 34 * s, 52 * s); }
        ctx.restore();
      }
      if (g.kind === 'door') {
        ctx.fillStyle = open ? '#0a0d13' : '#333b47';
        ctx.fillRect(x - 26 * s, y - 76 * s, 52 * s, 76 * s);
        if (!open) {
          ctx.strokeStyle = 'rgba(200,220,240,0.2)'; ctx.lineWidth = 1.6 * s;
          ctx.beginPath(); ctx.moveTo(x, y - 76 * s); ctx.lineTo(x, y); ctx.stroke();
        }
      }
      if (g.kind === 'shutter') {
        ctx.fillStyle = '#2b3140';
        const h = open ? 20 : 104;
        ctx.fillRect(x - 54 * s, y - 104 * s, 108 * s, h * s);
        ctx.strokeStyle = 'rgba(150,165,190,0.12)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < h / 11; i++) {
          ctx.beginPath();
          ctx.moveTo(x - 54 * s, y - 104 * s + i * 11 * s);
          ctx.lineTo(x + 54 * s, y - 104 * s + i * 11 * s);
          ctx.stroke();
        }
      }
    }
  }

  drawStationForeground() {
    const { ctx, W, H } = this;
    const y = this.sy(214);
    // 手前の柱。ホームの奥行きを作る（SPEC §46）
    ctx.fillStyle = '#04060a';
    ctx.fillRect(0, y + 22, W, H - y);
    // 手前の柱は細く。太いと仲間が隠れて誰が喋っているか分からなくなる
    ctx.save();
    ctx.globalAlpha = 0.82;
    for (let i = -1; i < 26; i++) {
      const x = this.layerX(i * 640 + 60, 1.24);
      if (x < -140 || x > W + 140) continue;
      ctx.fillStyle = '#05070c';
      ctx.fillRect(x - 9, y - 170, 18, H - y + 200);
    }
    ctx.restore();
    const g = ctx.createLinearGradient(0, H * 0.84, 0, H);
    g.addColorStop(0, 'rgba(3,4,8,0)');
    g.addColorStop(1, 'rgba(3,4,8,0.82)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.84, W, H * 0.16);
  }
}
