import { calculateStandings } from './algorithms/standings';
import { buildCompetitiveRatingTimeline, getCompetitiveRatingMap, type CompetitivePlayerInstance } from './competitive-ratings';
import type { Match, Player, RegisteredPlayer, Tournament } from './types';

type TournamentInput = Pick<Tournament, 'id' | 'name' | 'format' | 'status'>;
type InstanceInput = Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>;

// The decided champion of each tournament, by the same rules as the standings
// and Hall of Fame: a played final decides a knockout; a completed league goes
// to the top of the table (points, GD, goals, head-to-head).
export function getTournamentChampions(tournaments: TournamentInput[], instances: InstanceInput[], matches: Match[]) {
  const champions = new Map<string, { registeredPlayerId: string; instanceId: string }>();
  for (const tournament of tournaments) {
    const played = matches.filter((match) => match.tournament_id === tournament.id && match.is_played && !match.is_bye);
    const final = played.find((match) => match.stage === 'F' && match.home_score !== match.away_score);
    let instanceId: string | null = null;
    if (final) {
      instanceId = (final.home_score ?? 0) > (final.away_score ?? 0) ? final.home_player_id : final.away_player_id;
    } else if (tournament.status === 'completed' && tournament.format !== 'knockout') {
      const players = instances.filter((instance) => instance.tournament_id === tournament.id);
      instanceId = calculateStandings(played, players).find((row) => row.played > 0)?.player_id ?? null;
    }
    const owner = instances.find((instance) => instance.id === instanceId)?.registered_player_id;
    if (instanceId && owner) champions.set(tournament.id, { registeredPlayerId: owner, instanceId });
  }
  return champions;
}

export interface RatingHistoryPoint {
  matchId: string;
  playedAt: string | null;
  tournamentId: string;
  opponentName: string;
  result: 'W' | 'D' | 'L';
  ratingBefore: number;
  ratingAfter: number;
}

function chronological(a: Match, b: Match) {
  return (a.played_at ?? '').localeCompare(b.played_at ?? '') || a.match_number - b.match_number || a.id.localeCompare(b.id);
}

// A player's rating after every match they played, oldest first. "After" is
// the rating going into their next match (or their current rating).
export function getRatingHistory(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  instances: CompetitivePlayerInstance[],
  matches: Match[],
  registeredPlayerId: string
): RatingHistoryPoint[] {
  const timeline = buildCompetitiveRatingTimeline(players, instances, matches, { scope: 'all-time' });
  const current = getCompetitiveRatingMap(players, instances, matches).get(registeredPlayerId) ?? 1000;
  const nameOf = new Map(players.map((player) => [player.id, player.name]));
  const own = matches
    .filter((match) => timeline.has(match.id))
    .sort(chronological)
    .flatMap((match) => {
      const before = timeline.get(match.id)!;
      const isHome = before.homeRegisteredPlayerId === registeredPlayerId;
      if (!isHome && before.awayRegisteredPlayerId !== registeredPlayerId) return [];
      const goalsFor = (isHome ? match.home_score : match.away_score) ?? 0;
      const goalsAgainst = (isHome ? match.away_score : match.home_score) ?? 0;
      return [{
        match,
        ratingBefore: isHome ? before.homeRating : before.awayRating,
        opponentName: nameOf.get(isHome ? before.awayRegisteredPlayerId : before.homeRegisteredPlayerId) ?? 'Unknown',
        result: (goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D') as RatingHistoryPoint['result'],
      }];
    });
  return own.map((entry, index) => ({
    matchId: entry.match.id,
    playedAt: entry.match.played_at,
    tournamentId: entry.match.tournament_id,
    opponentName: entry.opponentName,
    result: entry.result,
    ratingBefore: entry.ratingBefore,
    ratingAfter: own[index + 1]?.ratingBefore ?? current,
  }));
}
