import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { verifyPin } from '@/lib/auth';
import { generateRoundRobin } from '@/lib/algorithms/round-robin';
import { generateKnockoutBracket, getNextMatchNumber, isHomeSlotInNextMatch } from '@/lib/algorithms/knockout';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;

  try {
    const { pin } = await request.json();

    // Verify admin
    const supabase = createServerClient();
    const { data: tournament } = await supabase
      .from('tournament')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const isValid = await verifyPin(pin, tournament.pin);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
    }

    // Check if schedule already exists
    const { data: existingMatches } = await supabase
      .from('match')
      .select('id')
      .eq('tournament_id', tournamentId)
      .limit(1);

    if (existingMatches && existingMatches.length > 0) {
      return NextResponse.json({ error: 'Schedule already generated' }, { status: 409 });
    }

    // Get players
    const { data: players } = await supabase
      .from('player')
      .select('id, seed')
      .eq('tournament_id', tournamentId)
      .order('seed');

    if (!players || players.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 });
    }

    const playerIds = players.map((p) => p.id);
    const adminClient = createAdminClient();

    let schedule;
    if (tournament.format === 'knockout') {
      schedule = generateKnockoutBracket(playerIds);
    } else {
      // league or cup (cup uses league format for group stage)
      schedule = generateRoundRobin(playerIds);
    }

    // Insert matches
    const matchRows = schedule.map((m, idx) => ({
      tournament_id: tournamentId,
      home_player_id: m.home_player_id || null,
      away_player_id: m.away_player_id || null,
      round_number: m.round_number,
      match_number: m.match_number,
      stage: m.stage,
      is_bye: m.is_bye,
      match_order: idx + 1,
    }));

    const { data: insertedMatches, error: insertError } = await adminClient
      .from('match')
      .insert(matchRows)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // For knockout: auto-advance BYE matches
    if (tournament.format === 'knockout' && insertedMatches) {
      const byeMatches = insertedMatches.filter((m) => m.is_bye);
      const round1Count = insertedMatches.filter((m) => m.round_number === 1).length;
      const totalMatchCount = insertedMatches.length;

      for (const byeMatch of byeMatches) {
        // Mark BYE as played
        await adminClient
          .from('match')
          .update({ is_played: true, home_score: 0, away_score: 0, played_at: new Date().toISOString() })
          .eq('id', byeMatch.id);

        // Advance the real player to the next round
        const nextMatchNum = getNextMatchNumber(byeMatch.match_number, round1Count, totalMatchCount);
        if (nextMatchNum !== null) {
          const isHome = isHomeSlotInNextMatch(byeMatch.match_number, round1Count);
          const nextMatch = insertedMatches.find((m) => m.match_number === nextMatchNum);

          if (nextMatch) {
            await adminClient
              .from('match')
              .update(
                isHome
                  ? { home_player_id: byeMatch.home_player_id }
                  : { away_player_id: byeMatch.home_player_id }
              )
              .eq('id', nextMatch.id);
          }
        }
      }
    }

    // Update tournament status to active
    await adminClient
      .from('tournament')
      .update({ status: 'active' })
      .eq('id', tournamentId);

    return NextResponse.json({ success: true, matchCount: insertedMatches?.length ?? 0 }, { status: 201 });
  } catch (err) {
    console.error('Generate schedule error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
