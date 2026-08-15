// CASE 02「くねくね」の進行。追われない。見て理解してしまうと戻れない。
// 生還の動詞は「見ない」＝遮蔽の陰を渡って家まで帰る（SPEC §32、CASE02_SLICE §2）。
import { Kunekune } from '../core/kunekune.js';
import { Sight } from '../core/sight.js';

export class SightMode {
  constructor(game) {
    this.g = game;
    this.c = game.c;
    this.k = new Kunekune(this.c);
    this.sight = new Sight(this.c);
    this.phase = 0;
    this.peekT = 0;      // 双眼鏡を覗いている時間
    this.warnT = 0;      // 警告のクールダウン
    this.dusk = this.c.TRIGGERS.duskByPhase[0];
  }

  get escaping() { return this.g.state.data.case_progress === 'escape'; }

  setPhase(n) {
    this.phase = n;
    this.k.setPhase(n);
  }

  // ---------------------------------------------------------------- 進行

  begin(cont) {
    // どこまで進んでいたかを世界の側から復元する
    const px = this.g.party.shirou.x;
    const T = this.c.TRIGGERS;
    let ph = 0;
    if (px > T.phase1AtX) ph = 1;
    if (px > T.phase2AtX) ph = 2;
    if (px > T.phase3AtX) ph = 3;
    if (cont && this.escaping) ph = 4;
    this.setPhase(ph);
    this.dusk = T.duskByPhase[ph];
    if (ph >= 1) this.k.show(this.g.party.shirou);
    if (ph >= 4) this.startRun(true);
  }

  restore() {
    if (!this.escaping) return false;
    this.startRun(true);
    return true;
  }

  checkpoint(point) {
    const st = this.g.state;
    if (point.id === 'Q1') st.setCheckpoint('CP1', this.g.party.shirou);
    if (point.id === 'Q2') st.setCheckpoint('CP2', this.g.party.shirou);
    if (point.id === 'Q3') st.setCheckpoint('CP3', this.g.party.shirou);
  }

  after(point) {
    if (point.id !== 'Q4') return;
    // 案山子の位置が変わっていた。ここで「見てはいけないもの」だと分かる
    const g = this.g;
    g.state.setCheckpoint('CP4', g.party.shirou);
    g.mode = 'dialogue';
    g.input.setEnabled(false);
    g.audio.setMode('silent');
    g.audio.sting();
    g.r.shake = 0.8;
    g.say(this.c.DIALOGUE.phase4, {
      blocking: true,
      onEnd: () => this.startRun(false),
    });
  }

  update(dt) {
    const g = this.g;
    this.k.update(dt, g.party.shirou);
    this.peekT = Math.max(0, this.peekT - dt);
    this.warnT = Math.max(0, this.warnT - dt);
    // 日が落ちていく。PHASE が進むほど暗い
    const want = this.c.TRIGGERS.duskByPhase[this.phase];
    this.dusk += (want - this.dusk) * Math.min(1, dt * 0.35);
    g.r.dusk = this.dusk;
    g.r.understanding = this.sight.active ? this.sight.understanding : 0;
    g.r.sightActive = this.sight.active;
    g.r.coverId = this.sight.coverId;

    this.updatePhases(dt);
    this.updateRun(dt);
  }

  updatePhases() {
    const g = this.g;
    const D = this.c.DIALOGUE, T = this.c.TRIGGERS;
    const px = g.party.shirou.x;
    if (this.escaping) return;
    // 調査中や会話中に割り込むと、調査側の onEnd が捨てられて操作が戻らなくなる。
    // 位置で判定しているので、手が空くまで待てばそのまま発火する
    if (g.mode !== 'free' || g.queue) return;

    if (this.phase === 0 && px > T.phase1AtX) {
      this.setPhase(1);
      this.k.show(g.party.shirou);
      g.audio.setMode('hush');
      g.audio.blip(140, 0.6, 0.04, 'sine');
      g.say(D.phase1, { blocking: false });
    }

    if (this.phase === 1 && px > T.phase2AtX) {
      this.setPhase(2);
      g.audio.sting();
      g.say(D.phase2, { blocking: false });
    }

    // 双眼鏡で覗いてしまう。装置を拾わせて、使わせて、後悔させる
    if (this.phase === 2 && px > T.phase3AtX && g.state.flags.has_binoculars) {
      this.setPhase(3);
      g.mode = 'dialogue';
      g.input.setEnabled(false);
      g.audio.setMode('silent');
      g.say(D.phase3, {
        blocking: true,
        onIndex: i => {
          if (i === 2) {           // 「……」四郎が黙る
            this.peekT = 3.2;
            this.sight.peek(this.c.KUNEKUNE.peek);
            g.r.understanding = this.c.KUNEKUNE.peek;
            g.audio.blip(58, 1.4, 0.08, 'sawtooth');
            g.r.shake = 0.7;
          }
        },
        onEnd: () => {
          g.mode = 'free';
          g.input.setEnabled(true);
          g.r.understanding = 0;
        },
      });
    }
  }

