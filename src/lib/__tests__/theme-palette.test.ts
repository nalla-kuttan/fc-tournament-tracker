import { describe, expect, it } from 'vitest';
import { BRAND_COLORS } from '@/design-tokens';
import { FORM_COLORS, FORM_TEXT_COLOR } from '@/lib/constants';

function relativeLuminance(hex: string) {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)!
    .map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('brand palette', () => {
  it('maps the supplied colors to their intended UI roles', () => {
    expect(BRAND_COLORS.coral).toBe('#EA6C56');
    expect(BRAND_COLORS.frenchBlue).toBe('#334075');
    expect(BRAND_COLORS.nightBordeaux).toBe('#621122');
  });

  it('keeps primary-button text readable on vibrant coral', () => {
    expect(contrastRatio(BRAND_COLORS.ink, BRAND_COLORS.coral)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps body text readable on the dark bordeaux surface', () => {
    expect(contrastRatio(BRAND_COLORS.text, BRAND_COLORS.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(Object.entries(FORM_COLORS))('keeps the %s form badge letter readable', (_, background) => {
    expect(contrastRatio(FORM_TEXT_COLOR, background)).toBeGreaterThanOrEqual(4.5);
  });
});
