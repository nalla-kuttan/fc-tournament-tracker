import type { Match, StandingRow } from '@/lib/types';

/**
 * Calculate league standings from match results.
 * Sort order: Points > Goal Difference > Goals For > Head-to-Head
 */
export function calculateStandings(
  matches: Match[],
  players: { id: string; name: string; team: string }[]
): StandingRow[] {
  const map = new Map<string, StandingRow>();

  // Initialize all players
  for (const p of players) {
    map.set(p.id, {
      player_id: p.id,
      player_name: p.name,
      team: p.team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
      form: [],
    });
  }

  // Sort matches by played_at for correct form order
  const playedMatches = matches
    .filter((m) => m.is_played && !m.is_bye)
    .sort((a, b) => (a.played_at ?? '').localeCompare(b.played_at ?? ''));

  for (const match of playedMatches) {
    const home = map.get(match.home_player_id!);
    const away = map.get(match.away_player_id!);
    if (!home || !away) continue;

    const hs = match.home_score!;
    const as_ = match.away_score!;

    home.played++;
    away.played++;
    home.goals_for += hs;
    home.goals_against += as_;
    away.goals_for += as_;
    away.goals_against += hs;

    if (hs > as_) {
      home.wins++;
      home.points += 3;
      away.losses++;
      home.form.push('W');
      away.form.push('L');
    } else if (hs < as_) {
      away.wins++;
      away.points += 3;
      home.losses++;
      home.form.push('L');
      away.form.push('W');
    } else {
      home.draws++;
      away.draws++;
      home.points += 1;
      away.points += 1;
      home.form.push('D');
      away.form.push('D');
    }
  }

  // Finalize
  const standings = Array.from(map.values());
  for (const s of standings) {
    s.goal_difference = s.goals_for - s.goals_against;
    s.form = s.form.slice(-5);
  }

  const baseSorted = standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return a.player_name.localeCompare(b.player_name) || a.player_id.localeCompare(b.player_id);
  });

  // Resolve each complete tie group as a mini-table. Pairwise comparison is not
  // transitive for three-way ties and can produce engine-dependent ordering.
  const resolved: StandingRow[] = [];
  for (let start = 0; start < baseSorted.length;) {
    let end = start + 1;
    while (end < baseSorted.length && hasSamePrimaryRecord(baseSorted[start], baseSorted[end])) end++;
    const group = baseSorted.slice(start, end);
    resolved.push(...resolveTieGroup(group, playedMatches));
    start = end;
  }
  return resolved;
}

function hasSamePrimaryRecord(a: StandingRow, b: StandingRow) {
  return a.points === b.points && a.goal_difference === b.goal_difference && a.goals_for === b.goals_for;
}

function resolveTieGroup(group: StandingRow[], matches: Match[]) {
  if (group.length < 2) return group;
  const ids = new Set(group.map((row) => row.player_id));
  const mini = new Map(group.map((row) => [row.player_id, { points: 0, goalDifference: 0, goalsFor: 0 }]));

  for (const match of matches) {
    if (!match.home_player_id || !match.away_player_id || !ids.has(match.home_player_id) || !ids.has(match.away_player_id)) continue;
    const home = mini.get(match.home_player_id)!;
    const away = mini.get(match.away_player_id)!;
    const homeScore = match.home_score ?? 0;
    const awayScore = match.away_score ?? 0;
    home.goalsFor += homeScore;
    away.goalsFor += awayScore;
    home.goalDifference += homeScore - awayScore;
    away.goalDifference += awayScore - homeScore;
    if (homeScore > awayScore) home.points += 3;
    else if (awayScore > homeScore) away.points += 3;
    else { home.points += 1; away.points += 1; }
  }

  return group.sort((a, b) => {
    const aMini = mini.get(a.player_id)!;
    const bMini = mini.get(b.player_id)!;
    return bMini.points - aMini.points
      || bMini.goalDifference - aMini.goalDifference
      || bMini.goalsFor - aMini.goalsFor
      || a.player_name.localeCompare(b.player_name)
      || a.player_id.localeCompare(b.player_id);
  });
}
