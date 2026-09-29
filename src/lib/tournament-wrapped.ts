import { calculateStandings } from './algorithms/standings';
import { clubForSide } from './club-analytics';
import { getRatingHistory } from './tournament-results';
import type { Match, MatchStats, Player, RegisteredPlayer, Tournament } from './types';

type InstanceInput = Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>;

export interface WrappedRecord {
  opponent: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface PlayerWrapped {
  playerId: string;
  name: string;
  position: number;
  entrants: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  played: number;
  goals: number;
  goalsRank: number;
  goalsFor: number;
  goalsAgainst: number;
  motm: number;
  averageRating: number | null;
  bestWin: { opponent: string; score: string; margin: number } | null;
  nemesis: WrappedRecord | null;
  favouriteOpponent: WrappedRecord | null;
  club: { name: string; matches: number } | null;
  rating: { from: number; to: number; change: number } | null;
}

export interface TournamentWrapped {
  tournament: Pick<Tournament, 'id' | 'name' | 'format' | 'status'>;
  players: PlayerWrapped[];
}

function recordAgainst(matches: Match[], instanceId: string, nameOf: Map<string, string>) {
  const records = new Map<string, WrappedRecord>();
  for (const match of matches) {
    const home = match.home_player_id === instanceId;
    const otherId = (home ? match.away_player_id : match.home_player_id) ?? '';
    const scored = (home ? match.home_score : match.away_score) ?? 0;
    const conceded = (home ? match.away_score : match.home_score) ?? 0;
    const row = records.get(otherId) ?? { opponent: nameOf.get(otherId) ?? 'Unknown', wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    if (scored > conceded) row.wins++;
    else if (scored < conceded) row.losses++;
    else row.draws++;
    row.goalsFor += scored;
    row.goalsAgainst += conceded;
    records.set(otherId, row);
  }
  return [...records.values()];
}

const points = (row: WrappedRecord) => row.wins * 3 + row.draws;
const gd = (row: WrappedRecord) => row.goalsFor - row.goalsAgainst;

// One story per entrant: where they finished and the moments that defined
// their tournament.
export function buildTournamentWrapped(
  tournament: Pick<Tournament, 'id' | 'name' | 'format' | 'status'>,
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  instances: InstanceInput[],
  allMatches: Match[],
  goals: Array<{ player_id: string; match_id: string }>
): TournamentWrapped {
  const entrants = instances.filter((instance) => instance.tournament_id === tournament.id);
  const matches = allMatches.filter((match) => match.tournament_id === tournament.id && match.is_played && !match.is_bye);
  const matchIds = new Set(matches.map((match) => match.id));
  const table = calculateStandings(matches, entrants).filter((row) => row.played > 0);
  const nameOf = new Map(entrants.map((instance) => [instance.id, instance.name]));
  const goalsBy = new Map<string, number>();
  for (const goal of goals) {
    if (matchIds.has(goal.match_id)) goalsBy.set(goal.player_id, (goalsBy.get(goal.player_id) ?? 0) + 1);
  }
  const goalCounts = table.map((row) => goalsBy.get(row.player_id) ?? 0);

  const stories = table.map((row, index): PlayerWrapped => {
    const instance = entrants.find((entry) => entry.id === row.player_id)!;
    const own = matches.filter((match) => match.home_player_id === instance.id || match.away_player_id === instance.id);
    const records = recordAgainst(own, instance.id, nameOf);
    const ratings = own
      .map((match) => ((match.stats ?? {}) as MatchStats)[match.home_player_id === instance.id ? 'home_rating' : 'away_rating'])
      .filter((value): value is number => typeof value === 'number');

    const wins = own
      .map((match) => {
        const home = match.home_player_id === instance.id;
        const scored = (home ? match.home_score : match.away_score) ?? 0;
        const conceded = (home ? match.away_score : match.home_score) ?? 0;
        return { match, scored, conceded, opponent: nameOf.get((home ? match.away_player_id : match.home_player_id) ?? '') ?? 'Unknown' };
      })
      .filter((entry) => entry.scored > entry.conceded)
      .sort((a, b) => (b.scored - b.conceded) - (a.scored - a.conceded) || b.scored - a.scored);
    const best = wins[0];

    // Nemesis: the opponent they took the fewest points from (at least one
    // loss). Favourite: the one they took the most from (at least one win).
    const nemesis = [...records].filter((r) => r.losses > 0).sort((a, b) => points(a) - points(b) || gd(a) - gd(b) || b.losses - a.losses)[0] ?? null;
    const favourite = [...records].filter((r) => r.wins > 0 && r.opponent !== nemesis?.opponent).sort((a, b) => points(b) - points(a) || gd(b) - gd(a))[0] ?? null;

    const clubs = new Map<string, number>();
    for (const match of own) {
      const club = clubForSide(match, match.home_player_id === instance.id ? 'home' : 'away');
      if (club !== 'Unknown') clubs.set(club, (clubs.get(club) ?? 0) + 1);
    }
    const topClub = [...clubs].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

    const history = getRatingHistory(players, instances, allMatches, instance.registered_player_id)
      .filter((point) => point.tournamentId === tournament.id);
    const goalsScored = goalsBy.get(instance.id) ?? 0;

    return {
      playerId: instance.registered_player_id,
      name: instance.name,
      position: index + 1,
      entrants: table.length,
      points: row.points,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      played: row.played,
      goals: goalsScored,
      goalsRank: 1 + goalCounts.filter((count) => count > goalsScored).length,
      goalsFor: row.goals_for,
      goalsAgainst: row.goals_against,
      motm: own.filter((match) => ((match.stats ?? {}) as MatchStats).motm_player_id === instance.id).length,
      averageRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
      bestWin: best ? { opponent: best.opponent, score: `${best.scored}–${best.conceded}`, margin: best.scored - best.conceded } : null,
      nemesis,
      favouriteOpponent: favourite,
      club: topClub ? { name: topClub[0], matches: topClub[1] } : null,
      rating: history.length
        ? { from: history[0].ratingBefore, to: history.at(-1)!.ratingAfter, change: history.at(-1)!.ratingAfter - history[0].ratingBefore }
        : null,
    };
  });

  return { tournament, players: stories };
}
