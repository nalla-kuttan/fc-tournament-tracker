import { NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { backtestOdds, oddsForFixture } from '@/lib/match-odds';
import { createServerClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/validation';

// Win / draw / loss odds for one fixture, plus the model's track record on
// every past result (each predicted only from the matches before it).
export async function GET(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params;
    if (!uuidSchema.safeParse(matchId).success) throw new ApiError('Match not found', 404, 'NOT_FOUND');

    const supabase = createServerClient();
    const { data: fixture, error } = await supabase
      .from('match')
      .select('id, is_played, is_bye, home_player_id, away_player_id')
      .eq('id', matchId)
      .maybeSingle();
    if (error) throw error;
    if (!fixture || fixture.is_bye) throw new ApiError('Match not found', 404, 'NOT_FOUND');

    const data = await getCompetitiveData(supabase);
    const result = oddsForFixture(data.registeredPlayers, data.playerInstances, data.matches, fixture);
    if (!result) throw new ApiError('Both players are needed for odds', 404, 'NOT_READY');

    return NextResponse.json(
      { ...result, trackRecord: backtestOdds(data.registeredPlayers, data.playerInstances, data.matches) },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'Load match odds');
  }
}
