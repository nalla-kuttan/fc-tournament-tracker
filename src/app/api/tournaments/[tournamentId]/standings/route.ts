import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { Match } from '@/lib/types';
import { handleApiError } from '@/lib/api-guards';
import { withMovement } from '@/lib/algorithms/standings';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = createServerClient();

    const { data: players, error: playerError } = await supabase
      .from('player')
      .select('id, name, team')
      .eq('tournament_id', tournamentId);
    if (playerError) throw playerError;

    if (!players?.length) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'private, no-store' } });
    }

    const { data: matches, error: matchError } = await supabase
      .from('match')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('played_at');
    if (matchError) throw matchError;

    const standings = withMovement((matches ?? []) as Match[], players);

    return NextResponse.json(standings, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load tournament standings');
  }
}
