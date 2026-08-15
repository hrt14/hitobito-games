// CASE 01「口裂け女」の進行。追われて、逃げて、鳥居をくぐる（生還の動詞＝逃げる）。
// Game 側は「歩く・調べる・喋る」だけを持ち、怪異の型はここに閉じる（SPEC §32 §71）。
import { Anomaly } from '../core/anomaly.js';
import { Chase } from '../core/chase.js';

const HOME = { x: 220, y: 130 };

export class ChaseMode {
  constructor(game) {
    this.g = game;
    this.c = game.c;
    this.anomaly = new Anomaly(this.c);
    this.chase = new Chase(this.c);
    this.goingHome = false;
    this.sightingTimer = 0;
    this.sightIndex = 0;
    this.nearMissT = 0;
  }

  get escaping() { return this.g.state.data.case_progress === 'escape'; }

  // ---------------------------------------------------------------- 進行

  begin(cont) {
    const st = this.g.state;
    if (cont && st.data.case_progress === 'escape') this.startEscape(true);
    this.goingHome = st.isDone('P5');
    if (this.goingHome && !this.escaping) this.anomaly.setPhase(3);
  }

  restore() {
    if (!this.escaping) return false;
    this.g.lamps = this.c.SCENERY.lamps.map(
      l => ({ ...l, on: l.x < this.g.party.shirou.x - 90 ? false : l.on }));
    this.startEscape(true);
    return true;   // Game 側の「自由行動に戻す」処理を飛ばす
  }

  checkpoint(point) {
    const st = this.g.state;
    if (point.id === 'P1') st.setCheckpoint('CP1', this.g.party.shirou);
    if (point.id === 'P3') st.setCheckpoint('CP2', this.g.party.shirou);
    if (point.id === 'P5') st.setCheckpoint('CP3', this.g.party.shirou);
  }

  after(point) {
    const g = this.g;
    if (point.id === 'P4') {
      // PHASE 2：遠景（SPEC §25）
      this.anomaly.setPhase(2);
      this.anomaly.showFar(g.party.shirou, 1);
      g.audio.setMode('hush');
      g.audio.sting();
      g.say(this.c.DIALOGUE.phase2, { blocking: false });
    }
    if (point.id === 'P5') {
      this.goingHome = true;
      this.anomaly.setPhase(3);
      this.sightIndex = 0;
      g.say(this.c.DIALOGUE.goHome, { blocking: false });
      g.refreshObjective();
    }
  }

  update(dt) {
    this.anomaly.update(dt);
    if (this.nearMissT > 0) this.nearMissT -= dt;
    this.updatePhases(dt);
    this.updateEscape(dt);
  }

