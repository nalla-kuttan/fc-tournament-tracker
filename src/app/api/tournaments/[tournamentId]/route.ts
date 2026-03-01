import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { verifyPin } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  const supabase = createServerClient();

  const { data: tournament, error } = await supabase
    .from('tournament')
    .select('id, name, format, status, created_at')
    .eq('id', tournamentId)
    .single();

  if (error || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // Get players
  const { data: players } = await supabase
    .from('player')
    .select('*, registered_player:registered_player_id(id, name, base_team)')
    .eq('tournament_id', tournamentId)
    .order('seed');

  // Get matches with player info
  const { data: matches } = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team)')
    .eq('tournament_id', tournamentId)
    .order('round_number')
    .order('match_number');

  // Get goals
  const { data: goals } = await supabase
    .from('goal')
    .select('*, player:player_id(id, name)')
    .in(
      'match_id',
      (matches ?? []).map((m) => m.id)
    );

  return NextResponse.json({
    ...tournament,
    players: players ?? [],
    matches: matches ?? [],
    goals: goals ?? [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;

  try {
    const body = await request.json();
    const { pin, status, name, format } = body;

    // Verify admin PIN
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

    // Build update object with only provided fields
    const updates: Record<string, string> = {};

    if (status !== undefined) {
      if (!['draft', 'active', 'completed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = status;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (format !== undefined) {
      if (!['league', 'knockout', 'cup'].includes(format)) {
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
      }
      updates.format = format;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament')
      .update(updates)
      .eq('id', tournamentId)
      .select('id, name, format, status, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;

  try {
    const { pin } = await request.json();

    // Verify admin PIN
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

    // Get match IDs for cascading goal deletes
    const { data: matches } = await adminClient
      .from('match')
      .select('id')
      .eq('tournament_id', tournamentId);

    const matchIds = (matches ?? []).map((m) => m.id);

    // Cascade delete: goals → matches → players → tournament
    if (matchIds.length > 0) {
      await adminClient.from('goal').delete().in('match_id', matchIds);
      await adminClient.from('match').delete().eq('tournament_id', tournamentId);
    }

    await adminClient.from('player').delete().eq('tournament_id', tournamentId);
    await adminClient.from('tournament').delete().eq('id', tournamentId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
