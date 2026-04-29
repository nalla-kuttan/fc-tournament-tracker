import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { readJsonBody, verifyTournamentPin } from '@/lib/api-guards';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('goal')
    .select('*, player:player_id(id, name)')
    .eq('match_id', matchId)
    .order('minute');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  try {
    const { goals, pin } = await readJsonBody<{
      goals?: { player_id: string; minute?: number | null }[];
      pin?: string;
    }>(request);

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

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

    const submittedGoals = goals ?? [];
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

    // Delete existing goals for this match (replace all)
    await adminClient.from('goal').delete().eq('match_id', matchId);

    if (submittedGoals.length > 0) {
      const goalRows = submittedGoals.map((g) => ({
        match_id: matchId,
        player_id: g.player_id,
        minute: g.minute ?? null,
      }));

      const { data, error } = await adminClient.from('goal').insert(goalRows).select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json([], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
