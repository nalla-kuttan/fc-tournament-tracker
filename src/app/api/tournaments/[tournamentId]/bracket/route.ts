import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  const supabase = createServerClient();

  const { data: matches, error } = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team)')
    .eq('tournament_id', tournamentId)
    .order('match_number');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group matches by stage/round
  const rounds: Record<string, typeof matches> = {};
  for (const match of matches ?? []) {
    const stage = match.stage || `Round ${match.round_number}`;
    if (!rounds[stage]) rounds[stage] = [];
    rounds[stage].push(match);
  }

  return NextResponse.json({ matches: matches ?? [], rounds });
}
