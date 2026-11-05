// A goal horn synthesised with Web Audio, so no audio files ship: one long,
// deep, brassy blast like an arena goal horn, echoing round the stadium,
// with the crowd going up underneath.

const PREF_KEY = 'fc-goal-sound';
const HORN_LENGTH = 2.8;

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let hall: AudioBuffer | null = null;
let brass: PeriodicWave | null = null;

function audio() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

// Brown noise, warmer and more crowd-like than white noise.
function noiseBuffer(ctx: AudioContext) {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  const length = Math.floor(ctx.sampleRate * 4);
  noise = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = noise.getChannelData(channel);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return noise;
}

// A stadium-sized echo: decaying stereo noise as the reverb impulse.
function hallBuffer(ctx: AudioContext) {
  if (hall && hall.sampleRate === ctx.sampleRate) return hall;
  const length = Math.floor(ctx.sampleRate * 2.6);
  hall = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = hall.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 2.4) * (t < 0.03 ? t / 0.03 : 1);
    }
  }
  return hall;
}

// Rich, slowly falling harmonics: the buzzy, brassy tone of a horn.
function brassWave(ctx: AudioContext) {
  if (brass) return brass;
  const harmonics = 40;
  const real = new Float32Array(harmonics);
  const imag = new Float32Array(harmonics);
  for (let n = 1; n < harmonics; n++) imag[n] = 1 / n ** 0.75;
  brass = ctx.createPeriodicWave(real, imag);
  return brass;
}

// Soft clipping, for the blare of a horn driven hard.
function drive(ctx: AudioContext) {
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(2.2 * x) / Math.tanh(2.2);
  }
  shaper.curve = curve;
  shaper.oversample = '2x';
  return shaper;
}

function horn(ctx: AudioContext, out: AudioNode, at: number) {
  const end = at + HORN_LENGTH;

  const body = ctx.createGain();
  body.gain.value = 0.16;

  // The bell: cut the rumble, lift the honk, and let the tone open up as
  // the air pressure builds.
  const lowCut = ctx.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = 70;
  const honk = ctx.createBiquadFilter();
  honk.type = 'peaking';
  honk.frequency.value = 900;
  honk.Q.value = 1.1;
  honk.gain.value = 7;
  const bright = ctx.createBiquadFilter();
  bright.type = 'lowpass';
  bright.Q.value = 0.8;
  bright.frequency.setValueAtTime(350, at);
  bright.frequency.exponentialRampToValueAtTime(3200, at + 0.18);
  bright.frequency.setValueAtTime(3200, end - 0.3);
  bright.frequency.exponentialRampToValueAtTime(500, end + 0.25);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(1.15, at + 0.09);
  env.gain.exponentialRampToValueAtTime(1, at + 0.3);
  env.gain.setValueAtTime(1, end - 0.15);
  env.gain.exponentialRampToValueAtTime(0.0001, end + 0.3);

  body.connect(drive(ctx)).connect(lowCut).connect(honk).connect(bright).connect(env).connect(out);

  // A deep root with a fifth and an octave, each a pair of slightly
  // detuned voices so it sounds thick, like several horns at once.
  const root = 138.6; // C#3
  for (const [ratio, level] of [[0.5, 0.55], [1, 1], [1.5, 0.6], [2, 0.35]] as const) {
    for (const cents of [-7, 6]) {
      const osc = ctx.createOscillator();
      osc.setPeriodicWave(brassWave(ctx));
      osc.detune.value = cents;
      const pitch = root * ratio;
      // Scoops up into pitch as it starts, sags as the air runs out.
      osc.frequency.setValueAtTime(pitch * 0.9, at);
      osc.frequency.exponentialRampToValueAtTime(pitch, at + 0.14);
      osc.frequency.setValueAtTime(pitch, end - 0.1);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.96, end + 0.3);
      const voice = ctx.createGain();
      voice.gain.value = level;
      osc.connect(voice).connect(body);
      osc.start(at);
      osc.stop(end + 0.35);
    }
  }
}

function roar(ctx: AudioContext, out: AudioNode, at: number) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 800;
  band.Q.value = 0.5;
  const swell = ctx.createGain();
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = 5.5;
  depth.gain.value = 0.12;
  lfo.connect(depth).connect(swell.gain);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(2.2, at + 0.5);
  env.gain.setValueAtTime(2.2, at + 2.6);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 4);
  source.connect(band).connect(swell).connect(env).connect(out);
  source.start(at);
  lfo.start(at);
  source.stop(at + 4);
  lfo.stop(at + 4);
}

export function playGoalSound() {
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const at = ctx.currentTime + 0.03;

  const master = ctx.createGain();
  master.gain.value = 0.6;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.ratio.value = 12;
  master.connect(limiter).connect(ctx.destination);

  // Dry signal plus the stadium echo.
  const echo = ctx.createConvolver();
  echo.buffer = hallBuffer(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  echo.connect(wet).connect(master);
  const mix = ctx.createGain();
  mix.connect(master);
  mix.connect(echo);

  horn(ctx, mix, at);
  roar(ctx, mix, at + 0.15);
}

// Browsers only allow sound after a tap. Call this from one (a TV left on a
// page that nobody has touched can't play the horn otherwise).
export function unlockGoalSound() {
  const ctx = audio();
  if (ctx?.state === 'suspended') void ctx.resume();
}

export function goalSoundEnabled() {
  try {
    return window.localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setGoalSoundEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(PREF_KEY, enabled ? 'on' : 'off');
  } catch {
    // Private mode: the choice lasts for this visit only.
  }
}
