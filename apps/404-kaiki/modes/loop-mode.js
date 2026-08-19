// CASE 05「きさらぎ駅」の進行。歩き回る怪異がいない。怪異は駅そのもの。
// 生還の動詞は「気づく」＝毎周ひとつだけ違うものの所まで歩く
// （SPEC §11 §12 §32、CASE05_SLICE §2）。
import { Loop } from '../core/loop.js';

export class LoopMode {
  constructor(game) {
    this.g = game;
    this.c = game.c;
    this.loop = new Loop(this.c);
    this.phase = 0;
    this.decay = 0;
    this.trainT = 0;      // 電車が入ってきている時間
    this.seamT = 0;       // 縫い目を越えた直後（デバッグ用）
    this.laps = 0;
  }

  get looping() { return this.g.state.data.case_progress === 'escape'; }

  setPhase(n) { this.phase = n; }

  // ---------------------------------------------------------------- 進行

  begin(cont) {
    const px = this.g.party.shirou.x;
    const T = this.c.TRIGGERS;
    let ph = 0;
    if (px > T.phase1AtX) ph = 1;
    if (px > T.phase2AtX) ph = 2;
    if (px > T.phase3AtX) ph = 3;
    if (cont && this.looping) ph = 4;
    this.setPhase(ph);
    this.decay = T.decayByPhase[ph];
    if (ph >= 4) this.startLoop(true);
  }

  restore() {
    if (!this.looping) return false;
    this.startLoop(true);
    return true;
  }

  checkpoint(point) {
    const st = this.g.state;
    if (point.id === 'N1') st.setCheckpoint('CP1', this.g.party.shirou);
    if (point.id === 'N2') st.setCheckpoint('CP2', this.g.party.shirou);
    if (point.id === 'N3') st.setCheckpoint('CP3', this.g.party.shirou);
  }

  after(point) {
    if (point.id !== 'N4') return;
    // 改札を出たはずが、またホームにいる
    const g = this.g;
    g.state.setCheckpoint('CP4', { x: 150, y: 130 });
    g.mode = 'dialogue';
    g.input.setEnabled(false);
    g.audio.setMode('silent');
    g.audio.sting();
    g.r.shake = 0.6;
    g.say(this.c.DIALOGUE.phase4, {
      blocking: true,
      onEnd: () => {
        // 台詞の通り、ホームに戻す。ここだけは「戻された」と分からせる
        g.setPartyAt(150, 130);
        this.startLoop(false);
      },
    });
  }

  update(dt) {
    const g = this.g;
    this.trainT = Math.max(0, this.trainT - dt);
    this.seamT = Math.max(0, this.seamT - dt);

    const want = Math.max(this.c.TRIGGERS.decayByPhase[this.phase], this.loop.decay);
    this.decay += (want - this.decay) * Math.min(1, dt * 0.4);
    g.r.decay = this.decay;
    g.r.change = this.looping ? this.loop.change : null;
    g.r.noticed = this.loop.noticed;
    g.r.exitOpen = this.loop.done;

    this.updatePhases();
    this.updateLoop(dt);
  }

  updatePhases() {
    const g = this.g;
    const D = this.c.DIALOGUE, T = this.c.TRIGGERS;
    const px = g.party.shirou.x;
    if (this.looping) return;
    if (g.mode !== 'free' || g.queue) return;

    if (this.phase === 0 && px > T.phase1AtX) {
      this.setPhase(1);
      g.audio.setMode('hush');
      g.audio.blip(660, 0.2, 0.04, 'sine');
      setTimeout(() => g.audio.blip(520, 0.3, 0.035, 'sine'), 220);
      g.say(D.phase1, { blocking: false });
    }

    if (this.phase === 1 && px > T.phase2AtX) {
      this.setPhase(2);
      g.audio.setMode('silent');
      g.say(D.phase2, { blocking: false });
    }

    // 電車が来る。誰も乗らない。行ってしまう
    if (this.phase === 2 && px > T.phase3AtX) {
      this.setPhase(3);
      this.trainT = 9.0;
      g.audio.blip(90, 1.8, 0.07, 'sawtooth');
      g.r.shake = 0.5;
      g.say(D.phase3, { blocking: false });
    }
  }

  // ---------------------------------------------------------------- 周回

  startLoop(restored) {
    const g = this.g;
    g.state.data.case_progress = 'escape';
    g.state.save();
    this.setPhase(4);
    g.mode = 'free';
    g.input.setEnabled(true);
    this.loop.start(!restored);
    g.audio.setMode('silent');
    g.refreshObjective();
  }

