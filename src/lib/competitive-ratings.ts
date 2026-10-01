import type { Match, Player, RegisteredPlayer } from './types';

export type CompetitivePlayerInstance = Pick<Player, 'id' | 'registered_player_id'>;

export type CompetitiveScope = { scope: 'season' | 'all-time'; seasonId?: string | null };

export interface CompetitiveRatingRow {
  player: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>;
  rank: number;
  rating: number;
  previousRating: number;
  movement: number;
  peakRating: number;
  matches: number;
  recentForm: ('W' | 'D' | 'L')[];
}

export interface CompetitiveRatingSnapshot {
  matchId: string;
  homeRegisteredPlayerId: string;
  awayRegisteredPlayerId: string;
  homeRating: number;
  awayRating: number;
}

export interface RatingTuning {
  // Rating points at stake in an evenly matched one-goal game.
  k: number;
  // Extra weight per goal of margin, on a log scale.
  marginWeight: number;
  // Share of the gap to 1000 a player gives back when they start a new
  // tournament.
  reversion: number;
  // Where a player's first match starts them.
  newPlayerRating: number;
  // For this many matches a player's own rating moves provisionalBoost
  // times as far, so it finds their level quickly.
  provisionalMatches: number;
  provisionalBoost: number;
}

const START = 1000;

// Chosen by back-testing on the group's history: the tightest spread
// between regulars that still predicts results about as well as before.
// Newcomers have mostly been weaker than the regulars, so they start below
// the average rather than above half the group.
export const RATING_TUNING: RatingTuning = {
  k: 16,
  marginWeight: 0.25,
  reversion: 0.1,
  newPlayerRating: 925,
  provisionalMatches: 10,
  provisionalBoost: 2.5,
};

// Rating points the home side gains (the away side loses the same). The
// margin bonus shrinks when the favourite wins big and grows for an
// underdog, so thrashing weaker players can't open a runaway gap.
export function ratingChange(
  homeRating: number,
  awayRating: number,
  homeGoals: number,
  awayGoals: number,
  tuning: RatingTuning = RATING_TUNING
) {
  const expectedHome = 1 / (1 + Math.pow(10, (awayRating - homeRating) / 400));
  const homeResult = homeGoals > awayGoals ? 1 : homeGoals === awayGoals ? 0.5 : 0;
  const margin = Math.abs(homeGoals - awayGoals);
  const lead = homeGoals > awayGoals ? homeRating - awayRating : awayRating - homeRating;
  const winnerLead = Math.max(-300, Math.min(300, lead));
  const favouriteDamping = Math.min(1.5, Math.max(0.5, 2.2 / (winnerLead * 0.004 + 2.2)));
  const marginBonus = margin > 1 ? 1 + tuning.marginWeight * Math.log(margin) * favouriteDamping : 1;
  return tuning.k * marginBonus * (homeResult - expectedHome);
}

interface RatingSequence {
  ratingMap: Map<string, number>;
  lastChangeMap: Map<string, number>;
  peakMap: Map<string, number>;
  matchesMap: Map<string, number>;
  formMap: Map<string, ('W' | 'D' | 'L')[]>;
  timeline: Map<string, CompetitiveRatingSnapshot>;
}

export function buildCompetitiveRatingTimeline(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: CompetitivePlayerInstance[],
  matches: Match[],
  options: CompetitiveScope,
  tuning: RatingTuning = RATING_TUNING
) {
  return runCompetitiveRatingSequence(players, playerInstances, matches, options, tuning).timeline;
}

