import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateStandings } from '@/lib/algorithms/standings';
import type { Match } from '@/lib/types';

export async function GET() {
  const supabase = createServerClient();

  // Get all completed tournaments
  const { data: tournaments } = await supabase
    .from('tournament')
    .select('id, name, format, status, created_at')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (!tournaments || tournaments.length === 0) {
    return NextResponse.json([]);
  }

  const hallOfFame = [];

  for (const t of tournaments) {
    if (t.format === 'league' || t.format === 'cup') {
      // League/Cup: winner is top of standings
      const { data: players } = await supabase
        .from('player')
        .select('id, name, team, registered_player_id')
        .eq('tournament_id', t.id);

      const { data: matches } = await supabase
        .from('match')
        .select('*')
        .eq('tournament_id', t.id)
        .order('played_at');

      if (players && players.length > 0 && matches) {
        const standings = calculateStandings(matches as Match[], players);
        if (standings.length > 0) {
          const winner = standings[0];
          const winnerPlayer = players.find((p) => p.id === winner.player_id);
          hallOfFame.push({
            tournament_id: t.id,
            tournament_name: t.name,
            tournament_format: t.format,
            completed_at: t.created_at,
            winner_name: winner.player_name,
            winner_team: winner.team,
            registered_player_id: winnerPlayer?.registered_player_id ?? null,
            stats: {
              played: winner.played,
              wins: winner.wins,
              draws: winner.draws,
              losses: winner.losses,
              goals_for: winner.goals_for,
              goals_against: winner.goals_against,
              points: winner.points,
            },
          });
        }
      }
    } else if (t.format === 'knockout') {
      // Knockout: winner is the winner of the Final match
      const { data: finalMatch } = await supabase
        .from('match')
        .select('*, home_player:home_player_id(id, name, team, registered_player_id), away_player:away_player_id(id, name, team, registered_player_id)')
        .eq('tournament_id', t.id)
        .eq('stage', 'F')
        .eq('is_played', true)
        .single();

      if (finalMatch) {
        const homeWon = finalMatch.home_score > finalMatch.away_score;
        const winner = homeWon ? finalMatch.home_player : finalMatch.away_player;
        if (winner) {
          hallOfFame.push({
            tournament_id: t.id,
            tournament_name: t.name,
            tournament_format: t.format,
            completed_at: t.created_at,
            winner_name: winner.name,
            winner_team: winner.team,
            registered_player_id: winner.registered_player_id ?? null,
            stats: {
              final_score: `${finalMatch.home_score} - ${finalMatch.away_score}`,
            },
          });
        }
      }
    }
  }

  return NextResponse.json(hallOfFame);
}
