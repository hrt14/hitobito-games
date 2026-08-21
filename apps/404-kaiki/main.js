// 404怪異調査クラブ 縦切り版
// Game は「歩く・近づいて調べる・3人で喋る」だけを持つ。
// 怪異ごとの型（追われる / 見てしまう）は modes/ 側に閉じる（SPEC §32 §63）。
import { CASE01 } from './data/case01.js';
import { CASE02 } from './data/case02.js';
import { CASE03 } from './data/case03.js';
import { CASE04 } from './data/case04.js';
import { CASE05 } from './data/case05.js';
import { CASE06 } from './data/case06.js';
import { CaseState } from './core/case.js';
import { findTrigger, visiblePoints, nextRequired } from './core/investigation.js';
import { buildRecord } from './core/log.js';
import { Renderer } from './world/render.js';
import { FieldRenderer } from './world/render-field.js';
import { SchoolRenderer } from './world/render-school.js';
import { ArcadeRenderer } from './world/render-arcade.js';
import { StationRenderer } from './world/render-station.js';
import { VillageRenderer } from './world/render-village.js';
import { ChaseMode } from './modes/chase-mode.js';
import { SightMode } from './modes/sight-mode.js';
import { PassMode } from './modes/pass-mode.js';
import { VoiceMode } from './modes/voice-mode.js';
import { LoopMode } from './modes/loop-mode.js';
import { VigilMode } from './modes/vigil-mode.js';
import { Input } from './world/input.js';
import { Ambience } from './world/audio.js';
import { buildPath, truncate } from './world/path.js';

const $ = s => document.querySelector(s);

const CASES = [CASE01, CASE02, CASE03, CASE04, CASE05, CASE06];
const MODES = { chase: ChaseMode, sight: SightMode, pass: PassMode, voice: VoiceMode, loop: LoopMode, vigil: VigilMode };
const RENDERERS = {
  field: FieldRenderer, school: SchoolRenderer, arcade: ArcadeRenderer,
  station: StationRenderer, village: VillageRenderer,
};

class Game {
  constructor() {
    this.canvas = $('#stage');
    this.input = new Input(this.canvas);
    this.audio = new Ambience();

    this.scene = 'title';
    this.mode = 'free';        // free | investigate | dialogue | caught | survive
    this.t = 0;
    this.last = performance.now();
    this.paused = false;
    this.bubbles = [];         // {who, text}
    this.queue = null;

    window.addEventListener('resize', () => this.r.resize());
    window.game = this; // デバッグ・テストプレイ用
    this.buildBoard();
    this.bindUI();
    this.setCase(CASES[0]);
    requestAnimationFrame(t => this.loop(t));
  }

  // ------------------------------------------------------------ CASE の読み込み

  setCase(caseData) {
    this.c = caseData;
    const R = RENDERERS[caseData.renderer] || Renderer;
    this.r = new R(this.canvas, caseData);
    this.state = new CaseState(caseData);
    this.dir = new MODES[caseData.mode](this);
    this.lamps = (caseData.SCENERY.lamps || []).map(l => ({ ...l }));

    this.scene = 'title';
    this.mode = 'free';
    this.party = { shirou: { x: 150, y: 130, z: 0 }, rei: { x: 118, y: 118, z: 0 }, yotsuba: { x: 92, y: 142, z: 0 } };
    this.trail = [];
    this.walkPhase = 0;
    this.moving = false;
    this.facing = { shirou: 1, rei: 1, yotsuba: 1 };
    this.vel = { x: 0, y: 0 };
    this.queue = null;
    this.bubbles = [];
    this.pending = null;
    this.objective = null;
    this.areaLabel = { name: '', a: 0 };
    this.camFocus = null;
    this.caughtT = 0;
    this.fade = 0;
    this._picked = {};
    this.banterT = undefined;
  }

  // ------------------------------------------------------------ UI

