import type { MatchStats } from './types';

// Raw text as typed, so a half-typed "1." or an empty field survives
// re-renders. Blank means "not recorded" and is never saved as a default.
export interface StatSheet {
  homeXg: string;
  awayXg: string;
  homePossession: string;
  homeTackles: string;
  awayTackles: string;
  homeInterceptions: string;
  awayInterceptions: string;
  homeRating: string;
  awayRating: string;
  motmSide: 'home' | 'away' | '';
  motmRating: string;
}

export type StatField = Exclude<keyof StatSheet, 'motmSide'>;
export type SheetErrors = Partial<Record<StatField, string>>;

export const EMPTY_SHEET: StatSheet = {
  homeXg: '', awayXg: '', homePossession: '', homeTackles: '', awayTackles: '',
  homeInterceptions: '', awayInterceptions: '', homeRating: '', awayRating: '',
  motmSide: '', motmRating: '',
};

interface FieldRule {
  min: number;
  max: number;
  decimals: number;
  label: string;
}

const RULES: Record<StatField, FieldRule> = {
  homeXg: { min: 0, max: 20, decimals: 2, label: 'xG' },
  awayXg: { min: 0, max: 20, decimals: 2, label: 'xG' },
  homePossession: { min: 0, max: 100, decimals: 0, label: 'Possession' },
  homeTackles: { min: 0, max: 99, decimals: 0, label: 'Tackles' },
  awayTackles: { min: 0, max: 99, decimals: 0, label: 'Tackles' },
  homeInterceptions: { min: 0, max: 99, decimals: 0, label: 'Interceptions' },
  awayInterceptions: { min: 0, max: 99, decimals: 0, label: 'Interceptions' },
  homeRating: { min: 0, max: 10, decimals: 1, label: 'Rating' },
  awayRating: { min: 0, max: 10, decimals: 1, label: 'Rating' },
  motmRating: { min: 0, max: 10, decimals: 1, label: 'Rating' },
};

const text = (value: number | undefined | null) => (value == null ? '' : String(value));

export function sheetFromStats(
  stats: MatchStats | null | undefined,
  players: { homeId?: string | null; awayId?: string | null }
): StatSheet {
  const s = stats ?? {};
  const motmSide = s.motm_player_id && s.motm_player_id === players.homeId
    ? 'home'
    : s.motm_player_id && s.motm_player_id === players.awayId ? 'away' : '';
  return {
    homeXg: text(s.home_xg),
    awayXg: text(s.away_xg),
    homePossession: text(s.home_possession),
    homeTackles: text(s.home_tackles),
    awayTackles: text(s.away_tackles),
    homeInterceptions: text(s.home_interceptions),
    awayInterceptions: text(s.away_interceptions),
    homeRating: text(s.home_rating),
    awayRating: text(s.away_rating),
    motmSide,
    motmRating: motmSide ? text(s.motm_rating) : '',
  };
}

// Accepts a comma as the decimal separator, since some phone keypads offer only that.
function parseNumber(raw: string) {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}

