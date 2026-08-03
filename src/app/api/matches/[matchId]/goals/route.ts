import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { handleApiError, rateLimit, readJsonBody, verifyTournamentPin } from '@/lib/api-guards';
import { goalsMutationSchema } from '@/lib/validation';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const supabase = createServerClient();

  const { data, error } = await supabase
    .from('goal')
    .select('*, player:player_id(id, name)')
    .eq('match_id', matchId)
    .order('minute');

    if (error) throw error;

    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load match goals');
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  try {
    const limited = await rateLimit(request, 'goals:replace', 30);
    if (limited) return limited;
    const { goals, pin } = await readJsonBody(request, goalsMutationSchema);

    const supabase = createServerClient();
    const { data: match, error: matchError } = await supabase
      .from('match')
      .select('id, tournament_id, home_player_id, away_player_id, is_bye')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.is_bye) {
      return NextResponse.json({ error: 'BYE matches cannot have goals' }, { status: 400 });
    }

    const pinCheck = await verifyTournamentPin(supabase, match.tournament_id, pin);
    if (!pinCheck.ok) {
      return pinCheck.response;
    }

    const submittedGoals = goals;
    const validScorers = new Set([match.home_player_id, match.away_player_id].filter(Boolean));
    const hasInvalidGoal = submittedGoals.some(
      (goal) =>
        !validScorers.has(goal.player_id) ||
        (goal.minute != null && (!Number.isInteger(goal.minute) || goal.minute < 1 || goal.minute > 130))
    );

    if (hasInvalidGoal) {
      return NextResponse.json({ error: 'Goals must use match players and valid minutes' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient.rpc('replace_match_goals_atomic', {
      p_match_id: matchId,
      p_goals: submittedGoals,
    });
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Replace match goals');
  }
}
