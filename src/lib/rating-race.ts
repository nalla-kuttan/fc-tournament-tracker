import { buildCompetitiveRatingTimeline, getCompetitiveRatingMap, type CompetitivePlayerInstance } from './competitive-ratings';
import { chronological, isDecided } from './player-results';
import type { Match, RegisteredPlayer, Tournament } from './types';

export interface RatingRaceFrame {
  label: string;
  // Rating per player id; players appear once they've played.
  ratings: Record<string, number>;
}

export interface RatingRace {
  players: Array<{ id: string; name: string }>;
  frames: RatingRaceFrame[];
}

type PlayerInput = Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>;

// Everyone's rating through history, one frame per match: frame n is the
// table going into match n, and the last frame is today.
export function buildRatingRace(
  players: PlayerInput[],
  instances: CompetitivePlayerInstance[],
  matches: Match[],
  tournaments: Pick<Tournament, 'id' | 'name'>[]
): RatingRace {
  const timeline = buildCompetitiveRatingTimeline(players, instances, matches, { scope: 'all-time' });
  const tournamentName = new Map(tournaments.map((tournament) => [tournament.id, tournament.name]));
  const ordered = matches.filter((match) => isDecided(match) && timeline.has(match.id)).sort(chronological);
  const current: Record<string, number> = {};
  const frames: RatingRaceFrame[] = [];
  for (const match of ordered) {
    const snap = timeline.get(match.id)!;
    current[snap.homeRegisteredPlayerId] = snap.homeRating;
    current[snap.awayRegisteredPlayerId] = snap.awayRating;
    frames.push({ label: tournamentName.get(match.tournament_id) ?? '', ratings: { ...current } });
  }
  const final = getCompetitiveRatingMap(players, instances, matches);
  const last: Record<string, number> = {};
  for (const id of Object.keys(current)) last[id] = final.get(id) ?? current[id];
  if (frames.length) frames.push({ label: 'Today', ratings: last });
  const seen = new Set(Object.keys(current));
  return { players: players.filter((player) => seen.has(player.id)).map((player) => ({ id: player.id, name: player.name })), frames };
}
