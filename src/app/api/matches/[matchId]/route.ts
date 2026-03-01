import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { verifyPin } from '@/lib/auth';

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
    const { home_score, away_score, stats, pin, tournamentId } = await request.json();

    // Verify admin
    const supabase = createServerClient();
    const { data: tournament } = await supabase
      .from('tournament')
      .select('pin')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const isValid = await verifyPin(pin, tournament.pin);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
    }

    if (home_score == null || away_score == null) {
      return NextResponse.json({ error: 'Scores are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('match')
      .update({
        home_score,
        away_score,
        stats: stats ?? {},
        is_played: true,
        played_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
