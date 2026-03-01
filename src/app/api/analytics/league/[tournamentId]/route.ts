import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { Match, MatchStats } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  const supabase = createServerClient();

  // Get tournament
  const { data: tournament } = await supabase
    .from('tournament')
    .select('id, name, format, status')
    .eq('id', tournamentId)
    .single();

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // Get players
  const { data: players } = await supabase
    .from('player')
    .select('id, name, team, registered_player_id')
    .eq('tournament_id', tournamentId);

  // Get matches
  const { data: allMatches } = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team)')
    .eq('tournament_id', tournamentId)
    .eq('is_played', true)
    .eq('is_bye', false)
    .order('played_at', { ascending: false });

  // Get goals
  const { data: allGoals } = await supabase
    .from('goal')
    .select('player_id, match_id, minute')
    .in('match_id', (allMatches ?? []).map((m) => m.id));

  const matches = (allMatches ?? []) as Match[];
  const goalList = allGoals ?? [];
  const playerList = players ?? [];

  // Per-player stats within this tournament
  const playerStats = playerList.map((p) => {
    const pMatches = matches.filter(
      (m) => m.home_player_id === p.id || m.away_player_id === p.id
    );

    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsConceded = 0, cleanSheets = 0;
    let xgSum = 0, xgCount = 0, ratingSum = 0, ratingCount = 0, possSum = 0, possCount = 0;
    let motmAwards = 0;

    for (const m of pMatches) {
      const isHome = m.home_player_id === p.id;
      const myScore = isHome ? m.home_score! : m.away_score!;
      const oppScore = isHome ? m.away_score! : m.home_score!;

      goalsFor += myScore;
      goalsConceded += oppScore;
      if (oppScore === 0) cleanSheets++;

      if (myScore > oppScore) wins++;
      else if (myScore < oppScore) losses++;
      else draws++;

      const stats = m.stats as MatchStats;
      if (stats) {
        const xg = isHome ? stats.home_xg : stats.away_xg;
        if (xg != null) { xgSum += xg; xgCount++; }
        const rating = isHome ? stats.home_rating : stats.away_rating;
        if (rating != null) { ratingSum += rating; ratingCount++; }
        const poss = isHome ? stats.home_possession : stats.away_possession;
        if (poss != null) { possSum += poss; possCount++; }
        if (stats.motm_player_id === p.id) motmAwards++;
      }
    }

    const totalGoals = goalList.filter((g) => g.player_id === p.id).length;
    const played = pMatches.length;

    return {
      player_id: p.id,
      player_name: p.name,
      team: p.team,
      registered_player_id: p.registered_player_id,
      played,
      wins,
      draws,
      losses,
      goals: totalGoals,
      goals_from_score: goalsFor,
      conceded: goalsConceded,
      clean_sheets: cleanSheets,
      points: wins * 3 + draws,
      win_rate: played > 0 ? (wins / played) * 100 : 0,
      goals_per_match: played > 0 ? totalGoals / played : 0,
      avg_xg: xgCount > 0 ? xgSum / xgCount : 0,
      avg_rating: ratingCount > 0 ? ratingSum / ratingCount : 0,
      avg_possession: possCount > 0 ? possSum / possCount : 0,
      motm_awards: motmAwards,
    };
  });

  // Top scorers in this tournament
  const topScorers = [...playerStats]
    .sort((a, b) => b.goals - a.goals || a.played - b.played)
    .slice(0, 20);

  // Biggest wins
  const biggestWins = [...matches]
    .map((m) => {
      const diff = Math.abs((m.home_score ?? 0) - (m.away_score ?? 0));
      const winnerIsHome = (m.home_score ?? 0) > (m.away_score ?? 0);
      return {
        match_id: m.id,
        home_player: m.home_player?.name ?? 'Unknown',
        away_player: m.away_player?.name ?? 'Unknown',
        home_score: m.home_score,
        away_score: m.away_score,
        goal_difference: diff,
        winner: winnerIsHome ? m.home_player?.name : m.away_player?.name,
        played_at: m.played_at,
      };
    })
    .filter((m) => m.goal_difference > 0)
    .sort((a, b) => b.goal_difference - a.goal_difference)
    .slice(0, 10);

  return NextResponse.json({
    tournament,
    player_stats: playerStats.sort((a, b) => b.points - a.points),
    top_scorers: topScorers,
    biggest_wins: biggestWins,
    xg_rankings: [...playerStats].filter((s) => s.avg_xg > 0).sort((a, b) => b.avg_xg - a.avg_xg),
    win_rate_rankings: [...playerStats].sort((a, b) => b.win_rate - a.win_rate),
    goals_per_match_rankings: [...playerStats].sort((a, b) => b.goals_per_match - a.goals_per_match),
    possession_rankings: [...playerStats].filter((s) => s.avg_possession > 0).sort((a, b) => b.avg_possession - a.avg_possession),
    rating_rankings: [...playerStats].filter((s) => s.avg_rating > 0).sort((a, b) => b.avg_rating - a.avg_rating),
    motm_rankings: [...playerStats].filter((s) => s.motm_awards > 0).sort((a, b) => b.motm_awards - a.motm_awards),
  });
}
