import { createServerClient } from '@/lib/supabase/server';
import { fetchAllRows, type PageResult } from '@/lib/supabase/pagination';
import { buildTournamentDerivedSeasons, getDerivedSeasonId } from '@/lib/competitive';
import type { Match, Player, RegisteredPlayer, Season, Tournament } from '@/lib/types';

export interface CompetitiveData {
  seasons: Season[];
  tournaments: Tournament[];
  registeredPlayers: RegisteredPlayer[];
  playerInstances: Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>[];
  matches: Match[];
}

type ServerClient = ReturnType<typeof createServerClient>;
type QueryError = { code?: string; message?: string } | null;

// Postgres and PostgREST codes for a column or table that does not exist yet.
// Only these justify retrying against the pre-season schema; any other error
// (network, permissions, timeouts) must surface instead of producing empty data.
const MISSING_SCHEMA_CODES = new Set(['42703', '42P01', 'PGRST200', 'PGRST204', 'PGRST205']);

export function isMissingSchemaError(error: QueryError) {
  return Boolean(error?.code && MISSING_SCHEMA_CODES.has(error.code));
}

export async function getCompetitiveData(supabase: ServerClient = createServerClient()): Promise<CompetitiveData> {
  const [registeredResult, instancesResult, seasons, tournaments, rawMatches] = await Promise.all([
    supabase.from('registered_player').select('*').order('name'),
    fetchAllRows<CompetitiveData['playerInstances'][number]>((from, to) => (
      supabase
        .from('player')
        .select('id, registered_player_id, name, team, tournament_id')
        .order('id', { ascending: true })
        .range(from, to)
    )),
    fetchSeasons(supabase),
    fetchTournaments(supabase),
    fetchPlayedMatches(supabase),
  ]);
  if (registeredResult.error) throw registeredResult.error;
  if (instancesResult.error) throw instancesResult.error;

  const derived = buildTournamentDerivedSeasons(tournaments);
  const seasonMap = new Map<string, Season>();
  for (const season of derived.seasons) seasonMap.set(season.id, season);
  for (const season of seasons) seasonMap.set(season.id, season);

  const matches = rawMatches.map((match) => ({
    ...match,
    season_id: match.tournament?.season_id ?? getDerivedSeasonId(match.tournament_id),
  }));

  return {
    seasons: [...seasonMap.values()].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    tournaments,
    registeredPlayers: (registeredResult.data ?? []) as RegisteredPlayer[],
    playerInstances: instancesResult.data ?? [],
    matches,
  };
}

async function fetchSeasons(supabase: ServerClient) {
  const { data, error } = await supabase
    .from('season')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingSchemaError(error)) return [] as Season[];
    throw error;
  }
  return (data ?? []) as Season[];
}

async function fetchTournaments(supabase: ServerClient) {
  const withSeason = await supabase
    .from('tournament')
    .select('id, name, format, status, season_id, created_at')
    .order('created_at', { ascending: false });

  if (!withSeason.error) return (withSeason.data ?? []) as Tournament[];
  if (!isMissingSchemaError(withSeason.error)) throw withSeason.error;

  const fallback = await supabase
    .from('tournament')
    .select('id, name, format, status, created_at')
    .order('created_at', { ascending: false });
  if (fallback.error) throw fallback.error;

  return (fallback.data ?? []) as Tournament[];
}

const PLAYED_MATCH_COLUMNS = '*, home_player:home_player_id(id, name, team, registered_player_id, tournament_id, seed, created_at), away_player:away_player_id(id, name, team, registered_player_id, tournament_id, seed, created_at), tournament:tournament_id(id, name, format, status, season_id, created_at)';
const PLAYED_MATCH_COLUMNS_WITHOUT_SEASON = '*, home_player:home_player_id(id, name, team, registered_player_id, tournament_id, seed, created_at), away_player:away_player_id(id, name, team, registered_player_id, tournament_id, seed, created_at), tournament:tournament_id(id, name, format, status, created_at)';
type PlayedMatch = Match & { tournament?: Tournament };

function fetchPlayedMatchPages(supabase: ServerClient, columns: string) {
  return fetchAllRows<PlayedMatch>((from, to) => (
    supabase
      .from('match')
      .select(columns)
      .eq('is_played', true)
      .eq('is_bye', false)
      .order('played_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
  ) as unknown as PromiseLike<PageResult<PlayedMatch>>);
}

async function fetchPlayedMatches(supabase: ServerClient) {
  const withSeason = await fetchPlayedMatchPages(supabase, PLAYED_MATCH_COLUMNS);
  if (!withSeason.error) return withSeason.data ?? [];
  if (!isMissingSchemaError(withSeason.error as QueryError)) throw withSeason.error;

  const fallback = await fetchPlayedMatchPages(supabase, PLAYED_MATCH_COLUMNS_WITHOUT_SEASON);
  if (fallback.error) throw fallback.error;
  return fallback.data ?? [];
}

export function resolveCompetitiveScope(searchParams: URLSearchParams): {
  scope: 'season' | 'all-time';
  seasonId: string | null;
} {
  const requestedScope = searchParams.get('scope');
  return {
    scope: requestedScope === 'season' ? 'season' : 'all-time',
    seasonId: searchParams.get('seasonId'),
  };
}