  updatePhases(dt) {
    const g = this.g;
    const D = this.c.DIALOGUE, T = this.c.TRIGGERS;
    const px = g.party.shirou.x;
    const a = this.anomaly;

    if (a.phase === 0 && px > T.phase1AtX) {
      a.setPhase(1);
      g.audio.setMode('hush');
      const near = g.lamps.find(l => Math.abs(l.x - px) < 460 && l.on);
      if (near) near.on = false;
      g.audio.blip(120, 0.5, 0.05, 'sawtooth');
      g.say(D.phase1, { blocking: false });
    }

    // PHASE 3：帰り道での接近（何度か確認できる）
    if (this.goingHome && a.phase === 3 && !this.escaping) {
      const th = T.phase3FromX[this.sightIndex];
      if (th !== undefined && px < th && !a.visible) {
        a.showNear(g.party.shirou, -1); // 帰る方向の先に立っている
        this.sightingTimer = 3.4;
        g.audio.sting();
        const lines = D.phase3[this.sightIndex];
        if (lines) g.say(lines, { blocking: false });
        this.sightIndex++;
      }
      if (a.visible) {
        this.sightingTimer -= dt;
        if (this.sightingTimer <= 0) a.hide();
      }
    }

    // 遠くの人影に近づくと消える。触れて無反応だと緊張感が消える
    if (a.visible && !a.chasing && !this.escaping) {
      const d = Math.hypot(px - a.x, g.party.shirou.y - a.y);
      if (d < 150) {
        a.hide();
        this.sightingTimer = 0;
        g.audio.blip(64, 0.8, 0.08, 'sawtooth');
        g.r.shake = 0.5;
        g.say(g.pick(D.vanish, 'vanish'), { blocking: false });
      }
    }

    // PHASE 4：完全出現
    if (this.goingHome && a.phase < 4 && px < T.phase4AtX && !this.escaping) {
      // 問いかけの場面。近すぎず、画面に二者が収まる距離で向かい合う
      a.appear(g.party.shirou, px - 262);
      // 3人を固めて、全員が女の方を向く（散っていると誰かが画面外に出る）
      g.party.rei = { x: px + 46, y: g.party.shirou.y - 26 };
      g.party.yotsuba = { x: px + 26, y: g.party.shirou.y + 30 };
      g.trail = [];
      g.moving = false;
      g.facing = { shirou: -1, rei: -1, yotsuba: -1 };
      g.audio.setMode('silent');
      g.audio.sting();
      g.r.shake = 0.9;
      g.mode = 'dialogue';
      g.input.setEnabled(false);
      const UNMASK_AT = 4; // 「これでも？」でマスクを外す
      g.say(D.phase4, {
        blocking: true,
        onIndex: i => {
          if (i === UNMASK_AT) {
            a.unmask();
            g.audio.reveal();
            g.r.shake = 1.1;
          } else if (D.phase4[i] && D.phase4[i].who === 'kuchisake') {
            g.audio.voice();
          }
        },
        onEnd: () => { this.startEscape(false); },
      });
    }
  }

  // ---------------------------------------------------------------- 逃走

  startEscape(restored) {
    const g = this.g;
    g.state.data.case_progress = 'escape';
    g.state.setCheckpoint('CP4', g.party.shirou);
    g.state.save();
    g.mode = 'free';
    g.input.setEnabled(true);
    this.anomaly.setPhase(4);
    this.anomaly.unmask();
    // 対峙の直後はその場から追い始める。復帰時だけ距離を作り直す
    this.chase.start(this.anomaly, g.party.shirou, restored ? -320 : null);
    // 会話が終わった瞬間に詰められると反応できない。一拍だけ動かない
    if (!restored) this.chase.block = 0.9;
    g.audio.setMode('silent');
    g.refreshObjective();
    if (restored) this.anomaly.visible = true;
  }

  updateEscape(dt) {
    const g = this.g;
    if (!this.escaping || g.mode === 'caught' || g.mode === 'survive') return;
    const p = g.party.shirou;

    this.chase.update(dt, this.anomaly, p);

    // 通り過ぎた街灯から順に消えていく
    for (const l of g.lamps) if (l.on && l.x < p.x - 90) l.on = false;

    // 先回りして道をふさぐ
    const cut = this.c.TRIGGERS.cutAheadAtX[this.chase.cutIndex];
    if (cut !== undefined && p.x > cut) {
      this.chase.cutAhead(this.anomaly, p, 1, 430);
      g.audio.sting();
      g.r.shake = 0.7;
      g.say(this.c.DIALOGUE.cutAhead, { blocking: false });
    }

    if (this.chase.caught) { this.onCaught(); return; }

    const S = this.c.SAFE_ZONE;
    if (Math.hypot(p.x - S.x, p.y - S.y) < 74) this.onSurvive();
  }

  onCaught() {
    const g = this.g;
    g.mode = 'caught';
    g.caughtT = 0;
    this.chase.stop(this.anomaly);
    g.input.setEnabled(false);
    g.audio.caught();
    g.r.shake = 1.2;
    g.say(this.c.DIALOGUE.caught, { blocking: false });
  }

  onSurvive() {
    const g = this.g;
    const S = this.c.SAFE_ZONE;
    g.mode = 'survive';
    this.chase.stop(this.anomaly);
    g.input.setEnabled(false);
    // 3人は鳥居をくぐって境内へ入る。怪異は道の側で止まる（SPEC §32）
    g.party.shirou = { x: S.x + 6, y: 14 };
    g.party.rei = { x: S.x - 36, y: 22 };
    g.party.yotsuba = { x: S.x + 44, y: 26 };
    g.trail = [];
    g.moving = false;
    this.anomaly.x = S.x - 120;
    this.anomaly.y = 96; // 境内には入らず、道の側に立ち止まる
    this.anomaly.chasing = false;
    g.audio.setMode('silent');
    setTimeout(() => { g.audio.setMode('night'); g.audio.relief(); }, 2200);
    g.say(this.c.DIALOGUE.survive, { blocking: true, onEnd: () => g.startEpilogue() });
  }

