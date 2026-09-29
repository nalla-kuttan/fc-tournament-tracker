import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { buildPlayerCards } from '@/lib/player-cards';

// Every player's card. Attributes are relative to the group, so they are
// computed together rather than one player at a time.
export async function GET() {
  try {
    const data = await getCompetitiveData();
    const cards = buildPlayerCards(data.registeredPlayers, data.playerInstances, data.matches, data.tournaments);
    return NextResponse.json({ cards }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load player cards');
  }
}
