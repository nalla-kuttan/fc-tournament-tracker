import 'server-only';

import { isMissingSchemaError } from '@/lib/competitive-data';
import { fetchAllRows } from '@/lib/supabase/pagination';
import type { createServerClient } from '@/lib/supabase/server';
import type { Prediction } from '@/lib/predictions';

type ServerClient = ReturnType<typeof createServerClient>;

// Predictions for some matches. `available` is false until the predictions
// migration has been applied, so pages can say so instead of failing.
export async function loadPredictions(supabase: ServerClient, matchIds: string[]): Promise<{ available: boolean; predictions: Prediction[] }> {
  if (matchIds.length === 0) return { available: true, predictions: [] };
  const result = await fetchAllRows<Prediction>((from, to) => supabase
    .from('prediction')
    .select('match_id, predictor_id, pick')
    .in('match_id', matchIds)
    .order('id', { ascending: true })
    .range(from, to));
  if (result.error) {
    if (isMissingSchemaError(result.error as { code?: string })) return { available: false, predictions: [] };
    throw result.error;
  }
  return { available: true, predictions: result.data ?? [] };
}

// All goal rows, counted per registered player.
export async function loadGoalCounts(supabase: ServerClient, instances: Array<{ id: string; registered_player_id: string }>) {
  const result = await fetchAllRows<{ player_id: string }>((from, to) => supabase
    .from('goal')
    .select('player_id')
    .order('id', { ascending: true })
    .range(from, to));
  if (result.error) throw result.error;
  const ownerOf = new Map(instances.map((instance) => [instance.id, instance.registered_player_id]));
  const counts = new Map<string, number>();
  for (const goal of result.data ?? []) {
    const owner = ownerOf.get(goal.player_id);
    if (owner) counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }
  return counts;
}
