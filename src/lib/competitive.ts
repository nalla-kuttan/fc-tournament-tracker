import type { Match, MatchStats, Player, RegisteredPlayer, Season, Tournament } from './types';

type TournamentWithSeason = Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'created_at' | 'season_id'>;
type PlayerInstance = Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>;
type ScopeOptions = { scope: 'season' | 'all-time'; seasonId?: string | null };

export interface TournamentSeasonAssignment {
  tournamentId: string;
  seasonId: string;
}

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

export interface MatchIntelligenceLabel {
  kind:
    | 'upset'
    | 'comeback'
    | 'clutch-win'
    | 'defensive-masterclass'
    | 'goal-rush'
    | 'rivalry-swing'
    | 'pressure-result';
  label: string;
  detail: string;
}

export interface TrophyCabinetRow {
  player: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>;
  titles: number;
  finals: number;
  runnerUps: number;
  bestSeason: string | null;
}

export interface RecordHighlight {
  playerId: string;
  playerName: string;
  value: number;
  detail: string;
}

export interface BiggestWinRecord {
  playerId: string;
  playerName: string;
  opponentName: string;
  scoreline: string;
  goalDifference: number;
  matchId: string;
}

export interface UpsetRecord {
  winnerId: string;
  winnerName: string;
  loserName: string;
  matchId: string;
  upsetScore: number;
  detail: string;
}

export interface MatchRecord {
  matchId: string;
  label: string;
  scoreline: string;
  totalGoals: number;
  detail: string;
}

export interface IndividualSeasonRecord {
  playerId: string;
  playerName: string;
  seasonId: string;
  seasonName: string;
  value: number;
  detail: string;
}

export interface CompetitiveRecords {
  trophyCabinet: TrophyCabinetRow[];
  biggestWins: BiggestWinRecord[];
  biggestLosses: BiggestWinRecord[];
  longestWinStreaks: Array<RecordHighlight & { streak: number }>;
  longestCleanSheetStreaks: Array<RecordHighlight & { streak: number }>;
  biggestUpsets: UpsetRecord[];
  topScorers: RecordHighlight[];
  mostWins: RecordHighlight[];
  mostMatches: RecordHighlight[];
  bestWinRates: RecordHighlight[];
  bestAttacks: RecordHighlight[];
  bestDefenses: RecordHighlight[];
  cleanSheetKings: RecordHighlight[];
  clutchWins: RecordHighlight[];
  highestScoringMatches: MatchRecord[];
  bestIndividualSeasons: {
    mostGoals: IndividualSeasonRecord[];
    mostWins: IndividualSeasonRecord[];
    bestWinRates: IndividualSeasonRecord[];
    bestAttacks: IndividualSeasonRecord[];
    bestDefenses: IndividualSeasonRecord[];
    cleanSheets: IndividualSeasonRecord[];
    clutchWins: IndividualSeasonRecord[];
  };
}

export function buildTournamentDerivedSeasons(tournaments: TournamentWithSeason[]): {
  seasons: Season[];
  tournamentSeasonAssignments: TournamentSeasonAssignment[];
} {
  const missingSeasonTournaments = tournaments.filter((tournament) => !tournament.season_id);
  return {
    seasons: missingSeasonTournaments.map((tournament) => ({
      id: getDerivedSeasonId(tournament.id),
      name: tournament.name,
      status: tournament.status === 'completed' ? 'completed' : tournament.status === 'active' ? 'active' : 'archived',
      starts_at: tournament.created_at,
      ends_at: tournament.status === 'completed' ? tournament.created_at : null,
      source_tournament_id: tournament.id,
      created_at: tournament.created_at,
    })),
    tournamentSeasonAssignments: missingSeasonTournaments.map((tournament) => ({
      tournamentId: tournament.id,
      seasonId: getDerivedSeasonId(tournament.id),
    })),
  };
}

export function getDerivedSeasonId(tournamentId: string) {
  return `season-${tournamentId}`;
}

