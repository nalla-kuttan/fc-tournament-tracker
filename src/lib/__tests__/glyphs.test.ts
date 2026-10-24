import { describe, expect, it } from 'vitest';
import { DECODE_GLYPHS, decodeText, fieldGlyph, revealTimes } from '../glyphs';

const fixedRandom = () => 0.42;

describe('fieldGlyph', () => {
  it('returns a glyph from the ramp or a space, deterministically', () => {
    for (let x = 0; x < 30; x++) {
      const glyph = fieldGlyph(x, 3, 1.25);
      expect(glyph === ' ' || DECODE_GLYPHS.includes(glyph)).toBe(true);
      expect(fieldGlyph(x, 3, 1.25)).toBe(glyph);
    }
  });

  it('changes over time', () => {
    const row = (t: number) => Array.from({ length: 40 }, (_, x) => fieldGlyph(x, 2, t)).join('');
    expect(row(0)).not.toBe(row(0.6));
  });
});

describe('revealTimes', () => {
  it('starts later the further the text is from the wave centre, within the budget', () => {
    const near = revealTimes('Players', 0);
    const far = revealTimes('Players', 1);
    expect(far[0]).toBeGreaterThan(near[0]);
    expect(Math.max(...far)).toBeLessThanOrEqual(700);
  });

  it('reveals characters in reading order', () => {
    const times = revealTimes('Standings', 0.5);
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
  });
});

describe('decodeText', () => {
  const original = 'Dex 2–1 Marco';
  const times = revealTimes(original, 0.3);

  it('keeps the length and the spaces, so the layout holds', () => {
    const frame = decodeText(original, times, 0, fixedRandom);
    expect(frame).toHaveLength(original.length);
    [...original].forEach((char, i) => { if (char === ' ') expect(frame[i]).toBe(' '); });
  });

  it('scrambles unresolved characters into glyphs', () => {
    const frame = decodeText(original, times, 0, fixedRandom);
    [...frame].forEach((char, i) => { if (original[i] !== ' ') expect(DECODE_GLYPHS).toContain(char); });
  });

  it('never splits an emoji into broken halves', () => {
    const text = '🏆 3 titles';
    const frame = decodeText(text, revealTimes(text, 0), 0, fixedRandom);
    expect(frame.startsWith('🏆 ')).toBe(true);
    expect(Array.from(frame)).toHaveLength(Array.from(text).length);
  });

  it('leaves invisible zero-width characters invisible', () => {
    const text = '\u200B';
    expect(decodeText(text, revealTimes(text, 0), 0, fixedRandom)).toBe(text);
  });

  it('ends as the original text', () => {
    expect(decodeText(original, times, Math.max(...times), fixedRandom)).toBe(original);
  });
});
