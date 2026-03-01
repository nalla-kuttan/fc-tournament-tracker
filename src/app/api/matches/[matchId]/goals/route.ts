import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { verifyPin } from '@/lib/auth';

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
    const { goals, pin, tournamentId } = await request.json();
    // goals: [{player_id, minute}]

    if (!pin || !tournamentId) {
      return NextResponse.json({ error: 'PIN and tournamentId required' }, { status: 400 });
    }

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

    const adminClient = createAdminClient();

    // Delete existing goals for this match (replace all)
    await adminClient.from('goal').delete().eq('match_id', matchId);

    if (goals && goals.length > 0) {
      const goalRows = goals.map((g: { player_id: string; minute?: number }) => ({
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
