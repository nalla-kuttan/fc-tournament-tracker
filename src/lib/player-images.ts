const PLAYER_IMAGE_BY_SLUG: Record<string, string> = {
  alex: '/players/alex.webp',
  arshad: '/players/arshad.webp',
  basil: '/players/basil.webp',
  moamen: '/players/moamen.webp',
  ruban: '/players/ruban-profile.webp',
};

function slugifyPlayerName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)[0]
    ?.replace(/[^a-z0-9-]/g, '') ?? '';
}

export function getPlayerImagePath(name: string) {
  return PLAYER_IMAGE_BY_SLUG[slugifyPlayerName(name)] ?? null;
}