  updateLoop(dt) {
    const g = this.g;
    if (!this.looping || g.mode === 'caught' || g.mode === 'survive') return;
    const p = g.party.shirou;
    const D = this.c.DIALOGUE;

    if (!this.loop.done) {
      const ev = this.loop.update(dt, g.state.flags.has_ticket);
      if (ev === 'hint1' && !g.queue) g.say(g.pick(D.hint1, 'hint1'), { blocking: false });
      if (ev === 'hint2' && !g.queue) {
        const ch = this.loop.change;
        if (ch) g.say([{ who: 'yotsuba', text: this.placeOf(ch) }], { blocking: false });
      }

      // 変わっているものの所まで歩いた＝気づいた
      if (this.loop.near(p) && g.mode === 'free') {
        const ch = this.loop.change;
        const last = this.loop.notice();
        g.audio.found();
        g.r.shake = 0.5;
        g.mode = 'dialogue';
        g.input.setEnabled(false);
        g.say(D[ch.id] || [], {
          blocking: true,
          onEnd: () => {
            g.mode = 'free';
            g.input.setEnabled(true);
            // 見つけても周は終わらない。縫い目まで歩く
            if (last) this.breakLoop();
          },
        });
        return;
      }
    }

    if (this.loop.done) {
      const S = this.c.SAFE_ZONE;
      if (Math.hypot(p.x - S.x, p.y - S.y) < 80) this.onSurvive();
    }
  }

  // 輪が切れた。無かったはずの階段が現れる
  breakLoop() {
    const g = this.g;
    g.audio.unlock();
    g.r.shake = 0.8;
    g.camFocus = { x: this.c.SAFE_ZONE.x, t: 1.8 };
    g.refreshObjective();
  }

  // ヨツバが場所を言う。同時にマークが戻る
  placeOf(ch) {
    const a = this.g.state.areaAt(ch.x);
    return `${a.name}。あそこ`;
  }

  // engine への唯一の追加。縫い目で x を巻き戻す。
  // 暗転もフェードも入れない。入れると「一周した」と教えてしまう
  onMoved(p) {
    if (!this.looping) return;
    const S = this.c.SEAM;
    if (p.x < S.wrapAt) return;
    const back = S.wrapAt - S.enterAt;
    p.x -= back;
    for (const who of ['rei', 'yotsuba']) this.g.party[who].x -= back;
    for (const t of this.g.trail) t.x -= back;
    this.laps++;
    this.seamT = 0.6;
    const g = this.g;
    const ev = this.loop.crossSeam();
    if (ev === 'lost') { this.onTaken(); return; }
    if (!ev) return;              // 輪は切れている。数えない
    g.audio.blip(140, 0.5, 0.04, 'sine');
    if (!g.queue) {
      const lines = ev === 'miss' ? this.c.DIALOGUE.miss : this.c.DIALOGUE.lapTop;
      g.say(g.pick(lines, 'lap'), { blocking: false });
    }
  }

  onTaken() {
    const g = this.g;
    g.mode = 'caught';
    g.caughtT = 0;
    this.loop.stop();
    g.input.setEnabled(false);
    g.audio.caught();
    g.r.shake = 1.0;
    this.trainT = 6;
    g.say(this.c.DIALOGUE.caught, { blocking: false });
  }

  onSurvive() {
    const g = this.g;
    const S = this.c.SAFE_ZONE;
    g.mode = 'survive';
    this.loop.stop();
    g.input.setEnabled(false);
    g.party.shirou = { x: S.x, y: S.y + 20, z: 0 };
    g.party.rei = { x: S.x - 32, y: S.y + 32, z: 0 };
    g.party.yotsuba = { x: S.x + 30, y: S.y + 38, z: 0 };
    g.trail = [];
    g.moving = false;
    g.facing = { shirou: 1, rei: 1, yotsuba: 1 };
    g.audio.setMode('silent');
    setTimeout(() => { g.audio.setMode('night'); g.audio.relief(); }, 2400);
    g.say(this.c.DIALOGUE.survive, { blocking: true, onEnd: () => g.startEpilogue() });
  }

  // ---------------------------------------------------------------- 画

  objective() {
    if (!this.looping) return null;
    // 輪が切れるまでは目的地が無い。線も出さない（自分で探す）
    if (!this.loop.done) return null;
    return { ...this.c.SAFE_ZONE };
  }

  // 周回中は線を出さない。これがこのCASEの一番大きい引き算
  guideRatio() {
    if (this.looping) return this.loop.done ? 1 : 0;
    return [1, 0.85, 0.7, 0.5][this.phase] ?? 0.5;
  }

  camera() { return null; }
  dark() { return 0; }
  vignette() { return 0.3 + this.decay * 0.3; }
  running() { return this.looping && this.loop.done; }
  lookBack() { return false; }
  showMarks() {
    if (this.g.mode === 'dialogue') return false;
    return !this.looping || this.loop.showMarks();
  }
  caughtColor() { return '0,0,0'; }

  entities() { return []; }   // 描く怪異がいない
  overlay() {}
  screen() {}
  anchor() { return null; }
  followerAdjust() {}
  followerClamp() {}

  hud() {
    if (!this.looping) return 'CASE 05';
    if (this.loop.done) return 'CASE 05 / EXIT';
    return `CASE 05 / LOOP ${this.loop.lap}`;
  }

  titleBg(r) {
    r.camX = 800;
    r.decay = 0.35;
    r.drawStationBack();
    r.drawVignette(0.5);
  }
}
