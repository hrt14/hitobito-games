// CASE 03「テケテケ」の進行。追われない。速すぎて逃げられない。
// 生還の動詞は「上がる」＝通過されるとき地面にいないこと（SPEC §32、CASE03_SLICE §2）。
import { Elevation } from '../core/elevation.js';
import { Pass } from '../core/pass.js';
import { TekeTeke } from '../core/teketeke.js';

export class PassMode {
  constructor(game) {
    this.g = game;
    this.c = game.c;
    this.elev = new Elevation(this.c);
    this.pass = new Pass(this.c);
    this.k = new TekeTeke(this.c);
    this.phase = 0;
    this.warnT = 0;
    this.lowT = 0;         // 「そこ低い」を言い過ぎないため
    this.glimpseT = 0;     // PHASE 2 の横切り演出
    this.cpAt = null;      // 復帰点を置いた台
    this.dusk = this.c.TRIGGERS.duskByPhase[0];
  }

  get escaping() { return this.g.state.data.case_progress === 'escape'; }

  setPhase(n) { this.phase = n; }

  // ---------------------------------------------------------------- 進行

  begin(cont) {
    const px = this.g.party.shirou.x;
    const T = this.c.TRIGGERS;
    let ph = 0;
    if (px > T.phase1AtX) ph = 1;
    if (px > T.phase2AtX) ph = 2;
    if (px > T.phase3AtX) ph = 3;
    if (cont && this.escaping) ph = 4;
    this.setPhase(ph);
    this.dusk = T.duskByPhase[ph];
    this.elev.reset();
    if (ph >= 4) this.startPasses(true);
  }

  restore() {
    this.elev.reset();
    this.k.hide();
    if (!this.escaping) return false;
    this.startPasses(true);
    return true;
  }

  checkpoint(point) {
    const st = this.g.state;
    if (point.id === 'S1') st.setCheckpoint('CP1', this.g.party.shirou);
    if (point.id === 'S2') st.setCheckpoint('CP2', this.g.party.shirou);
    if (point.id === 'S3') st.setCheckpoint('CP3', this.g.party.shirou);
  }

  after(point) {
    if (point.id !== 'S4') return;
    // 手のひらの跡。足跡が無い。ここで「地面を這うもの」だと分かる
    const g = this.g;
    g.state.setCheckpoint('CP4', g.party.shirou);
    g.mode = 'dialogue';
    g.input.setEnabled(false);
    g.audio.setMode('silent');
    g.audio.sting();
    g.r.shake = 0.8;
    g.say(this.c.DIALOGUE.phase4, { blocking: true, onEnd: () => this.startPasses(false) });
  }

  // 踏切の音。イヤホンを入れてからは四郎に届かない。
  // 日常音が「なくなる」ことを恐怖に使う（SPEC §51 §52）
  bellSound() {
    const g = this.g;
    const m = g.state.flags.has_earbud ? 0.16 : 1;
    g.audio.blip(880, 0.13, 0.05 * m, 'square');
    setTimeout(() => g.audio.blip(700, 0.13, 0.045 * m, 'square'), 250);
  }

  update(dt) {
    const g = this.g;
    const p = g.party.shirou;
    this.elev.update(dt, p);
    this.k.update(dt, p);
    this.warnT = Math.max(0, this.warnT - dt);
    this.lowT = Math.max(0, this.lowT - dt);
    this.glimpseT = Math.max(0, this.glimpseT - dt);

    const want = this.c.TRIGGERS.duskByPhase[this.phase];
    this.dusk += (want - this.dusk) * Math.min(1, dt * 0.35);
    g.r.dusk = this.dusk;
    g.r.bell = this.pass.pressure;
    g.r.crossing = this.pass.crossing;

    // 仲間も同じ台に乗る。3人とも上がっている絵にする
    for (const who of ['rei', 'yotsuba']) {
      const c = g.party[who];
      const t = this.elev.platformAt(c);
      const wz = t ? t.h : 0;
      c.z = (c.z || 0) + (wz - (c.z || 0)) * Math.min(1, dt * (wz > (c.z || 0) ? 9 : 15));
    }

    this.updatePhases();
    this.updatePasses(dt);
  }

  updatePhases() {
    const g = this.g;
    const D = this.c.DIALOGUE, T = this.c.TRIGGERS;
    const px = g.party.shirou.x;
    if (this.escaping) return;
    // 調査や会話に割り込むと、調査側の onEnd が捨てられて操作が戻らなくなる
    if (g.mode !== 'free' || g.queue) return;

    if (this.phase === 0 && px > T.phase1AtX) {
      this.setPhase(1);
      g.audio.setMode('hush');
      this.bellSound();
      g.say(D.phase1, { blocking: false });
    }

    // 何かが低く速く横切る。まだ姿は見せない
    if (this.phase === 1 && px > T.phase2AtX) {
      this.setPhase(2);
      this.glimpseT = 0.7;
      this.k.cross(g.party.shirou);
      this.k.reached = true;      // この回は測られない
      g.audio.blip(150, 0.35, 0.05, 'sawtooth');
      g.r.shake = 0.45;
      g.say(D.phase2, { blocking: false });
    }

    if (this.phase === 2 && px > T.phase3AtX) {
      this.setPhase(3);
      g.audio.setMode('silent');
      g.audio.sting();
      g.say(D.phase3, { blocking: false });
    }
  }

