import { z } from 'zod';
import type { StatSheet } from './match-entry';

// What the vision model is asked to return for an EA FC match-facts screen.
// Sides are "left"/"right" as printed on screen; the server maps them to the
// fixture's home and away players by team name.
const sideSchema = z.object({
  team_name: z.string().nullable(),
  goals: z.number().nullable(),
  possession: z.number().nullable(),
  xg: z.number().nullable(),
  tackles: z.number().nullable(),
  interceptions: z.number().nullable(),
});

export const statsReadingSchema = z.object({
  is_match_stats_screen: z.boolean(),
  left: sideSchema,
  right: sideSchema,
  player_of_the_match: z.object({
    side: z.enum(['left', 'right']).nullable(),
    rating: z.number().nullable(),
  }),
});

export type StatsReading = z.infer<typeof statsReadingSchema>;

// JSON Schema handed to Gemini so it can only answer in this shape.
const nullable = (type: 'string' | 'number') => ({ type: [type, 'null'] });
const sideJsonSchema = {
  type: 'object',
  properties: {
    team_name: nullable('string'),
    goals: nullable('number'),
    possession: nullable('number'),
    xg: nullable('number'),
    tackles: nullable('number'),
    interceptions: nullable('number'),
  },
  required: ['team_name', 'goals', 'possession', 'xg', 'tackles', 'interceptions'],
};

export const statsReadingJsonSchema = {
  type: 'object',
  properties: {
    is_match_stats_screen: { type: 'boolean' },
    left: sideJsonSchema,
    right: sideJsonSchema,
    player_of_the_match: {
      type: 'object',
      properties: {
        side: { type: ['string', 'null'], enum: ['left', 'right', null] },
        rating: nullable('number'),
      },
      required: ['side', 'rating'],
    },
  },
  required: ['is_match_stats_screen', 'left', 'right', 'player_of_the_match'],
};

export interface ReadStatsResult {
  score: { home: number; away: number } | null;
  sheet: Partial<StatSheet>;
  filledFields: number;
  sidesUncertain: boolean;
  notStatsScreen: boolean;
}

function normalizeTeam(name: string | null | undefined) {
  return (name ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(fc|cf|afc|sc|club|de|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function sameTeam(screen: string | null, fixtureTeam: string | null | undefined) {
  const a = normalizeTeam(screen);
  const b = normalizeTeam(fixtureTeam);
  return a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a));
}

// Decides whether the on-screen left team is the fixture's home side.
// Falls back to left = home (the in-game convention) and flags it when the
// team names cannot settle the question.
export function resolveSides(reading: StatsReading, homeTeam?: string | null, awayTeam?: string | null) {
  const leftIsHome = sameTeam(reading.left.team_name, homeTeam) || sameTeam(reading.right.team_name, awayTeam);
  const leftIsAway = sameTeam(reading.left.team_name, awayTeam) || sameTeam(reading.right.team_name, homeTeam);
  if (leftIsHome && !leftIsAway) return { swapped: false, uncertain: false };
  if (leftIsAway && !leftIsHome) return { swapped: true, uncertain: false };
  return { swapped: false, uncertain: true };
}

function inRange(value: number | null, min: number, max: number, integer = false) {
  if (value === null || !Number.isFinite(value) || value < min || value > max) return null;
  if (integer && !Number.isInteger(value)) return null;
  return value;
}

const asText = (value: number | null) => (value === null ? undefined : String(value));

export function toReadStatsResult(
  reading: StatsReading,
  fixture: { homeTeam?: string | null; awayTeam?: string | null }
): ReadStatsResult {
  if (!reading.is_match_stats_screen) {
    return { score: null, sheet: {}, filledFields: 0, sidesUncertain: false, notStatsScreen: true };
  }

  const { swapped, uncertain } = resolveSides(reading, fixture.homeTeam, fixture.awayTeam);
  const home = swapped ? reading.right : reading.left;
  const away = swapped ? reading.left : reading.right;

  const homeGoals = inRange(home.goals, 0, 99, true);
  const awayGoals = inRange(away.goals, 0, 99, true);
  const homePossession = inRange(home.possession, 0, 100);

  const potmSide = reading.player_of_the_match.side;
  const motmSide: StatSheet['motmSide'] = potmSide === null
    ? ''
    : (potmSide === 'left') !== swapped ? 'home' : 'away';

  const sheet: Partial<StatSheet> = {
    homeXg: asText(inRange(home.xg, 0, 20)),
    awayXg: asText(inRange(away.xg, 0, 20)),
    homePossession: asText(homePossession === null ? null : Math.round(homePossession)),
    homeTackles: asText(inRange(home.tackles, 0, 99, true)),
    awayTackles: asText(inRange(away.tackles, 0, 99, true)),
    homeInterceptions: asText(inRange(home.interceptions, 0, 99, true)),
    awayInterceptions: asText(inRange(away.interceptions, 0, 99, true)),
  };
  if (motmSide) {
    sheet.motmSide = motmSide;
    const rating = inRange(reading.player_of_the_match.rating, 0, 10);
    if (rating !== null) sheet.motmRating = String(rating);
  }

  const cleanSheet = Object.fromEntries(
    Object.entries(sheet).filter(([, value]) => value !== undefined && value !== '')
  ) as Partial<StatSheet>;
  const score = homeGoals !== null && awayGoals !== null ? { home: homeGoals, away: awayGoals } : null;

  return {
    score,
    sheet: cleanSheet,
    filledFields: Object.keys(cleanSheet).length + (score ? 2 : 0),
    sidesUncertain: uncertain,
    notStatsScreen: false,
  };
}
