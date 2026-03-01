import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateStandings } from '@/lib/algorithms/standings';
import type { Match } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  const supabase = createServerClient();

  // Get players
  const { data: players } = await supabase
    .from('player')
    .select('id, name, team')
    .eq('tournament_id', tournamentId);

  if (!players || players.length === 0) {
    return NextResponse.json([]);
  }

  // Get matches
  const { data: matches } = await supabase
    .from('match')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('played_at');

  const standings = calculateStandings((matches ?? []) as Match[], players);

  return NextResponse.json(standings);
}
