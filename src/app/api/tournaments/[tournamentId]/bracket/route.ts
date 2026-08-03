import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api-guards';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = createServerClient();

  const { data: matches, error } = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team)')
    .eq('tournament_id', tournamentId)
    .order('match_number');

    if (error) throw error;

  // Group matches by stage/round
  const rounds: Record<string, typeof matches> = {};
  for (const match of matches ?? []) {
    const stage = match.stage || `Round ${match.round_number}`;
    if (!rounds[stage]) rounds[stage] = [];
    rounds[stage].push(match);
  }

    return NextResponse.json(
      { matches: matches ?? [], rounds },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return handleApiError(error, 'Load bracket');
  }
}
