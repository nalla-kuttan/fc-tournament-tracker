import type { Match, StandingRow, Tournament } from './types';

type TournamentSummary = Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'created_at'>;

export interface ChampionEntry {
  tournament_id: string;
  winner_name: string;
  winner_team: string;
  stats: {
    played?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    goals_for?: number;
    goals_against?: number;
    points?: number;
    final_score?: string;
  };
}

export type MatchNightState<M extends Pick<Match, 'is_played' | 'is_bye'>> =
  | { kind: 'loading'; tournament: TournamentSummary }
  | { kind: 'next-match'; tournament: TournamentSummary; match: M }
  | { kind: 'awaiting-fixture'; tournament: TournamentSummary }
  | { kind: 'awaiting-close'; tournament: TournamentSummary }
  | { kind: 'awaiting-schedule'; tournament: TournamentSummary }
  | { kind: 'complete'; tournament: TournamentSummary; champion: ChampionEntry | null; nextName: string };

// The tournament match night is about: the one being played, then one being
// set up, then the most recently created (finished) one.
export function pickFeaturedTournament<T extends TournamentSummary>(tournaments: T[]): T | null {
  const newestFirst = [...tournaments].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  return newestFirst.find((t) => t.status === 'active')
    ?? newestFirst.find((t) => t.status === 'draft')
    ?? newestFirst[0]
    ?? null;
}

// "Season 24" -> "Season 25". Names without a trailing number get no suggestion.
export function suggestNextName(name: string) {
  const match = /^(.*?)(\d+)(\s*)$/.exec(name.trim());
  if (!match) return '';
  return `${match[1]}${Number(match[2]) + 1}`;
}

function isPlayable(match: Pick<Match, 'is_played' | 'is_bye'> & { home_player_id?: string | null; away_player_id?: string | null; home_player?: unknown; away_player?: unknown }) {
  return !match.is_played && !match.is_bye
    && Boolean(match.home_player_id ?? match.home_player)
    && Boolean(match.away_player_id ?? match.away_player);
}

export function getMatchNightState<M extends Pick<Match, 'is_played' | 'is_bye'> & { home_player_id?: string | null; away_player_id?: string | null; home_player?: unknown; away_player?: unknown }>(
  tournament: TournamentSummary,
  matches: M[] | undefined,
  champions: ChampionEntry[]
): MatchNightState<M> {
  if (tournament.status === 'completed') {
    return {
      kind: 'complete',
      tournament,
      champion: champions.find((entry) => entry.tournament_id === tournament.id) ?? null,
      nextName: suggestNextName(tournament.name),
    };
  }
  if (tournament.status === 'draft') return { kind: 'awaiting-schedule', tournament };
  if (!matches) return { kind: 'loading', tournament };
  const fixtures = matches.filter((match) => !match.is_bye);
  if (fixtures.length === 0) return { kind: 'awaiting-schedule', tournament };

  const next = matches.find(isPlayable);
  if (next) return { kind: 'next-match', tournament, match: next };
  if (fixtures.some((match) => !match.is_played)) return { kind: 'awaiting-fixture', tournament };
  return { kind: 'awaiting-close', tournament };
}

// Champion as the tournament pages can see it: the league leader, or the
// knockout final's winner. Null while undecided (or a drawn final).
export function getChampionName(
  format: string,
  standings: Pick<StandingRow, 'player_name'>[],
  matches: Array<Pick<Match, 'stage' | 'is_played' | 'home_score' | 'away_score'> & { home_player?: { name: string } | null; away_player?: { name: string } | null }>
) {
  if (format !== 'knockout') return standings[0]?.player_name ?? null;
  const final = matches.find((match) => match.stage === 'F' && match.is_played);
  if (!final || final.home_score === final.away_score) return null;
  return ((final.home_score ?? 0) > (final.away_score ?? 0) ? final.home_player?.name : final.away_player?.name) ?? null;
}

export function newTournamentHref(previous: Pick<Tournament, 'id' | 'format'>, name: string) {
  const params = new URLSearchParams({ from: previous.id, format: previous.format });
  if (name) params.set('name', name);
  return `/tournaments/new?${params.toString()}`;
}