  // ---------------------------------------------------------------- 通過

  startPasses(restored) {
    const g = this.g;
    g.state.data.case_progress = 'escape';
    g.state.save();
    this.setPhase(4);
    g.mode = 'free';
    g.input.setEnabled(true);
    this.pass.start(!restored);
    g.audio.setMode('silent');
    g.refreshObjective();
  }

  updatePasses(dt) {
    const g = this.g;
    if (!this.escaping || g.mode === 'caught' || g.mode === 'survive') return;
    const p = g.party.shirou;
    const area = g.state.areaAt(p.x);

    const ev = this.pass.update(dt, area);
    if (ev === 'warn') {
      this.bellSound();
      // 音が届かなくなった分、警告は仲間の声が担う（UIを人にやらせる・§9 §48）
      const cool = g.state.flags.has_earbud ? 1.6 : 4.0;
      if (this.warnT <= 0) {
        this.warnT = cool;
        g.say(g.pick(this.c.DIALOGUE.warn, 'warn'), { blocking: false });
      }
    }
    if (ev === 'cross') {
      this.k.cross(p);
      g.audio.blip(120, 0.5, 0.07, 'sawtooth');
      g.r.shake = 0.6;
    }
    if (ev === 'clear') {
      this.k.hide();
      if (this.warnT <= 0) {
        this.warnT = 3.6;
        g.say(g.pick(this.c.DIALOGUE.safe, 'safe'), { blocking: false });
      }
    }

    // 「乗った瞬間」ではなく「上がりきった時」を復帰点にする。
    // 乗った瞬間は z がまだ 0 なので、safe() と同時には成立しない（§35 §36）
    if (this.elev.on && this.elev.safe()) {
      if (this.cpAt !== this.elev.on.id) {
        this.cpAt = this.elev.on.id;
        g.state.setCheckpoint('PT', p);
        g.audio.blip(300, 0.12, 0.03, 'triangle');
      }
    } else if (!this.elev.on) {
      this.cpAt = null;
    }
    // 低い台に乗っているのに安心している時だけ言う
    if (this.pass.warning && this.elev.on && !this.elev.safe() && this.lowT <= 0) {
      this.lowT = 5.0;
      g.say(g.pick(this.c.DIALOGUE.tooLow, 'low'), { blocking: false });
    }

    // 真横に来た瞬間だけ高さを測られる
    if (this.k.atPlayer(p)) {
      if (!this.elev.safe()) { this.onTaken(); return; }
      g.r.shake = 0.5;
    }

    const S = this.c.SAFE_ZONE;
    // 跨線橋は「たどり着く」だけでなく「上がりきる」必要がある
    if (Math.hypot(p.x - S.x, p.y - S.y) < 84 && this.elev.z > 80) this.onSurvive();
  }

  onTaken() {
    const g = this.g;
    g.mode = 'caught';
    g.caughtT = 0;
    this.pass.stop();
    g.input.setEnabled(false);
    g.audio.caught();
    g.r.shake = 1.2;
    g.say(this.c.DIALOGUE.caught, { blocking: false });
  }

  onSurvive() {
    const g = this.g;
    const S = this.c.SAFE_ZONE;
    g.mode = 'survive';
    this.pass.stop();
    this.k.hide();
    g.input.setEnabled(false);
    // 3人は橋の上。テケテケは下の線路を通り過ぎて、そのまま行く（§32）
    g.party.shirou = { x: S.x + 8, y: S.y, z: 96 };
    g.party.rei = { x: S.x - 34, y: S.y + 8, z: 96 };
    g.party.yotsuba = { x: S.x + 46, y: S.y + 14, z: 96 };
    this.elev.z = 96;
    g.trail = [];
    g.moving = false;
    g.facing = { shirou: -1, rei: -1, yotsuba: -1 };
    g.audio.setMode('silent');
    setTimeout(() => { g.audio.setMode('night'); g.audio.relief(); }, 2400);
    g.say(this.c.DIALOGUE.survive, { blocking: true, onEnd: () => g.startEpilogue() });
  }

  // ---------------------------------------------------------------- 画

  objective() { return this.escaping ? { ...this.c.SAFE_ZONE } : null; }

  guideRatio() {
    if (this.escaping) return 1;
    return [1, 0.8, 0.6, 0.4][this.phase] ?? 0.4;
  }

  camera() { return null; }
  dark() { return 0; }
  vignette() { return this.escaping ? 0.4 : 0.2; }
  running() { return this.escaping; }
  lookBack() { return this.k.visible; }
  showMarks() { return !this.escaping && this.g.mode !== 'dialogue'; }
  caughtColor() { return '0,0,0'; }

  entities(r) {
    if (!this.k.visible) return [];
    return [{ y: this.k.y + 1, f: () => r.drawTekeTeke(this.k) }];
  }

  overlay() {}
  screen(r) { r.drawBell(this.pass.pressure); }

  anchor() { return null; }
  followerAdjust() {}
  followerClamp() {}

  hud() { return this.escaping ? 'CASE 03 / PASS' : 'CASE 03'; }

  titleBg(r) {
    r.camX = 5600;
    r.dusk = 0.6;
    r.drawEveningSky();
    r.drawSchoolProps({ state: null });
    r.drawGround();
    r.drawVignette(0.45);
  }
}
