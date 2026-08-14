// 404怪異調査クラブ / CASE 01 縦切り版
import { WORLD, SPEED, AREAS, GATES, POINTS, SCENERY, SAFE_ZONE, DIALOGUE, TRIGGERS } from './data/case01.js';
import { CaseState } from './core/case.js';
import { Anomaly } from './core/anomaly.js';
import { Chase } from './core/chase.js';
import { findTrigger, visiblePoints, nextRequired } from './core/investigation.js';
import { buildRecord } from './core/log.js';
import { Renderer } from './world/render.js';
import { Input } from './world/input.js';
import { Ambience } from './world/audio.js';
import { buildPath, truncate } from './world/path.js';

const $ = s => document.querySelector(s);
const HOME = { x: 220, y: 130 };

class Game {
  constructor() {
    this.canvas = $('#stage');
    this.r = new Renderer(this.canvas);
    this.input = new Input(this.canvas);
    this.audio = new Ambience();
    this.state = new CaseState();
    this.anomaly = new Anomaly();
    this.chase = new Chase();

    this.scene = 'title';
    this.mode = 'free';        // free | investigate | dialogue | caught | survive
    this.t = 0;
    this.last = performance.now();

    this.party = {
      shirou: { x: 150, y: 130 },
      rei: { x: 118, y: 118 },
      yotsuba: { x: 92, y: 142 },
    };
    this.trail = [];
    this.walkPhase = 0;
    this.moving = false;
    this.facing = { shirou: 1, rei: 1, yotsuba: 1 };
    this.vel = { x: 0, y: 0 };   // 入力を均して動きを硬くしない
    this.nearMissT = 0;          // 仲間が怪異にかすった時のクールダウン

    this.bubbles = [];         // {who, text, until}
    this.queue = null;
    this.pending = null;
    this.objective = null;
    this.areaLabel = { name: '', a: 0 };
    this.camFocus = null;
    this.sightingTimer = 0;
    this.sightIndex = 0;
    this.goingHome = false;
    this.escapeStarted = 0;
    this.caughtT = 0;
    this.fade = 0;
    this.lamps = SCENERY.lamps.map(l => ({ ...l }));

    window.addEventListener('resize', () => this.r.resize());
    window.game = this; // デバッグ・テストプレイ用
    this.bindUI();
    requestAnimationFrame(t => this.loop(t));
  }

  // ------------------------------------------------------------ UI

  bindUI() {
    $('#btnNew').onclick = () => { this.state.reset(); this.begin(false); };
    $('#btnContinue').onclick = () => { this.state.load(); this.begin(true); };
    $('#btnPause').onclick = () => this.togglePause(true);
    $('#btnResume').onclick = () => this.togglePause(false);
    $('#btnRecord').onclick = () => this.showRecord();
    $('#btnRecordClose').onclick = () => { $('#record').hidden = true; if (this.scene === 'done') $('#title').hidden = false; };
    $('#btnRestart').onclick = () => { $('#record').hidden = true; this.state.reset(); this.begin(false); };
    if (!CaseState.hasSave()) $('#btnContinue').hidden = true;
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

    // クリア済みのセーブから「続きから」を選んだ場合は、
    // 途中のチェックポイントへ戻さず最初から調べ直す
    if (cont && this.state.data.case_completed) { this.state.reset(); cont = false; }

    const cp = cont ? this.state.restoreCheckpoint() : null;
    if (cp) {
      this.setPartyAt(cp.x, cp.y);
      if (this.state.data.case_progress === 'escape') this.startEscape(true);
    } else {
      this.setPartyAt(150, 130);
      this.say(DIALOGUE.intro, { blocking: false });
    }
    this.goingHome = this.state.isDone('P5');
    if (this.goingHome && this.state.data.case_progress !== 'escape') this.anomaly.setPhase(3);
    this.input.setEnabled(true);
    this.refreshObjective();
  }

