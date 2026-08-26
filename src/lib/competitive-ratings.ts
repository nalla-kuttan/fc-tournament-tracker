import type { Match, Player, RegisteredPlayer } from './types';

export type CompetitivePlayerInstance = Pick<
  Player,
  'id' | 'registered_player_id' | 'tournament_id'
>;

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

interface RatingSequence {
  ratingMap: Map<string, number>;
  peakMap: Map<string, number>;
  matchesMap: Map<string, number>;
  formMap: Map<string, ('W' | 'D' | 'L')[]>;
  timeline: Map<string, CompetitiveRatingSnapshot>;
}

export function buildCompetitiveRatingTimeline(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: CompetitivePlayerInstance[],
  matches: Match[],
  options: CompetitiveScope
) {
  return runCompetitiveRatingSequence(players, playerInstances, matches, options).timeline;
}

export function calculateCompetitiveRatings(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: CompetitivePlayerInstance[],
  matches: Match[],
  options: CompetitiveScope
): CompetitiveRatingRow[] {
  const { ratingMap, peakMap, matchesMap, formMap } = runCompetitiveRatingSequence(
    players,
    playerInstances,
    matches,
    options
  );

  return players
    .map((player) => {
      const rating = ratingMap.get(player.id) ?? 1000;
      const recentForm = (formMap.get(player.id) ?? []).slice(0, 5);
      const previousRating = estimatePreviousRating(rating, recentForm[0]);
      return {
        player,
        rank: 0,
        rating,
        previousRating,
        movement: rating - previousRating,
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
  options: CompetitiveScope
): RatingSequence {
  const instanceToRegistered = new Map(playerInstances.map((player) => [player.id, player.registered_player_id]));
  const ratingMap = new Map(players.map((player) => [player.id, 1000]));
  const peakMap = new Map(players.map((player) => [player.id, 1000]));
  const matchesMap = new Map(players.map((player) => [player.id, 0]));
  const formMap = new Map(players.map((player) => [player.id, [] as ('W' | 'D' | 'L')[]]));
  const timeline = new Map<string, CompetitiveRatingSnapshot>();
  const filteredMatches = filterMatchesByScope(matches, options)
    .filter((match) => match.is_played && !match.is_bye && match.home_player_id && match.away_player_id)
    .sort(compareMatchesChronologically);

  for (const match of filteredMatches) {
    const homeRegisteredId = instanceToRegistered.get(match.home_player_id ?? '');
    const awayRegisteredId = instanceToRegistered.get(match.away_player_id ?? '');
    if (!homeRegisteredId || !awayRegisteredId) continue;

    const homeRating = ratingMap.get(homeRegisteredId) ?? 1000;
    const awayRating = ratingMap.get(awayRegisteredId) ?? 1000;
    timeline.set(match.id, {
      matchId: match.id,
      homeRegisteredPlayerId: homeRegisteredId,
      awayRegisteredPlayerId: awayRegisteredId,
      homeRating,
      awayRating,
    });

    const homeGoals = match.home_score ?? 0;
    const awayGoals = match.away_score ?? 0;
    const expectedHome = 1 / (1 + Math.pow(10, (awayRating - homeRating) / 400));
    const homeResult = homeGoals > awayGoals ? 1 : homeGoals === awayGoals ? 0.5 : 0;
    const marginBonus = Math.min(Math.abs(homeGoals - awayGoals), 5) * 2;
    const k = 28 + marginBonus;
    const homeNext = Math.round(homeRating + k * (homeResult - expectedHome));
    const awayNext = Math.round(awayRating + k * ((1 - homeResult) - (1 - expectedHome)));

    ratingMap.set(homeRegisteredId, homeNext);
    ratingMap.set(awayRegisteredId, awayNext);
    peakMap.set(homeRegisteredId, Math.max(peakMap.get(homeRegisteredId) ?? 1000, homeNext));
    peakMap.set(awayRegisteredId, Math.max(peakMap.get(awayRegisteredId) ?? 1000, awayNext));
    matchesMap.set(homeRegisteredId, (matchesMap.get(homeRegisteredId) ?? 0) + 1);
    matchesMap.set(awayRegisteredId, (matchesMap.get(awayRegisteredId) ?? 0) + 1);
    formMap.get(homeRegisteredId)?.unshift(homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D');
    formMap.get(awayRegisteredId)?.unshift(awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D');
  }

  return { ratingMap, peakMap, matchesMap, formMap, timeline };
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

function estimatePreviousRating(rating: number, latestForm?: 'W' | 'D' | 'L') {
  if (latestForm === 'W') return rating - 18;
  if (latestForm === 'L') return rating + 18;
  return rating;
}
