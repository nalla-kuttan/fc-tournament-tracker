import { NextResponse } from 'next/server';
import { calculateStandings } from '@/lib/algorithms/standings';
import { handleApiError } from '@/lib/api-guards';
import { createServerClient } from '@/lib/supabase/server';
import type { Match } from '@/lib/types';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournament')
      .select('id, name, format, status, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    if (tournamentError) throw tournamentError;
    if (!tournaments?.length) return NextResponse.json([]);

    const tournamentIds = tournaments.map((tournament) => tournament.id);
    const [playersResult, matchesResult] = await Promise.all([
      supabase
        .from('player')
        .select('id, name, team, registered_player_id, tournament_id')
        .in('tournament_id', tournamentIds),
      supabase
        .from('match')
        .select('*, home_player:home_player_id(id, name, team, registered_player_id), away_player:away_player_id(id, name, team, registered_player_id)')
        .in('tournament_id', tournamentIds)
        .order('played_at'),
    ]);
    if (playersResult.error) throw playersResult.error;
    if (matchesResult.error) throw matchesResult.error;

    const playersByTournament = new Map<string, NonNullable<typeof playersResult.data>>();
    for (const player of playersResult.data ?? []) {
      const group = playersByTournament.get(player.tournament_id) ?? [];
      group.push(player);
      playersByTournament.set(player.tournament_id, group);
    }
    const matchesByTournament = new Map<string, Match[]>();
    for (const match of (matchesResult.data ?? []) as Match[]) {
      const group = matchesByTournament.get(match.tournament_id) ?? [];
      group.push(match);
      matchesByTournament.set(match.tournament_id, group);
    }

    const hallOfFame: unknown[] = [];
    for (const tournament of tournaments) {
      const players = playersByTournament.get(tournament.id) ?? [];
      const matches = matchesByTournament.get(tournament.id) ?? [];

      if (tournament.format === 'league' || tournament.format === 'cup') {
        const winner = calculateStandings(matches, players)[0];
        if (!winner) continue;
        const winnerPlayer = players.find((player) => player.id === winner.player_id);
        hallOfFame.push({
          tournament_id: tournament.id,
          tournament_name: tournament.name,
          tournament_format: tournament.format,
          completed_at: tournament.created_at,
          winner_name: winner.player_name,
          winner_team: winner.team,
          registered_player_id: winnerPlayer?.registered_player_id ?? null,
          stats: {
            played: winner.played, wins: winner.wins, draws: winner.draws, losses: winner.losses,
            goals_for: winner.goals_for, goals_against: winner.goals_against, points: winner.points,
          },
        });
        continue;
      }

      const finalMatch = matches.find((match) => match.stage === 'F' && match.is_played);
      if (!finalMatch || finalMatch.home_score === finalMatch.away_score) continue;
      const winner = (finalMatch.home_score ?? 0) > (finalMatch.away_score ?? 0)
        ? finalMatch.home_player
        : finalMatch.away_player;
      if (!winner) continue;
      hallOfFame.push({
        tournament_id: tournament.id,
        tournament_name: tournament.name,
        tournament_format: tournament.format,
        completed_at: tournament.created_at,
        winner_name: winner.name,
        winner_team: winner.team,
        registered_player_id: winner.registered_player_id ?? null,
        stats: { final_score: `${finalMatch.home_score} - ${finalMatch.away_score}` },
      });
    }

    return NextResponse.json(hallOfFame, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load hall of fame');
  }
}
