import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { verifyPin } from '@/lib/auth';
import { getNextMatchNumber, isHomeSlotInNextMatch } from '@/lib/algorithms/knockout';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;

  try {
    const { matchId, pin } = await request.json();

    // Verify admin
    const supabase = createServerClient();
    const { data: tournament } = await supabase
      .from('tournament')
      .select('pin')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const isValid = await verifyPin(pin, tournament.pin);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
    }

    // Get the match
    const { data: match } = await supabase
      .from('match')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match || !match.is_played) {
      return NextResponse.json({ error: 'Match not found or not played' }, { status: 400 });
    }

    // Determine winner
    const winnerId =
      match.home_score > match.away_score ? match.home_player_id : match.away_player_id;

    if (!winnerId) {
      return NextResponse.json({ error: 'Cannot determine winner (draw)' }, { status: 400 });
    }

    // Get all matches to determine bracket structure
    const { data: allMatches } = await supabase
      .from('match')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('match_number');

    if (!allMatches) {
      return NextResponse.json({ error: 'No matches found' }, { status: 500 });
    }

    const round1Count = allMatches.filter((m) => m.round_number === 1).length;
    const totalMatchCount = allMatches.length;

    const nextMatchNum = getNextMatchNumber(match.match_number, round1Count, totalMatchCount);

    if (nextMatchNum === null) {
      // This was the final - mark tournament as completed
      const adminClient = createAdminClient();
      await adminClient
        .from('tournament')
        .update({ status: 'completed' })
        .eq('id', tournamentId);

      return NextResponse.json({ success: true, final: true, winnerId });
    }

    // Find next match and slot the winner
    const isHome = isHomeSlotInNextMatch(match.match_number, round1Count);
    const nextMatch = allMatches.find((m) => m.match_number === nextMatchNum);

    if (!nextMatch) {
      return NextResponse.json({ error: 'Next match not found' }, { status: 500 });
    }

    const adminClient = createAdminClient();
    await adminClient
      .from('match')
      .update(isHome ? { home_player_id: winnerId } : { away_player_id: winnerId })
      .eq('id', nextMatch.id);

    return NextResponse.json({ success: true, nextMatchId: nextMatch.id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
