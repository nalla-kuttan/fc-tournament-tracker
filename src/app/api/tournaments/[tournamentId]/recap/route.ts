import { NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-guards';
import { loadTournamentRecap } from '@/lib/tournament-recap-data';
import { uuidSchema } from '@/lib/validation';

export async function GET(_request: Request, { params }: { params: Promise<{ tournamentId: string }> }) {
  try {
    const { tournamentId } = await params;
    if (!uuidSchema.safeParse(tournamentId).success) throw new ApiError('Tournament not found', 404, 'NOT_FOUND');
    return NextResponse.json(await loadTournamentRecap(tournamentId), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load tournament recap');
  }
}
