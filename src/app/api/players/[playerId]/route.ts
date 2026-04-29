import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { readJsonBody } from '@/lib/api-guards';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
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
  const { data: participations } = await supabase
    .from('player')
    .select('*, tournament:tournament_id(id, name, format, status)')
    .eq('registered_player_id', playerId)
    .order('created_at', { ascending: false });

  return NextResponse.json({ ...player, participations: participations ?? [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  try {
    const { name, base_team } = await readJsonBody<{ name?: string; base_team?: string }>(request);
    const trimmedName = name?.trim();
    const trimmedTeam = base_team?.trim();

    if (!trimmedName || !trimmedTeam) {
      return NextResponse.json({ error: 'Name and base_team are required' }, { status: 400 });
    }

    if (trimmedName.length > 80 || trimmedTeam.length > 80) {
      return NextResponse.json({ error: 'Name and base_team must be 80 characters or fewer' }, { status: 400 });
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
