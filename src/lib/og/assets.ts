import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ASSETS = join(process.cwd(), 'src/assets');

let fonts: Promise<Array<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }>> | null = null;

// Chakra Petch in the formats the image renderer reads (woff, not woff2).
export function loadOgFonts() {
  fonts ??= Promise.all(([500, 700] as const).map(async (weight) => {
    const file = await readFile(join(ASSETS, 'fonts', `chakra-petch-latin-${weight}-normal.woff`));
    return { name: 'Chakra Petch', data: file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer, weight, style: 'normal' as const };
  }));
  return fonts;
}

// Small JPEG copies of the profile photos (the renderer can't read webp),
// keyed by the same slug as getPlayerImagePath.
export async function loadPlayerPhoto(webPath: string | null) {
  if (!webPath) return null;
  const name = webPath.split('/').pop()?.replace(/\.\w+$/, '');
  if (!name) return null;
  try {
    const file = await readFile(join(ASSETS, 'players', `${name}.jpg`));
    return `data:image/jpeg;base64,${file.toString('base64')}`;
  } catch {
    return null;
  }
}
