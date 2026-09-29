import 'server-only';

import { getCompetitiveData } from '@/lib/competitive-data';
import { ApiError } from '@/lib/api-error';
import { createServerClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/pagination';
import { buildPlayerCards } from '@/lib/player-cards';
import { buildTournamentRecap } from '@/lib/tournament-recap';
import { buildTournamentWrapped } from '@/lib/tournament-wrapped';

// Loads what a tournament recap needs: every played match (ratings depend on
// the full history) and this tournament's goal records.
async function loadTournamentInputs(tournamentId: string) {
  const supabase = createServerClient();
  const data = await getCompetitiveData(supabase);
  const tournament = data.tournaments.find((row) => row.id === tournamentId);
  if (!tournament) throw new ApiError('Tournament not found', 404, 'NOT_FOUND');

  const matchIds = data.matches.filter((match) => match.tournament_id === tournamentId).map((match) => match.id);
  const goals = matchIds.length
    ? await fetchAllRows<{ player_id: string; match_id: string }>((from, to) => supabase
      .from('goal')
      .select('player_id, match_id')
      .in('match_id', matchIds)
      .order('id', { ascending: true })
      .range(from, to))
    : { data: [], error: null };
  if (goals.error) throw goals.error;

  return { data, tournament, goals: goals.data ?? [] };
}

export async function loadTournamentRecap(tournamentId: string) {
  const { data, tournament, goals } = await loadTournamentInputs(tournamentId);
  return buildTournamentRecap(tournament, data.registeredPlayers, data.playerInstances, data.matches, goals);
}

export async function loadTournamentWrapped(tournamentId: string) {
  const { data, tournament, goals } = await loadTournamentInputs(tournamentId);
  const wrapped = buildTournamentWrapped(tournament, data.registeredPlayers, data.playerInstances, data.matches, goals);
  const cards = buildPlayerCards(data.registeredPlayers, data.playerInstances, data.matches, data.tournaments);
  return { ...wrapped, cards: cards.filter((card) => wrapped.players.some((player) => player.playerId === card.playerId)) };
}
