// Generated club badges: two colours and a short code per club. Real crests
// are trademarked, so badges only borrow each club's colours. Clubs we don't
// know get stable colours derived from the name.

export interface ClubBadgeStyle {
  primary: string;
  secondary: string;
  text: string;
  code: string;
}

type Known = [primary: string, secondary: string, code?: string];

const KNOWN: Record<string, Known> = {
  'real madrid': ['#F4F1E8', '#C9A227', 'RMA'],
  'manchester city': ['#6CABDD', '#1C2C5B', 'MCI'],
  'man city': ['#6CABDD', '#1C2C5B', 'MCI'],
  barcelona: ['#A50044', '#004D98', 'BAR'],
  psg: ['#004170', '#DA291C', 'PSG'],
  'paris saint-germain': ['#004170', '#DA291C', 'PSG'],
  chelsea: ['#034694', '#DBA111', 'CHE'],
  arsenal: ['#EF0107', '#F4F1E8', 'ARS'],
  tottenham: ['#F4F1E8', '#132257', 'TOT'],
  france: ['#1F3A93', '#E4002B', 'FRA'],
  spain: ['#C60B1E', '#FFC400', 'ESP'],
  'bayern munich': ['#DC052D', '#0066B2', 'FCB'],
  liverpool: ['#C8102E', '#00B2A9', 'LIV'],
  portugal: ['#046A38', '#DA291C', 'POR'],
  'al hilal': ['#0B4EA2', '#F4F1E8', 'HIL'],
  norway: ['#BA0C2F', '#00205B', 'NOR'],
  'manchester united': ['#DA291C', '#FBE122', 'MUN'],
  'man united': ['#DA291C', '#FBE122', 'MUN'],
  'lombardia fc': ['#0B2C5E', '#D4AF37', 'LOM'],
  england: ['#F4F1E8', '#CF081F', 'ENG'],
  sweden: ['#006AA7', '#FECC00', 'SWE'],
  bournemouth: ['#DA291C', '#111111', 'BOU'],
  benfica: ['#E83030', '#F4F1E8', 'SLB'],
  'al nassr': ['#FDE100', '#0B3D91', 'NAS'],
  'west ham': ['#7A263A', '#1BB1E7', 'WHU'],
  'borussia dortmund': ['#FDE100', '#111111', 'BVB'],
  'inter milan': ['#0068A8', '#111111', 'INT'],
  argentina: ['#75AADB', '#F4F1E8', 'ARG'],
  newcastle: ['#241F20', '#F4F1E8', 'NEW'],
  juventus: ['#F4F1E8', '#111111', 'JUV'],
  'ac milan': ['#FB090B', '#111111', 'MIL'],
  'atlético madrid': ['#CB3524', '#272E61', 'ATM'],
  napoli: ['#12A0D7', '#F4F1E8', 'NAP'],
  'bayer leverkusen': ['#E32221', '#111111', 'B04'],
  'aston villa': ['#670E36', '#95BFE5', 'AVL'],
  brazil: ['#FFDF00', '#009C3B', 'BRA'],
  germany: ['#111111', '#DD0000', 'GER'],
  italy: ['#0066B3', '#F4F1E8', 'ITA'],
  netherlands: ['#F36C21', '#21468B', 'NED'],
  ajax: ['#D2122E', '#F4F1E8', 'AJA'],
  celtic: ['#018749', '#F4F1E8', 'CEL'],
  porto: ['#0048A0', '#F4F1E8', 'POR'],
  galatasaray: ['#A90432', '#FDB912', 'GAL'],
};

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Relative luminance, to pick dark or light lettering.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hslToHex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function clubCode(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const skip = new Set(['fc', 'cf', 'afc', 'sc', 'the', 'de', 'of']);
  const meaningful = words.filter((word) => !skip.has(word.toLowerCase()));
  const pool = meaningful.length ? meaningful : words;
  if (pool.length === 0) return '?';
  if (pool.length === 1) return pool[0].slice(0, 3).toUpperCase();
  return pool.slice(0, 3).map((word) => word[0]).join('').toUpperCase();
}

export function getClubBadge(name: string | null | undefined): ClubBadgeStyle {
  const clean = (name ?? '').trim();
  const known = KNOWN[clean.toLowerCase()];
  let primary: string;
  let secondary: string;
  let code: string;
  if (known) {
    [primary, secondary] = known;
    code = known[2] ?? clubCode(clean);
  } else {
    const h = hash(clean.toLowerCase() || '?');
    const hue = h % 360;
    primary = hslToHex(hue, 0.62, 0.42);
    secondary = hslToHex((hue + 150 + ((h >> 9) % 60)) % 360, 0.55, 0.58);
    code = clean ? clubCode(clean) : '?';
  }
  return { primary, secondary, code, text: luminance(primary) > 0.45 ? '#16090D' : '#FFF7F6' };
}