  // ---------------------------------------------------------------- 画

  objective() {
    if (this.escaping) return { ...this.c.SAFE_ZONE };
    if (this.goingHome) return HOME;
    return null;
  }

  guideRatio() {
    if (this.escaping) return 1;
    const ph = this.anomaly.phase;
    if (ph >= 4) return 0;
    if (ph === 3) return Math.sin(this.g.t * 2.2) > -0.3 ? 0.45 : 0; // 途切れる
    if (ph === 2) return 0.72;
    return 1;
  }

  camera(p) {
    const g = this.g;
    // 生還の瞬間は、鳥居の内と外の両方が同時に見える位置で止める
    if (g.mode === 'survive') return this.c.SAFE_ZONE.x - 46;
    // 問いかけの場面は、3人と女の両方が画面に入る位置で止める
    if (g.mode === 'dialogue' && this.anomaly.visible) return (p.x + this.anomaly.x) / 2;
    return null;
  }

  dark()     { return this.escaping ? 0.7 : 0; }
  caughtColor() { return '0,0,0'; }
  vignette() { return this.escaping ? 0.55 : 0.25; }
  running()  { return this.escaping; }
  lookBack() { return this.anomaly.visible; }
  showMarks() {
    return !this.escaping && !(this.g.mode === 'dialogue' && this.anomaly.visible);
  }

  entities(r) {
    if (this.anomaly.fade <= 0.02) return [];
    return [{
      y: this.anomaly.high ? -50 : this.anomaly.y,
      f: () => r.drawAnomaly(this.anomaly),
    }];
  }

  overlay() {}
  screen() {}

  // 吹き出しの持ち主。口裂け女は背が高いので持ち上げる
  anchor(who) {
    if (who !== 'kuchisake') return null;
    return { x: this.anomaly.x, y: this.anomaly.y, lift: 62 };
  }

  // 仲間が怪異を避ける／追い越されない（SPEC §49）
  followerAdjust(who, c, t) {
    const g = this.g, a = this.anomaly;
    if (a.visible && a.fade > 0.3 && !a.high) {
      const ax = c.x - a.x, ay = c.y - a.y;
      const ad = Math.hypot(ax, ay);
      if (ad < 76) {
        const push = (76 - ad) / 76;
        t.tx += (ax / (ad || 1)) * push * 120;
        t.ty += (ay / (ad || 1)) * push * 90;
        if (ad < 46 && this.nearMissT <= 0 && this.escaping) {
          this.nearMissT = 3.2;
          g.r.shake = 0.55;
          g.audio.sting();
          g.say([{ who, text: who === 'rei' ? 'うわっ、来た！' : 'こっち来ないで！' }], { blocking: false });
        }
      }
    }
  }

  followerClamp(who, c) {
    const g = this.g, a = this.anomaly;
    if (!this.escaping || !a.chasing || !a.visible) return;
    const dir = Math.sign(g.objective.x - a.x) || 1;
    if ((c.x - a.x) * dir < 58) {
      c.x = a.x + dir * 58;
      if (this.nearMissT <= 0) {
        this.nearMissT = 3.4;
        g.r.shake = 0.5;
        g.audio.sting();
        g.say([{ who, text: who === 'rei' ? '無理無理無理！' : '置いてかないで！' }], { blocking: false });
      }
    }
  }

  hud() { return this.escaping ? 'CASE 01 / ESCAPE' : 'CASE 01'; }

  titleBg(r) {
    r.camX = 4900;
    r.drawSky(); r.drawFar(); r.drawMid(); r.drawRoad();
    r.drawTorii(this.c.SAFE_ZONE.x, this.c.SAFE_ZONE.y);
    r.drawVignette(0.5);
  }
}
