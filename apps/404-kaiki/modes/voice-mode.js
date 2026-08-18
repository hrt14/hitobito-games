// CASE 04「人面犬」の進行。追われない。隣を歩かれる。
// 生還の動詞は「緑のラインを信じない」（SPEC §15-17 §32、CASE04_SLICE §2）。
import { Lure } from '../core/lure.js';
import { Ninmenken } from '../core/ninmenken.js';

export class VoiceMode {
  constructor(game) {
    this.g = game;
    this.c = game.c;
    this.lure = new Lure(this.c);
    this.k = new Ninmenken(this.c);
    this.phase = 0;
    this.denyT = -1;      // 仲間が否定するまでの残り
    this.talkT = 0;
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
    if (ph >= 4) this.startVoice(true);
  }

  restore() {
    this.k.hide();
    if (!this.escaping) return false;
    this.startVoice(true);
    return true;
  }

  checkpoint(point) {
    const st = this.g.state;
    if (point.id === 'D1') st.setCheckpoint('CP1', this.g.party.shirou);
    if (point.id === 'D2') st.setCheckpoint('CP2', this.g.party.shirou);
    if (point.id === 'D3') st.setCheckpoint('CP3', this.g.party.shirou);
  }

  after(point) {
    if (point.id !== 'D4') return;
    // 爪の跡。立って掻いた高さ。ここで「犬ではない」と分かる
    const g = this.g;
    // 路地の外を復帰点にする。路地の中から再開すると即死しかねない
    g.state.setCheckpoint('CP4', { x: g.party.shirou.x, y: 120 });
    g.mode = 'dialogue';
    g.input.setEnabled(false);
    g.audio.setMode('silent');
    g.audio.sting();
    g.r.shake = 0.7;
    g.say(this.c.DIALOGUE.phase4, {
      blocking: true,
      onIndex: i => { if (this.c.DIALOGUE.phase4[i].who === 'koe') g.audio.voice(); },
      onEnd: () => this.startVoice(false),
    });
  }

  update(dt) {
    const g = this.g;
    const p = g.party.shirou;
    this.k.update(dt, p);
    this.talkT = Math.max(0, this.talkT - dt);

    const want = this.c.TRIGGERS.duskByPhase[this.phase];
    this.dusk += (want - this.dusk) * Math.min(1, dt * 0.35);
    g.r.dusk = this.dusk;
    g.r.lying = this.lure.lying;

    this.updatePhases();
    this.updateVoice(dt);
  }

  updatePhases() {
    const g = this.g;
    const D = this.c.DIALOGUE, T = this.c.TRIGGERS;
    const px = g.party.shirou.x;
    if (this.escaping) return;
    if (g.mode !== 'free' || g.queue) return;

    if (this.phase === 0 && px > T.phase1AtX) {
      this.setPhase(1);
      g.audio.setMode('hush');
      g.audio.blip(320, 0.3, 0.045, 'sawtooth');
      g.say(D.phase1, { blocking: false });
    }

    if (this.phase === 1 && px > T.phase2AtX) {
      this.setPhase(2);
      g.audio.sting();
      g.r.shake = 0.35;
      g.say(D.phase2, { blocking: false });
    }

    // 路地の奥にいる。近づくと消える。顔だけ思い出せない
    if (this.phase === 2 && px > T.phase3AtX) {
      this.setPhase(3);
      const a = this.c.ALLEYS.find(x => x.x > px) || this.c.ALLEYS[this.c.ALLEYS.length - 1];
      this.k.waitAt(a);
      this.sighted = a;
      g.audio.setMode('silent');
      g.audio.sting();
      g.say(D.phase3, { blocking: false });
    }

    // 近づくと消える。触れて無反応だと緊張感が消える
    if (this.phase === 3 && this.k.visible && this.k.mode === 'wait') {
      const d = Math.hypot(px - this.k.x, g.party.shirou.y - this.k.y);
      if (d < 130) {
        this.k.hide();
        g.audio.blip(70, 0.7, 0.07, 'sawtooth');
        g.r.shake = 0.45;
      }
    }
  }

  // ---------------------------------------------------------------- 嘘

  startVoice(restored) {
    const g = this.g;
    g.state.data.case_progress = 'escape';
    g.state.save();
    this.setPhase(4);
    g.mode = 'free';
    g.input.setEnabled(true);
    this.k.walkWith(g.party.shirou);
    this.lure.start(!restored);
    this.denyT = -1;
    g.audio.setMode('silent');
    g.refreshObjective();
  }

