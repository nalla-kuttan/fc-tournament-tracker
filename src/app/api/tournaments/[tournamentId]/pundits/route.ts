import { NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { buildPunditTable, modelPicks } from '@/lib/predictions';
import { loadPredictions } from '@/lib/predictions-data';
import { createServerClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/validation';

// The tournament's prediction league, with the ratings model as a rival.
export async function GET(_request: Request, { params }: { params: Promise<{ tournamentId: string }> }) {
  try {
    const { tournamentId } = await params;
    if (!uuidSchema.safeParse(tournamentId).success) throw new ApiError('Tournament not found', 404, 'NOT_FOUND');
    const supabase = createServerClient();
    const { data: fixtures, error } = await supabase.from('match').select('id').eq('tournament_id', tournamentId);
    if (error) throw error;
    const ids = (fixtures ?? []).map((row) => row.id);
    const [data, { available, predictions }] = await Promise.all([getCompetitiveData(supabase), loadPredictions(supabase, ids)]);
    const names = new Map(data.registeredPlayers.map((player) => [player.id, player.name]));
    const played = data.matches.filter((match) => match.tournament_id === tournamentId);
    const model = modelPicks(data.registeredPlayers, data.playerInstances, data.matches, new Set(played.map((match) => match.id)));
    return NextResponse.json({
      available,
      open: predictions.filter((prediction) => !played.some((match) => match.id === prediction.match_id)).length,
      table: buildPunditTable(predictions, played, names, model),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load pundit table');
  }
}
