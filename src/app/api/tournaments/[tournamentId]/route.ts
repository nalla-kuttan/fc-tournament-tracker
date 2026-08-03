import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { handleApiError, rateLimit, readJsonBody, verifyTournamentPin } from '@/lib/api-guards';
import { pinRequestSchema, tournamentUpdateSchema } from '@/lib/validation';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = createServerClient();

  let tournamentResult = await supabase
    .from('tournament')
    .select('id, name, format, status, season_id, created_at')
    .eq('id', tournamentId)
    .single();

  if (tournamentResult.error && String(tournamentResult.error.message).includes('season_id')) {
    tournamentResult = await supabase
      .from('tournament')
      .select('id, name, format, status, created_at')
      .eq('id', tournamentId)
      .single();
  }

  const { data: tournament, error } = tournamentResult;

  if (error || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // Get players
    const { data: players, error: playersError } = await supabase
    .from('player')
    .select('*, registered_player:registered_player_id(id, name, base_team)')
    .eq('tournament_id', tournamentId)
    .order('seed');

  // Get matches with player info
    const { data: matches, error: matchesError } = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team)')
    .eq('tournament_id', tournamentId)
    .order('round_number')
    .order('match_number');

  // Get goals
  const matchIds = (matches ?? []).map((match) => match.id);
  const goalsResult = matchIds.length > 0
    ? await supabase.from('goal').select('*, player:player_id(id, name)').in('match_id', matchIds)
    : { data: [], error: null };

    if (playersError) throw playersError;
    if (matchesError) throw matchesError;
    if (goalsResult.error) throw goalsResult.error;

    return NextResponse.json({
      ...tournament,
      players,
      matches,
      goals: goalsResult.data ?? [],
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load tournament');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;

  try {
    const limited = await rateLimit(request, 'tournaments:update', 20);
    if (limited) return limited;
    const { pin, status, name, format } = await readJsonBody(request, tournamentUpdateSchema);

    // Verify admin PIN
    const supabase = createServerClient();
    const pinCheck = await verifyTournamentPin(supabase, tournamentId, pin);
    if (!pinCheck.ok) return pinCheck.response;

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

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'Update tournament');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;

  try {
    const limited = await rateLimit(request, 'tournaments:delete', 5, 5 * 60);
    if (limited) return limited;
    const { pin } = await readJsonBody(request, pinRequestSchema);

    // Verify admin PIN
    const supabase = createServerClient();
    const pinCheck = await verifyTournamentPin(supabase, tournamentId, pin);
    if (!pinCheck.ok) return pinCheck.response;

    const adminClient = createAdminClient();

    const { error } = await adminClient.from('tournament').delete().eq('id', tournamentId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Delete tournament');
  }
}
