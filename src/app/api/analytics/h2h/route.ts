import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { aggregateCareerStats } from '@/lib/algorithms/stats';
import type { Match } from '@/lib/types';
import { ApiError, handleApiError } from '@/lib/api-guards';
import { uuidSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const p1Id = searchParams.get('p1');
    const p2Id = searchParams.get('p2');

    if (!uuidSchema.safeParse(p1Id).success || !uuidSchema.safeParse(p2Id).success || p1Id === p2Id) {
      throw new ApiError('Choose two different valid players', 400, 'INVALID_REQUEST');
    }

    const supabase = createServerClient();

    const [player1Result, player2Result] = await Promise.all([
      supabase.from('registered_player').select('*').eq('id', p1Id!).maybeSingle(),
      supabase.from('registered_player').select('*').eq('id', p2Id!).maybeSingle(),
    ]);
    if (player1Result.error) throw player1Result.error;
    if (player2Result.error) throw player2Result.error;
    const rp1 = player1Result.data;
    const rp2 = player2Result.data;

    if (!rp1 || !rp2) {
      throw new ApiError('Player not found', 404, 'NOT_FOUND');
    }

  // Get all player instances for both
  const [{ data: p1Instances }, { data: p2Instances }] = await Promise.all([
    supabase.from('player').select('id').eq('registered_player_id', p1Id),
    supabase.from('player').select('id').eq('registered_player_id', p2Id),
  ]);

  const p1Ids = (p1Instances ?? []).map((p) => p.id);
  const p2Ids = (p2Instances ?? []).map((p) => p.id);
  const allIds = [...p1Ids, ...p2Ids];

  // Get all matches involving either player
  const matchResult = allIds.length > 0
    ? await supabase
      .from('match')
      .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team), tournament:tournament_id(id, name)')
      .or(allIds.map((id) => `home_player_id.eq.${id},away_player_id.eq.${id}`).join(','))
    : { data: [], error: null };
  if (matchResult.error) throw matchResult.error;

  const matches = (matchResult.data ?? []) as Match[];

  // Get all goals
  const goalResult = allIds.length > 0
    ? await supabase.from('goal').select('player_id').in('player_id', allIds)
    : { data: [], error: null };
  if (goalResult.error) throw goalResult.error;

  // Find head-to-head matches (both players were opponents)
  const p1Set = new Set(p1Ids);
  const p2Set = new Set(p2Ids);

  const h2hMatches = matches.filter(
    (m) =>
      m.is_played &&
      !m.is_bye &&
      ((p1Set.has(m.home_player_id!) && p2Set.has(m.away_player_id!)) ||
        (p2Set.has(m.home_player_id!) && p1Set.has(m.away_player_id!)))
  );

  let p1Wins = 0;
  let p2Wins = 0;
  let draws = 0;
  let p1Goals = 0;
  let p2Goals = 0;

  for (const m of h2hMatches) {
    const p1IsHome = p1Set.has(m.home_player_id!);
    const p1Score = p1IsHome ? m.home_score! : m.away_score!;
    const p2Score = p1IsHome ? m.away_score! : m.home_score!;

    p1Goals += p1Score;
    p2Goals += p2Score;

    if (p1Score > p2Score) p1Wins++;
    else if (p2Score > p1Score) p2Wins++;
    else draws++;
  }

  // Career stats
  const p1Career = aggregateCareerStats(p1Id!, rp1.name, rp1.base_team, p1Ids, matches, goalResult.data ?? []);
  const p2Career = aggregateCareerStats(p2Id!, rp2.name, rp2.base_team, p2Ids, matches, goalResult.data ?? []);

    return NextResponse.json({
      player1: rp1,
      player2: rp2,
      total_encounters: h2hMatches.length,
      player1_wins: p1Wins,
      player2_wins: p2Wins,
      draws,
      player1_goals: p1Goals,
      player2_goals: p2Goals,
      matches: h2hMatches,
      player1_career: p1Career,
      player2_career: p2Career,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load head-to-head analytics');
  }
}
