import type { Match, Player } from './types';

export interface PlayerResult {
  match: Match;
  scored: number;
  conceded: number;
  result: 'W' | 'D' | 'L';
  opponentId: string;
  instanceId: string;
}

type InstanceInput = Pick<Player, 'id' | 'registered_player_id'>;

export function chronological(a: Match, b: Match) {
  return (a.played_at ?? '').localeCompare(b.played_at ?? '') || a.match_number - b.match_number || a.id.localeCompare(b.id);
}

export function isDecided(match: Match) {
  return match.is_played && !match.is_bye && Boolean(match.home_player_id && match.away_player_id)
    && match.home_score != null && match.away_score != null;
}

// Every played match from each registered player's side, oldest first.
export function buildPlayerResults(instances: InstanceInput[], matches: Match[]) {
  const ownerOf = new Map(instances.map((instance) => [instance.id, instance.registered_player_id]));
  const results = new Map<string, PlayerResult[]>();
  for (const match of matches.filter(isDecided).sort(chronological)) {
    const home = ownerOf.get(match.home_player_id!);
    const away = ownerOf.get(match.away_player_id!);
    if (!home || !away) continue;
    for (const [owner, opponent, scored, conceded, instanceId] of [
      [home, away, match.home_score!, match.away_score!, match.home_player_id!],
      [away, home, match.away_score!, match.home_score!, match.away_player_id!],
    ] as const) {
      const list = results.get(owner) ?? [];
      list.push({ match, scored, conceded, opponentId: opponent, instanceId, result: scored > conceded ? 'W' : scored < conceded ? 'L' : 'D' });
      results.set(owner, list);
    }
  }
  return results;
}
