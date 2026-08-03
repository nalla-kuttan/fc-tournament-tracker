import { NextResponse } from 'next/server';
import {
  calculateCompetitiveRatings,
  calculateCompetitiveRecords,
  getMatchIntelligenceLabels,
} from '@/lib/competitive';
import { getCompetitiveData } from '@/lib/competitive-data';
import { handleApiError } from '@/lib/api-guards';

export async function GET() {
  try {
    const data = await getCompetitiveData();
    const activeSeason = data.seasons.find((season) => season.status === 'active') ?? data.seasons[0] ?? null;
    const seasonScope = { scope: 'season' as const, seasonId: activeSeason?.id ?? null };
    const allTimeScope = { scope: 'all-time' as const, seasonId: null };
    const seasonRatings = activeSeason
      ? calculateCompetitiveRatings(data.registeredPlayers, data.playerInstances, data.matches, seasonScope)
      : [];
    const allTimeRatings = calculateCompetitiveRatings(data.registeredPlayers, data.playerInstances, data.matches, allTimeScope);
    const records = calculateCompetitiveRecords(data.registeredPlayers, data.playerInstances, data.tournaments, data.matches, allTimeScope);
    const latestMatches = [...data.matches]
      .sort((a, b) => (b.played_at ?? '').localeCompare(a.played_at ?? ''))
      .slice(0, 8)
      .map((match) => ({
        match,
        labels: getMatchIntelligenceLabels(match),
      }))
      .filter((row) => row.labels.length > 0);

    return NextResponse.json({
      activeSeason,
      seasons: data.seasons,
      seasonRatings,
      allTimeRatings,
      records,
      latestIntelligence: latestMatches,
    });
  } catch (error) {
    return handleApiError(error, 'Load competitive overview');
  }
}
