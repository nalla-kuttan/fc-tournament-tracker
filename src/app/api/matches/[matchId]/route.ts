import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { readJsonBody, verifyTournamentPin } from '@/lib/api-guards';
import type { MatchStats } from '@/lib/types';

interface GoalInput {
  player_id: string;
  minute?: number | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = createServerClient();

  const { data: match, error } = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team)')
    .eq('id', matchId)
    .single();

  if (error || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  // Get goals for this match
  const { data: goals } = await supabase
    .from('goal')
    .select('*, player:player_id(id, name)')
    .eq('match_id', matchId)
    .order('minute');

  return NextResponse.json({ ...match, goals: goals ?? [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  try {
    const { home_score, away_score, stats, goals, advance_bracket, pin } = await readJsonBody<{
      home_score: number;
      away_score: number;
      stats?: MatchStats;
      goals?: GoalInput[];
      advance_bracket?: boolean;
      pin?: string;
    }>(request);

    const supabase = createServerClient();
    const { data: existingMatch, error: matchError } = await supabase
      .from('match')
      .select('id, tournament_id, home_player_id, away_player_id, is_bye')
      .eq('id', matchId)
      .single();

    if (matchError || !existingMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const pinCheck = await verifyTournamentPin(supabase, existingMatch.tournament_id, pin);
    if (!pinCheck.ok) {
      return pinCheck.response;
    }

    if (!Number.isInteger(home_score) || !Number.isInteger(away_score) || home_score < 0 || away_score < 0) {
      return NextResponse.json({ error: 'Scores must be non-negative whole numbers' }, { status: 400 });
    }

    if (existingMatch.is_bye) {
      return NextResponse.json({ error: 'BYE matches cannot be edited' }, { status: 400 });
    }

    const submittedGoals = goals ?? [];
    if (!Array.isArray(submittedGoals)) {
      return NextResponse.json({ error: 'Goals must be an array' }, { status: 400 });
    }

    if (submittedGoals.length !== home_score + away_score) {
      return NextResponse.json({ error: 'Goal scorers must match the final score total' }, { status: 400 });
    }

    const homeGoalCount = submittedGoals.filter((goal) => goal.player_id === existingMatch.home_player_id).length;
    const awayGoalCount = submittedGoals.filter((goal) => goal.player_id === existingMatch.away_player_id).length;
    if (homeGoalCount !== home_score || awayGoalCount !== away_score) {
      return NextResponse.json({ error: 'Goal scorers must match each player score' }, { status: 400 });
    }

    const validScorers = new Set([existingMatch.home_player_id, existingMatch.away_player_id].filter(Boolean));
    const hasInvalidGoal = submittedGoals.some(
      (goal) =>
        !validScorers.has(goal.player_id) ||
        (goal.minute != null && (!Number.isInteger(goal.minute) || goal.minute < 1 || goal.minute > 130))
    );

    if (hasInvalidGoal) {
      return NextResponse.json({ error: 'Goals must use match players and valid minutes' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc('save_match_result_atomic', {
      p_match_id: matchId,
      p_home_score: home_score,
      p_away_score: away_score,
      p_stats: stats ?? {},
      p_goals: submittedGoals,
      p_advance_bracket: advance_bracket ?? false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
