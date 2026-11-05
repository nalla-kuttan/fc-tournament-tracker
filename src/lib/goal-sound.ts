// A short goal celebration synthesised with Web Audio: a crowd roar that
// swells and fades, under two blasts of a stadium horn. No audio files.

const PREF_KEY = 'fc-goal-sound';

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

function noiseBuffer(ctx: AudioContext) {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  const length = Math.floor(ctx.sampleRate * 3);
  noise = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = noise.getChannelData(channel);
    // Brownish noise: warmer and more like a crowd than white noise.
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return noise;
}

function roar(ctx: AudioContext, out: AudioNode, at: number) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 700;
  band.Q.value = 0.5;
  // A slow wobble so it breathes like a crowd rather than hissing.
  const swell = ctx.createGain();
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = 5.5;
  depth.gain.value = 0.12;
  lfo.connect(depth).connect(swell.gain);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(4, at + 0.3);
  env.gain.setValueAtTime(4, at + 1.4);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 2.9);
  source.connect(band).connect(swell).connect(env).connect(out);
  source.start(at);
  lfo.start(at);
  source.stop(at + 3);
  lfo.stop(at + 3);
}

function horn(ctx: AudioContext, out: AudioNode, at: number, length: number) {
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 1600;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.22, at + 0.04);
  env.gain.setValueAtTime(0.22, at + length - 0.08);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length);
  tone.connect(env).connect(out);
  for (const frequency of [233, 293.7, 349.2]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = frequency;
    osc.connect(tone);
    osc.start(at);
    osc.stop(at + length + 0.02);
  }
}

export function playGoalSound() {
  const ctx = audio();
  if (!ctx) return;
  // Called from a tap, so resuming is allowed even where autoplay is blocked.
  if (ctx.state === 'suspended') void ctx.resume();
  const at = ctx.currentTime + 0.02;
  const master = ctx.createGain();
  master.gain.value = 0.6;
  const limiter = ctx.createDynamicsCompressor();
  master.connect(limiter).connect(ctx.destination);
  roar(ctx, master, at);
  horn(ctx, master, at, 0.32);
  horn(ctx, master, at + 0.42, 0.7);
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
