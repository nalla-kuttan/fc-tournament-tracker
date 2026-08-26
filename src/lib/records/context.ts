import type { Match, Player, RegisteredPlayer, Tournament } from '@/lib/types';
import type { PlayerMatchRow, RecordContext, RecordsScope } from './types';

type RegisteredInput = Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>;
type InstanceInput = Pick<Player, 'id' | 'registered_player_id' | 'team' | 'tournament_id'>;
type TournamentInput = Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'season_id'>;

function compareMatches(a: Match, b: Match) {
  return (a.played_at ?? '').localeCompare(b.played_at ?? '')
    || a.match_number - b.match_number
    || a.id.localeCompare(b.id);
}

function matchesScope(match: Match, tournament: TournamentInput | undefined, scope: RecordsScope) {
  if (scope.scope === 'all-time') return true;
  const seasonId = match.season_id ?? tournament?.season_id ?? `season-${match.tournament_id}`;
  return seasonId === scope.seasonId;
}

export function buildRecordContext(
  registeredPlayers: RegisteredInput[],
  playerInstances: InstanceInput[],
  tournaments: TournamentInput[],
  matches: Match[],
  scope: RecordsScope
): RecordContext {
  const registeredById = new Map(registeredPlayers.map((player) => [player.id, player]));
  const instanceById = new Map(playerInstances.map((player) => [player.id, player]));
  const tournamentById = new Map(tournaments.map((tournament) => [tournament.id, tournament]));
  const eligibleMatches = matches
    .filter((match) => match.is_played && !match.is_bye && match.home_player_id && match.away_player_id)
    .filter((match) => matchesScope(match, tournamentById.get(match.tournament_id), scope))
    .sort(compareMatches);

  const rows: PlayerMatchRow[] = [];
  for (const match of eligibleMatches) {
    const homeInstance = instanceById.get(match.home_player_id ?? '');
    const awayInstance = instanceById.get(match.away_player_id ?? '');
    const homeRegistered = homeInstance ? registeredById.get(homeInstance.registered_player_id) : null;
    const awayRegistered = awayInstance ? registeredById.get(awayInstance.registered_player_id) : null;
    if (!homeInstance || !awayInstance || !homeRegistered || !awayRegistered) continue;
    const homeScore = match.home_score ?? 0;
    const awayScore = match.away_score ?? 0;
    const stats = match.stats ?? {};
    rows.push({ match, registeredPlayerId: homeRegistered.id, playerName: homeRegistered.name, baseTeam: homeRegistered.base_team, instanceId: homeInstance.id, opponentRegisteredPlayerId: awayRegistered.id, opponentName: awayRegistered.name, selectedTeam: homeInstance.team, goalsFor: homeScore, goalsAgainst: awayScore, result: homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'D', side: 'home', stats });
    rows.push({ match, registeredPlayerId: awayRegistered.id, playerName: awayRegistered.name, baseTeam: awayRegistered.base_team, instanceId: awayInstance.id, opponentRegisteredPlayerId: homeRegistered.id, opponentName: homeRegistered.name, selectedTeam: awayInstance.team, goalsFor: awayScore, goalsAgainst: homeScore, result: awayScore > homeScore ? 'W' : awayScore < homeScore ? 'L' : 'D', side: 'away', stats });
  }

  const rowsByPlayer = new Map<string, PlayerMatchRow[]>();
  for (const row of rows) {
    const group = rowsByPlayer.get(row.registeredPlayerId) ?? [];
    group.push(row);
    rowsByPlayer.set(row.registeredPlayerId, group);
  }
  return { scope, registeredPlayers, playerInstances, tournaments, matches: eligibleMatches, rows, rowsByPlayer, tournamentById };
}
