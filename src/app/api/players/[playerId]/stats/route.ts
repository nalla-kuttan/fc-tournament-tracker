import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { aggregateCareerStats } from '@/lib/algorithms/stats';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  const supabase = createServerClient();

  // Get registered player info
  const { data: regPlayer, error: rpError } = await supabase
    .from('registered_player')
    .select('*')
    .eq('id', playerId)
    .single();

  if (rpError || !regPlayer) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  // Get all tournament player instances
  const { data: playerInstances } = await supabase
    .from('player')
    .select('id')
    .eq('registered_player_id', playerId);

  const playerIds = (playerInstances ?? []).map((p) => p.id);

  if (playerIds.length === 0) {
    const emptyStats = aggregateCareerStats(playerId, regPlayer.name, regPlayer.base_team, [], [], []);
    return NextResponse.json({ stats: emptyStats, matches: [], playerIds: [] });
  }

  // Get all matches involving any of this player's instances, with tournament info
  const { data: matches } = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team), tournament:tournament_id(id, name)')
    .or(playerIds.map((id) => `home_player_id.eq.${id},away_player_id.eq.${id}`).join(','))
    .order('played_at', { ascending: true, nullsFirst: false });

  // Get all goals by this player's instances
  const { data: goals } = await supabase
    .from('goal')
    .select('player_id')
    .in('player_id', playerIds);

  const typedMatches = (matches ?? []) as import('@/lib/types').Match[];

  const stats = aggregateCareerStats(
    playerId,
    regPlayer.name,
    regPlayer.base_team,
    playerIds,
    typedMatches,
    goals ?? []
  );

  return NextResponse.json({ stats, matches: typedMatches, playerIds });
}
