import type { Match } from './types';

type ClubMatch = Pick<Match, 'is_played' | 'is_bye' | 'home_score' | 'away_score'> & {
  stats?: Match['stats'] | null;
  home_player?: { team?: string | null } | null;
  away_player?: { team?: string | null } | null;
};

// The club a side actually played as. Results record it per match
// (stats.home_team / away_team); the player's tournament team is only a
// fallback, and differs from the real club on about one side in five.
export function clubForSide(match: ClubMatch, side: 'home' | 'away', fallback?: string | null) {
  const stats = (match.stats ?? {}) as Record<string, unknown>;
  const recorded = stats[side === 'home' ? 'home_team' : 'away_team'];
  if (typeof recorded === 'string' && recorded.trim()) return recorded.trim();
  const team = side === 'home' ? match.home_player?.team : match.away_player?.team;
  return team?.trim() || fallback?.trim() || 'Unknown';
}

export interface ClubMatchup {
  club: string;
  opponent: string;
  meetings: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

// Club-vs-club records, one row per pairing from the stronger side's view.
// Mirror matches (same club on both sides) are skipped.
export function getClubMatchups(matches: ClubMatch[], minimumMeetings = 3): ClubMatchup[] {
  const pairs = new Map<string, ClubMatchup>();
  for (const match of matches) {
    if (!match.is_played || match.is_bye) continue;
    const home = clubForSide(match, 'home');
    const away = clubForSide(match, 'away');
    if (home === away || home === 'Unknown' || away === 'Unknown') continue;
    const [first, second] = [home, away].sort((a, b) => a.localeCompare(b));
    const key = `${first}\u0000${second}`;
    const row = pairs.get(key) ?? { club: first, opponent: second, meetings: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    const firstScore = first === home ? match.home_score ?? 0 : match.away_score ?? 0;
    const secondScore = first === home ? match.away_score ?? 0 : match.home_score ?? 0;
    row.meetings++;
    row.goalsFor += firstScore;
    row.goalsAgainst += secondScore;
    if (firstScore > secondScore) row.wins++;
    else if (firstScore < secondScore) row.losses++;
    else row.draws++;
    pairs.set(key, row);
  }
  return [...pairs.values()]
    .filter((row) => row.meetings >= minimumMeetings)
    .map((row) => (row.losses > row.wins
      ? { ...row, club: row.opponent, opponent: row.club, wins: row.losses, losses: row.wins, goalsFor: row.goalsAgainst, goalsAgainst: row.goalsFor }
      : row))
    .sort((a, b) => b.meetings - a.meetings || (b.wins - b.losses) - (a.wins - a.losses) || a.club.localeCompare(b.club));
}
