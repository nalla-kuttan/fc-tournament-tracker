import { buildCompetitiveRatingTimeline, getCompetitiveRatingMap, RATING_TUNING, type CompetitivePlayerInstance } from './competitive-ratings';
import type { Match, RegisteredPlayer } from './types';

export interface ResultOdds {
  home: number;
  draw: number;
  away: number;
}

export interface OddsTrackRecord {
  matches: number;
  correct: number;
  accuracy: number;
  brier: number;
}

type PlayerInput = Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>;

// Back-testing on the group's history (predicting each match only from the
// matches before it) showed ratings plus the group's own draw rate beat
// goal-based Poisson models: draws are rare here (about 9%), and Poisson
// over-predicts them.
const WARM_UP_MATCHES = 30;

function decided(match: Match) {
  return match.is_played && !match.is_bye && match.home_player_id && match.away_player_id
    && match.home_score != null && match.away_score != null;
}

// Smoothed so a handful of early draws can't swing it wildly.
export function drawRate(matches: Match[]) {
  const played = matches.filter(decided);
  const draws = played.filter((match) => match.home_score === match.away_score).length;
  return (draws + 1) / (played.length + 10);
}

export function predictResult(homeRating: number, awayRating: number, pDraw: number): ResultOdds {
  const expectedHome = 1 / (1 + Math.pow(10, (awayRating - homeRating) / 400));
  return { home: (1 - pDraw) * expectedHome, draw: pDraw, away: (1 - pDraw) * (1 - expectedHome) };
}

function chronological(a: Match, b: Match) {
  return (a.played_at ?? '').localeCompare(b.played_at ?? '') || a.match_number - b.match_number || a.id.localeCompare(b.id);
}

// What the model would have said before every past match, using only what
// was known then, and how often its favourite actually won.
export function backtestOdds(players: PlayerInput[], instances: CompetitivePlayerInstance[], matches: Match[]): OddsTrackRecord {
  const timeline = buildCompetitiveRatingTimeline(players, instances, matches, { scope: 'all-time' });
  const played = matches.filter(decided).sort(chronological);
  let draws = 0;
  let seen = 0;
  let correct = 0;
  let scored = 0;
  let brier = 0;
  for (const match of played) {
    const before = timeline.get(match.id);
    if (before && seen >= WARM_UP_MATCHES) {
      const odds = predictResult(before.homeRating, before.awayRating, (draws + 1) / (seen + 10));
      const outcome = match.home_score! > match.away_score! ? 'home' : match.home_score! < match.away_score! ? 'away' : 'draw';
      const pick = (['home', 'draw', 'away'] as const).reduce((best, key) => (odds[key] > odds[best] ? key : best), 'home');
      scored++;
      if (pick === outcome) correct++;
      brier += (['home', 'draw', 'away'] as const).reduce((sum, key) => sum + Math.pow(odds[key] - (key === outcome ? 1 : 0), 2), 0);
    }
    seen++;
    if (match.home_score === match.away_score) draws++;
  }
  return {
    matches: scored,
    correct,
    accuracy: scored ? correct / scored : 0,
    brier: scored ? brier / scored : 0,
  };
}

export interface FixtureOdds {
  odds: ResultOdds;
  homeRating: number;
  awayRating: number;
  // True when the odds are the pre-match view of a match already played.
  preMatch: boolean;
}

// Odds for one fixture: the pre-match view for a played match, otherwise
// the current ratings.
export function oddsForFixture(
  players: PlayerInput[],
  instances: CompetitivePlayerInstance[],
  matches: Match[],
  fixture: Pick<Match, 'id' | 'is_played' | 'home_player_id' | 'away_player_id'>
): FixtureOdds | null {
  const ownerOf = new Map(instances.map((instance) => [instance.id, instance.registered_player_id]));
  const home = ownerOf.get(fixture.home_player_id ?? '');
  const away = ownerOf.get(fixture.away_player_id ?? '');
  if (!home || !away) return null;

  if (fixture.is_played) {
    const before = buildCompetitiveRatingTimeline(players, instances, matches, { scope: 'all-time' }).get(fixture.id);
    if (!before) return null;
    const target = matches.find((match) => match.id === fixture.id)!;
    const earlier = matches.filter((match) => decided(match) && chronological(match, target) < 0);
    return { odds: predictResult(before.homeRating, before.awayRating, drawRate(earlier)), homeRating: before.homeRating, awayRating: before.awayRating, preMatch: true };
  }

  const ratings = getCompetitiveRatingMap(players, instances, matches);
  const homeRating = ratings.get(home) ?? RATING_TUNING.newPlayerRating;
  const awayRating = ratings.get(away) ?? RATING_TUNING.newPlayerRating;
  return { odds: predictResult(homeRating, awayRating, drawRate(matches)), homeRating, awayRating, preMatch: false };
}
