import { NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { createServerClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { buildTrophyRoom } from '@/lib/trophies';
import { uuidSchema } from '@/lib/validation';

export async function GET(_request: Request, { params }: { params: Promise<{ playerId: string }> }) {
  try {
    const { playerId } = await params;
    if (!uuidSchema.safeParse(playerId).success) throw new ApiError('Player not found', 404, 'NOT_FOUND');
    const supabase = createServerClient();
    const data = await getCompetitiveData(supabase);
    if (!data.registeredPlayers.some((player) => player.id === playerId)) throw new ApiError('Player not found', 404, 'NOT_FOUND');
    const goals = await fetchAllRows<{ player_id: string; match_id: string }>((from, to) => supabase
      .from('goal')
      .select('player_id, match_id')
      .order('id', { ascending: true })
      .range(from, to));
    if (goals.error) throw goals.error;
    return NextResponse.json({ items: buildTrophyRoom(playerId, data.registeredPlayers, data.tournaments, data.playerInstances, data.matches, goals.data ?? []) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load trophy room');
  }
}
