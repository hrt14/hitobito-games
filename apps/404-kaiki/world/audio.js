// 音（SPEC §51 §52）
// 怪異専用BGMは流さない。日常音を先に作り、それが「なくなる」ことを恐怖に使う。
export class Ambience {
  constructor() {
    this.ctx = null;
    this.ok = false;
    this.mode = 'night';
    this.nodes = {};
  }

  start() {
    if (this.ok) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);

      // 虫の音：ホワイトノイズを高域だけ通す
      const noise = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noise.buffer = buf;
      noise.loop = true;

      const bug = ctx.createBiquadFilter();
      bug.type = 'bandpass';
      bug.frequency.value = 4600;
      bug.Q.value = 8;
      const bugGain = ctx.createGain();
      bugGain.gain.value = 0.05;
      noise.connect(bug).connect(bugGain).connect(master);
      noise.start();

      // 遠くの車・電線のうなり
      const hum = ctx.createOscillator();
      hum.type = 'sawtooth';
      hum.frequency.value = 54;
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.value = 180;
      const humGain = ctx.createGain();
      humGain.gain.value = 0.035;
      hum.connect(humFilter).connect(humGain).connect(master);
      hum.start();

      this.nodes = { master, bugGain, humGain, hum };
      this.ok = true;
    } catch { this.ok = false; }
  }

  resume() { if (this.ok && this.ctx.state === 'suspended') this.ctx.resume(); }

  ramp(node, value, time) {
    if (!node) return;
    const t = this.ctx.currentTime;
    node.gain.cancelScheduledValues(t);
    node.gain.setValueAtTime(node.gain.value, t);
    node.gain.linearRampToValueAtTime(value, t + time);
  }

  // night: 日常音あり / hush: 減る / silent: 消える（＝いる）
  setMode(mode) {
    if (!this.ok || this.mode === mode) return;
    this.mode = mode;
    if (mode === 'night')  { this.ramp(this.nodes.bugGain, 0.05, 1.4); this.ramp(this.nodes.humGain, 0.035, 1.4); }
    if (mode === 'hush')   { this.ramp(this.nodes.bugGain, 0.014, 1.0); this.ramp(this.nodes.humGain, 0.02, 1.0); }
    if (mode === 'silent') { this.ramp(this.nodes.bugGain, 0.0, 0.5);  this.ramp(this.nodes.humGain, 0.0, 0.5); }
  }

  blip(freq, dur, gain, type) {
    if (!this.ok) return;
    try {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(this.nodes.master);
      o.start();
      o.stop(ctx.currentTime + dur + 0.02);
    } catch { /* 音は演出。失敗しても進行は止めない */ }
  }

  step()      { this.blip(90 + Math.random() * 30, 0.07, 0.05, 'triangle'); }
  doorKnob()  { this.blip(180, 0.12, 0.07, 'square'); }
  doorOpen()  { this.blip(70, 0.6, 0.06, 'sawtooth'); }
  found()     { this.blip(520, 0.18, 0.05); setTimeout(() => this.blip(690, 0.22, 0.045), 90); }
  unlock()    { this.blip(300, 0.3, 0.06, 'triangle'); setTimeout(() => this.blip(420, 0.4, 0.05, 'triangle'), 140); }
  sting()     { this.blip(48, 1.1, 0.09, 'sawtooth'); }
  // 女の声。人の声には寄せず、低く濁った音を短く重ねる
  voice() {
    this.blip(132, 0.42, 0.05, 'sawtooth');
    setTimeout(() => this.blip(98, 0.5, 0.04, 'square'), 70);
  }
  // マスクを外す瞬間
  reveal() {
    this.blip(210, 0.16, 0.07, 'square');
    setTimeout(() => this.blip(44, 1.4, 0.11, 'sawtooth'), 130);
  }
  caught()    { this.blip(60, 0.9, 0.12, 'square'); }
  relief()    { this.blip(392, 0.5, 0.05); setTimeout(() => this.blip(523, 0.7, 0.045), 220); }
}
