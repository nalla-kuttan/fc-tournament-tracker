import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

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
