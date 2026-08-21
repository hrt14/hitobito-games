// CASE 06「八尺様」の進行。追われない。回られる。
// 生還の動詞は「持ちこたえる」＝朝まで五枚の札を守る
// （SPEC §32 §35 §36、CASE06_SLICE §2）。
import { Vigil } from '../core/vigil.js';
import { Yashiki } from '../core/yashiki.js';

export class VigilMode {
  constructor(game) {
    this.g = game;
    this.c = game.c;
    this.vigil = new Vigil(this.c);
    this.k = new Yashiki(this.c);
    this.phase = 0;
    this.light = this.c.TRIGGERS.lightByPhase[0];
    this.warnT = 0;
    this.fixT = 0;
    this.granny = null;   // 仏間の祖母
    this.morning = false;
    this.repId = null;    // いま押さえている札と、押さえ始めた時の減り具合
    this.repFrom = 1;
  }

  get holding() { return this.g.state.data.case_progress === 'escape'; }

  setPhase(n) { this.phase = n; }

  // ---------------------------------------------------------------- 進行

  begin(cont) {
    const px = this.g.party.shirou.x;
    const T = this.c.TRIGGERS;
    let ph = 0;
    if (px > T.phase1AtX) ph = 1;
    if (px > T.phase2AtX) ph = 2;
    if (px > T.phase3AtX) ph = 3;
    if (cont && this.holding) ph = 4;
    this.setPhase(ph);
    this.light = T.lightByPhase[ph];
    if (ph >= 1 && ph < 4) this.k.showFar(this.g.party.shirou);
    if (ph >= 4) this.startVigil(true);
  }

  restore() {
    if (!this.holding) return false;
    this.startVigil(true);
    return true;
  }

  checkpoint(point) {
    const st = this.g.state;
    if (point.id === 'V1') st.setCheckpoint('CP1', this.g.party.shirou);
    if (point.id === 'V2') st.setCheckpoint('CP2', this.g.party.shirou);
    if (point.id === 'V3') st.setCheckpoint('CP3', this.g.party.shirou);
  }

  after(point) {
    if (point.id !== 'V4') return;
    // 家に入れてもらう。ここから先は逃げるゲームではなくなる
    const g = this.g;
    g.state.setCheckpoint('CP4', { x: 4460, y: 140 });
    g.mode = 'dialogue';
    g.input.setEnabled(false);
    g.audio.setMode('silent');
    g.audio.doorOpen();
    g.r.shake = 0.5;
    g.say(this.c.DIALOGUE.phase4, {
      blocking: true,
      onEnd: () => {
        g.setPartyAt(4460, 140);
        this.startVigil(false);
      },
    });
  }

  update(dt) {
    const g = this.g;
    const p = g.party.shirou;
    this.warnT = Math.max(0, this.warnT - dt);
    this.fixT = Math.max(0, this.fixT - dt);

    // 真昼 → 日が傾く → 夜 → 朝。
    // 朝は vigil を止めたあとに来る。止めた時点で夜の残りが読めなくなるので、
    // ここを見ないと明るくならずに夜へ戻ってしまう
    let want = this.morning ? 0.95 : this.c.TRIGGERS.lightByPhase[this.phase];
    if (this.holding && this.vigil.active) {
      const n = this.vigil.night;
      want = n < 0.86 ? 0.1 * (1 - n) : (n - 0.86) / 0.14 * 0.6;  // 最後に朝日
    }
    this.light += (want - this.light) * Math.min(1, dt * 0.5);
    g.r.light = this.light;

    this.k.update(dt, p, this.vigil.night, !!g.state.flags.has_charm && this.holding);
    // 窓は建具であって UI ではない。夜が明けても消えない
    g.r.wards = this.vigil.wards.length ? this.vigil.wards : null;
    g.r.repairing = this.vigil.repairing;
    g.r.inside = this.holding;
    g.r.yashiki = this.holding ? this.k : null;

    this.updatePhases();
    this.updateVigil(dt);
  }

  updatePhases() {
    const g = this.g;
    const D = this.c.DIALOGUE, T = this.c.TRIGGERS;
    const px = g.party.shirou.x;
    if (this.holding) return;
    if (g.mode !== 'free' || g.queue) return;

    if (this.phase === 0 && px > T.phase1AtX) {
      this.setPhase(1);
      this.k.showFar(g.party.shirou);
      g.audio.setMode('hush');
      g.say(D.phase1, { blocking: false });
    }

    if (this.phase === 1 && px > T.phase2AtX) {
      this.setPhase(2);
      g.audio.sting();
      g.say(D.phase2, { blocking: false });
    }

    // 声。祖母が飛び出してくる
    if (this.phase === 2 && px > T.phase3AtX) {
      this.setPhase(3);
      g.audio.setMode('silent');
      g.audio.voice();
      g.r.shake = 0.6;
      this.granny = { x: px + 150, y: 150 };
      g.mode = 'dialogue';
      g.input.setEnabled(false);
      g.say(D.phase3, {
        blocking: true,
        onIndex: i => { if (D.phase3[i].who === 'granny') g.audio.blip(300, 0.18, 0.04, 'triangle'); },
        onEnd: () => { g.mode = 'free'; g.input.setEnabled(true); },
      });
    }
  }

  // ---------------------------------------------------------------- 籠城

