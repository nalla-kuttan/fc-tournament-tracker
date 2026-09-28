import { NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { getRatingHistory, getTournamentChampions } from '@/lib/tournament-results';
import { uuidSchema } from '@/lib/validation';

// A player's rating after every match, with the tournaments they won marked
// on each title's final match.
export async function GET(_request: Request, { params }: { params: Promise<{ playerId: string }> }) {
  try {
    const { playerId } = await params;
    if (!uuidSchema.safeParse(playerId).success) throw new ApiError('Player not found', 404, 'NOT_FOUND');

    const data = await getCompetitiveData();
    if (!data.registeredPlayers.some((player) => player.id === playerId)) throw new ApiError('Player not found', 404, 'NOT_FOUND');

    const history = getRatingHistory(data.registeredPlayers, data.playerInstances, data.matches, playerId);
    const champions = getTournamentChampions(data.tournaments, data.playerInstances, data.matches);
    const tournamentName = new Map(data.tournaments.map((tournament) => [tournament.id, tournament.name]));
    const wonTournaments = new Set([...champions].filter(([, champion]) => champion.registeredPlayerId === playerId).map(([id]) => id));
    const lastIndexByTournament = new Map(history.map((point, index) => [point.tournamentId, index]));

    const points = history.map((point, index) => ({
      ...point,
      tournamentName: tournamentName.get(point.tournamentId) ?? 'Tournament',
      titleWon: wonTournaments.has(point.tournamentId) && lastIndexByTournament.get(point.tournamentId) === index,
    }));
    const ratings = points.map((point) => point.ratingAfter);

    return NextResponse.json({
      points,
      current: ratings.at(-1) ?? 1000,
      peak: ratings.length ? Math.max(...ratings) : 1000,
      lowest: ratings.length ? Math.min(...ratings) : 1000,
      titles: wonTournaments.size,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load rating history');
  }
}
