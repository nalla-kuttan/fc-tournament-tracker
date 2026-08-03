import { NextResponse } from 'next/server';
import { handleApiError, rateLimit, readJsonBody, verifyTournamentPin } from '@/lib/api-guards';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { bracketAdvanceSchema } from '@/lib/validation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  try {
    const limited = await rateLimit(request, 'bracket:advance', 30);
    if (limited) return limited;
    const { matchId, pin } = await readJsonBody(request, bracketAdvanceSchema);

    const readClient = createServerClient();
    const pinCheck = await verifyTournamentPin(readClient, tournamentId, pin);
    if (!pinCheck.ok) return pinCheck.response;

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc('advance_bracket_atomic', {
      p_tournament_id: tournamentId,
      p_match_id: matchId,
    });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'Advance tournament bracket');
  }
}
