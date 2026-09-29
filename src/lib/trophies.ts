import { calculateStandings } from './algorithms/standings';
import { getTournamentChampions } from './tournament-results';
import type { Match, Player, Tournament } from './types';

export interface TrophyItem {
  kind: 'title' | 'runner-up' | 'golden-boot';
  tournamentId: string;
  tournamentName: string;
  detail: string;
  date: string | null;
}

type InstanceInput = Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>;
type TournamentInput = Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'created_at'>;

// Everything a player has won, tournament by tournament: titles, runner-up
// finishes and golden boots (top scorer, shared on a tie). Only decided
// tournaments count.
export function buildTrophyRoom(
  registeredPlayerId: string,
  tournaments: TournamentInput[],
  instances: InstanceInput[],
  matches: Match[],
  goals: Array<{ player_id: string; match_id: string }>
): TrophyItem[] {
  const champions = getTournamentChampions(tournaments, instances, matches);
  const goalsByMatch = new Map<string, string[]>();
  for (const goal of goals) goalsByMatch.set(goal.match_id, [...(goalsByMatch.get(goal.match_id) ?? []), goal.player_id]);
  const items: TrophyItem[] = [];

  for (const tournament of [...tournaments].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))) {
    const champion = champions.get(tournament.id);
    if (!champion) continue;
    const entrants = instances.filter((instance) => instance.tournament_id === tournament.id);
    const own = entrants.find((instance) => instance.registered_player_id === registeredPlayerId);
    if (!own) continue;
    const played = matches.filter((match) => match.tournament_id === tournament.id && match.is_played && !match.is_bye);
    const lastDate = played.map((match) => match.played_at ?? '').sort().at(-1) || null;
    const base = { tournamentId: tournament.id, tournamentName: tournament.name, date: lastDate };

    if (champion.registeredPlayerId === registeredPlayerId) {
      items.push({ ...base, kind: 'title', detail: tournament.format === 'knockout' ? 'Won the final' : 'Won the league' });
    } else {
      const final = played.find((match) => match.stage === 'F' && match.home_score !== match.away_score);
      const runnerUpInstance = final
        ? ((final.home_score ?? 0) > (final.away_score ?? 0) ? final.away_player_id : final.home_player_id)
        : calculateStandings(played, entrants).filter((row) => row.played > 0)[1]?.player_id;
      if (runnerUpInstance === own.id) items.push({ ...base, kind: 'runner-up', detail: final ? 'Lost the final' : 'Finished second' });
    }

    const tally = new Map<string, number>();
    for (const match of played) for (const scorer of goalsByMatch.get(match.id) ?? []) tally.set(scorer, (tally.get(scorer) ?? 0) + 1);
    const best = Math.max(0, ...tally.values());
    if (best > 0 && tally.get(own.id) === best) {
      const shared = [...tally.values()].filter((count) => count === best).length > 1;
      items.push({ ...base, kind: 'golden-boot', detail: `${best} goals${shared ? ' (shared)' : ''}` });
    }
  }
  return items;
}