  setPartyAt(x, y) {
    this.party.shirou = { x, y };
    this.party.rei = { x: x - 38, y: y - 22 };
    this.party.yotsuba = { x: x - 66, y: y + 24 };
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
    if (this.state.data.case_progress === 'escape') return;
    if (!this.moving) return;
    this.banterT = (this.banterT === undefined ? 9 : this.banterT) - dt;
    if (this.banterT > 0) return;
    this.banterT = 17 + Math.random() * 13;
    const area = this.state.areaAt(this.party.shirou.x);
    const sets = DIALOGUE.banter[area.id];
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
    const lines = DIALOGUE[point.id] || [];
    const completeAt = alreadyDone ? -1 : lines.length - 1;
    this.say(lines, {
      blocking: true,
      onIndex: i => { if (i === completeAt) this.applyCompletion(point); },
      onEnd: () => {
        this.pending = null;
        this.mode = 'free';
        this.input.setEnabled(true);
        this.afterCompletion(point);
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
    if (point.id === 'P1') this.state.setCheckpoint('CP1', this.party.shirou);
    if (point.id === 'P3') this.state.setCheckpoint('CP2', this.party.shirou);
    if (point.id === 'P5') this.state.setCheckpoint('CP3', this.party.shirou);
    this.refreshObjective();
  }

  afterCompletion(point) {
    if (point.id === 'P4') {
      // PHASE 2：遠景（SPEC §25）
      this.anomaly.setPhase(2);
      this.anomaly.showFar(this.party.shirou, 1);
      this.audio.setMode('hush');
      this.audio.sting();
      this.say(DIALOGUE.phase2, { blocking: false });
    }
    if (point.id === 'P5') {
      this.goingHome = true;
      this.anomaly.setPhase(3);
      this.sightIndex = 0;
      this.say(DIALOGUE.goHome, { blocking: false });
      this.refreshObjective();
    }
  }

  // ------------------------------------------------------------ 目的地と緑ライン

  refreshObjective() {
    if (this.state.data.case_progress === 'escape') { this.objective = { ...SAFE_ZONE }; return; }
    if (this.goingHome) { this.objective = HOME; return; }
    this.objective = nextRequired(this.state);
  }

  guideRatio() {
    if (this.state.data.case_progress === 'escape') return 1;
    const ph = this.anomaly.phase;
    if (ph >= 4) return 0;
    if (ph === 3) return Math.sin(this.t * 2.2) > -0.3 ? 0.45 : 0; // 途切れる
    if (ph === 2) return 0.72;
    return 1;
  }

  // ------------------------------------------------------------ 怪異の段階

  updatePhases(dt) {
    const px = this.party.shirou.x;
    const a = this.anomaly;

    if (a.phase === 0 && px > TRIGGERS.phase1AtX) {
      a.setPhase(1);
      this.audio.setMode('hush');
      const near = this.lamps.find(l => Math.abs(l.x - px) < 460 && l.on);
      if (near) near.on = false;
      this.audio.blip(120, 0.5, 0.05, 'sawtooth');
      this.say(DIALOGUE.phase1, { blocking: false });
    }

    // PHASE 3：帰り道での接近（何度か確認できる）
    if (this.goingHome && a.phase === 3 && this.state.data.case_progress !== 'escape') {
      const th = TRIGGERS.phase3FromX[this.sightIndex];
      if (th !== undefined && px < th && !a.visible) {
        a.showNear(this.party.shirou, -1); // 帰る方向の先に立っている
        this.sightingTimer = 3.4;
        this.audio.sting();
        const lines = DIALOGUE.phase3[this.sightIndex];
        if (lines) this.say(lines, { blocking: false });
        this.sightIndex++;
      }
      if (a.visible) {
        this.sightingTimer -= dt;
        if (this.sightingTimer <= 0) a.hide();
      }
    }

    // 遠くの人影に近づくと消える。触れて無反応だと緊張感が消える
    if (a.visible && !a.chasing && this.state.data.case_progress !== 'escape') {
      const d = Math.hypot(px - a.x, this.party.shirou.y - a.y);
      if (d < 150) {
        a.hide();
        this.sightingTimer = 0;
        this.audio.blip(64, 0.8, 0.08, 'sawtooth');
        this.r.shake = 0.5;
        this.say(this.pick(DIALOGUE.vanish, 'vanish'), { blocking: false });
      }
    }

    // PHASE 4：完全出現
    if (this.goingHome && a.phase < 4 && px < TRIGGERS.phase4AtX && this.state.data.case_progress !== 'escape') {
      a.appear(this.party.shirou, px - 430);
      this.audio.setMode('silent');
      this.audio.sting();
      this.r.shake = 0.9;
      this.mode = 'dialogue';
      this.input.setEnabled(false);
      this.say(DIALOGUE.phase4, {
        blocking: true,
        onEnd: () => { this.startEscape(false); },
      });
    }
  }

  // ------------------------------------------------------------ 逃走

  startEscape(restored) {
    this.state.data.case_progress = 'escape';
    this.state.setCheckpoint('CP4', this.party.shirou);
    this.state.save();
    this.mode = 'free';
    this.input.setEnabled(true);
    this.anomaly.setPhase(4);
    this.chase.start(this.anomaly, this.party.shirou, -430);
    this.escapeStarted = this.t;
    this.audio.setMode('silent');
    this.refreshObjective();
    if (restored) this.anomaly.visible = true;
  }

  updateEscape(dt) {
    if (this.state.data.case_progress !== 'escape' || this.mode === 'caught' || this.mode === 'survive') return;
    const p = this.party.shirou;

    this.chase.update(dt, this.anomaly, p);

    // 通り過ぎた街灯から順に消えていく
    for (const l of this.lamps) if (l.on && l.x < p.x - 90) { l.on = false; }

    // 先回りして道をふさぐ
    const cut = TRIGGERS.cutAheadAtX[this.chase.cutIndex];
    if (cut !== undefined && p.x > cut) {
      this.chase.cutAhead(this.anomaly, p, 1, 430);
      this.audio.sting();
      this.r.shake = 0.7;
      this.say(DIALOGUE.cutAhead, { blocking: false });
    }

    if (this.chase.caught) { this.onCaught(); return; }

    if (Math.hypot(p.x - SAFE_ZONE.x, p.y - SAFE_ZONE.y) < 74) this.onSurvive();
  }

  onCaught() {
    this.mode = 'caught';
    this.caughtT = 0;
    this.chase.stop(this.anomaly);
    this.input.setEnabled(false);
    this.audio.caught();
    this.r.shake = 1.2;
    this.say(DIALOGUE.caught, { blocking: false });
  }

  respawn() {
    const cp = this.state.restoreCheckpoint();
    this.setPartyAt(cp ? cp.x : 150, cp ? cp.y : 130);
    this.bubbles = [];
    this.queue = null;
    this.fade = 1;
    if (this.state.data.case_progress === 'escape') {
      this.lamps = SCENERY.lamps.map(l => ({ ...l, on: l.x < this.party.shirou.x - 90 ? false : l.on }));
      this.startEscape(true);
    } else {
      this.mode = 'free';
      this.input.setEnabled(true);
    }
  }

  onSurvive() {
    this.mode = 'survive';
    this.chase.stop(this.anomaly);
    this.input.setEnabled(false);
    // 3人は鳥居をくぐり切る。怪異は外側で止まる（SPEC §32）
    this.party.shirou = { x: SAFE_ZONE.x + 46, y: 118 };
    this.party.rei = { x: SAFE_ZONE.x + 6, y: 92 };
    this.party.yotsuba = { x: SAFE_ZONE.x + 22, y: 152 };
    this.trail = [];
    this.moving = false;
    this.anomaly.x = SAFE_ZONE.x - 168;
    this.anomaly.y = 62;
    this.anomaly.chasing = false;
    this.audio.setMode('silent');
    setTimeout(() => { this.audio.setMode('night'); this.audio.relief(); }, 2200);
    this.say(DIALOGUE.survive, {
      blocking: true,
      onEnd: () => this.startEpilogue(),
    });
  }

  startEpilogue() {
    this.scene = 'epilogue';
    this.epiT = 0;
    this.bubbles = [];
    $('#hud').hidden = true;
    this.audio.setMode('night');
    this.say(DIALOGUE.epilogue, {
      blocking: true,
      onEnd: () => {
        this.state.markCleared(buildRecord(this.state));
        this.scene = 'done';
        this.showRecord();
      },
    });
  }

  // ------------------------------------------------------------ 調査記録

  showRecord() {
    const rec = this.state.data.case_records.case01 || buildRecord(this.state);
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

  // ------------------------------------------------------------ 更新

  update(dt) {
    this.t += dt;
    if (this.r.shake > 0) this.r.shake = Math.max(0, this.r.shake - dt * 1.8);
    if (this.fade > 0) this.fade = Math.max(0, this.fade - dt * 0.9);
    this.anomaly.update(dt);
    this.updateDialogue(dt);

    if (this.scene === 'epilogue') { this.epiT += dt; return; }
    if (this.scene !== 'play' || this.paused) return;

    if (this.mode === 'caught') {
      this.caughtT += dt;
      if (this.caughtT > 1.9) this.respawn();
      return;
    }

    if (this.mode === 'investigate') { this.updateInvestigation(dt); this.updateFollowers(dt, false); return; }

    if (this.mode === 'free') {
      this.movePlayer(dt);
      // 逃走中は調査を発火させない。操作が止まっている間に怪異が歩いて来て、
      // 3人が棒立ちのまま捕まる（緊張感が消えるどころか理不尽になる）
      if (this.state.data.case_progress !== 'escape') {
        const hit = findTrigger(this.state, this.party.shirou);
        if (hit) this.startInvestigation(hit);
      }
    }

    this.updateFollowers(dt, this.moving);
    this.updateBanter(dt);
    this.updatePhases(dt);
    this.updateEscape(dt);
    this.updateArea(dt);

    if (this.camFocus) {
      this.camFocus.t -= dt;
      if (this.camFocus.t <= 0) this.camFocus = null;
    }
  }

  movePlayer(dt) {
    const running = this.state.data.case_progress === 'escape';
    const sp = running ? SPEED.run : SPEED.walk;
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
    const area = this.state.areaAt(p.x);
    p.y = Math.max(area.bandTop + 6, Math.min(area.bandBottom - 4, p.y));

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
    const escaping = this.state.data.case_progress === 'escape';
    // 逃走中は隊列を詰める。探索時の間隔のままだと、後ろの2人が
    // 常に怪異とプレイヤーの間に居ることになり、必ず追い越される
    const gaps = escaping ? [30, 56] : [95, 180];
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
      const offY = moving ? 0 : (i === 0 ? -30 : 34);
      let tx = target.x, ty = target.y + offY;

      // 怪異をよける。素通りさせると絵として壊れるし、緊張感も消える
      const a = this.anomaly;
      if (a.visible && a.fade > 0.3 && !a.high) {
        const ax = c.x - a.x, ay = c.y - a.y;
        const ad = Math.hypot(ax, ay);
        if (ad < 76) {
          const push = (76 - ad) / 76;
          tx += (ax / (ad || 1)) * push * 120;
          ty += (ay / (ad || 1)) * push * 90;
          if (ad < 46 && this.nearMissT <= 0 && this.state.data.case_progress === 'escape') {
            this.nearMissT = 3.2;
            this.r.shake = 0.55;
            this.audio.sting();
            this.say([{ who, text: who === 'rei' ? 'うわっ、来た！' : 'こっち来ないで！' }], { blocking: false });
          }
        }
      }

      const dx = tx - c.x, dy = ty - c.y;
      const d = Math.hypot(dx, dy);
      if (d > 1.5) {
        // 逃走中は追いつけないと置き去りになるので上限を上げる
        const base = escaping ? SPEED.run * 1.9 : SPEED.walk * 1.3;
        const sp = Math.min(d * 6.5, base);
        c.x += dx / d * sp * dt;
        c.y += dy / d * sp * dt;
        if (Math.abs(dx) > 2) this.facing[who] = dx > 0 ? 1 : -1;
      }

      // 追ってくる怪異より後ろへは絶対に残さない。
      // 追い越されると絵として破綻し、緊張感も消える
      if (escaping && a.chasing && a.visible) {
        const dir = Math.sign(this.objective.x - a.x) || 1;
        const behind = (c.x - a.x) * dir;
        if (behind < 58) {
          c.x = a.x + dir * 58;
          if (this.nearMissT <= 0) {
            this.nearMissT = 3.4;
            this.r.shake = 0.5;
            this.audio.sting();
            this.say([{ who, text: who === 'rei' ? '無理無理無理！' : '置いてかないで！' }], { blocking: false });
          }
        }
      }

      const area = this.state.areaAt(c.x);
      c.y = Math.max(area.bandTop + 4, Math.min(area.bandBottom - 2, c.y));
    });
    if (this.nearMissT > 0) this.nearMissT -= dt;
  }

  updateArea(dt) {
    const a = this.state.areaAt(this.party.shirou.x);
    if (a.name !== this.areaLabel.name) { this.areaLabel = { name: a.name, a: 1.6 }; }
    else this.areaLabel.a = Math.max(0, this.areaLabel.a - dt * 0.45);
  }

  // ------------------------------------------------------------ 描画

  draw() {
    const r = this.r, ctx = r.ctx;
    if (this.scene === 'title') { this.drawTitleBg(); return; }
    if (this.scene === 'epilogue') { this.drawEpilogue(); return; }

    const p = this.party.shirou;
    let cam = p.x;
    // 生還の瞬間は、鳥居の内と外の両方が同時に見える位置で止める
    if (this.mode === 'survive') cam = SAFE_ZONE.x - 58;
    else if (this.camFocus) {
      const k = 1 - Math.abs(this.camFocus.t - 0.85) / 0.85;
      cam = p.x + (this.camFocus.x - p.x) * Math.max(0, Math.min(1, k));
    }
    r.camX = cam;
    r.dark = this.state.data.case_progress === 'escape' ? 0.7 : 0;

    ctx.save();
    if (r.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 9 * r.shake, (Math.random() - 0.5) * 9 * r.shake);
    }

    r.drawSky();
    r.drawFar();
    r.drawMid();
    r.drawHouses();
    r.drawRoad();
    r.drawPoles();
    r.drawPowerLines();
    r.drawLampPools(this.lamps);
    r.drawProps(this.state);
    r.drawLampPosts(this.lamps);

    const ratio = this.guideRatio();
    if (ratio > 0 && this.objective && this.mode !== 'caught') {
      const path = truncate(buildPath(p, this.objective), ratio);
      r.drawGuideLine(path, this.t, this.state.data.case_progress === 'escape' ? 'escape' : 'normal');
    }

    // 逃走中は調査できないので、マークも出さない
    if (this.state.data.case_progress !== 'escape') {
      for (const pt of visiblePoints(this.state, p)) {
        const near = Math.hypot(pt.x - p.x, pt.y - p.y);
        r.drawMark(pt, this.t, pt.hidden ? Math.min(1, (150 - near) / 60) : 1);
      }
    }

    // 奥から手前へ並べて描く
    const ents = [
      { y: this.party.rei.y, f: () => r.drawPerson('rei', this.party.rei.x, this.party.rei.y, this.walkPhase - 0.7, this.facing.rei, { moving: this.moving, lookBack: this.anomaly.visible }) },
      { y: this.party.yotsuba.y, f: () => r.drawPerson('yotsuba', this.party.yotsuba.x, this.party.yotsuba.y, this.walkPhase - 1.4, this.facing.yotsuba, { moving: this.moving, lookBack: this.anomaly.visible }) },
      { y: p.y, f: () => r.drawPerson('shirou', p.x, p.y, this.walkPhase, this.facing.shirou, { moving: this.moving }) },
    ];
    if (this.anomaly.fade > 0.02) ents.push({ y: this.anomaly.high ? -50 : this.anomaly.y, f: () => r.drawAnomaly(this.anomaly) });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.f());

    r.drawForeground();
    r.drawVignette(this.state.data.case_progress === 'escape' ? 0.55 : 0.25);
    ctx.restore();

    r.drawAreaName(this.areaLabel.name, Math.min(1, this.areaLabel.a));

    for (const b of this.bubbles) {
      const c = this.party[b.who] || p;
      r.drawBubble(b.text, b.who, c.x, c.y);
    }

    if (this.mode === 'free') r.drawStick(this.input);

    if (this.mode === 'caught') {
      const k = Math.min(1, this.caughtT / 1.5);
      ctx.fillStyle = `rgba(0,0,0,${k})`;
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
    const label = this.state.data.case_progress === 'escape' ? 'CASE 01 / ESCAPE' : 'CASE 01';
    ctx.fillText(label, 16, 26);
    ctx.restore();
  }

  drawTitleBg() {
    const r = this.r;
    r.camX = 4900;
    r.drawSky(); r.drawFar(); r.drawMid(); r.drawRoad();
    r.drawTorii(SAFE_ZONE.x, SAFE_ZONE.y);
    r.drawVignette(0.5);
  }

  drawEpilogue() {
    const r = this.r, ctx = r.ctx, { W, H } = r;
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
    r.groundTop = H * 0.60; r.groundBottom = H * 0.92;
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
