import type { CareerStats, Match, MatchStats, RegisteredPlayer } from '@/lib/types';

export interface PlayerInstanceLite {
  id: string;
  registered_player_id: string;
  name?: string;
  team?: string;
}

export interface PlayerMatchInsight {
  match: Match;
  result: 'W' | 'D' | 'L';
  goalsFor: number;
  goalsAgainst: number;
  opponentName: string;
  team: string;
  rating: number | null;
}

export interface PlayerHighlight {
  label: string;
  value: string;
  detail: string;
}

export interface TeamHistoryRow {
  team: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winRate: number;
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

export function getAvatarColor(seed: string) {
  const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#A855F7', '#EF4444', '#14B8A6', '#F97316'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % colors.length;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getPlayerMatchInsights(matches: Match[], playerIds: Set<string>): PlayerMatchInsight[] {
  return matches
    .filter((match) => match.is_played && !match.is_bye && (playerIds.has(match.home_player_id ?? '') || playerIds.has(match.away_player_id ?? '')))
    .map((match) => {
      const isHome = playerIds.has(match.home_player_id ?? '');
      const goalsFor = isHome ? match.home_score ?? 0 : match.away_score ?? 0;
      const goalsAgainst = isHome ? match.away_score ?? 0 : match.home_score ?? 0;
      const stats = match.stats as MatchStats;
      const result: 'W' | 'D' | 'L' = goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';

      return {
        match,
        result,
        goalsFor,
        goalsAgainst,
        opponentName: isHome ? match.away_player?.name ?? 'TBD' : match.home_player?.name ?? 'TBD',
        team: isHome ? match.home_player?.team ?? 'Unknown' : match.away_player?.team ?? 'Unknown',
        rating: isHome ? stats?.home_rating ?? null : stats?.away_rating ?? null,
      };
    })
    .sort((a, b) => (b.match.played_at ?? '').localeCompare(a.match.played_at ?? ''));
}

export function getRecentForm(matches: Match[], playerIds: Set<string>, limit = 5) {
  return getPlayerMatchInsights(matches, playerIds)
    .slice(0, limit)
    .map((entry) => entry.result);
}

export function getTeamHistory(matches: Match[], playerIds: Set<string>): TeamHistoryRow[] {
  const rows = new Map<string, TeamHistoryRow>();

  for (const entry of getPlayerMatchInsights(matches, playerIds)) {
    const current = rows.get(entry.team) ?? {
      team: entry.team,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      winRate: 0,
    };

    current.matches++;
    current.goalsFor += entry.goalsFor;
    current.goalsAgainst += entry.goalsAgainst;
    if (entry.result === 'W') current.wins++;
    if (entry.result === 'D') current.draws++;
    if (entry.result === 'L') current.losses++;
    current.winRate = (current.wins / current.matches) * 100;
    rows.set(entry.team, current);
  }

  return [...rows.values()].sort((a, b) => b.matches - a.matches || b.winRate - a.winRate);
}

export function getPlayerHighlights(stats: CareerStats, matches: Match[], playerIds: Set<string>): PlayerHighlight[] {
  const insights = getPlayerMatchInsights(matches, playerIds).slice().reverse();
  let biggestWin: PlayerMatchInsight | null = null;
  let mostGoals: PlayerMatchInsight | null = null;
  let bestRating: PlayerMatchInsight | null = null;
  let longestWinStreak = 0;
  let longestCleanSheetStreak = 0;
  let winStreak = 0;
  let cleanSheetStreak = 0;

  for (const entry of insights) {
    if (!biggestWin || entry.goalsFor - entry.goalsAgainst > biggestWin.goalsFor - biggestWin.goalsAgainst) {
      biggestWin = entry;
    }

    if (!mostGoals || entry.goalsFor > mostGoals.goalsFor) {
      mostGoals = entry;
    }

    if (entry.rating != null && (!bestRating || entry.rating > (bestRating.rating ?? 0))) {
      bestRating = entry;
    }

    if (entry.result === 'W') {
      winStreak++;
      longestWinStreak = Math.max(longestWinStreak, winStreak);
    } else {
      winStreak = 0;
    }

    if (entry.goalsAgainst === 0) {
      cleanSheetStreak++;
      longestCleanSheetStreak = Math.max(longestCleanSheetStreak, cleanSheetStreak);
    } else {
      cleanSheetStreak = 0;
    }
  }

  const topTeam = getTeamHistory(matches, playerIds)[0];
  const highlights: PlayerHighlight[] = [
    { label: 'Archetype', value: getPlayerArchetype(stats), detail: 'Based on career profile' },
  ];

  if (biggestWin && biggestWin.goalsFor > biggestWin.goalsAgainst) {
    highlights.push({
      label: 'Biggest Win',
      value: `${biggestWin.goalsFor}-${biggestWin.goalsAgainst}`,
      detail: `vs ${biggestWin.opponentName}`,
    });
  }

  if (mostGoals && mostGoals.goalsFor > 0) {
    highlights.push({
      label: 'Best Scoring Match',
      value: `${mostGoals.goalsFor} goals`,
      detail: `vs ${mostGoals.opponentName}`,
    });
  }

  if (longestWinStreak > 1) {
    highlights.push({ label: 'Longest Win Streak', value: `${longestWinStreak}`, detail: 'matches in a row' });
  }

  if (longestCleanSheetStreak > 1) {
    highlights.push({ label: 'Clean Sheet Run', value: `${longestCleanSheetStreak}`, detail: 'matches in a row' });
  }

  if (bestRating?.rating != null) {
    highlights.push({ label: 'Best Rating', value: bestRating.rating.toFixed(1), detail: `vs ${bestRating.opponentName}` });
  }

  if (topTeam) {
    highlights.push({ label: 'Most Used Team', value: topTeam.team, detail: `${topTeam.matches} matches` });
  }

  return highlights.slice(0, 6);
}

export function getPlayerArchetype(stats: CareerStats) {
  if (stats.total_matches === 0) return 'New Prospect';
  if (stats.goals_per_match >= 2.5) return 'Finisher';
  if (stats.clean_sheets / Math.max(stats.total_matches, 1) >= 0.45) return 'Defensive Wall';
  if (stats.avg_possession >= 58) return 'Possession Controller';
  if (stats.motm_awards >= Math.max(2, stats.total_matches * 0.3)) return 'Big Game Player';
  if (stats.win_rate >= 70) return 'Serial Winner';
  if (stats.total_goals + stats.total_conceded >= stats.total_matches * 5) return 'Chaos Ball';
  return 'Balanced Operator';
}

export function calculateEloRatings(
  players: Pick<RegisteredPlayer, 'id'>[],
  playerInstances: PlayerInstanceLite[],
  matches: Match[]
) {
  const ratings = new Map(players.map((player) => [player.id, 1000]));
  const instanceToRegistered = new Map(playerInstances.map((player) => [player.id, player.registered_player_id]));
  const sortedMatches = [...matches]
    .filter((match) => match.is_played && !match.is_bye && match.home_player_id && match.away_player_id)
    .sort((a, b) => (a.played_at ?? '').localeCompare(b.played_at ?? ''));

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const getPerformanceScore = (
    match: Match,
    side: 'home' | 'away',
    goalsFor: number,
    goalsAgainst: number
  ) => {
    const stats = match.stats as MatchStats | undefined;
    const isHome = side === 'home';
    const xg = isHome ? stats?.home_xg : stats?.away_xg;
    const possession = isHome ? stats?.home_possession : stats?.away_possession;
    const rating = isHome ? stats?.home_rating : stats?.away_rating;
    const playerId = isHome ? match.home_player_id : match.away_player_id;
    const motmBonus = stats?.motm_player_id && stats.motm_player_id === playerId
      ? 5 + clamp((stats.motm_rating ?? 8) - 8, -1, 2)
      : 0;

    return (
      clamp(goalsFor, 0, 6) * 1.2 +
      clamp(goalsFor - goalsAgainst, -5, 5) * 2.2 +
      (xg == null ? 0 : clamp(xg, 0, 5) * 2.4) +
      (possession == null ? 0 : clamp(possession - 50, -30, 30) * 0.12) +
      (rating == null ? 0 : clamp(rating - 6.5, -3, 3.5) * 3) +
      motmBonus
    );
  };

  for (const match of sortedMatches) {
    const homeRegisteredId = instanceToRegistered.get(match.home_player_id ?? '');
    const awayRegisteredId = instanceToRegistered.get(match.away_player_id ?? '');
    if (!homeRegisteredId || !awayRegisteredId) continue;

    const homeRating = ratings.get(homeRegisteredId) ?? 1000;
    const awayRating = ratings.get(awayRegisteredId) ?? 1000;
    const expectedHome = 1 / (1 + Math.pow(10, (awayRating - homeRating) / 400));
    const homeGoals = match.home_score ?? 0;
    const awayGoals = match.away_score ?? 0;
    const homeScore = homeGoals > awayGoals ? 1 : homeGoals === awayGoals ? 0.5 : 0;
    const k = 28;
    const homePerformance = getPerformanceScore(match, 'home', homeGoals, awayGoals);
    const awayPerformance = getPerformanceScore(match, 'away', awayGoals, homeGoals);
    const performanceModifier = clamp(homePerformance - awayPerformance, -14, 14);

    ratings.set(homeRegisteredId, Math.round(homeRating + k * (homeScore - expectedHome) + performanceModifier));
    ratings.set(awayRegisteredId, Math.round(awayRating + k * ((1 - homeScore) - (1 - expectedHome)) - performanceModifier));
  }

  return ratings;
}