export function validateSheet(sheet: StatSheet): SheetErrors {
  const errors: SheetErrors = {};
  for (const field of Object.keys(RULES) as StatField[]) {
    const rule = RULES[field];
    const value = parseNumber(sheet[field]);
    if (value === null) continue;
    if (Number.isNaN(value)) {
      errors[field] = 'Enter a number';
    } else if (value < rule.min || value > rule.max) {
      errors[field] = `${rule.label} must be ${rule.min}–${rule.max}`;
    } else if (rule.decimals === 0 && !Number.isInteger(value)) {
      errors[field] = 'Use a whole number';
    }
  }
  if (sheet.motmSide === '' && sheet.motmRating.trim() !== '') {
    errors.motmRating = 'Pick the Man of the Match first';
  }
  return errors;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function numberOrUndefined(sheet: StatSheet, field: StatField) {
  const value = parseNumber(sheet[field]);
  return value === null || Number.isNaN(value) ? undefined : round(value, RULES[field].decimals);
}

export function statsFromSheet(
  sheet: StatSheet,
  players: { homeId?: string | null; awayId?: string | null }
): MatchStats {
  const homePossession = numberOrUndefined(sheet, 'homePossession');
  const motmPlayerId = sheet.motmSide === 'home'
    ? players.homeId ?? undefined
    : sheet.motmSide === 'away' ? players.awayId ?? undefined : undefined;
  const stats: MatchStats = {
    home_xg: numberOrUndefined(sheet, 'homeXg'),
    away_xg: numberOrUndefined(sheet, 'awayXg'),
    home_possession: homePossession,
    away_possession: homePossession === undefined ? undefined : 100 - homePossession,
    home_tackles: numberOrUndefined(sheet, 'homeTackles'),
    away_tackles: numberOrUndefined(sheet, 'awayTackles'),
    home_interceptions: numberOrUndefined(sheet, 'homeInterceptions'),
    away_interceptions: numberOrUndefined(sheet, 'awayInterceptions'),
    home_rating: numberOrUndefined(sheet, 'homeRating'),
    away_rating: numberOrUndefined(sheet, 'awayRating'),
    motm_player_id: motmPlayerId,
    motm_rating: motmPlayerId ? numberOrUndefined(sheet, 'motmRating') : undefined,
  };
  return Object.fromEntries(Object.entries(stats).filter(([, value]) => value !== undefined)) as MatchStats;
}

// Stats keys the sheet reads and writes. Anything else already stored on a
// match (e.g. the in-game clubs, home_team/away_team/motm_team) belongs to the
// history and must survive an edit.
const SHEET_STAT_KEYS = new Set([
  'home_xg', 'away_xg', 'home_possession', 'away_possession', 'home_tackles', 'away_tackles',
  'home_interceptions', 'away_interceptions', 'home_rating', 'away_rating', 'motm_player_id', 'motm_rating',
]);

export function mergeStatsForSave(existing: Record<string, unknown> | null | undefined, fromSheet: MatchStats) {
  const kept = Object.fromEntries(Object.entries(existing ?? {}).filter(([key]) => !SHEET_STAT_KEYS.has(key)));
  return { ...kept, ...fromSheet };
}

// Mirrors the sheet so the left column becomes the right one. Used when a
// photo was read with the teams on the opposite sides.
export function swapSheetSides(sheet: StatSheet): StatSheet {
  const possession = parseNumber(sheet.homePossession);
  return {
    homeXg: sheet.awayXg,
    awayXg: sheet.homeXg,
    homePossession: possession === null || Number.isNaN(possession) ? sheet.homePossession : String(100 - possession),
    homeTackles: sheet.awayTackles,
    awayTackles: sheet.homeTackles,
    homeInterceptions: sheet.awayInterceptions,
    awayInterceptions: sheet.homeInterceptions,
    homeRating: sheet.awayRating,
    awayRating: sheet.homeRating,
    motmSide: sheet.motmSide === 'home' ? 'away' : sheet.motmSide === 'away' ? 'home' : '',
    motmRating: sheet.motmRating,
  };
}

export interface GoalEntry {
  player_id: string;
  minute: string;
}

// Keeps one goal row per goal scored, preserving any minutes already typed.
// In a 1v1 every goal belongs to one of the two players, so the score alone
// determines the scorers.
export function goalsForScore(
  current: GoalEntry[],
  homeId: string | null | undefined,
  awayId: string | null | undefined,
  homeScore: number,
  awayScore: number
): GoalEntry[] {
  const forPlayer = (playerId: string | null | undefined, count: number) => {
    if (!playerId) return [];
    const existing = current.filter((goal) => goal.player_id === playerId).slice(0, count);
    const missing = Array.from({ length: Math.max(0, count - existing.length) }, () => ({ player_id: playerId, minute: '' }));
    return [...existing, ...missing];
  };
  return [...forPlayer(homeId, homeScore), ...forPlayer(awayId, awayScore)];
}

export function goalMinuteError(minute: string) {
  if (minute.trim() === '') return null;
  const value = Number(minute);
  return Number.isInteger(value) && value >= 1 && value <= 130 ? null : 'Minute must be 1–130';
}

interface FixtureLike {
  id: string;
  is_played: boolean;
  is_bye: boolean;
  home_player_id?: string | null;
  away_player_id?: string | null;
  home_player?: unknown;
  away_player?: unknown;
  round_number: number;
  match_number: number;
  match_order?: number | null;
}

// The next fixture that can be played: unplayed, not a bye, both players known.
export function nextFixture<T extends FixtureLike>(matches: T[], currentMatchId: string): T | null {
  const ready = matches.filter((match) =>
    match.id !== currentMatchId &&
    !match.is_played &&
    !match.is_bye &&
    Boolean(match.home_player_id ?? match.home_player) &&
    Boolean(match.away_player_id ?? match.away_player)
  );
  ready.sort((a, b) =>
    (a.match_order ?? Number.MAX_SAFE_INTEGER) - (b.match_order ?? Number.MAX_SAFE_INTEGER) ||
    a.round_number - b.round_number ||
    a.match_number - b.match_number
  );
  return ready[0] ?? null;
}