export function calculateCompetitiveRatings(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: CompetitivePlayerInstance[],
  matches: Match[],
  options: CompetitiveScope,
  tuning: RatingTuning = RATING_TUNING
): CompetitiveRatingRow[] {
  const { ratingMap, lastChangeMap, peakMap, matchesMap, formMap } = runCompetitiveRatingSequence(
    players,
    playerInstances,
    matches,
    options,
    tuning
  );

  return players
    .map((player) => {
      const rating = ratingMap.get(player.id) ?? RATING_TUNING.newPlayerRating;
      const recentForm = (formMap.get(player.id) ?? []).slice(0, 5);
      // The real change from the player's latest match, not an estimate.
      const movement = lastChangeMap.get(player.id) ?? 0;
      return {
        player,
        rank: 0,
        rating,
        previousRating: rating - movement,
        movement,
        peakRating: peakMap.get(player.id) ?? rating,
        matches: matchesMap.get(player.id) ?? 0,
        recentForm,
      };
    })
    .filter((row) => row.matches > 0)
    .sort((a, b) => b.rating - a.rating || b.peakRating - a.peakRating || a.player.name.localeCompare(b.player.name))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function runCompetitiveRatingSequence(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: CompetitivePlayerInstance[],
  matches: Match[],
  options: CompetitiveScope,
  tuning: RatingTuning = RATING_TUNING
): RatingSequence {
  const instanceToRegistered = new Map(playerInstances.map((player) => [player.id, player.registered_player_id]));
  // Exact ratings; everything shown is rounded from these so rounding
  // never accumulates.
  const exact = new Map(players.map((player) => [player.id, tuning.newPlayerRating]));
  const ratingMap = new Map(players.map((player) => [player.id, tuning.newPlayerRating]));
  const lastChangeMap = new Map<string, number>();
  const peakMap = new Map(players.map((player) => [player.id, tuning.newPlayerRating]));
  const matchesMap = new Map(players.map((player) => [player.id, 0]));
  const formMap = new Map(players.map((player) => [player.id, [] as ('W' | 'D' | 'L')[]]));
  const timeline = new Map<string, CompetitiveRatingSnapshot>();
  const filteredMatches = filterMatchesByScope(matches, options)
    .filter((match) => match.is_played && !match.is_bye && match.home_player_id && match.away_player_id)
    .sort(compareMatchesChronologically);

  const lastTournament = new Map<string, string>();

  for (const match of filteredMatches) {
    const homeRegisteredId = instanceToRegistered.get(match.home_player_id ?? '');
    const awayRegisteredId = instanceToRegistered.get(match.away_player_id ?? '');
    if (!homeRegisteredId || !awayRegisteredId) continue;

    // Starting a new tournament pulls a player part of the way back to 1000,
    // so one long run of form can't open a gap nobody can close. Only
    // players who turn up are pulled back, once, however many they missed.
    for (const id of [homeRegisteredId, awayRegisteredId]) {
      const previous = lastTournament.get(id);
      if (previous && previous !== match.tournament_id) {
        exact.set(id, START + ((exact.get(id) ?? START) - START) * (1 - tuning.reversion));
      }
      lastTournament.set(id, match.tournament_id);
    }

    const homeExact = exact.get(homeRegisteredId) ?? tuning.newPlayerRating;
    const awayExact = exact.get(awayRegisteredId) ?? tuning.newPlayerRating;
    const homeRating = Math.round(homeExact);
    const awayRating = Math.round(awayExact);
    timeline.set(match.id, {
      matchId: match.id,
      homeRegisteredPlayerId: homeRegisteredId,
      awayRegisteredPlayerId: awayRegisteredId,
      homeRating,
      awayRating,
    });

    const homeGoals = match.home_score ?? 0;
    const awayGoals = match.away_score ?? 0;
    const change = ratingChange(homeExact, awayExact, homeGoals, awayGoals, tuning);
    const boost = (id: string) => ((matchesMap.get(id) ?? 0) < tuning.provisionalMatches ? tuning.provisionalBoost : 1);
    const homeAfter = homeExact + change * boost(homeRegisteredId);
    const awayAfter = awayExact - change * boost(awayRegisteredId);
    exact.set(homeRegisteredId, homeAfter);
    exact.set(awayRegisteredId, awayAfter);
    const homeNext = Math.round(homeAfter);
    const awayNext = Math.round(awayAfter);

    ratingMap.set(homeRegisteredId, homeNext);
    ratingMap.set(awayRegisteredId, awayNext);
    lastChangeMap.set(homeRegisteredId, homeNext - homeRating);
    lastChangeMap.set(awayRegisteredId, awayNext - awayRating);
    peakMap.set(homeRegisteredId, Math.max(peakMap.get(homeRegisteredId) ?? homeNext, homeNext));
    peakMap.set(awayRegisteredId, Math.max(peakMap.get(awayRegisteredId) ?? awayNext, awayNext));
    matchesMap.set(homeRegisteredId, (matchesMap.get(homeRegisteredId) ?? 0) + 1);
    matchesMap.set(awayRegisteredId, (matchesMap.get(awayRegisteredId) ?? 0) + 1);
    formMap.get(homeRegisteredId)?.unshift(homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D');
    formMap.get(awayRegisteredId)?.unshift(awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D');
  }

  return { ratingMap, lastChangeMap, peakMap, matchesMap, formMap, timeline };
}

function filterMatchesByScope(matches: Match[], options: CompetitiveScope) {
  if (options.scope === 'all-time') return matches;
  return matches.filter((match) => match.season_id === options.seasonId);
}

function compareMatchesChronologically(a: Match, b: Match) {
  return (a.played_at ?? '').localeCompare(b.played_at ?? '')
    || a.match_number - b.match_number
    || a.id.localeCompare(b.id);
}

// The app's single player rating (all-time, results-based). Every screen that
// shows a "rating" reads this, so the power table, player cards and the
// competition history can't disagree.
export function getCompetitiveRatingMap(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: CompetitivePlayerInstance[],
  matches: Match[]
) {
  return runCompetitiveRatingSequence(players, playerInstances, matches, { scope: 'all-time' }).ratingMap;
}
