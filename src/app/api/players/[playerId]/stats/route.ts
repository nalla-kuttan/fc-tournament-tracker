import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { aggregateCareerStats } from '@/lib/algorithms/stats';
import { handleApiError } from '@/lib/api-guards';
import { fetchAllRows } from '@/lib/supabase/pagination';
import type { Match } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  try {
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
    const { data: playerInstances, error: instancesError } = await supabase
      .from('player')
      .select('id')
      .eq('registered_player_id', playerId);
    if (instancesError) throw instancesError;

    const playerIds = (playerInstances ?? []).map((p) => p.id);

    if (playerIds.length === 0) {
      const emptyStats = aggregateCareerStats(playerId, regPlayer.name, regPlayer.base_team, [], [], []);
      return NextResponse.json({ stats: emptyStats, matches: [], playerIds: [] });
    }

    const [matchesResult, goalsResult] = await Promise.all([
      // Get all matches involving any of this player's instances, with tournament info
      fetchAllRows<Match>((from, to) => (
        supabase
          .from('match')
          .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team), tournament:tournament_id(id, name)')
          .or(playerIds.map((id) => `home_player_id.eq.${id},away_player_id.eq.${id}`).join(','))
          .order('played_at', { ascending: true, nullsFirst: false })
          .order('id', { ascending: true })
          .range(from, to)
      )),
      // Get all goals by this player's instances
      fetchAllRows<{ player_id: string }>((from, to) => (
        supabase
          .from('goal')
          .select('player_id')
          .in('player_id', playerIds)
          .order('id', { ascending: true })
          .range(from, to)
      )),
    ]);
    if (matchesResult.error) throw matchesResult.error;
    if (goalsResult.error) throw goalsResult.error;

    const typedMatches = matchesResult.data ?? [];

    const stats = aggregateCareerStats(
      playerId,
      regPlayer.name,
      regPlayer.base_team,
      playerIds,
      typedMatches,
      goalsResult.data ?? []
    );

    return NextResponse.json({ stats, matches: typedMatches, playerIds });
  } catch (error) {
    return handleApiError(error, 'Load player stats');
  }
}
