import { calculateStandings } from './algorithms/standings';
import { buildCompetitiveRatingTimeline, getCompetitiveRatingMap, type CompetitivePlayerInstance } from './competitive-ratings';
import { getTournamentChampions } from './tournament-results';
import type { Match, MatchStats, Player, RegisteredPlayer, StandingRow, Tournament } from './types';

type TournamentInput = Pick<Tournament, 'id' | 'name' | 'format' | 'status'>;
type InstanceInput = Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>;

export interface RecapAward {
  label: string;
  winners: string[];
  value: string;
}

export interface TournamentRecap {
  tournament: TournamentInput;
  decided: boolean;
  champion: string | null;
  podium: Array<Pick<StandingRow, 'player_name' | 'points' | 'wins' | 'draws' | 'losses' | 'goal_difference'>>;
  matchesPlayed: number;
  goals: number;
  awards: RecapAward[];
  biggestWin: { winner: string; loser: string; score: string } | null;
  biggestRiser: { name: string; change: number; from: number; to: number } | null;
  biggestFaller: { name: string; change: number; from: number; to: number } | null;
  shareText: string;
}

// Every name tied on the best value, so shared awards aren't silently
// given to whoever sorts first.
function leaders<T>(rows: T[], value: (row: T) => number, name: (row: T) => string, direction: 'high' | 'low' = 'high') {
  if (rows.length === 0) return null;
  const best = direction === 'high' ? Math.max(...rows.map(value)) : Math.min(...rows.map(value));
  return { value: best, names: rows.filter((row) => value(row) === best).map(name) };
}

const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;

