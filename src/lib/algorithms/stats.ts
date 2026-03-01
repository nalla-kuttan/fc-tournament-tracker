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
