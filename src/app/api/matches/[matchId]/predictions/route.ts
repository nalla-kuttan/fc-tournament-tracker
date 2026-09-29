import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError, handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { isMissingSchemaError } from '@/lib/competitive-data';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/validation';

const predictionSchema = z.object({
  predictor_id: uuidSchema,
  pick: z.enum(['home', 'draw', 'away']),
});

// Save (or change) one player's pick for a fixture. Open to everyone in the
// group, no PIN, but only until the match is played.
export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const limited = await rateLimit(request, 'predictions:write', 30);
    if (limited) return limited;
    const { matchId } = await params;
    if (!uuidSchema.safeParse(matchId).success) throw new ApiError('Match not found', 404, 'NOT_FOUND');
    const { predictor_id, pick } = await readJsonBody(request, predictionSchema);

    const supabase = createServerClient();
    const [{ data: match, error: matchError }, { data: predictor, error: predictorError }] = await Promise.all([
      supabase.from('match').select('id, is_played, is_bye').eq('id', matchId).maybeSingle(),
      supabase.from('registered_player').select('id').eq('id', predictor_id).maybeSingle(),
    ]);
    if (matchError) throw matchError;
    if (predictorError) throw predictorError;
    if (!match || match.is_bye) throw new ApiError('Match not found', 404, 'NOT_FOUND');
    if (!predictor) throw new ApiError('Pick who you are first', 400, 'UNKNOWN_PREDICTOR');
    if (match.is_played) throw new ApiError('Predictions close at kick-off', 409, 'MATCH_PLAYED');

    const { error } = await createAdminClient()
      .from('prediction')
      .upsert({ match_id: matchId, predictor_id, pick, updated_at: new Date().toISOString() }, { onConflict: 'match_id,predictor_id' });
    if (error) {
      if (isMissingSchemaError(error)) throw new ApiError('Predictions are not set up yet', 503, 'NOT_SET_UP');
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, 'Save prediction');
  }
}