  // ---------------------------------------------------------------- 帰り道

  startRun(restored) {
    const g = this.g;
    g.state.data.case_progress = 'escape';
    g.state.save();
    this.setPhase(4);
    g.mode = 'free';
    g.input.setEnabled(true);
    this.k.active = true;
    if (!this.k.visible) this.k.show(g.party.shirou);
    // 双眼鏡で見た分が残っている。まっさらからは始まらない
    this.sight.start(restored ? 0 : this.c.KUNEKUNE.carry);
    g.audio.setMode('silent');
    g.refreshObjective();
  }

  updateRun(dt) {
    const g = this.g;
    if (!this.escaping || g.mode === 'caught' || g.mode === 'survive') return;
    const p = g.party.shirou;

    this.sight.update(dt, p, this.k);

    // 陰に入った時点を復帰点にする。山場のたびに Q4 まで戻されると理不尽になる
    if (this.sight.justEntered()) {
      g.state.setCheckpoint('CV', p);
      g.audio.blip(210, 0.16, 0.03, 'sine');
      if (this.warnT <= 0) {
        this.warnT = 5.5;
        g.say(g.pick(this.c.DIALOGUE.safe, 'safe'), { blocking: false });
      }
    }
    // 陰から出て、そのまま上がり続けている時だけ声を出す
    if (!this.sight.inCover && this.sight.understanding > 0.55 && this.warnT <= 0) {
      this.warnT = 4.2;
      g.r.shake = 0.3;
      g.say(g.pick(this.c.DIALOGUE.warn, 'warn'), { blocking: false });
    }

    if (this.sight.lost) { this.onUnderstood(); return; }

    const S = this.c.SAFE_ZONE;
    if (Math.hypot(p.x - S.x, p.y - S.y) < 74) this.onSurvive();
  }

  // 「捕まる」ではなく「分かってしまう」。死因が違う（CASE02_SLICE §0）
  onUnderstood() {
    const g = this.g;
    g.mode = 'caught';
    g.caughtT = 0;
    this.sight.stop();
    g.input.setEnabled(false);
    g.audio.blip(1180, 1.6, 0.07, 'sine');
    g.r.shake = 1.0;
    g.say(this.c.DIALOGUE.caught, { blocking: false });
  }

  onSurvive() {
    const g = this.g;
    const S = this.c.SAFE_ZONE;
    g.mode = 'survive';
    this.sight.stop();
    g.input.setEnabled(false);
    // 玄関に三人。くねくねは田の向こうに立ったまま動かない
    g.party.shirou = { x: S.x, y: S.y + 30 };
    g.party.rei = { x: S.x - 34, y: S.y + 44 };
    g.party.yotsuba = { x: S.x + 30, y: S.y + 52 };
    g.trail = [];
    g.moving = false;
    g.facing = { shirou: 1, rei: 1, yotsuba: -1 };
    g.r.understanding = 0;
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
  vignette() { return this.escaping ? 0.42 : 0.2; }
  running() { return this.escaping; }
  lookBack() { return false; }   // くねくねは後ろではなく前にいる
  showMarks() { return !this.escaping && this.g.mode !== 'dialogue'; }
  caughtColor() { return '255,255,255'; }  // 暗転ではなく白飛び

  entities(r) {
    if (this.k.fade <= 0.02) return [];
    return [{ y: this.k.y, f: () => r.drawKunekune(this.k, this.sight.understanding) }];
  }

  overlay() {}

  screen(r) {
    if (this.sight.active) r.drawUnderstanding(this.sight.understanding);
    if (this.peekT > 0) r.drawBinoculars(Math.min(1, this.peekT / 0.5));
  }

  anchor() { return null; }
  followerAdjust() {}
  followerClamp() {}

  hud() { return this.escaping ? 'CASE 02 / SIGHT' : 'CASE 02'; }

  titleBg(r) {
    r.camX = 3900;
    r.dusk = 0.55;
    r.drawDuskSky(); r.drawMountains(); r.drawPaddies(); r.drawFarmRoad();
    r.drawFieldPoles();
    r.drawVignette(0.45);
  }
}
