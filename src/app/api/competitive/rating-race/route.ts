import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { buildRatingRace } from '@/lib/rating-race';

export async function GET() {
  try {
    const data = await getCompetitiveData();
    return NextResponse.json(buildRatingRace(data.registeredPlayers, data.playerInstances, data.matches, data.tournaments), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load rating race');
  }
}
