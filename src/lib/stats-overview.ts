import type { Match } from './types';

export type StatsPeriod = 'all' | '30' | '90';
export interface OverviewPlayer { id: string; name: string }
export interface OverviewInstance { id: string; registered_player_id: string }

// Only completed, scored games count. Undated games belong to all-time totals,
// but cannot establish a recent period or an ordered form comparison.
export function getStatsOverview(matches: Match[], players: OverviewPlayer[], instances: OverviewInstance[], period: StatsPeriod, now = Date.now()) {
  const cutoff = period === 'all' ? -Infinity : now - Number(period) * 86400000;
  const valid = matches.filter((m) => m.is_played && !m.is_bye && m.home_score !== null && m.away_score !== null);
  const games = valid.filter((m) => period === 'all' || (m.played_at && Date.parse(m.played_at) >= cutoff && Date.parse(m.played_at) <= now));
  const identity = new Map(instances.map((p) => [p.id, p.registered_player_id]));
  const rows = players.map((player) => {
    const appearances = games.filter((m) => identity.get(m.home_player_id ?? '') === player.id || identity.get(m.away_player_id ?? '') === player.id);
    const score = (m: Match) => {
      const home = identity.get(m.home_player_id ?? '') === player.id;
      return { goals: (home ? m.home_score : m.away_score)!, conceded: (home ? m.away_score : m.home_score)! };
    };
    const dated = appearances.filter((m) => m.played_at && Number.isFinite(Date.parse(m.played_at)) && Date.parse(m.played_at) <= now)
      .sort((a, b) => Date.parse(b.played_at!) - Date.parse(a.played_at!) || a.id.localeCompare(b.id));
    const points = (list: Match[]) => list.reduce((sum, m) => { const s = score(m); return sum + (s.goals > s.conceded ? 3 : s.goals === s.conceded ? 1 : 0); }, 0);
    const latestPoints = points(dated.slice(0, 5));
    const previousPoints = points(dated.slice(5, 10));
    return { ...player, played: appearances.length, goals: appearances.reduce((sum, m) => sum + score(m).goals, 0), latestPoints, previousPoints,
      improvement: dated.length >= 10 ? latestPoints - previousPoints : null };
  });
  const scorers = rows.filter((p) => p.played > 0).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
  const improving = rows.filter((p) => p.improvement !== null && p.improvement > 0).sort((a, b) => b.improvement! - a.improvement! || a.name.localeCompare(b.name));
  return { games, rows, scorers: scorers.filter((p) => p.goals === scorers[0]?.goals),
    improving: improving.filter((p) => p.improvement === improving[0]?.improvement),
    goals: games.reduce((sum, m) => sum + m.home_score! + m.away_score!, 0),
    undated: valid.filter((m) => !m.played_at || !Number.isFinite(Date.parse(m.played_at))).length };
}
