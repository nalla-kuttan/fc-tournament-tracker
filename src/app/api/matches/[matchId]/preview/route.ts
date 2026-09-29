import { NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { buildHypeLines } from '@/lib/hype';
import { oddsForFixture } from '@/lib/match-odds';
import { buildPlayerResults, chronological } from '@/lib/player-results';
import { modelPicks } from '@/lib/predictions';
import { loadPredictions } from '@/lib/predictions-data';
import { createServerClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/validation';

// Everything the walkout, match page and TV need before kick-off: talking
// points, odds, the head-to-head and everyone's predictions.
export async function GET(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params;
    if (!uuidSchema.safeParse(matchId).success) throw new ApiError('Match not found', 404, 'NOT_FOUND');
    const supabase = createServerClient();
    const { data: fixture, error } = await supabase
      .from('match')
      .select('id, tournament_id, is_played, is_bye, home_player_id, away_player_id')
      .eq('id', matchId)
      .maybeSingle();
    if (error) throw error;
    if (!fixture || fixture.is_bye) throw new ApiError('Match not found', 404, 'NOT_FOUND');

    const [data, predictionData] = await Promise.all([getCompetitiveData(supabase), loadPredictions(supabase, [matchId])]);
    const ownerOf = new Map(data.playerInstances.map((instance) => [instance.id, instance.registered_player_id]));
    const homeId = ownerOf.get(fixture.home_player_id ?? '');
    const awayId = ownerOf.get(fixture.away_player_id ?? '');
    if (!homeId || !awayId) throw new ApiError('Both players are needed', 404, 'NOT_READY');

    // Before kick-off, only what came earlier counts.
    const target = data.matches.find((match) => match.id === matchId);
    const history = fixture.is_played && target ? data.matches.filter((match) => chronological(match, target) < 0) : data.matches;
    const odds = oddsForFixture(data.registeredPlayers, data.playerInstances, data.matches, fixture);
    const meetings = (buildPlayerResults(data.playerInstances, history).get(homeId) ?? []).filter((result) => result.opponentId === awayId);
    const nameOf = new Map(data.registeredPlayers.map((player) => [player.id, player.name]));
    const modelPick = fixture.is_played
      ? modelPicks(data.registeredPlayers, data.playerInstances, data.matches, new Set([matchId])).get(matchId) ?? null
      : odds ? (['home', 'draw', 'away'] as const).reduce((best, key) => (odds.odds[key] > odds.odds[best] ? key : best), 'home' as 'home' | 'draw' | 'away') : null;

    return NextResponse.json({
      homePlayerId: homeId,
      awayPlayerId: awayId,
      hype: buildHypeLines(data.registeredPlayers, data.playerInstances, history, homeId, awayId, odds?.odds ?? null),
      odds: odds?.odds ?? null,
      h2h: {
        meetings: meetings.length,
        homeWins: meetings.filter((m) => m.result === 'W').length,
        draws: meetings.filter((m) => m.result === 'D').length,
        awayWins: meetings.filter((m) => m.result === 'L').length,
      },
      predictionsAvailable: predictionData.available,
      predictions: predictionData.predictions.map((prediction) => ({ ...prediction, name: nameOf.get(prediction.predictor_id) ?? 'Unknown' })),
      modelPick,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load match preview');
  }
}
