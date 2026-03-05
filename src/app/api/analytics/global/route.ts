import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { aggregateCareerStats } from '@/lib/algorithms/stats';
import type { Match, MatchStats } from '@/lib/types';

export async function GET() {
  const supabase = createServerClient();

  // Get all registered players
  const { data: registeredPlayers } = await supabase
    .from('registered_player')
    .select('id, name, base_team');

  if (!registeredPlayers || registeredPlayers.length === 0) {
    return NextResponse.json({
      career_stats: [],
      top_scorers: [],
      biggest_wins: [],
    });
  }

  // Get all player instances
  const { data: allPlayers } = await supabase
    .from('player')
    .select('id, registered_player_id, name, team');

  // Get all played matches with stats
  const { data: allMatches } = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team), tournament:tournament_id(id, name)')
    .eq('is_played', true)
    .eq('is_bye', false)
    .order('played_at', { ascending: false });

  // Get all goals (include minute and match_id for analytics)
  const { data: allGoals } = await supabase
    .from('goal')
    .select('player_id, minute, match_id');

  const matches = (allMatches ?? []) as Match[];
  const players = allPlayers ?? [];
  const goals = allGoals ?? [];

  // Build career stats for every registered player
  const careerStats = registeredPlayers.map((rp) => {
    const playerIds = players
      .filter((p) => p.registered_player_id === rp.id)
      .map((p) => p.id);
    return aggregateCareerStats(rp.id, rp.name, rp.base_team, playerIds, matches, goals);
  }).filter((s) => s.total_matches > 0);

  // Top scorers: sorted by total_goals desc
  const topScorers = [...careerStats]
    .sort((a, b) => b.total_goals - a.total_goals || a.total_matches - b.total_matches)
    .slice(0, 20);

  // Biggest wins: matches with largest goal difference
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
        tournament_name: m.tournament?.name ?? 'Unknown',
        played_at: m.played_at,
      };
    })
    .filter((m) => m.goal_difference > 0)
    .sort((a, b) => b.goal_difference - a.goal_difference)
    .slice(0, 10);

  // xG rankings (avg_xg desc)
  const xgRankings = [...careerStats]
    .filter((s) => s.avg_xg > 0)
    .sort((a, b) => b.avg_xg - a.avg_xg);

  // xA rankings — we approximate "expected assists" from match stats
  // Since we don't track xA separately, we use total goals minus own xG as a proxy
  // For now, skip xA since the data model doesn't support it

  // Win rate rankings
  const winRateRankings = [...careerStats]
    .filter((s) => s.total_matches >= 3)
    .sort((a, b) => b.win_rate - a.win_rate);

  // Goals per match rankings
  const goalsPerMatchRankings = [...careerStats]
    .sort((a, b) => b.goals_per_match - a.goals_per_match);

  // Possession rankings
  const possessionRankings = [...careerStats]
    .filter((s) => s.avg_possession > 0)
    .sort((a, b) => b.avg_possession - a.avg_possession);

  // Avg rating rankings
  const ratingRankings = [...careerStats]
    .filter((s) => s.avg_rating > 0)
    .sort((a, b) => b.avg_rating - a.avg_rating);

  // MOTM rankings
  const motmRankings = [...careerStats]
    .filter((s) => s.motm_awards > 0)
    .sort((a, b) => b.motm_awards - a.motm_awards);

  // Clean sheet rankings
  const cleanSheetRankings = [...careerStats]
    .sort((a, b) => b.clean_sheets - a.clean_sheets);

  return NextResponse.json({
    career_stats: careerStats.sort((a, b) => b.win_rate - a.win_rate),
    top_scorers: topScorers,
    biggest_wins: biggestWins,
    xg_rankings: xgRankings,
    win_rate_rankings: winRateRankings,
    goals_per_match_rankings: goalsPerMatchRankings,
    possession_rankings: possessionRankings,
    rating_rankings: ratingRankings,
    motm_rankings: motmRankings,
    clean_sheet_rankings: cleanSheetRankings,
    // Raw data for visual analytics
    all_matches: matches,
    all_goals: goals,
    registered_players: registeredPlayers,
    player_instances: players,
  });
}
