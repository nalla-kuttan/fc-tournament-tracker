import type { CareerStats, Match, RegisteredPlayer, Tournament } from '@/lib/types';
import { calculateEloRatings, type PlayerInstanceLite } from '@/lib/player-insights';

export interface GoalLite {
  player_id: string;
  minute: number | null;
  match_id: string;
}

export interface AnalyticsSummary {
  matches: number;
  goals: number;
  players: number;
  topScorer: CareerStats | null;
  bestWinRate: CareerStats | null;
  latestMatch: Match | null;
}

export interface PowerRanking {
  player: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>;
  rating: number;
  rank: number;
}

export interface FormRanking {
  player: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>;
  form: ('W' | 'D' | 'L')[];
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface TeamAnalyticsRow {
  team: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winRate: number;
}

export interface ClutchRow {
  playerName: string;
  team: string;
  earlyGoals: number;
  lateGoals: number;
  clutchScore: number;
}

export interface UpsetRow {
  match: Match;
  winnerName: string;
  loserName: string;
  winnerRating: number;
  loserRating: number;
  ratingGap: number;
}

export interface RivalrySummary {
  p1Id: string;
  p2Id: string;
  p1Name: string;
  p2Name: string;
  matches: Match[];
  p1Wins: number;
  p2Wins: number;
  draws: number;
  totalGoals: number;
  closeness: number;
}

export interface LeagueStory {
  champion: string | null;
  bestAttack: string | null;
  bestDefense: string | null;
  biggestWin: string | null;
  closestMatch: string | null;
  averageGoals: number;
}

export interface TitleRaceRow {
  playerName: string;
  team: string;
  currentPoints: number;
  projectedPoints: number;
  remainingMatches: number;
}

export function getAnalyticsSummary(
  stats: CareerStats[],
  matches: Match[],
  goals: GoalLite[],
  players: RegisteredPlayer[]
): AnalyticsSummary {
  const latestMatch = [...matches].sort((a, b) => (b.played_at ?? '').localeCompare(a.played_at ?? ''))[0] ?? null;
  return {
    matches: matches.length,
    goals: goals.length,
    players: players.length,
    topScorer: [...stats].sort((a, b) => b.total_goals - a.total_goals)[0] ?? null,
    bestWinRate: [...stats].filter((s) => s.total_matches >= 3).sort((a, b) => b.win_rate - a.win_rate)[0] ?? null,
    latestMatch,
  };
}

export function getPowerRankings(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: PlayerInstanceLite[],
  matches: Match[]
): PowerRanking[] {
  const ratings = calculateEloRatings(players, playerInstances, matches);
  return players
    .map((player) => ({ player, rating: ratings.get(player.id) ?? 1000, rank: 0 }))
    .sort((a, b) => b.rating - a.rating)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getFormRankings(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: PlayerInstanceLite[],
  matches: Match[],
  limit = 5
): FormRanking[] {
  const instanceToRegistered = new Map(playerInstances.map((player) => [player.id, player.registered_player_id]));
  const rows = new Map<string, FormRanking>();
  for (const player of players) {
    rows.set(player.id, { player, form: [], wins: 0, goalsFor: 0, goalsAgainst: 0 });
  }

  const sortedMatches = [...matches]
    .filter((match) => match.is_played && !match.is_bye)
    .sort((a, b) => (b.played_at ?? '').localeCompare(a.played_at ?? ''));

  for (const match of sortedMatches) {
    const homeRegisteredId = instanceToRegistered.get(match.home_player_id ?? '');
    const awayRegisteredId = instanceToRegistered.get(match.away_player_id ?? '');
    if (!homeRegisteredId || !awayRegisteredId) continue;

    const home = rows.get(homeRegisteredId);
    const away = rows.get(awayRegisteredId);
    if (!home || !away) continue;

    const homeScore = match.home_score ?? 0;
    const awayScore = match.away_score ?? 0;

    if (home.form.length < limit) {
      home.form.push(homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'D');
      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      if (homeScore > awayScore) home.wins++;
    }

    if (away.form.length < limit) {
      away.form.push(awayScore > homeScore ? 'W' : awayScore < homeScore ? 'L' : 'D');
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;
      if (awayScore > homeScore) away.wins++;
    }
  }

  return [...rows.values()]
    .filter((row) => row.form.length > 0)
    .sort((a, b) => b.wins - a.wins || b.goalsFor - a.goalsFor);
}

export function getTeamAnalytics(matches: Match[]): TeamAnalyticsRow[] {
  const teams = new Map<string, TeamAnalyticsRow>();

  const apply = (team: string, goalsFor: number, goalsAgainst: number) => {
    const row = teams.get(team) ?? {
      team,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      winRate: 0,
    };
    row.matches++;
    row.goalsFor += goalsFor;
    row.goalsAgainst += goalsAgainst;
    if (goalsFor > goalsAgainst) row.wins++;
    else if (goalsFor < goalsAgainst) row.losses++;
    else row.draws++;
    row.winRate = (row.wins / row.matches) * 100;
    teams.set(team, row);
  };

  for (const match of matches.filter((m) => m.is_played && !m.is_bye)) {
    apply(match.home_player?.team ?? 'Unknown', match.home_score ?? 0, match.away_score ?? 0);
    apply(match.away_player?.team ?? 'Unknown', match.away_score ?? 0, match.home_score ?? 0);
  }

  return [...teams.values()].sort((a, b) => b.winRate - a.winRate || b.matches - a.matches);
}

export function getClutchRankings(
  goals: GoalLite[],
  playerInstances: PlayerInstanceLite[],
  registeredPlayers: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[]
): ClutchRow[] {
  const instanceToPlayer = new Map(playerInstances.map((player) => [player.id, player]));
  const registeredById = new Map(registeredPlayers.map((player) => [player.id, player]));
  const rows = new Map<string, ClutchRow>();

  for (const goal of goals) {
    const instance = instanceToPlayer.get(goal.player_id);
    if (!instance) continue;
    const registered = registeredById.get(instance.registered_player_id);
    if (!registered) continue;

    const row = rows.get(registered.id) ?? {
      playerName: registered.name,
      team: registered.base_team,
      earlyGoals: 0,
      lateGoals: 0,
      clutchScore: 0,
    };

    if (goal.minute != null && goal.minute <= 15) row.earlyGoals++;
    if (goal.minute != null && goal.minute >= 75) row.lateGoals++;
    row.clutchScore = row.lateGoals * 2 + row.earlyGoals;
    rows.set(registered.id, row);
  }

  return [...rows.values()].filter((row) => row.clutchScore > 0).sort((a, b) => b.clutchScore - a.clutchScore);
}

export function getUpsets(
  matches: Match[],
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: PlayerInstanceLite[]
): UpsetRow[] {
  const ratings = calculateEloRatings(players, playerInstances, matches);
  const instanceToRegistered = new Map(playerInstances.map((player) => [player.id, player.registered_player_id]));
  const playerById = new Map(players.map((player) => [player.id, player]));

  return matches
    .filter((match) => match.is_played && !match.is_bye && (match.home_score ?? 0) !== (match.away_score ?? 0))
    .map((match) => {
      const homeWon = (match.home_score ?? 0) > (match.away_score ?? 0);
      const winnerInstanceId = homeWon ? match.home_player_id : match.away_player_id;
      const loserInstanceId = homeWon ? match.away_player_id : match.home_player_id;
      const winnerRegisteredId = instanceToRegistered.get(winnerInstanceId ?? '');
      const loserRegisteredId = instanceToRegistered.get(loserInstanceId ?? '');
      const winnerRating = winnerRegisteredId ? ratings.get(winnerRegisteredId) ?? 1000 : 1000;
      const loserRating = loserRegisteredId ? ratings.get(loserRegisteredId) ?? 1000 : 1000;
      return {
        match,
        winnerName: winnerRegisteredId ? playerById.get(winnerRegisteredId)?.name ?? 'Unknown' : 'Unknown',
        loserName: loserRegisteredId ? playerById.get(loserRegisteredId)?.name ?? 'Unknown' : 'Unknown',
        winnerRating,
        loserRating,
        ratingGap: loserRating - winnerRating,
      };
    })
    .filter((row) => row.ratingGap > 0)
    .sort((a, b) => b.ratingGap - a.ratingGap);
}

export function getRivalries(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: PlayerInstanceLite[],
  matches: Match[]
): RivalrySummary[] {
  const instanceToRegistered = new Map(playerInstances.map((player) => [player.id, player.registered_player_id]));
  const playerById = new Map(players.map((player) => [player.id, player]));
  const rivalries = new Map<string, RivalrySummary>();

  for (const match of matches.filter((m) => m.is_played && !m.is_bye && m.home_player_id && m.away_player_id)) {
    const homeId = instanceToRegistered.get(match.home_player_id ?? '');
    const awayId = instanceToRegistered.get(match.away_player_id ?? '');
    if (!homeId || !awayId || homeId === awayId) continue;

    const [p1Id, p2Id] = [homeId, awayId].sort();
    const key = `${p1Id}:${p2Id}`;
    const row = rivalries.get(key) ?? {
      p1Id,
      p2Id,
      p1Name: playerById.get(p1Id)?.name ?? 'Unknown',
      p2Name: playerById.get(p2Id)?.name ?? 'Unknown',
      matches: [],
      p1Wins: 0,
      p2Wins: 0,
      draws: 0,
      totalGoals: 0,
      closeness: 0,
    };

    const p1IsHome = homeId === p1Id;
    const p1Score = p1IsHome ? match.home_score ?? 0 : match.away_score ?? 0;
    const p2Score = p1IsHome ? match.away_score ?? 0 : match.home_score ?? 0;
    row.matches.push(match);
    row.totalGoals += p1Score + p2Score;
    row.closeness += Math.abs(p1Score - p2Score);
    if (p1Score > p2Score) row.p1Wins++;
    else if (p2Score > p1Score) row.p2Wins++;
    else row.draws++;
    rivalries.set(key, row);
  }

  return [...rivalries.values()].sort((a, b) => b.matches.length - a.matches.length);
}

export function getLeagueStory<T extends {
  player_name: string;
  team: string;
  points: number;
  goals_from_score: number;
  conceded: number;
  played: number;
}>(playerStats: T[], biggestWins: { home_player: string; away_player: string; home_score: number; away_score: number }[]): LeagueStory {
  const champion = [...playerStats].sort((a, b) => b.points - a.points)[0]?.player_name ?? null;
  const bestAttack = [...playerStats].sort((a, b) => b.goals_from_score - a.goals_from_score)[0]?.player_name ?? null;
  const bestDefense = [...playerStats].filter((p) => p.played > 0).sort((a, b) => a.conceded / a.played - b.conceded / b.played)[0]?.player_name ?? null;
  const biggest = biggestWins[0];
  return {
    champion,
    bestAttack,
    bestDefense,
    biggestWin: biggest ? `${biggest.home_player} ${biggest.home_score}-${biggest.away_score} ${biggest.away_player}` : null,
    closestMatch: null,
    averageGoals: playerStats.reduce((sum, row) => sum + row.goals_from_score, 0) / Math.max(playerStats.reduce((sum, row) => sum + row.played, 0) / 2, 1),
  };
}

export function getTitleRace<T extends {
  player_name: string;
  team: string;
  points: number;
  played: number;
  win_rate: number;
}>(playerStats: T[], tournament?: Pick<Tournament, 'format'> | null): TitleRaceRow[] {
  const maxPlayed = Math.max(...playerStats.map((row) => row.played), 0);
  return playerStats
    .map((row) => {
      const remainingMatches = tournament?.format === 'league' ? Math.max(maxPlayed - row.played, 0) : 0;
      return {
        playerName: row.player_name,
        team: row.team,
        currentPoints: row.points,
        projectedPoints: Math.round(row.points + remainingMatches * 3 * (row.win_rate / 100)),
        remainingMatches,
      };
    })
    .sort((a, b) => b.projectedPoints - a.projectedPoints || b.currentPoints - a.currentPoints);
}
