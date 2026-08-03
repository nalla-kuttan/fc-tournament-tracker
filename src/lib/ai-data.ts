import 'server-only';

import { aggregateCareerStats, aggregateCareerStatsBatch } from '@/lib/algorithms/stats';
import { calculateStandings } from '@/lib/algorithms/standings';
import { ApiError } from '@/lib/api-guards';
import { createServerClient } from '@/lib/supabase/server';
import type { Match } from '@/lib/types';

export async function getPlayerScoutFacts(playerId: string) {
  const supabase = createServerClient();
  const [{ data: player, error: playerError }, { data: instances, error: instanceError }] = await Promise.all([
    supabase.from('registered_player').select('id, name, base_team').eq('id', playerId).single(),
    supabase.from('player').select('id').eq('registered_player_id', playerId),
  ]);
  if (playerError || !player) throw new ApiError('Player not found', 404, 'NOT_FOUND');
  if (instanceError) throw instanceError;
  const playerIds = (instances ?? []).map((instance) => instance.id);
  if (!playerIds.length) {
    return { player, stats: aggregateCareerStats(player.id, player.name, player.base_team, [], [], []) };
  }
  const [{ data: matches, error: matchError }, { data: goals, error: goalError }] = await Promise.all([
    supabase
      .from('match')
      .select('*')
      .or(playerIds.map((id) => `home_player_id.eq.${id},away_player_id.eq.${id}`).join(','))
      .eq('is_played', true)
      .eq('is_bye', false),
    supabase.from('goal').select('player_id').in('player_id', playerIds),
  ]);
  if (matchError) throw matchError;
  if (goalError) throw goalError;
  return {
    player,
    stats: aggregateCareerStats(player.id, player.name, player.base_team, playerIds, (matches ?? []) as Match[], goals ?? []),
  };
}

export async function getH2HFacts(player1Id: string, player2Id: string) {
  const supabase = createServerClient();
  const [{ data: players, error: playerError }, { data: instances, error: instanceError }] = await Promise.all([
    supabase.from('registered_player').select('id, name, base_team').in('id', [player1Id, player2Id]),
    supabase.from('player').select('id, registered_player_id').in('registered_player_id', [player1Id, player2Id]),
  ]);
  if (playerError) throw playerError;
  if (instanceError) throw instanceError;
  const player1 = players?.find((player) => player.id === player1Id);
  const player2 = players?.find((player) => player.id === player2Id);
  if (!player1 || !player2) throw new ApiError('Player not found', 404, 'NOT_FOUND');

  const player1Ids = (instances ?? []).filter((instance) => instance.registered_player_id === player1Id).map((instance) => instance.id);
  const player2Ids = (instances ?? []).filter((instance) => instance.registered_player_id === player2Id).map((instance) => instance.id);
  const allIds = [...player1Ids, ...player2Ids];
  if (!allIds.length) return { player1, player2, encounters: [] };

  const { data: matches, error } = await supabase
    .from('match')
    .select('id, home_player_id, away_player_id, home_score, away_score, played_at, tournament:tournament_id(name)')
    .or(allIds.map((id) => `home_player_id.eq.${id},away_player_id.eq.${id}`).join(','))
    .eq('is_played', true)
    .eq('is_bye', false)
    .order('played_at', { ascending: false });
  if (error) throw error;
  const player1Set = new Set(player1Ids);
  const player2Set = new Set(player2Ids);
  const encounters = (matches ?? []).filter((match) =>
    (player1Set.has(match.home_player_id!) && player2Set.has(match.away_player_id!)) ||
    (player2Set.has(match.home_player_id!) && player1Set.has(match.away_player_id!))
  );
  return { player1, player2, encounters };
}

export async function getTournamentSummaryFacts(tournamentId: string) {
  const supabase = createServerClient();
  const [tournamentResult, playersResult, matchesResult] = await Promise.all([
    supabase.from('tournament').select('id, name, format, status').eq('id', tournamentId).single(),
    supabase.from('player').select('id, name, team').eq('tournament_id', tournamentId),
    supabase
      .from('match')
      .select('id, tournament_id, home_player_id, away_player_id, home_score, away_score, round_number, match_number, stage, is_played, is_bye, stats, match_order, played_at, created_at, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team)')
      .eq('tournament_id', tournamentId)
      .eq('is_played', true)
      .order('played_at', { ascending: false })
      .limit(100),
  ]);
  if (tournamentResult.error || !tournamentResult.data) throw new ApiError('Tournament not found', 404, 'NOT_FOUND');
  if (playersResult.error) throw playersResult.error;
  if (matchesResult.error) throw matchesResult.error;
  const matches = (matchesResult.data ?? []) as unknown as Match[];
  return {
    tournament: tournamentResult.data,
    standings: calculateStandings(matches, playersResult.data ?? []),
    matches,
  };
}

export async function getMatchReportFacts(matchId: string) {
  const supabase = createServerClient();
  const [{ data: match, error: matchError }, { data: goals, error: goalsError }] = await Promise.all([
    supabase
      .from('match')
      .select('id, home_score, away_score, round_number, stats, home_player:home_player_id(id, name, team), away_player:away_player_id(id, name, team), tournament:tournament_id(name)')
      .eq('id', matchId)
      .eq('is_played', true)
      .single(),
    supabase.from('goal').select('minute, player:player_id(name)').eq('match_id', matchId).order('minute'),
  ]);
  if (matchError || !match) throw new ApiError('Played match not found', 404, 'NOT_FOUND');
  if (goalsError) throw goalsError;
  return { match, goals: goals ?? [] };
}

export async function getGlobalStatFacts() {
  const supabase = createServerClient();
  const [registeredResult, instancesResult, matchesResult, goalsResult] = await Promise.all([
    supabase.from('registered_player').select('id, name, base_team'),
    supabase.from('player').select('id, registered_player_id'),
    supabase.from('match').select('*').eq('is_played', true).eq('is_bye', false),
    supabase.from('goal').select('player_id'),
  ]);
  const error = registeredResult.error || instancesResult.error || matchesResult.error || goalsResult.error;
  if (error) throw error;
  return aggregateCareerStatsBatch(
    registeredResult.data ?? [],
    instancesResult.data ?? [],
    (matchesResult.data ?? []) as Match[],
    goalsResult.data ?? []
  ).filter((stats) => stats.total_matches > 0).slice(0, 100);
}
