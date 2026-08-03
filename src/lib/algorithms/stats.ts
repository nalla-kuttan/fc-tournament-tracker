import type { Match, MatchStats, CareerStats } from '@/lib/types';

/**
 * Aggregate career stats for a registered player across all their tournament appearances.
 */
export function aggregateCareerStats(
  registeredPlayerId: string,
  playerName: string,
  baseTeam: string,
  playerIds: string[], // all Player.id entries linked to this registered player
  matches: Match[],
  goals: { player_id: string }[]
): CareerStats {
  const playerIdSet = new Set(playerIds);

  // Filter matches this player participated in
  const playerMatches = matches.filter(
    (m) =>
      m.is_played &&
      !m.is_bye &&
      (playerIdSet.has(m.home_player_id!) || playerIdSet.has(m.away_player_id!))
  );

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let totalConceded = 0;
  let cleanSheets = 0;
  let xgSum = 0;
  let xgCount = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  let possessionSum = 0;
  let possessionCount = 0;
  let motmAwards = 0;

  for (const m of playerMatches) {
    const isHome = playerIdSet.has(m.home_player_id!);
    const myScore = isHome ? m.home_score! : m.away_score!;
    const oppScore = isHome ? m.away_score! : m.home_score!;

    if (myScore > oppScore) wins++;
    else if (myScore < oppScore) losses++;
    else draws++;

    totalConceded += oppScore;
    if (oppScore === 0) cleanSheets++;

    const stats = m.stats as MatchStats;
    if (stats) {
      const myXg = isHome ? stats.home_xg : stats.away_xg;
      if (myXg != null) {
        xgSum += myXg;
        xgCount++;
      }

      const myRating = isHome ? stats.home_rating : stats.away_rating;
      if (myRating != null) {
        ratingSum += myRating;
        ratingCount++;
      }

      const myPoss = isHome ? stats.home_possession : stats.away_possession;
      if (myPoss != null) {
        possessionSum += myPoss;
        possessionCount++;
      }

      if (stats.motm_player_id && playerIdSet.has(stats.motm_player_id)) {
        motmAwards++;
      }
    }
  }

  const totalMatches = playerMatches.length;
  const totalGoals = goals.filter((g) => playerIdSet.has(g.player_id)).length;

  return {
    registered_player_id: registeredPlayerId,
    player_name: playerName,
    base_team: baseTeam,
    total_matches: totalMatches,
    wins,
    draws,
    losses,
    total_goals: totalGoals,
    total_conceded: totalConceded,
    clean_sheets: cleanSheets,
    avg_xg: xgCount > 0 ? xgSum / xgCount : 0,
    avg_rating: ratingCount > 0 ? ratingSum / ratingCount : 0,
    avg_possession: possessionCount > 0 ? possessionSum / possessionCount : 0,
    motm_awards: motmAwards,
    win_rate: totalMatches > 0 ? (wins / totalMatches) * 100 : 0,
    goals_per_match: totalMatches > 0 ? totalGoals / totalMatches : 0,
  };
}