export function calculateCompetitiveRatings(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: PlayerInstance[],
  matches: Match[],
  options: ScopeOptions
): CompetitiveRatingRow[] {
  const instanceToRegistered = new Map(playerInstances.map((player) => [player.id, player.registered_player_id]));
  const ratingMap = new Map(players.map((player) => [player.id, 1000]));
  const peakMap = new Map(players.map((player) => [player.id, 1000]));
  const matchesMap = new Map(players.map((player) => [player.id, 0]));
  const formMap = new Map(players.map((player) => [player.id, [] as ('W' | 'D' | 'L')[]]));
  const filteredMatches = filterMatchesByScope(matches, options)
    .filter((match) => match.is_played && !match.is_bye && match.home_player_id && match.away_player_id)
    .sort((a, b) => (a.played_at ?? '').localeCompare(b.played_at ?? ''));

  for (const match of filteredMatches) {
    const homeRegisteredId = instanceToRegistered.get(match.home_player_id ?? '');
    const awayRegisteredId = instanceToRegistered.get(match.away_player_id ?? '');
    if (!homeRegisteredId || !awayRegisteredId) continue;

    const homeRating = ratingMap.get(homeRegisteredId) ?? 1000;
    const awayRating = ratingMap.get(awayRegisteredId) ?? 1000;
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

export function calculateCompetitiveRecords(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  playerInstances: PlayerInstance[],
  tournaments: TournamentWithSeason[],
  matches: Match[],
  options: ScopeOptions
): CompetitiveRecords {
  const scopedMatches = filterMatchesByScope(matches, options).filter((match) => match.is_played && !match.is_bye);
  const scopedTournamentIds = new Set(scopedMatches.map((match) => match.tournament_id));
  const scopedTournaments = tournaments.filter((tournament) => scopedTournamentIds.has(tournament.id));
  const seasonNames = new Map(scopedTournaments.map((tournament) => [
    tournament.season_id ?? getDerivedSeasonId(tournament.id),
    tournament.name,
  ]));
  const instanceToRegistered = new Map(playerInstances.map((player) => [player.id, player.registered_player_id]));
  const playerById = new Map(players.map((player) => [player.id, player]));
  const trophyMap = new Map(players.map((player) => [player.id, {
    player,
    titles: 0,
    finals: 0,
    runnerUps: 0,
    bestSeason: null as string | null,
  }]));

  for (const tournament of scopedTournaments) {
    const tournamentMatches = scopedMatches.filter((match) => match.tournament_id === tournament.id);
    const finalMatch = tournamentMatches
      .filter((match) => match.stage === 'F')
      .sort((a, b) => (b.played_at ?? '').localeCompare(a.played_at ?? ''))[0];
    const hasFinal = Boolean(finalMatch);
    const winner = finalMatch ? getWinnerAndLoser(finalMatch) : getLeagueChampion(tournamentMatches);
    if (!winner) continue;

    const winnerRegisteredId = instanceToRegistered.get(winner.winnerInstanceId ?? '');
    const runnerUpRegisteredId = instanceToRegistered.get(winner.loserInstanceId ?? '');
    if (winnerRegisteredId) {
      const row = trophyMap.get(winnerRegisteredId);
      if (row) {
        row.titles++;
        if (hasFinal) row.finals++;
        row.bestSeason = tournament.name;
      }
    }
    if (runnerUpRegisteredId) {
      const row = trophyMap.get(runnerUpRegisteredId);
      if (row) {
        row.runnerUps++;
        if (hasFinal) row.finals++;
      }
    }
  }

  const playerMatchRows = getPlayerMatchRows(scopedMatches, instanceToRegistered, playerById);
  const biggestWins = playerMatchRows
    .filter((row) => row.goalsFor > row.goalsAgainst)
    .map((row) => ({
      playerId: row.player.id,
      playerName: row.player.name,
      opponentName: row.opponentName,
      scoreline: `${row.goalsFor}-${row.goalsAgainst}`,
      goalDifference: row.goalsFor - row.goalsAgainst,
      matchId: row.match.id,
    }))
    .sort((a, b) => b.goalDifference - a.goalDifference || a.playerName.localeCompare(b.playerName))
    .slice(0, 10);

  const longestWinStreaks = calculateStreaks(playerMatchRows, 'win').slice(0, 10);
  const longestCleanSheetStreaks = calculateStreaks(playerMatchRows, 'clean-sheet').slice(0, 10);
  const biggestUpsets = calculateBiggestUpsets(scopedMatches, instanceToRegistered, playerById).slice(0, 10);
  const aggregateRecords = calculateAggregateRecords(playerMatchRows);
  const bestIndividualSeasons = calculateBestIndividualSeasons(playerMatchRows, seasonNames);
  const biggestLosses = playerMatchRows
    .filter((row) => row.goalsFor < row.goalsAgainst)
    .map((row) => ({
      playerId: row.player.id,
      playerName: row.player.name,
      opponentName: row.opponentName,
      scoreline: `${row.goalsFor}-${row.goalsAgainst}`,
      goalDifference: row.goalsAgainst - row.goalsFor,
      matchId: row.match.id,
    }))
    .sort((a, b) => b.goalDifference - a.goalDifference || a.playerName.localeCompare(b.playerName))
    .slice(0, 10);
  const highestScoringMatches = scopedMatches
    .map((match) => {
      const homeScore = match.home_score ?? 0;
      const awayScore = match.away_score ?? 0;
      return {
        matchId: match.id,
        label: `${match.home_player?.name ?? 'Home'} vs ${match.away_player?.name ?? 'Away'}`,
        scoreline: `${homeScore}-${awayScore}`,
        totalGoals: homeScore + awayScore,
        detail: match.tournament?.name ?? 'Tournament match',
      };
    })
    .sort((a, b) => b.totalGoals - a.totalGoals || a.label.localeCompare(b.label))
    .slice(0, 10);

  return {
    trophyCabinet: [...trophyMap.values()]
      .filter((row) => row.titles > 0 || row.finals > 0)
      .sort((a, b) => b.titles - a.titles || b.finals - a.finals || a.player.name.localeCompare(b.player.name)),
    biggestWins,
    biggestLosses,
    longestWinStreaks,
    longestCleanSheetStreaks,
    biggestUpsets,
    highestScoringMatches,
    bestIndividualSeasons,
    ...aggregateRecords,
  };
}

export function getMatchIntelligenceLabels(
  match: Match,
  context: {
    winnerRating?: number | null;
    loserRating?: number | null;
    previousH2HWinnerId?: string | null;
  } = {}
): MatchIntelligenceLabel[] {
  const result = getWinnerAndLoser(match);
  if (!result) return [];

  const labels: MatchIntelligenceLabel[] = [];
  const totalGoals = (match.home_score ?? 0) + (match.away_score ?? 0);
  const winnerScore = result.winnerInstanceId === match.home_player_id ? match.home_score ?? 0 : match.away_score ?? 0;
  const loserScore = result.loserInstanceId === match.home_player_id ? match.home_score ?? 0 : match.away_score ?? 0;
  const winnerSide = result.winnerInstanceId === match.home_player_id ? 'home' : 'away';
  const loserSide = winnerSide === 'home' ? 'away' : 'home';
  const stats = match.stats as MatchStats | undefined;
  const loserXg = loserSide === 'home' ? stats?.home_xg : stats?.away_xg;

  if (
    context.winnerRating != null &&
    context.loserRating != null &&
    context.winnerRating + 35 < context.loserRating
  ) {
    labels.push({ kind: 'upset', label: 'Upset', detail: 'Lower-rated player beat a higher-rated opponent.' });
  }

  if (winnerScore > loserScore && loserScore > 0 && winnerScore - loserScore === 1) {
    labels.push({ kind: 'clutch-win', label: 'Clutch Win', detail: 'Settled by a one-goal margin.' });
  }

  if (loserScore <= 1 && (loserXg == null || loserXg >= 1.5)) {
    labels.push({
      kind: 'defensive-masterclass',
      label: 'Defensive Masterclass',
      detail: 'Held the opponent down despite real attacking pressure.',
    });
  }

  if (totalGoals >= 5) {
    labels.push({ kind: 'goal-rush', label: 'Goal Rush', detail: `${totalGoals} total goals in one match.` });
  }

  if (context.previousH2HWinnerId && context.previousH2HWinnerId === result.loserInstanceId) {
    labels.push({ kind: 'rivalry-swing', label: 'Rivalry Swing', detail: 'Reversed the previous head-to-head result.' });
  }

  if (match.stage === 'F' || match.round_number >= 3) {
    labels.push({ kind: 'pressure-result', label: 'Pressure Result', detail: 'Delivered in a late-stage match.' });
  }

  return labels;
}

function filterMatchesByScope(matches: Match[], options: ScopeOptions) {
  if (options.scope === 'all-time') return matches;
  return matches.filter((match) => match.season_id === options.seasonId);
}

function estimatePreviousRating(rating: number, latestForm?: 'W' | 'D' | 'L') {
  if (latestForm === 'W') return rating - 18;
  if (latestForm === 'L') return rating + 18;
  return rating;
}

function getWinnerAndLoser(match: Match) {
  if ((match.home_score ?? 0) === (match.away_score ?? 0)) return null;
  const homeWon = (match.home_score ?? 0) > (match.away_score ?? 0);
  return {
    winnerInstanceId: homeWon ? match.home_player_id : match.away_player_id,
    loserInstanceId: homeWon ? match.away_player_id : match.home_player_id,
  };
}

function getLeagueChampion(matches: Match[]) {
  const rows = new Map<string, { points: number; goalDifference: number; goalsFor: number }>();
  for (const match of matches) {
    if (!match.home_player_id || !match.away_player_id) continue;
    const home = rows.get(match.home_player_id) ?? { points: 0, goalDifference: 0, goalsFor: 0 };
    const away = rows.get(match.away_player_id) ?? { points: 0, goalDifference: 0, goalsFor: 0 };
    const homeScore = match.home_score ?? 0;
    const awayScore = match.away_score ?? 0;

    home.goalDifference += homeScore - awayScore;
    home.goalsFor += homeScore;
    away.goalDifference += awayScore - homeScore;
    away.goalsFor += awayScore;
    if (homeScore > awayScore) home.points += 3;
    else if (homeScore < awayScore) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
    rows.set(match.home_player_id, home);
    rows.set(match.away_player_id, away);
  }

  const sorted = [...rows.entries()].sort(([, a], [, b]) =>
    b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
  );
  if (sorted.length === 0) return null;
  return { winnerInstanceId: sorted[0][0], loserInstanceId: sorted[1]?.[0] ?? null };
}

function getPlayerMatchRows(
  matches: Match[],
  instanceToRegistered: Map<string, string>,
  playerById: Map<string, Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>>
) {
  return matches
    .flatMap((match) => {
      if (!match.home_player_id || !match.away_player_id) return [];
      const homeRegistered = instanceToRegistered.get(match.home_player_id);
      const awayRegistered = instanceToRegistered.get(match.away_player_id);
      const homePlayer = homeRegistered ? playerById.get(homeRegistered) : null;
      const awayPlayer = awayRegistered ? playerById.get(awayRegistered) : null;
      if (!homePlayer || !awayPlayer) return [];
      const homeScore = match.home_score ?? 0;
      const awayScore = match.away_score ?? 0;
      return [
        {
          match,
          player: homePlayer,
          opponentName: awayPlayer.name,
          goalsFor: homeScore,
          goalsAgainst: awayScore,
          result: homeScore > awayScore ? 'W' as const : homeScore < awayScore ? 'L' as const : 'D' as const,
        },
        {
          match,
          player: awayPlayer,
          opponentName: homePlayer.name,
          goalsFor: awayScore,
          goalsAgainst: homeScore,
          result: awayScore > homeScore ? 'W' as const : awayScore < homeScore ? 'L' as const : 'D' as const,
        },
      ];
    })
    .sort((a, b) => (a.match.played_at ?? '').localeCompare(b.match.played_at ?? ''));
}

function calculateStreaks(
  rows: ReturnType<typeof getPlayerMatchRows>,
  mode: 'win' | 'clean-sheet'
): Array<RecordHighlight & { streak: number }> {
  const byPlayer = new Map<string, typeof rows>();
  for (const row of rows) {
    byPlayer.set(row.player.id, [...(byPlayer.get(row.player.id) ?? []), row]);
  }

  return [...byPlayer.entries()]
    .map(([playerId, playerRows]) => {
      let current = 0;
      let best = 0;
      for (const row of playerRows) {
        const hit = mode === 'win' ? row.result === 'W' : row.goalsAgainst === 0;
        current = hit ? current + 1 : 0;
        best = Math.max(best, current);
      }
      const player = playerRows[0].player;
      return {
        playerId,
        playerName: player.name,
        value: best,
        streak: best,
        detail: mode === 'win' ? 'consecutive wins' : 'consecutive clean sheets',
      };
    })
    .filter((row) => row.streak > 0)
    .sort((a, b) => b.streak - a.streak || a.playerName.localeCompare(b.playerName));
}

function calculateAggregateRecords(rows: ReturnType<typeof getPlayerMatchRows>) {
  const aggregates = new Map<string, {
    playerId: string;
    playerName: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
    clutchWins: number;
  }>();

  for (const row of rows) {
    const current = aggregates.get(row.player.id) ?? {
      playerId: row.player.id,
      playerName: row.player.name,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      clutchWins: 0,
    };

    current.matches++;
    current.goalsFor += row.goalsFor;
    current.goalsAgainst += row.goalsAgainst;
    if (row.result === 'W') current.wins++;
    if (row.result === 'D') current.draws++;
    if (row.result === 'L') current.losses++;
    if (row.goalsAgainst === 0) current.cleanSheets++;
    if (row.result === 'W' && row.goalsFor - row.goalsAgainst === 1) current.clutchWins++;
    aggregates.set(row.player.id, current);
  }

  const values = [...aggregates.values()];
  const toRecord = (
    rowsToMap: typeof values,
    valueFor: (row: typeof values[number]) => number,
    detailFor: (row: typeof values[number]) => string
  ): RecordHighlight[] => rowsToMap
    .map((row) => ({
      playerId: row.playerId,
      playerName: row.playerName,
      value: valueFor(row),
      detail: detailFor(row),
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.playerName.localeCompare(b.playerName))
    .slice(0, 10);

  return {
    topScorers: toRecord(values, (row) => row.goalsFor, (row) => `${row.matches} matches`),
    mostWins: toRecord(values, (row) => row.wins, (row) => `${row.matches} matches played`),
    mostMatches: toRecord(values, (row) => row.matches, (row) => `${row.wins} wins`),
    bestWinRates: toRecord(
      values.filter((row) => row.matches >= 3),
      (row) => Math.round((row.wins / row.matches) * 100),
      (row) => `${row.wins}-${row.draws}-${row.losses}`
    ),
    bestAttacks: toRecord(values, (row) => row.goalsFor, (row) => `${(row.goalsFor / row.matches).toFixed(2)} goals/match`),
    bestDefenses: toRecord(values, (row) => row.goalsAgainst, (row) => `${(row.goalsAgainst / row.matches).toFixed(2)} conceded/match`)
      .sort((a, b) => a.value - b.value || a.playerName.localeCompare(b.playerName))
      .slice(0, 10),
    cleanSheetKings: toRecord(values, (row) => row.cleanSheets, (row) => `${row.matches} matches`),
    clutchWins: toRecord(values, (row) => row.clutchWins, () => 'one-goal wins'),
  };
}

function calculateBestIndividualSeasons(
  rows: ReturnType<typeof getPlayerMatchRows>,
  seasonNames: Map<string, string>
): CompetitiveRecords['bestIndividualSeasons'] {
  const seasonRows = new Map<string, {
    playerId: string;
    playerName: string;
    seasonId: string;
    seasonName: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
    clutchWins: number;
  }>();

  for (const row of rows) {
    const seasonId = row.match.season_id ?? `season-${row.match.tournament_id}`;
    const seasonName = seasonNames.get(seasonId) ?? row.match.tournament?.name ?? seasonId;
    const key = `${seasonId}:${row.player.id}`;
    const current = seasonRows.get(key) ?? {
      playerId: row.player.id,
      playerName: row.player.name,
      seasonId,
      seasonName,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      clutchWins: 0,
    };

    current.matches++;
    current.goalsFor += row.goalsFor;
    current.goalsAgainst += row.goalsAgainst;
    if (row.result === 'W') current.wins++;
    if (row.result === 'D') current.draws++;
    if (row.result === 'L') current.losses++;
    if (row.goalsAgainst === 0) current.cleanSheets++;
    if (row.result === 'W' && row.goalsFor - row.goalsAgainst === 1) current.clutchWins++;
    seasonRows.set(key, current);
  }

  const values = [...seasonRows.values()];
  const high = (
    valueFor: (row: typeof values[number]) => number,
    detailFor: (row: typeof values[number]) => string,
    rowsToMap = values
  ): IndividualSeasonRecord[] => rowsToMap
    .map((row) => ({
      playerId: row.playerId,
      playerName: row.playerName,
      seasonId: row.seasonId,
      seasonName: row.seasonName,
      value: valueFor(row),
      detail: detailFor(row),
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.playerName.localeCompare(b.playerName) || a.seasonName.localeCompare(b.seasonName))
    .slice(0, 10);

  const low = (
    valueFor: (row: typeof values[number]) => number,
    detailFor: (row: typeof values[number]) => string,
    rowsToMap = values
  ): IndividualSeasonRecord[] => rowsToMap
    .map((row) => ({
      playerId: row.playerId,
      playerName: row.playerName,
      seasonId: row.seasonId,
      seasonName: row.seasonName,
      value: valueFor(row),
      detail: detailFor(row),
    }))
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => a.value - b.value || a.playerName.localeCompare(b.playerName) || a.seasonName.localeCompare(b.seasonName))
    .slice(0, 10);

  return {
    mostGoals: high((row) => row.goalsFor, (row) => `${row.seasonName} · ${row.matches} matches`),
    mostWins: high((row) => row.wins, (row) => `${row.seasonName} · ${row.matches} matches`),
    bestWinRates: high(
      (row) => Math.round((row.wins / row.matches) * 100),
      (row) => `${row.seasonName} · ${row.wins}-${row.draws}-${row.losses}`,
      values.filter((row) => row.matches >= 2)
    ),
    bestAttacks: high(
      (row) => Number((row.goalsFor / row.matches).toFixed(2)),
      (row) => `${row.seasonName} · ${row.goalsFor} goals`
    ),
    bestDefenses: low(
      (row) => Number((row.goalsAgainst / row.matches).toFixed(2)),
      (row) => `${row.seasonName} · ${row.goalsAgainst} conceded`
    ),
    cleanSheets: high((row) => row.cleanSheets, (row) => `${row.seasonName} · ${row.matches} matches`),
    clutchWins: high((row) => row.clutchWins, (row) => `${row.seasonName} · one-goal wins`),
  };
}

function calculateBiggestUpsets(
  matches: Match[],
  instanceToRegistered: Map<string, string>,
  playerById: Map<string, Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>>
): UpsetRecord[] {
  return matches
    .map((match) => {
      const result = getWinnerAndLoser(match);
      if (!result?.winnerInstanceId || !result.loserInstanceId) return null;
      const winnerRegisteredId = instanceToRegistered.get(result.winnerInstanceId);
      const loserRegisteredId = instanceToRegistered.get(result.loserInstanceId);
      const winner = winnerRegisteredId ? playerById.get(winnerRegisteredId) : null;
      const loser = loserRegisteredId ? playerById.get(loserRegisteredId) : null;
      if (!winner || !loser) return null;

      const winnerIsHome = result.winnerInstanceId === match.home_player_id;
      const stats = match.stats as MatchStats | undefined;
      const winnerXg = winnerIsHome ? stats?.home_xg : stats?.away_xg;
      const loserXg = winnerIsHome ? stats?.away_xg : stats?.home_xg;
      const xgGap = winnerXg != null && loserXg != null ? loserXg - winnerXg : 0;
      const margin = Math.abs((match.home_score ?? 0) - (match.away_score ?? 0));
      const upsetScore = Math.round(Math.max(xgGap, 0) * 20 + margin * 5);
      if (upsetScore <= 0) return null;
      return {
        winnerId: winner.id,
        winnerName: winner.name,
        loserName: loser.name,
        matchId: match.id,
        upsetScore,
        detail: winnerXg != null && loserXg != null
          ? `Won despite ${winnerXg.toFixed(1)} xG vs ${loserXg.toFixed(1)} xG`
          : `Won by ${margin}`,
      };
    })
    .filter((row): row is UpsetRecord => Boolean(row))
    .sort((a, b) => b.upsetScore - a.upsetScore || a.winnerName.localeCompare(b.winnerName));
}
