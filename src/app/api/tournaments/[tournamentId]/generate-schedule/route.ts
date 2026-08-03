import { NextResponse } from 'next/server';
import { ApiError, handleApiError, rateLimit, readJsonBody, verifyTournamentPin } from '@/lib/api-guards';
import { generateRoundRobin } from '@/lib/algorithms/round-robin';
import { generateKnockoutBracket } from '@/lib/algorithms/knockout';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { pinRequestSchema } from '@/lib/validation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;

  try {
    const limited = await rateLimit(request, 'schedule:create', 6, 5 * 60);
    if (limited) return limited;
    const { pin } = await readJsonBody(request, pinRequestSchema);

    const supabase = createServerClient();
    const pinCheck = await verifyTournamentPin(supabase, tournamentId, pin);
    if (!pinCheck.ok) return pinCheck.response;

    const [{ data: tournament, error: tournamentError }, { data: players, error: playersError }] = await Promise.all([
      supabase.from('tournament').select('id, format').eq('id', tournamentId).single(),
      supabase.from('player').select('id, seed').eq('tournament_id', tournamentId).order('seed'),
    ]);

    if (tournamentError || !tournament) throw new ApiError('Tournament not found', 404, 'NOT_FOUND');
    if (playersError) throw playersError;
    if (!players || players.length < 2) throw new ApiError('Add at least two players before generating a schedule');

    const playerIds = players.map((player) => player.id);
    const schedule = tournament.format === 'knockout'
      ? generateKnockoutBracket(playerIds)
      : generateRoundRobin(playerIds);
    const matchRows = schedule.map((match, index) => ({
      home_player_id: match.home_player_id || null,
      away_player_id: match.away_player_id || null,
      round_number: match.round_number,
      match_number: match.match_number,
      stage: match.stage,
      is_bye: match.is_bye,
      match_order: index + 1,
    }));

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc('create_schedule_atomic', {
      p_tournament_id: tournamentId,
      p_match_rows: matchRows,
    });
    if (error) {
      if (error.code === '23505' || error.message.includes('already generated')) {
        throw new ApiError('Schedule already generated', 409, 'CONFLICT');
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Generate tournament schedule');
  }
}
