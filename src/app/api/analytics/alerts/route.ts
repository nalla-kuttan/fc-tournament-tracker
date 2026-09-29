import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-guards';
import { getCompetitiveData } from '@/lib/competitive-data';
import { loadGoalCounts } from '@/lib/predictions-data';
import { buildRecordAlerts } from '@/lib/record-alerts';
import { createServerClient } from '@/lib/supabase/server';

// Records and milestones the next results could set.
export async function GET() {
  try {
    const supabase = createServerClient();
    const data = await getCompetitiveData(supabase);
    const goals = await loadGoalCounts(supabase, data.playerInstances);
    return NextResponse.json({ alerts: buildRecordAlerts(data.registeredPlayers, data.playerInstances, data.matches, goals) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load record alerts');
  }
}
