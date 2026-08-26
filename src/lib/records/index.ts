import type { Match, Player, RegisteredPlayer, Tournament } from '@/lib/types';
import { calculateCampaignRecords } from './campaigns';
import { buildRecordContext } from './context';
import { calculatePerformanceRecords as calculatePerformanceRecordsFromContext } from './performance';
import { calculateRivalryRecords } from './rivalries';
import { calculateRunRecords } from './runs';
import { calculateTeamRecords } from './teams';
import type { ExpandedRecords, PerformanceRecords, RecordsScope } from './types';

type RegisteredInput = Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>;
type InstanceInput = Pick<Player, 'id' | 'registered_player_id' | 'team' | 'tournament_id'>;
type TournamentInput = Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'season_id'>;

export function calculateExpandedRecords(
  registeredPlayers: RegisteredInput[],
  playerInstances: InstanceInput[],
  tournaments: TournamentInput[],
  matches: Match[],
  scope: RecordsScope
): ExpandedRecords {
  const context = buildRecordContext(registeredPlayers, playerInstances, tournaments, matches, scope);
  return {
    runs: calculateRunRecords(context),
    campaigns: calculateCampaignRecords(context),
    performance: calculatePerformanceRecordsFromContext(context),
    rivalries: calculateRivalryRecords(context),
    teams: calculateTeamRecords(context),
  };
}

export function calculatePerformanceRecords(
  registeredPlayers: RegisteredInput[],
  playerInstances: InstanceInput[],
  matches: Match[]
): PerformanceRecords {
  const context = buildRecordContext(registeredPlayers, playerInstances, [], matches, { scope: 'all-time' });
  return calculatePerformanceRecordsFromContext(context);
}

export type {
  CampaignRecord,
  CampaignRecords,
  ExpandedRecords,
  PerformanceRecords,
  RecordEntry,
  RecordsScope,
  RivalryRecord,
  RivalryRecords,
  RunsRecords,
  TeamRecord,
  TeamRecords,
} from './types';
