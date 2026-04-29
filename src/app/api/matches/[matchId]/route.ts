import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { readJsonBody, verifyTournamentPin } from '@/lib/api-guards';
import type { MatchStats } from '@/lib/types';

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
    const { home_score, away_score, stats, pin } = await readJsonBody<{
      home_score: number;
      away_score: number;
      stats?: MatchStats;
      pin?: string;
    }>(request);

    const supabase = createServerClient();
    const { data: existingMatch, error: matchError } = await supabase
      .from('match')
      .select('id, tournament_id, is_bye')
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
      .eq('tournament_id', existingMatch.tournament_id)
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
