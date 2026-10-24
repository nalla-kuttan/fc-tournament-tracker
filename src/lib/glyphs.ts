// The maths behind the decode loading effect: GlyphSkeleton draws a drifting
// field of glyphs while data loads, and DecodeReveal scrambles the real text
// that replaces it, resolving in a wave from the centre.

// Light to heavy, so the field can shade by intensity.
export const DECODE_GLYPHS = '.:-=+*#%@';

const WAVE_MS = 320;      // how long the wave takes to reach the furthest text
const STAGGER_MS = 9;     // per character, left to right
const MAX_STAGGER_MS = 220;
const SCRAMBLE_MS = 140;  // every character scrambles at least this long

function hash(x: number, y: number, k: number) {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// The glyph in cell (x, y) of the loading field at time t (seconds): a soft
// diagonal wave with a little per-cell flicker. A space leaves the cell empty.
export function fieldGlyph(x: number, y: number, t: number): string {
  const wave = 0.5 + 0.5 * Math.sin(x * 0.42 + y * 0.9 - t * 4.2);
  const flicker = hash(x, y, Math.floor(t * 12));
  const v = wave * 0.75 + flicker * 0.35 - 0.3;
  if (v <= 0.12) return ' ';
  return DECODE_GLYPHS[Math.min(DECODE_GLYPHS.length - 1, Math.floor(v * DECODE_GLYPHS.length))];
}

// When (ms after the reveal starts) each character of `text` settles.
// `distance` is 0 at the centre of the wave and 1 at its furthest edge.
export function revealTimes(text: string, distance: number): number[] {
  const start = Math.min(1, Math.max(0, distance)) * WAVE_MS;
  return Array.from(text, (_, i) => start + Math.min(i * STAGGER_MS, MAX_STAGGER_MS) + SCRAMBLE_MS);
}

// Whitespace and zero-width characters (MUI hides a zero-width space inside
// input outlines): scrambling these would make something invisible appear.
const INVISIBLE = /[\s​-‍⁠﻿]/;

// One frame of `original` decoding: settled characters show as themselves,
// the rest as random glyphs. Whitespace never changes, so lines don't reflow,
// and emoji are left alone (they are a single character, never half of one).
export function decodeText(original: string, times: number[], elapsed: number, random: () => number = Math.random): string {
  let out = '';
  Array.from(original).forEach((char, i) => {
    const keep = INVISIBLE.test(char) || char.length > 1 || elapsed >= times[i];
    out += keep ? char : DECODE_GLYPHS[Math.floor(random() * DECODE_GLYPHS.length)];
  });
  return out;
}
