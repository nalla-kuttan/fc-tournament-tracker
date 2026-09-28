import type { CareerStats, Match, MatchStats } from '@/lib/types';
import { clubForSide } from '@/lib/club-analytics';

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

export type PlayerTag =
  | 'xG Beater'
  | 'Goal Machine'
  | 'Clean Sheet Specialist'
  | 'Elite Rated'
  | 'Possession Boss'
  | 'MOTM Magnet'
  | 'Winning Habit'
  | 'Veteran'
  | 'Entertainer'
  | 'Counter Threat';

const MIN_PERFORMANCE_SAMPLE = 10;

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

export function getAvatarColor(seed: string) {
  const colors = ['#EA6C56', '#7E8CC2', '#F59E0B', '#EF4444', '#FF8A73', '#852A3D'];
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
        team: clubForSide(match, isHome ? 'home' : 'away'),
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

  if (stats.total_matches >= MIN_PERFORMANCE_SAMPLE) {
    const cleanSheetRate = stats.clean_sheets / stats.total_matches;
    const concededPerMatch = stats.total_conceded / stats.total_matches;
    const goalsToXg = stats.avg_xg > 0 ? stats.goals_per_match / stats.avg_xg : 0;

    if (stats.goals_per_match >= 1.5 && goalsToXg >= 1.25) return 'Clinical Finisher';
    if (stats.avg_possession < 48 && stats.win_rate >= 60) return 'Counterpuncher';
    if (concededPerMatch <= 1.25 && cleanSheetRate >= 0.25) return 'Iron Curtain';
    if (stats.avg_rating >= 8.2) return 'Rating Machine';
    if (stats.goals_per_match >= 2) return 'Relentless Attacker';
  }

  if (stats.win_rate >= 70) return 'Serial Winner';
  if (stats.total_goals + stats.total_conceded >= stats.total_matches * 5) return 'Chaos Ball';
  return 'Balanced Operator';
}

export function getPlayerTags(stats: CareerStats): PlayerTag[] {
  if (stats.total_matches < MIN_PERFORMANCE_SAMPLE) return [];

  const tags: PlayerTag[] = [];
  const cleanSheetRate = stats.clean_sheets / stats.total_matches;
  const goalsToXg = stats.avg_xg > 0 ? stats.goals_per_match / stats.avg_xg : 0;
  const motmRate = stats.motm_awards / stats.total_matches;
  const totalGoalsPerMatch = (stats.total_goals + stats.total_conceded) / stats.total_matches;

  if (goalsToXg >= 1.2) tags.push('xG Beater');
  if (stats.goals_per_match >= 2) tags.push('Goal Machine');
  if (cleanSheetRate >= 0.3) tags.push('Clean Sheet Specialist');
  if (stats.avg_rating >= 8) tags.push('Elite Rated');
  if (stats.avg_possession >= 55) tags.push('Possession Boss');
  if (motmRate >= 0.25) tags.push('MOTM Magnet');
  if (stats.win_rate >= 65) tags.push('Winning Habit');
  if (stats.total_matches >= 30) tags.push('Veteran');
  if (totalGoalsPerMatch >= 5) tags.push('Entertainer');
  if (stats.avg_possession < 48 && stats.win_rate >= 55) tags.push('Counter Threat');

  return tags.slice(0, 3);
}