export function buildTournamentRecap(
  tournament: TournamentInput,
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  instances: InstanceInput[],
  allMatches: Match[],
  goals: Array<{ player_id: string; match_id: string }>
): TournamentRecap {
  const entrants = instances.filter((instance) => instance.tournament_id === tournament.id);
  const matches = allMatches.filter((match) => match.tournament_id === tournament.id && match.is_played && !match.is_bye);
  const matchIds = new Set(matches.map((match) => match.id));
  const table = calculateStandings(matches, entrants).filter((row) => row.played > 0);
  const championEntry = getTournamentChampions([tournament], instances, allMatches).get(tournament.id);
  const nameOfInstance = new Map(entrants.map((instance) => [instance.id, instance.name]));

  const perPlayer = entrants.map((instance) => {
    const own = matches.filter((match) => match.home_player_id === instance.id || match.away_player_id === instance.id);
    const ratings = own
      .map((match) => ((match.stats ?? {}) as MatchStats)[match.home_player_id === instance.id ? 'home_rating' : 'away_rating'])
      .filter((rating): rating is number => typeof rating === 'number');
    const conceded = own.reduce((sum, match) => sum + ((match.home_player_id === instance.id ? match.away_score : match.home_score) ?? 0), 0);
    return {
      name: instance.name,
      played: own.length,
      goals: goals.filter((goal) => goal.player_id === instance.id && matchIds.has(goal.match_id)).length,
      motm: own.filter((match) => ((match.stats ?? {}) as MatchStats).motm_player_id === instance.id).length,
      avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      concededPerMatch: own.length ? conceded / own.length : null,
    };
  }).filter((row) => row.played > 0);

  const awards: RecapAward[] = [];
  const scorer = leaders(perPlayer.filter((row) => row.goals > 0), (row) => row.goals, (row) => row.name);
  if (scorer) awards.push({ label: 'Top scorer', winners: scorer.names, value: `${scorer.value} goals` });
  const rated = leaders(perPlayer.filter((row) => row.avgRating != null && row.played >= 2), (row) => Math.round(row.avgRating! * 10) / 10, (row) => row.name);
  if (rated) awards.push({ label: 'Best average rating', winners: rated.names, value: rated.value.toFixed(1) });
  const motm = leaders(perPlayer.filter((row) => row.motm > 0), (row) => row.motm, (row) => row.name);
  if (motm) awards.push({ label: 'Most Man of the Match', winners: motm.names, value: `${motm.value}` });
  const defence = leaders(perPlayer.filter((row) => row.played >= 2), (row) => Math.round(row.concededPerMatch! * 100) / 100, (row) => row.name, 'low');
  if (defence) awards.push({ label: 'Best defence', winners: defence.names, value: `${defence.value.toFixed(2)} conceded per match` });

  const biggest = [...matches]
    .filter((match) => match.home_score !== match.away_score)
    .sort((a, b) => Math.abs(b.home_score! - b.away_score!) - Math.abs(a.home_score! - a.away_score!) || (b.home_score! + b.away_score!) - (a.home_score! + a.away_score!))[0];
  const biggestWin = biggest ? (() => {
    const homeWon = biggest.home_score! > biggest.away_score!;
    return {
      winner: nameOfInstance.get((homeWon ? biggest.home_player_id : biggest.away_player_id) ?? '') ?? 'Unknown',
      loser: nameOfInstance.get((homeWon ? biggest.away_player_id : biggest.home_player_id) ?? '') ?? 'Unknown',
      score: homeWon ? `${biggest.home_score}-${biggest.away_score}` : `${biggest.away_score}-${biggest.home_score}`,
    };
  })() : null;

  // Rating change across the tournament: going into a player's first match
  // here versus going into their next match after it (or now).
  const lite: CompetitivePlayerInstance[] = instances;
  const timeline = buildCompetitiveRatingTimeline(players, lite, allMatches, { scope: 'all-time' });
  const current = getCompetitiveRatingMap(players, lite, allMatches);
  const ordered = allMatches.filter((match) => timeline.has(match.id))
    .sort((a, b) => (a.played_at ?? '').localeCompare(b.played_at ?? '') || a.match_number - b.match_number || a.id.localeCompare(b.id));
  const movers = entrants.flatMap((instance) => {
    const owner = instance.registered_player_id;
    const involves = (match: Match) => {
      const snap = timeline.get(match.id)!;
      return snap.homeRegisteredPlayerId === owner || snap.awayRegisteredPlayerId === owner;
    };
    const ratingIn = (match: Match) => {
      const snap = timeline.get(match.id)!;
      return snap.homeRegisteredPlayerId === owner ? snap.homeRating : snap.awayRating;
    };
    const own = ordered.filter((match) => match.tournament_id === tournament.id && involves(match));
    if (own.length === 0) return [];
    const lastIndex = ordered.indexOf(own.at(-1)!);
    const next = ordered.slice(lastIndex + 1).find(involves);
    const from = ratingIn(own[0]);
    const to = next ? ratingIn(next) : current.get(owner) ?? from;
    return [{ name: instance.name, change: to - from, from, to }];
  });
  const byChange = [...movers].sort((a, b) => b.change - a.change);
  const biggestRiser = byChange[0] && byChange[0].change > 0 ? byChange[0] : null;
  const biggestFaller = byChange.at(-1) && byChange.at(-1)!.change < 0 ? byChange.at(-1)! : null;

  const decided = Boolean(championEntry);
  const champion = championEntry ? nameOfInstance.get(championEntry.instanceId) ?? null : table[0]?.player_name ?? null;
  const top = table[0];
  const lines = [
    `${tournament.name}${decided ? '' : ' (so far)'}`,
    top ? `${decided ? '🏆 Champion' : 'Leader'}: ${champion} · ${top.points} pts (${top.wins}W ${top.draws}D ${top.losses}L, ${signed(top.goal_difference)})` : null,
    table.length > 1 ? `Podium: ${table.slice(0, 3).map((row, index) => `${index + 1}. ${row.player_name} ${row.points}`).join(' · ')}` : null,
    ...awards.map((award) => `${award.label}: ${award.winners.join(' & ')} (${award.value})`),
    biggestWin ? `Biggest win: ${biggestWin.winner} ${biggestWin.score} ${biggestWin.loser}` : null,
    biggestRiser ? `Biggest riser: ${biggestRiser.name} ${signed(biggestRiser.change)} rating` : null,
    biggestFaller ? `Biggest faller: ${biggestFaller.name} ${signed(biggestFaller.change)} rating` : null,
  ].filter(Boolean);

  return {
    tournament,
    decided,
    champion,
    podium: table.slice(0, 3).map((row) => ({ player_name: row.player_name, points: row.points, wins: row.wins, draws: row.draws, losses: row.losses, goal_difference: row.goal_difference })),
    matchesPlayed: matches.length,
    goals: matches.reduce((sum, match) => sum + (match.home_score ?? 0) + (match.away_score ?? 0), 0),
    awards,
    biggestWin,
    biggestRiser,
    biggestFaller,
    shareText: lines.join('\n'),
  };
}