  startVigil(restored) {
    const g = this.g;
    g.state.data.case_progress = 'escape';
    g.state.save();
    this.morning = false;
    this.setPhase(4);
    g.mode = 'free';
    g.input.setEnabled(true);
    this.vigil.start(restored);
    this.k.circle(this.c.HOUSE);
    // 二人は仏間へ。守るのは一人（CASE06_SLICE §2「手が足りない」）
    this.granny = { x: this.c.HOUSE.x1 - 40, y: 158 };
    g.audio.setMode('silent');
    g.refreshObjective();
  }

  updateVigil(dt) {
    const g = this.g;
    if (!this.holding || g.mode === 'caught' || g.mode === 'survive') return;
    const p = g.party.shirou;
    const D = this.c.DIALOGUE;

    const ev = this.vigil.update(dt, p, this.k);
    g.refreshObjective();

    if (ev === 'lost') { this.onBrokenIn(); return; }
    if (ev === 'tear') {
      g.audio.caught();
      g.r.shake = 0.9;
      g.say(D.tear, { blocking: false });
      this.warnT = 4;
    }

    // 弱っている札があると仲間が言う。どれかは線が指す
    const w = this.vigil.weakest();
    if (w && w.s < this.c.VIGIL.warnAt && this.warnT <= 0) {
      this.warnT = 4.5;
      g.r.shake = 0.25;
      g.say(g.pick(D.warn, 'warn'), { blocking: false });
    }
    // 貼り直しきった。いま押さえている札を見る。
    // 一番弱い札で判定すると「五枚とも無事」のときしか言わない
    const rep = this.vigil.repairing
      && this.vigil.wards.find(x => x.id === this.vigil.repairing);
    if (this.vigil.repairing !== this.repId) {
      this.repId = this.vigil.repairing;
      this.repFrom = rep ? rep.s : 1;
    }
    // 剥がれかけていたものを戻した時だけ言う。
    // 満タンの札の前に立っているだけで褒められると嘘くさい
    if (rep && rep.s >= 1 && this.repFrom < 0.7 && this.fixT <= 0) {
      this.fixT = 7;
      this.repFrom = 1;
      g.audio.blip(320, 0.14, 0.03, 'triangle');
      g.say(g.pick(D.fixed, 'fixed'), { blocking: false });
    }

    if (this.vigil.done) this.onMorning();
  }

  onBrokenIn() {
    const g = this.g;
    g.mode = 'caught';
    g.caughtT = 0;
    this.vigil.stop();
    g.input.setEnabled(false);
    g.audio.caught();
    g.r.shake = 1.2;
    g.say(this.c.DIALOGUE.caught, { blocking: false });
  }

  onMorning() {
    const g = this.g;
    g.mode = 'survive';
    this.morning = true;
    this.vigil.stop();
    this.k.hide();
    g.input.setEnabled(false);
    const H = this.c.HOUSE;
    g.party.shirou = { x: H.x1 - 130, y: 150, z: 0 };
    g.party.rei = { x: H.x1 - 96, y: 162, z: 0 };
    g.party.yotsuba = { x: H.x1 - 62, y: 150, z: 0 };
    this.granny = { x: H.x1 - 26, y: 160 };
    g.trail = [];
    g.moving = false;
    g.facing = { shirou: 1, rei: 1, yotsuba: 1 };
    g.refreshObjective();   // 守る先はもう無い。線を消す
    g.audio.setMode('night');
    setTimeout(() => g.audio.relief(), 1600);
    g.say(this.c.DIALOGUE.survive, { blocking: true, onEnd: () => g.startEpilogue() });
  }

  // ---------------------------------------------------------------- 画

  // 行き先が無い。山場では**一番弱い札**を指す（CASE06_SLICE §2）
  objective() {
    if (!this.holding || !this.vigil.active) return null;
    const w = this.vigil.urgent(this.k, this.g.party.shirou);
    return w ? { x: w.x, y: w.y + 46 } : null;
  }

  guideRatio() {
    if (this.holding) return 1;
    return [1, 0.8, 0.6, 0.45][this.phase] ?? 0.45;
  }

  camera() { return null; }
  dark() { return 0; }
  vignette() { return this.holding ? 0.3 + (1 - this.light) * 0.3 : 0.18; }
  running() { return this.holding; }
  lookBack() { return this.k.visible && !this.holding; }
  showMarks() { return !this.holding && this.g.mode !== 'dialogue'; }
  caughtColor() { return '0,0,0'; }

  entities(r) {
    const out = [];
    if (this.k.fade > 0.02) out.push({ y: this.k.y, f: () => r.drawYashiki(this.k) });
    if (this.granny) out.push({ y: this.granny.y, f: () => r.drawGranny(this.granny) });
    return out;
  }

  overlay() {}
  screen(r) { if (this.vigil.active) r.drawNightBar(1 - this.vigil.night, this.vigil.wards); }

  anchor(who) {
    if (who !== 'granny' || !this.granny) return null;
    return { x: this.granny.x, y: this.granny.y, lift: 0 };
  }

  // 二人は仏間から出ない。守るのは一人（§9 §48）
  followerAdjust(who, c, t) {
    if (!this.holding) return;
    const H = this.c.HOUSE;
    t.tx = H.x1 - (who === 'rei' ? 100 : 66);
    t.ty = who === 'rei' ? 164 : 148;
  }

  followerClamp() {}

  // 秒数は出さない。夜の残りは画面上端のバーが持っている（§12 §17）
  hud() {
    if (!this.holding) return 'CASE 06';
    if (this.morning || this.vigil.night > 0.86) return 'CASE 06 / DAWN';
    return 'CASE 06 / VIGIL';
  }

  titleBg(r) {
    r.camX = 2600;
    r.light = 0.9;
    r.drawVillageBack();
    r.drawVignette(0.34);
  }
}
