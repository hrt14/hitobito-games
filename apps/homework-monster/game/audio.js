// 宿題モンスター — 音（仕様 12.3）
//
// 外部素材を使わず、Web Audio API の簡易音で作る。
// BGMと効果音は個別にOFFできる。

let ctx = null;
let master = null;
let bgmTimer = null;
let bgmGain = null;
let settings = { bgm: false, sfx: true };

function ensureContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

export function setAudioSettings(next) {
  settings = { ...settings, ...next };
  if (!settings.bgm) stopBgm();
}

/** 最初のタップで鳴らせる状態にする */
export function unlockAudio() {
  const audio = ensureContext();
  if (audio && audio.state === 'suspended') audio.resume();
  if (settings.bgm) startBgm();
}

function tone({ freq = 440, type = 'sine', start = 0, dur = 0.15, gain = 0.2, slideTo = null }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env);
  env.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ start = 0, dur = 0.18, gain = 0.12 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const length = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2400, t0);
  filter.frequency.exponentialRampToValueAtTime(700, t0 + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(env);
  env.connect(master);
  src.start(t0);
}

const SOUNDS = {
  tap: () => tone({ freq: 620, type: 'sine', dur: 0.09, gain: 0.14 }),
  soft: () => tone({ freq: 420, type: 'sine', dur: 0.12, gain: 0.1 }),
  slice: () => {
    noise({ dur: 0.2, gain: 0.14 });
    tone({ freq: 1200, type: 'triangle', dur: 0.12, gain: 0.08, slideTo: 400 });
  },
  complete: () => {
    tone({ freq: 523, type: 'triangle', dur: 0.14, gain: 0.16 });
    tone({ freq: 784, type: 'triangle', start: 0.1, dur: 0.22, gain: 0.16 });
  },
  feed: () => {
    tone({ freq: 220, type: 'sine', dur: 0.1, gain: 0.16, slideTo: 160 });
    tone({ freq: 240, type: 'sine', start: 0.14, dur: 0.1, gain: 0.14, slideTo: 170 });
    tone({ freq: 260, type: 'sine', start: 0.28, dur: 0.12, gain: 0.12, slideTo: 180 });
  },
  growth: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => tone({ freq, type: 'triangle', start: i * 0.11, dur: 0.26, gain: 0.16 }));
    tone({ freq: 1319, type: 'sine', start: 0.5, dur: 0.6, gain: 0.12 });
  },
  sparkle: () => {
    tone({ freq: 1046, type: 'sine', dur: 0.1, gain: 0.1 });
    tone({ freq: 1568, type: 'sine', start: 0.08, dur: 0.14, gain: 0.08 });
  },
  rest: () => tone({ freq: 330, type: 'sine', dur: 0.5, gain: 0.09, slideTo: 220 }),
  chime: () => {
    tone({ freq: 880, type: 'sine', dur: 0.3, gain: 0.12 });
    tone({ freq: 1174, type: 'sine', start: 0.18, dur: 0.35, gain: 0.1 });
  },
};

export function playSound(name) {
  if (!settings.sfx) return;
  const audio = ensureContext();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume();
  SOUNDS[name]?.();
}

const BGM_NOTES = [392, 523, 587, 659, 523, 440, 392, 330];

export function startBgm() {
  if (!settings.bgm || bgmTimer) return;
  const audio = ensureContext();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume();

  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.055;
  bgmGain.connect(master);

  let step = 0;
  const playStep = () => {
    if (!bgmGain) return;
    const freq = BGM_NOTES[step % BGM_NOTES.length];
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(1, t0 + 0.15);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
    osc.connect(env);
    env.connect(bgmGain);
    osc.start(t0);
    osc.stop(t0 + 1);
    step += 1;
  };

  playStep();
  bgmTimer = setInterval(playStep, 900);
}

export function stopBgm() {
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = null;
  if (bgmGain) {
    try {
      bgmGain.disconnect();
    } catch (_) {
      /* 破棄済みなら無視 */
    }
  }
  bgmGain = null;
}
