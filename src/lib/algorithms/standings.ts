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

  // Sort with H2H tiebreaker
  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return resolveH2H(a.player_id, b.player_id, playedMatches);
  });
}

/**
 * Head-to-head tiebreaker: compare direct encounters between two players.
 * Returns negative if player A is better, positive if player B is better.
 */
function resolveH2H(playerA: string, playerB: string, matches: Match[]): number {
  const h2h = matches.filter(
    (m) =>
      (m.home_player_id === playerA && m.away_player_id === playerB) ||
      (m.home_player_id === playerB && m.away_player_id === playerA)
  );

  let aPoints = 0;
  let bPoints = 0;

  for (const m of h2h) {
    const aIsHome = m.home_player_id === playerA;
    const aScore = aIsHome ? m.home_score! : m.away_score!;
    const bScore = aIsHome ? m.away_score! : m.home_score!;

    if (aScore > bScore) aPoints += 3;
    else if (aScore < bScore) bPoints += 3;
    else {
      aPoints += 1;
      bPoints += 1;
    }
  }

  return bPoints - aPoints;
}