  // §69 調査ボード。CASE を足したら勝手に並ぶようにしておく
  buildBoard() {
    const board = $('#caseBoard');
    board.innerHTML = CASES.map(c => {
      const saved = CaseState.hasSave(c.id);
      return `<article class="case" data-case="${c.id}">
        <header><b>${c.no}</b><span class="tag" data-tag="${c.id}"></span></header>
        <h3>${c.name}</h3>
        <p>${c.RECORD.rumor}</p>
        <div class="case-btns">
          <button class="ghost" data-act="continue" data-case="${c.id}"${saved ? '' : ' hidden'}>続きから</button>
          <button class="primary" data-act="new" data-case="${c.id}">調べに行く</button>
        </div>
      </article>`;
    }).join('');
    board.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const c = CASES.find(x => x.id === btn.dataset.case);
      if (!c) return;
      this.setCase(c);
      if (btn.dataset.act === 'continue') { this.state.load(); this.begin(true); }
      else { this.state.reset(); this.begin(false); }
    });
    this.refreshBoard();
  }

  refreshBoard() {
    for (const c of CASES) {
      const tag = document.querySelector(`.tag[data-tag="${c.id}"]`);
      const cont = document.querySelector(`button[data-act="continue"][data-case="${c.id}"]`);
      let label = '未調査';
      let saved = false;
      try {
        const raw = localStorage.getItem(`hitobito_404_${c.id}_slice_v1`);
        if (raw) {
          saved = true;
          label = JSON.parse(raw).case_completed ? '調査済み' : '調査中';
        }
      } catch { /* localStorage が無くても遊べる */ }
      if (tag) { tag.textContent = label; tag.className = `tag ${label === '調査済み' ? 'done' : ''}`; }
      if (cont) cont.hidden = !saved;
    }
  }

  bindUI() {
    $('#btnPause').onclick = () => this.togglePause(true);
    $('#btnResume').onclick = () => this.togglePause(false);
    $('#btnRecord').onclick = () => this.showRecord();
    $('#btnRecordClose').onclick = () => {
      $('#record').hidden = true;
      if (this.scene === 'done') { this.refreshBoard(); $('#title').hidden = false; }
    };
    $('#btnRestart').onclick = () => { $('#record').hidden = true; this.state.reset(); this.begin(false); };
    $('#btnQuit').onclick = () => {
      this.togglePause(false);
      this.scene = 'title';
      $('#hud').hidden = true;
      this.refreshBoard();
      $('#title').hidden = false;
    };
  }

  togglePause(on) {
    if (this.scene !== 'play') return;
    this.paused = on;
    $('#pause').hidden = !on;
    this.input.setEnabled(!on && this.mode === 'free');
  }

  begin(cont) {
    $('#title').hidden = true;
    $('#record').hidden = true;
    $('#hud').hidden = false;
    $('#btnRestart').hidden = true;
    this.audio.start();
    this.audio.resume();
    this.audio.setMode('night');
    this.scene = 'play';
    this.paused = false;
    this.fade = 0;
    this.mode = 'free';
    this.pending = null;
    this.camFocus = null;

    // クリア済みのセーブから「続きから」を選んだ場合は、
    // 途中のチェックポイントへ戻さず最初から調べ直す
    if (cont && this.state.data.case_completed) { this.state.reset(); cont = false; }

    const cp = cont ? this.state.restoreCheckpoint() : null;
    if (cp) this.setPartyAt(cp.x, cp.y);
    else {
      this.setPartyAt(150, 130);
      this.say(this.c.DIALOGUE.intro, { blocking: false });
    }
    this.dir.begin(!!cp);
    this.input.setEnabled(true);
    this.refreshObjective();
  }

  // 歩ける帯。通常はエリアの値。CASE 04 の路地だけ mode 側が広げる
  band(x) {
    const a = this.state.areaAt(x);
    return this.dir.bandAt ? this.dir.bandAt(x, a) : a;
  }

  setPartyAt(x, y) {
    this.party.shirou = { x, y, z: 0 };
    this.party.rei = { x: x - 38, y: y - 22, z: 0 };
    this.party.yotsuba = { x: x - 66, y: y + 24, z: 0 };
    this.trail = [];
  }

  // ------------------------------------------------------------ 会話

  // 同じものが続けて出ないように選ぶ
  pick(list, key) {
    this._picked = this._picked || {};
    const used = this._picked[key] || [];
    let pool = list.filter((_, i) => !used.includes(i));
    if (!pool.length) { this._picked[key] = []; pool = list; }
    const item = pool[Math.floor(Math.random() * pool.length)];
    this._picked[key] = [...(this._picked[key] || []), list.indexOf(item)];
    return item;
  }

  // 歩いている最中の雑談。3人の会話そのものを見せる（SPEC §4③ §9）
  updateBanter(dt) {
    if (this.queue || this.mode !== 'free') return;
    if (this.dir.running()) return;
    if (!this.moving) return;
    this.banterT = (this.banterT === undefined ? 9 : this.banterT) - dt;
    if (this.banterT > 0) return;
    this.banterT = 17 + Math.random() * 13;
    const area = this.state.areaAt(this.party.shirou.x);
    const sets = this.c.DIALOGUE.banter[area.id];
    if (sets && sets.length) this.say(this.pick(sets, 'banter-' + area.id), { blocking: false });
  }

  say(lines, opts = {}) {
    this.queue = {
      lines: lines.slice(),
      i: -1,
      blocking: !!opts.blocking,
      onEnd: opts.onEnd || null,
      onIndex: opts.onIndex || null,
      timer: 0,
    };
    if (this.queue.blocking) this.input.setEnabled(false);
    this.nextLine();
  }

  nextLine() {
    const q = this.queue;
    if (!q) return;
    q.i++;
    if (q.i >= q.lines.length) {
      this.queue = null;
      this.bubbles = [];
      if (q.onEnd) q.onEnd();
      else if (q.blocking) { this.mode = 'free'; this.input.setEnabled(true); }
      return;
    }
    const line = q.lines[q.i];
    if (q.onIndex) q.onIndex(q.i);
    q.timer = line.dur || Math.max(1.5, [...line.text].length * 0.105);
    this.bubbles = [{ who: line.who, text: line.text }];
    this.audio.blip(430 + Math.random() * 60, 0.04, 0.02, 'sine');
  }

  updateDialogue(dt) {
    const q = this.queue;
    if (!q) return;
    q.timer -= dt;
    if (this.input.consumeTap() && q.timer < 9) q.timer = 0;
    if (q.timer <= 0) this.nextLine();
  }

  // ------------------------------------------------------------ 調査

  startInvestigation(point) {
    this.mode = 'investigate';
    this.input.setEnabled(false);
    const actors = point.by === 'all' ? ['shirou', 'rei', 'yotsuba'] : [point.by];
    this.pending = { point, actors, phase: 'approach', t: 0 };
    this.audio.found();
  }

  updateInvestigation(dt) {
    const p = this.pending;
    if (!p) return;
    p.t += dt;

    if (p.phase === 'approach') {
      let done = true;
      p.actors.forEach((who, i) => {
        const c = this.party[who];
        const tx = p.point.x + (i - (p.actors.length - 1) / 2) * 26;
        const ty = p.point.y + 26;
        const dx = tx - c.x, dy = ty - c.y;
        const d = Math.hypot(dx, dy);
        if (d > 4) {
          const step = Math.min(d, 130 * dt);
          c.x += dx / d * step; c.y += dy / d * step;
          done = false;
        }
      });
      this.walkPhase += dt * 9;
      if (done || p.t > 1.6) {
        p.phase = p.point.kind === 'door' ? 'door' : 'talk';
        p.t = 0;
        if (p.phase === 'talk') this.runPointDialogue(p.point);
      }
      return;
    }

    // ドア演出（SPEC §22）: 止まる → ノブが動く → 少し遅れて開く
    if (p.phase === 'door') {
      if (!p.knob && p.t > 1.2) { p.knob = true; this.audio.doorKnob(); this.r.shake = 0.25; }
      if (!p.open && p.t > 1.8) {
        p.open = true;
        this.audio.doorOpen();
        this.applyCompletion(p.point);
      }
      if (p.t > 2.6) { p.phase = 'talk'; p.t = 0; this.runPointDialogue(p.point, true); }
      return;
    }
  }

  runPointDialogue(point, alreadyDone) {
    const lines = this.c.DIALOGUE[point.id] || [];
    const completeAt = alreadyDone ? -1 : lines.length - 1;
    this.say(lines, {
      blocking: true,
      onIndex: i => { if (i === completeAt) this.applyCompletion(point); },
      onEnd: () => {
        this.pending = null;
        this.mode = 'free';
        this.input.setEnabled(true);
        this.dir.after(point);
      },
    });
  }

  applyCompletion(point) {
    const opened = this.state.complete(point);
    if (opened) {
      this.audio.unlock();
      this.camFocus = { x: opened.x, t: 1.7 };
      this.r.shake = 0.4;
    }
    this.dir.checkpoint(point);
    this.refreshObjective();
  }

  // ------------------------------------------------------------ 目的地と緑ライン

  refreshObjective() {
    this.objective = this.dir.objective() || nextRequired(this.state);
  }

  // ------------------------------------------------------------ 更新

  update(dt) {
    this.t += dt;
    if (this.r.shake > 0) this.r.shake = Math.max(0, this.r.shake - dt * 1.8);
    if (this.fade > 0) this.fade = Math.max(0, this.fade - dt * 0.9);
    this.updateDialogue(dt);

    if (this.scene === 'epilogue') { this.epiT += dt; return; }
    if (this.scene !== 'play' || this.paused) return;

    if (this.mode === 'caught') {
      this.caughtT += dt;
      if (this.caughtT > 1.9) this.respawn();
      return;
    }

    if (this.mode === 'investigate') {
      this.updateInvestigation(dt);
      this.updateFollowers(dt, false);
      this.dir.update(dt);
      return;
    }

    if (this.mode === 'free') {
      this.movePlayer(dt);
      // 逃走中は調査を発火させない。操作が止まっている間に怪異が歩いて来て、
      // 3人が棒立ちのまま捕まる（緊張感が消えるどころか理不尽になる）
      if (!this.dir.running()) {
        const hit = findTrigger(this.state, this.party.shirou);
        if (hit) this.startInvestigation(hit);
      }
    }

    this.updateFollowers(dt, this.moving);
    this.updateBanter(dt);
    this.dir.update(dt);
    this.updateArea(dt);

    if (this.camFocus) {
      this.camFocus.t -= dt;
      if (this.camFocus.t <= 0) this.camFocus = null;
    }
  }

  respawn() {
    const cp = this.state.restoreCheckpoint();
    this.setPartyAt(cp ? cp.x : 150, cp ? cp.y : 130);
    this.bubbles = [];
    this.queue = null;
    this.fade = 1;
    if (!this.dir.restore()) {
      this.mode = 'free';
      this.input.setEnabled(true);
    }
  }

  movePlayer(dt) {
    const running = this.dir.running();
    const sp = running ? this.c.SPEED.run : this.c.SPEED.walk;
    const p = this.party.shirou;

    // 入力を直接座標へ流すと動きが硬い。速度を追従させる
    const k = Math.min(1, dt * 16);
    this.vel.x += (this.input.vx - this.vel.x) * k;
    this.vel.y += (this.input.vy - this.vel.y) * k;
    const vx = this.vel.x, vy = this.vel.y;
    this.moving = Math.hypot(vx, vy) > 0.06;

    if (this.moving) {
      p.x += vx * sp * dt;
      p.y += vy * sp * dt * 0.72;
      this.walkPhase += dt * (running ? 15 : 11);
      if (Math.sin(this.walkPhase) > 0.94) this.audio.step();
      if (Math.abs(vx) > 0.12) this.facing.shirou = vx > 0 ? 1 : -1;
    }

    const limit = this.state.frontier();
    p.x = Math.max(40, Math.min(limit - 26, p.x));
    const band = this.band(p.x);
    p.y = Math.max(band.bandTop + 6, Math.min(band.bandBottom - 4, p.y));

    // 世界が輪になっている CASE は、ここで縫い目を越える（CASE 05）
    if (this.dir.onMoved) this.dir.onMoved(p);

    // 実際に動いたときだけ記録する。止まっている間に同じ点を積むと
    // 後続の2人が先頭へ吸い寄せられて3人が重なる（SPEC §49）
    const tail = this.trail[this.trail.length - 1];
    if (!tail || Math.hypot(p.x - tail.x, p.y - tail.y) > 2.5) {
      this.trail.push({ x: p.x, y: p.y });
      if (this.trail.length > 400) this.trail.shift();
    }
  }

  // 3人一緒に動く。重ねない。狭い道では自然に一列になる（SPEC §49）
  updateFollowers(dt, moving) {
    const order = ['rei', 'yotsuba'];
    const running = this.dir.running();
    // 山場では隊列を詰める。探索時の間隔のままだと、後ろの2人が
    // 置いていかれる（CASE 01 では必ず怪異に追い越された）
    const gaps = running ? [30, 56] : [95, 180];
    order.forEach((who, i) => {
      const c = this.party[who];
      let target;
      if (this.trail.length > 2) {
        let acc = 0, idx = this.trail.length - 1;
        while (idx > 0 && acc < gaps[i]) {
          acc += Math.hypot(this.trail[idx].x - this.trail[idx - 1].x, this.trail[idx].y - this.trail[idx - 1].y);
          idx--;
        }
        target = this.trail[idx];
      } else {
        target = { x: this.party.shirou.x - gaps[i], y: this.party.shirou.y };
      }
      // 山場で止まっている時は3人を寄せる。CASE 02 では散っていると
      // 誰かが遮蔽の陰からはみ出して、絵が「隠れている」に見えない
      const offY = moving ? 0 : (running ? (i === 0 ? -15 : 17) : (i === 0 ? -30 : 34));
      const t = { tx: target.x, ty: target.y + offY };
      this.dir.followerAdjust(who, c, t);

      const dx = t.tx - c.x, dy = t.ty - c.y;
      const d = Math.hypot(dx, dy);
      if (d > 1.5) {
        // 山場では追いつけないと置き去りになるので上限を上げる
        const base = running ? this.c.SPEED.run * 1.9 : this.c.SPEED.walk * 1.3;
        const sp = Math.min(d * 6.5, base);
        c.x += dx / d * sp * dt;
        c.y += dy / d * sp * dt;
        if (Math.abs(dx) > 2) this.facing[who] = dx > 0 ? 1 : -1;
      }

      this.dir.followerClamp(who, c);

      const band = this.band(c.x);
      c.y = Math.max(band.bandTop + 4, Math.min(band.bandBottom - 2, c.y));
    });
  }

  updateArea(dt) {
    const a = this.state.areaAt(this.party.shirou.x);
    if (a.name !== this.areaLabel.name) { this.areaLabel = { name: a.name, a: 1.6 }; }
    else this.areaLabel.a = Math.max(0, this.areaLabel.a - dt * 0.45);
  }

  // ------------------------------------------------------------ 調査記録

  showRecord() {
    const rec = this.state.data.case_records[this.c.id] || buildRecord(this.state);
    $('#recBody').innerHTML = `
      <div class="rec-line"><span>CASE</span><b>${rec.case}</b></div>
      <div class="rec-line"><span>噂</span><b>${rec.rumor}</b></div>
      <div class="rec-line"><span>調査場所</span><b>${rec.places.join(' / ')}</b></div>
      <div class="rec-line"><span>遭遇</span><b>${rec.encounter}</b></div>
      <div class="rec-line"><span>証拠</span><b>${rec.evidence.length ? rec.evidence.join('<br>') : '—'}</b></div>
      <div class="rec-line"><span>任意調査</span><b>${rec.optional}</b></div>
      <div class="rec-notes">${rec.notes.map(n => `<p><i>${n[0]}</i>「${n[1]}」</p>`).join('')}</div>
      <div class="rec-open"><span>未解決</span>${rec.unresolved.map(u => `<p>${u}</p>`).join('')}</div>`;
    $('#record').hidden = false;
    $('#btnRestart').hidden = this.scene !== 'done';
  }

  startEpilogue() {
    this.scene = 'epilogue';
    this.epiT = 0;
    this.bubbles = [];
    $('#hud').hidden = true;
    this.audio.setMode('night');
    this.say(this.c.DIALOGUE.epilogue, {
      blocking: true,
      onEnd: () => {
        this.state.markCleared(buildRecord(this.state));
        this.scene = 'done';
        this.refreshBoard();
        this.showRecord();
      },
    });
  }

  // ------------------------------------------------------------ 描画

  draw() {
    const r = this.r, ctx = r.ctx;
    if (this.scene === 'title') { this.dir.titleBg(r); return; }
    if (this.scene === 'epilogue') { this.drawEpilogue(); return; }

    const p = this.party.shirou;
    let cam = this.dir.camera(p);
    if (cam === null) {
      cam = p.x;
      if (this.camFocus) {
        const k = 1 - Math.abs(this.camFocus.t - 0.85) / 0.85;
        cam = p.x + (this.camFocus.x - p.x) * Math.max(0, Math.min(1, k));
      }
    }
    r.camX = cam;
    r.dark = this.dir.dark();

    ctx.save();
    if (r.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 9 * r.shake, (Math.random() - 0.5) * 9 * r.shake);
    }

    r.drawWorldBack(this);

    const ratio = this.dir.guideRatio();
    if (ratio > 0 && this.objective && this.mode !== 'caught') {
      const path = truncate(buildPath(p, this.objective, this.c.WAYPOINTS), ratio);
      r.drawGuideLine(path, this.t, this.dir.running() ? 'escape' : 'normal');
    }

    if (this.dir.showMarks()) {
      for (const pt of visiblePoints(this.state, p)) {
        const near = Math.hypot(pt.x - p.x, pt.y - p.y);
        r.drawMark(pt, this.t, pt.hidden ? Math.min(1, (150 - near) / 60) : 1);
      }
    }

    // 奥から手前へ並べて描く
    const lookBack = this.dir.lookBack();
    const ents = [
      { y: this.party.rei.y, f: () => r.drawPerson('rei', this.party.rei.x, this.party.rei.y, this.walkPhase - 0.7, this.facing.rei, { moving: this.moving, lookBack, z: this.party.rei.z }) },
      { y: this.party.yotsuba.y, f: () => r.drawPerson('yotsuba', this.party.yotsuba.x, this.party.yotsuba.y, this.walkPhase - 1.4, this.facing.yotsuba, { moving: this.moving, lookBack, z: this.party.yotsuba.z }) },
      { y: p.y, f: () => r.drawPerson('shirou', p.x, p.y, this.walkPhase, this.facing.shirou, { moving: this.moving, z: p.z }) },
      ...this.dir.entities(r),
    ];
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());

    r.drawWorldFront(this);
    this.dir.overlay(r);
    r.drawVignette(this.dir.vignette());
    ctx.restore();

    r.drawAreaName(this.areaLabel.name, Math.min(1, this.areaLabel.a));
    this.dir.screen(r);

    for (const b of this.bubbles) {
      const a = this.dir.anchor(b.who);
      const c = a || this.party[b.who] || p;
      r.drawBubble(b.text, b.who, c.x, c.y, a ? a.lift : 0);
    }

    if (this.mode === 'free') r.drawStick(this.input);

    if (this.mode === 'caught') {
      const k = Math.min(1, this.caughtT / 1.5);
      ctx.fillStyle = `rgba(${this.dir.caughtColor()},${k})`;
      ctx.fillRect(0, 0, r.W, r.H);
    }
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fade})`;
      ctx.fillRect(0, 0, r.W, r.H);
    }
    this.drawHud();
  }

  drawHud() {
    const r = this.r, ctx = r.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(220,232,248,0.5)';
    ctx.font = '700 11px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(this.dir.hud(), 16, 26);
    ctx.restore();
  }

  drawEpilogue() {
    const r = this.r, ctx = r.ctx, { W, H } = r;
    const gt = r.groundTop, gb = r.groundBottom;
    // 翌日の教室。夜との温度差を出す（SPEC §37）
    const wallY = H * 0.62;
    const g = ctx.createLinearGradient(0, 0, 0, wallY);
    g.addColorStop(0, '#dceaf4');
    g.addColorStop(1, '#f2f6f9');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, wallY);

    // 床
    const fg = ctx.createLinearGradient(0, wallY, 0, H);
    fg.addColorStop(0, '#d8cdba');
    fg.addColorStop(1, '#b9ad98');
    ctx.fillStyle = fg; ctx.fillRect(0, wallY, W, H - wallY);
    ctx.strokeStyle = 'rgba(120,105,85,0.18)';
    ctx.lineWidth = 1.4;
    for (let i = -3; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(W * 0.5 + (i - 4.5) * 26, wallY);
      ctx.lineTo(W * 0.5 + (i - 4.5) * 150, H);
      ctx.stroke();
    }
    ctx.fillStyle = '#a99c86';
    ctx.fillRect(0, wallY - 7, W, 8);

    // 窓と外の光
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W * 0.04, H * 0.14, W * 0.44, H * 0.40);
    const sun = ctx.createLinearGradient(W * 0.04, H * 0.14, W * 0.48, H * 0.54);
    sun.addColorStop(0, 'rgba(255,246,214,0.9)');
    sun.addColorStop(1, 'rgba(198,228,246,0.75)');
    ctx.fillStyle = sun;
    ctx.fillRect(W * 0.04, H * 0.14, W * 0.44, H * 0.40);
    ctx.strokeStyle = '#8f9fae'; ctx.lineWidth = 3.5;
    ctx.strokeRect(W * 0.04, H * 0.14, W * 0.44, H * 0.40);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(W * 0.26, H * 0.14); ctx.lineTo(W * 0.26, H * 0.54);
    ctx.moveTo(W * 0.04, H * 0.30); ctx.lineTo(W * 0.48, H * 0.30);
    ctx.stroke();
    // 窓の外の校庭
    ctx.fillStyle = 'rgba(150,180,140,0.5)';
    ctx.fillRect(W * 0.05, H * 0.44, W * 0.42, H * 0.09);

    // 黒板
    ctx.fillStyle = '#3c5347';
    ctx.fillRect(W * 0.56, H * 0.18, W * 0.40, H * 0.22);
    ctx.strokeStyle = '#b9a06a'; ctx.lineWidth = 5;
    ctx.strokeRect(W * 0.56, H * 0.18, W * 0.40, H * 0.22);
    ctx.strokeStyle = 'rgba(235,240,235,0.30)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(W * 0.60, H * (0.23 + i * 0.045));
      ctx.lineTo(W * (0.60 + 0.2 + i * 0.05), H * (0.23 + i * 0.045));
      ctx.stroke();
    }

    // 光の帯
    ctx.save();
    ctx.globalAlpha = 0.35;
    const beam = ctx.createLinearGradient(W * 0.1, H * 0.3, W * 0.75, H);
    beam.addColorStop(0, 'rgba(255,250,225,0.9)');
    beam.addColorStop(1, 'rgba(255,250,225,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(W * 0.06, H * 0.56); ctx.lineTo(W * 0.48, H * 0.56);
    ctx.lineTo(W * 0.95, H); ctx.lineTo(W * 0.18, H);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // 机
    const desk = (dx, dy, s) => {
      ctx.fillStyle = '#c9a978';
      ctx.fillRect(dx - 30 * s, dy - 20 * s, 60 * s, 7 * s);
      ctx.fillStyle = '#a98d61';
      ctx.fillRect(dx - 30 * s, dy - 14 * s, 60 * s, 3 * s);
      ctx.fillStyle = '#8d9aa6';
      ctx.fillRect(dx - 26 * s, dy - 12 * s, 4 * s, 13 * s);
      ctx.fillRect(dx + 22 * s, dy - 12 * s, 4 * s, 13 * s);
    };
    desk(W * 0.14, H * 0.76, 1.0);
    desk(W * 0.86, H * 0.79, 1.1);
    desk(W * 0.10, H * 0.95, 1.5);
    desk(W * 0.92, H * 0.99, 1.6);

    const POS = { rei: [214, 86], shirou: [300, 122], yotsuba: [382, 158] };
    r.groundTop = H * 0.60; r.groundBottom = H * 0.90;
    r.camX = 300;
    const FACE = { rei: 1, shirou: 1, yotsuba: -1 }; // 輪になって話している
    ['rei', 'shirou', 'yotsuba'].forEach(who => {
      r.drawPerson(who, POS[who][0], POS[who][1], 0, FACE[who], { moving: false, phone: who !== 'rei' });
    });
    for (const b of this.bubbles) {
      const pos = POS[b.who] || POS.shirou;
      r.drawBubble(b.text, b.who, pos[0], pos[1]);
    }
    r.groundTop = gt; r.groundBottom = gb;
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }
}

new Game();
