import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { playerMutationSchema } from '@/lib/validation';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const supabase = createServerClient();

  const { data: player, error } = await supabase
    .from('registered_player')
    .select('*')
    .eq('id', playerId)
    .single();

  if (error || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  // Get all tournament participations
    const { data: participations, error: participationError } = await supabase
    .from('player')
    .select('*, tournament:tournament_id(id, name, format, status)')
    .eq('registered_player_id', playerId)
    .order('created_at', { ascending: false });

    if (participationError) throw participationError;
    return NextResponse.json(
      { ...player, participations: participations ?? [] },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'Load player');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  try {
    const limited = await rateLimit(request, 'players:update', 20);
    if (limited) return limited;
    const { name: trimmedName, base_team: trimmedTeam } = await readJsonBody(request, playerMutationSchema);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('registered_player')
      .update({ name: trimmedName, base_team: trimmedTeam })
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Player name already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'Update player');
  }
}
