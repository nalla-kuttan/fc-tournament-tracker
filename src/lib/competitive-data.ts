import { createServerClient } from '@/lib/supabase/server';
import { buildTournamentDerivedSeasons, getDerivedSeasonId } from '@/lib/competitive';
import type { Match, Player, RegisteredPlayer, Season, Tournament } from '@/lib/types';

export interface CompetitiveData {
  seasons: Season[];
  tournaments: Tournament[];
  registeredPlayers: RegisteredPlayer[];
  playerInstances: Pick<Player, 'id' | 'registered_player_id' | 'name' | 'team' | 'tournament_id'>[];
  matches: Match[];
}

export async function getCompetitiveData(): Promise<CompetitiveData> {
  const supabase = createServerClient();

  const [{ data: registeredPlayers }, { data: playerInstances }] = await Promise.all([
    supabase.from('registered_player').select('*').order('name'),
    supabase.from('player').select('id, registered_player_id, name, team, tournament_id'),
  ]);

  const seasons = await fetchSeasons(supabase);
  const tournaments = await fetchTournaments(supabase);
  const rawMatches = await fetchPlayedMatches(supabase);
  const derived = buildTournamentDerivedSeasons(tournaments);
  const seasonMap = new Map<string, Season>();
  for (const season of derived.seasons) seasonMap.set(season.id, season);
  for (const season of seasons) seasonMap.set(season.id, season);

  const matches = ((rawMatches ?? []) as Array<Match & { tournament?: Tournament }>).map((match) => ({
    ...match,
    season_id: match.tournament?.season_id ?? getDerivedSeasonId(match.tournament_id),
  }));

  return {
    seasons: [...seasonMap.values()].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    tournaments: (tournaments ?? []) as Tournament[],
    registeredPlayers: (registeredPlayers ?? []) as RegisteredPlayer[],
    playerInstances: (playerInstances ?? []) as CompetitiveData['playerInstances'],
    matches,
  };
}

async function fetchSeasons(supabase: ReturnType<typeof createServerClient>) {
  const { data, error } = await supabase
    .from('season')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [] as Season[];
  return (data ?? []) as Season[];
}

async function fetchTournaments(supabase: ReturnType<typeof createServerClient>) {
  const withSeason = await supabase
    .from('tournament')
    .select('id, name, format, status, season_id, created_at')
    .order('created_at', { ascending: false });

  if (!withSeason.error) return (withSeason.data ?? []) as Tournament[];

  const fallback = await supabase
    .from('tournament')
    .select('id, name, format, status, created_at')
    .order('created_at', { ascending: false });

  return (fallback.data ?? []) as Tournament[];
}

async function fetchPlayedMatches(supabase: ReturnType<typeof createServerClient>) {
  const withSeason = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team, registered_player_id, tournament_id, seed, created_at), away_player:away_player_id(id, name, team, registered_player_id, tournament_id, seed, created_at), tournament:tournament_id(id, name, format, status, season_id, created_at)')
    .eq('is_played', true)
    .eq('is_bye', false)
    .order('played_at', { ascending: true });

  if (!withSeason.error) return withSeason.data ?? [];

  const fallback = await supabase
    .from('match')
    .select('*, home_player:home_player_id(id, name, team, registered_player_id, tournament_id, seed, created_at), away_player:away_player_id(id, name, team, registered_player_id, tournament_id, seed, created_at), tournament:tournament_id(id, name, format, status, created_at)')
    .eq('is_played', true)
    .eq('is_bye', false)
    .order('played_at', { ascending: true });

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