export function aggregateCareerStatsBatch(
  registeredPlayers: Array<{ id: string; name: string; base_team: string }>,
  playerInstances: Array<{ id: string; registered_player_id: string }>,
  matches: Match[],
  goals: Array<{ player_id: string }>
): CareerStats[] {
  type MutableStats = CareerStats & {
    xgSum: number; xgCount: number; ratingSum: number; ratingCount: number;
    possessionSum: number; possessionCount: number;
  };
  const instanceToRegistered = new Map(playerInstances.map((player) => [player.id, player.registered_player_id]));
  const stats = new Map<string, MutableStats>(registeredPlayers.map((player) => [player.id, {
    registered_player_id: player.id,
    player_name: player.name,
    base_team: player.base_team,
    total_matches: 0, wins: 0, draws: 0, losses: 0, total_goals: 0,
    total_conceded: 0, clean_sheets: 0, avg_xg: 0, avg_rating: 0,
    avg_possession: 0, motm_awards: 0, win_rate: 0, goals_per_match: 0,
    xgSum: 0, xgCount: 0, ratingSum: 0, ratingCount: 0,
    possessionSum: 0, possessionCount: 0,
  }]));

  for (const match of matches) {
    if (!match.is_played || match.is_bye || !match.home_player_id || !match.away_player_id) continue;
    const home = stats.get(instanceToRegistered.get(match.home_player_id) ?? '');
    const away = stats.get(instanceToRegistered.get(match.away_player_id) ?? '');
    if (!home || !away) continue;
    const homeScore = match.home_score ?? 0;
    const awayScore = match.away_score ?? 0;
    home.total_matches++; away.total_matches++;
    home.total_conceded += awayScore; away.total_conceded += homeScore;
    if (awayScore === 0) home.clean_sheets++;
    if (homeScore === 0) away.clean_sheets++;
    if (homeScore > awayScore) { home.wins++; away.losses++; }
    else if (awayScore > homeScore) { away.wins++; home.losses++; }
    else { home.draws++; away.draws++; }

    const matchStats = match.stats as MatchStats | null;
    if (matchStats) {
      addMetric(home, matchStats.home_xg, 'xgSum', 'xgCount');
      addMetric(away, matchStats.away_xg, 'xgSum', 'xgCount');
      addMetric(home, matchStats.home_rating, 'ratingSum', 'ratingCount');
      addMetric(away, matchStats.away_rating, 'ratingSum', 'ratingCount');
      addMetric(home, matchStats.home_possession, 'possessionSum', 'possessionCount');
      addMetric(away, matchStats.away_possession, 'possessionSum', 'possessionCount');
      const motmRegisteredId = matchStats.motm_player_id ? instanceToRegistered.get(matchStats.motm_player_id) : null;
      if (motmRegisteredId) {
        const motm = stats.get(motmRegisteredId);
        if (motm) motm.motm_awards++;
      }
    }
  }

  for (const goal of goals) {
    const player = stats.get(instanceToRegistered.get(goal.player_id) ?? '');
    if (player) player.total_goals++;
  }

  return [...stats.values()].map((row) => {
    const { xgSum, xgCount, ratingSum, ratingCount, possessionSum, possessionCount, ...career } = row;
    return {
      ...career,
      avg_xg: xgCount ? xgSum / xgCount : 0,
      avg_rating: ratingCount ? ratingSum / ratingCount : 0,
      avg_possession: possessionCount ? possessionSum / possessionCount : 0,
      win_rate: career.total_matches ? (career.wins / career.total_matches) * 100 : 0,
      goals_per_match: career.total_matches ? career.total_goals / career.total_matches : 0,
    };
  });
}

function addMetric(
  row: { xgSum: number; xgCount: number; ratingSum: number; ratingCount: number; possessionSum: number; possessionCount: number },
  value: number | null | undefined,
  sumKey: 'xgSum' | 'ratingSum' | 'possessionSum',
  countKey: 'xgCount' | 'ratingCount' | 'possessionCount'
) {
  if (value == null || !Number.isFinite(value)) return;
  row[sumKey] += value;
  row[countKey] += 1;
}

/**
 * Normalize career stats to 0-100 scale for radar chart.
 * Uses reasonable maximums for a small tournament context.
 */
export function normalizeForRadar(stats: CareerStats): {
  goals: number;
  cleanSheets: number;
  winRate: number;
  avgRating: number;
  possession: number;
} {
  return {
    goals: Math.min((stats.goals_per_match / 3) * 100, 100),
    cleanSheets:
      stats.total_matches > 0
        ? Math.min((stats.clean_sheets / stats.total_matches) * 100, 100)
        : 0,
    winRate: stats.win_rate,
    avgRating: Math.min((stats.avg_rating / 10) * 100, 100),
    possession: stats.avg_possession,
  };
}