  updateVoice(dt) {
    const g = this.g;
    if (!this.escaping || g.mode === 'caught' || g.mode === 'survive') return;
    const p = g.party.shirou;
    const L = this.c.LURE;

    const ev = this.lure.update(dt, p);
    if (ev === 'lie') {
      g.refreshObjective();
      this.k.talk();
      this.talkT = 2.2;
      const named = g.state.flags.has_collar;
      g.say(g.pick(named ? this.c.DIALOGUE.lureNamed : this.c.DIALOGUE.lure, 'lure'), { blocking: false });
      g.audio.voice();
      // 首輪を拾っていると、名前を呼ばれた分だけ否定が遅れる
      this.denyT = named ? L.warnDelayCollar : L.warnDelay;
    }
    if (ev === 'truth') {
      g.refreshObjective();
      this.denyT = -1;
      g.say(g.pick(this.c.DIALOGUE.clear, 'clear'), { blocking: false });
    }

    // 仲間の否定。線が嘘をついていることを教える唯一の確実な合図
    if (this.denyT >= 0) {
      this.denyT -= dt;
      if (this.denyT < 0) g.say(g.pick(this.c.DIALOGUE.deny, 'deny'), { blocking: false });
    }

    // 路地の奥まで入った＝ついて行った
    if (this.lure.caught(p)) { this.onFollowed(); return; }

    const S = this.c.SAFE_ZONE;
    if (Math.hypot(p.x - S.x, p.y - S.y) < 78) this.onSurvive();
  }

  onFollowed() {
    const g = this.g;
    g.mode = 'caught';
    g.caughtT = 0;
    this.lure.stop();
    g.input.setEnabled(false);
    g.audio.caught();
    g.r.shake = 1.0;
    // 路地の奥で待っている
    this.k.visible = true;
    this.k.mode = 'wait';
    this.k.x = g.party.shirou.x;
    this.k.y = g.party.shirou.y - 60;
    g.say(this.c.DIALOGUE.caught, { blocking: false });
  }

  onSurvive() {
    const g = this.g;
    const S = this.c.SAFE_ZONE;
    g.mode = 'survive';
    this.lure.stop();
    g.input.setEnabled(false);
    // 3人は交番の灯りの中。人面犬は灯りの外で止まる（§32）
    g.party.shirou = { x: S.x, y: S.y + 26, z: 0 };
    g.party.rei = { x: S.x - 34, y: S.y + 38, z: 0 };
    g.party.yotsuba = { x: S.x + 32, y: S.y + 44, z: 0 };
    g.trail = [];
    g.moving = false;
    g.facing = { shirou: -1, rei: -1, yotsuba: -1 };
    this.k.visible = true;
    this.k.mode = 'wait';
    this.k.x = S.x - 190;
    this.k.y = 150;
    g.audio.setMode('silent');
    setTimeout(() => { g.audio.setMode('night'); g.audio.relief(); }, 2400);
    g.say(this.c.DIALOGUE.survive, { blocking: true, onEnd: () => g.startEpilogue() });
  }

  // ---------------------------------------------------------------- 画

  // 緑のラインが指す先。嘘のときだけ路地の奥になる
  objective() {
    if (!this.escaping) return null;
    return this.lure.objective({ ...this.c.SAFE_ZONE });
  }

  // 路地へ入れるように帯を伸ばす。engine への唯一の追加
  bandAt(x, area) {
    for (const a of this.c.ALLEYS) {
      if (Math.abs(x - a.x) > a.w / 2) continue;
      return { bandTop: a.deep, bandBottom: area.bandBottom };
    }
    return area;
  }

  guideRatio() {
    if (this.escaping) return 1;
    return [1, 0.85, 0.7, 0.5][this.phase] ?? 0.5;
  }

  camera() { return null; }
  dark() { return 0; }
  vignette() { return this.escaping ? 0.45 : 0.28; }
  running() { return this.escaping; }
  lookBack() { return this.k.visible && this.k.mode === 'wait'; }
  showMarks() { return !this.escaping && this.g.mode !== 'dialogue'; }
  caughtColor() { return '0,0,0'; }

  entities(r) {
    if (this.k.fade <= 0.02) return [];
    return [{ y: this.k.y, f: () => r.drawNinmenken(this.k) }];
  }

  overlay() {}
  screen() {}

  // 声の吹き出しは人面犬の位置から出す
  anchor(who) {
    if (who !== 'koe') return null;
    return { x: this.k.x, y: this.k.y, lift: 10 };
  }

  followerAdjust() {}
  followerClamp() {}

  hud() { return this.escaping ? 'CASE 04 / VOICE' : 'CASE 04'; }

  titleBg(r) {
    r.camX = 2400;
    r.dusk = 0.5;
    r.drawNightSky();
    r.drawShops();
    r.drawStreet();
    r.drawArcade();
    r.drawVignette(0.5);
  }
}
