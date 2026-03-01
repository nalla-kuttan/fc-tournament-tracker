import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { aggregateCareerStats } from '@/lib/algorithms/stats';
import type { Match } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const p1Id = searchParams.get('p1');
  const p2Id = searchParams.get('p2');

  if (!p1Id || !p2Id) {
    return NextResponse.json({ error: 'Both p1 and p2 query params required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Get registered players
  const [{ data: rp1 }, { data: rp2 }] = await Promise.all([
    supabase.from('registered_player').select('*').eq('id', p1Id).single(),
    supabase.from('registered_player').select('*').eq('id', p2Id).single(),
  ]);

  if (!rp1 || !rp2) {
    return NextResponse.json({ error: 'Player(s) not found' }, { status: 404 });
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
  const { data: allMatches } = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team), tournament:tournament_id(id, name)')
    .or(allIds.map((id) => `home_player_id.eq.${id},away_player_id.eq.${id}`).join(','));

  const matches = (allMatches ?? []) as Match[];

  // Get all goals
  const { data: allGoals } = await supabase
    .from('goal')
    .select('player_id')
    .in('player_id', allIds);

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
  const p1Career = aggregateCareerStats(p1Id, rp1.name, rp1.base_team, p1Ids, matches, allGoals ?? []);
  const p2Career = aggregateCareerStats(p2Id, rp2.name, rp2.base_team, p2Ids, matches, allGoals ?? []);

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
  });
}
