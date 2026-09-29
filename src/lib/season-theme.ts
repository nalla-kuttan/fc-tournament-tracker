// Each season gets its own kit: an accent colour used for buttons, tabs and
// highlights on its pages. Surfaces stay the app's bordeaux. Every accent
// keeps dark ink text at 4.5:1 or better.

export interface SeasonKit {
  name: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  stripe: string;
}

export const SEASON_KITS: SeasonKit[] = [
  { name: 'Coral', accent: '#EA6C56', accentLight: '#FF8A73', accentDark: '#C84F3D', stripe: 'linear-gradient(90deg, #EA6C56, #FF8A73)' },
  { name: 'Royal', accent: '#7E8CC2', accentLight: '#A3AEDB', accentDark: '#5A68A0', stripe: 'linear-gradient(90deg, #334075, #7E8CC2)' },
  { name: 'Emerald', accent: '#34C38F', accentLight: '#6FDDB2', accentDark: '#23946B', stripe: 'linear-gradient(90deg, #1E7A58, #34C38F)' },
  { name: 'Gold', accent: '#F2B84B', accentLight: '#F9D27E', accentDark: '#C98A1B', stripe: 'linear-gradient(90deg, #C98A1B, #F9D27E)' },
  { name: 'Violet', accent: '#B18CF2', accentLight: '#CAB0F7', accentDark: '#8A63D2', stripe: 'linear-gradient(90deg, #6A45B0, #B18CF2)' },
  { name: 'Ice', accent: '#6CC7E8', accentLight: '#9EDBF1', accentDark: '#3A9BC0', stripe: 'linear-gradient(90deg, #2A7C9C, #6CC7E8)' },
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

// Numbered seasons rotate through the kits in order ("Season 25" follows
// Season 24's kit); anything else gets a stable kit from its id.
export function getSeasonKit(tournament: { id: string; name: string }): SeasonKit {
  const number = tournament.name.match(/(\d+)\s*$/)?.[1];
  const index = number ? Number(number) : hash(tournament.id);
  return SEASON_KITS[index % SEASON_KITS.length];
}
