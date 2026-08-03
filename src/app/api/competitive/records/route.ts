import { NextResponse } from 'next/server';
import { calculateCompetitiveRecords } from '@/lib/competitive';
import { getCompetitiveData, resolveCompetitiveScope } from '@/lib/competitive-data';
import { handleApiError } from '@/lib/api-guards';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = resolveCompetitiveScope(searchParams);
    const data = await getCompetitiveData();

    return NextResponse.json({
      scope,
      records: calculateCompetitiveRecords(
        data.registeredPlayers,
        data.playerInstances,
        data.tournaments,
        data.matches,
        scope
      ),
    });
  } catch (error) {
    return handleApiError(error, 'Load competitive records');
  }
}
