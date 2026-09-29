import { calculateStandings } from './algorithms/standings';
import { buildTournamentRecap } from './tournament-recap';
import { getTournamentChampions } from './tournament-results';
import type { Match, Player, RegisteredPlayer, Tournament } from './types';

export type TrophyKind = 'title' | 'runner-up' | 'golden-boot' | 'golden-ball' | 'motm' | 'best-defence';

export interface TrophyItem {
  kind: TrophyKind;
  tournamentId: string;
  tournamentName: string;
  detail: string;
  date: string | null;
}

export const TROPHY_LABELS: Record<TrophyKind, { name: string; plural: string; description: string }> = {
  title: { name: 'Champion', plural: 'Titles', description: 'Won the tournament' },
  'golden-ball': { name: 'Golden Ball', plural: 'Golden Balls', description: 'Best average match rating' },
  'golden-boot': { name: 'Golden Boot', plural: 'Golden Boots', description: 'Top scorer' },
  motm: { name: 'Star Man', plural: 'Star Man awards', description: 'Most Man of the Match awards' },
  'best-defence': { name: 'Iron Wall', plural: 'Iron Walls', description: 'Fewest goals conceded per match' },
  'runner-up': { name: 'Runner-up', plural: 'Runner-up medals', description: 'Finished second' },
};

// The tournament-recap award behind each individual trophy.
const AWARD_KINDS: Record<string, TrophyKind> = {
  'Top scorer': 'golden-boot',
  'Best average rating': 'golden-ball',
  'Most Man of the Match': 'motm',
  'Best defence': 'best-defence',
};

type InstanceInput = Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>;
type TournamentInput = Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'created_at'>;

// Everything a player has won, tournament by tournament: the title or a
// runner-up finish, plus each individual award from the tournament recap
// (shared awards count for everyone who shares them). Only decided
// tournaments count.
export function buildTrophyRoom(
  registeredPlayerId: string,
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  tournaments: TournamentInput[],
  instances: InstanceInput[],
  matches: Match[],
  goals: Array<{ player_id: string; match_id: string }>
): TrophyItem[] {
  const champions = getTournamentChampions(tournaments, instances, matches);
  const items: TrophyItem[] = [];

  for (const tournament of [...tournaments].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))) {
    const champion = champions.get(tournament.id);
    if (!champion) continue;
    const entrants = instances.filter((instance) => instance.tournament_id === tournament.id);
    const own = entrants.find((instance) => instance.registered_player_id === registeredPlayerId);
    if (!own) continue;
    const played = matches.filter((match) => match.tournament_id === tournament.id && match.is_played && !match.is_bye);
    if (!played.some((match) => match.home_player_id === own.id || match.away_player_id === own.id)) continue;
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

    const recap = buildTournamentRecap(tournament, players, instances, matches, goals);
    for (const award of recap.awards) {
      const kind = AWARD_KINDS[award.label];
      if (!kind || !award.winners.includes(own.name)) continue;
      const value = kind === 'motm' ? `${award.value}× Man of the Match` : kind === 'golden-ball' ? `${award.value} average rating` : award.value;
      items.push({ ...base, kind, detail: `${value}${award.winners.length > 1 ? ' (shared)' : ''}` });
    }
  }
  return items;
}
