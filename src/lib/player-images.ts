const PLAYER_IMAGE_BY_SLUG: Record<string, string> = {
  alex: '/players/alex.png',
  arshad: '/players/arshad.png',
  basil: '/players/basil.png',
  moamen: '/players/moamen.png',
  ruban: '/players/ruban-profile.png',
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
