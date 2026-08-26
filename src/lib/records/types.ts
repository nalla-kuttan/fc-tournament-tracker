import type { Match, MatchStats, Player, RegisteredPlayer, Tournament } from '@/lib/types';

export interface RecordsScope {
  scope: 'season' | 'all-time';
  seasonId?: string | null;
}

export interface RecordEntry {
  playerId: string;
  playerName: string;
  value: number;
  detail: string;
  sampleSize: number;
}

export interface PlayerMatchRow {
  match: Match;
  registeredPlayerId: string;
  playerName: string;
  baseTeam: string;
  instanceId: string;
  opponentRegisteredPlayerId: string;
  opponentName: string;
  selectedTeam: string;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
  side: 'home' | 'away';
  stats: MatchStats;
}

export interface RecordContext {
  scope: RecordsScope;
  registeredPlayers: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[];
  playerInstances: Pick<Player, 'id' | 'registered_player_id' | 'team' | 'tournament_id'>[];
  tournaments: Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'season_id'>[];
  matches: Match[];
  rows: PlayerMatchRow[];
  rowsByPlayer: Map<string, PlayerMatchRow[]>;
  tournamentById: Map<string, Pick<Tournament, 'id' | 'name' | 'format' | 'status' | 'season_id'>>;
}

export interface RunsRecords {
  longestUnbeaten: RecordEntry[];
  longestScoring: RecordEntry[];
  longestMotm: RecordEntry[];
  bounceBack: RecordEntry[];
  dominanceRate: RecordEntry[];
  threePlusGoals: RecordEntry[];
  fourPlusGoals: RecordEntry[];
  bestMatchOutput: RecordEntry[];
}

export interface CampaignRecord extends RecordEntry {
  tournamentId: string;
  tournamentName: string;
  wins: number;
  draws: number;
  losses: number;
}

export interface CampaignRecords {
  perfectCampaigns: CampaignRecord[];
  unbeatenCampaigns: CampaignRecord[];
  bestGoalDifference: CampaignRecord[];
  largestTitleMargins: CampaignRecord[];
}

export interface PerformanceRecords {
  finishingEfficiency: RecordEntry[];
  xgOverperformance: RecordEntry[];
  defensiveXgOverperformance: RecordEntry[];
  counterpunchWinRate: RecordEntry[];
  motmRate: RecordEntry[];
  defensiveWorkRate: RecordEntry[];
  ratingConsistency: RecordEntry[];
  expectedPointsSurplus: RecordEntry[];
  pressurePerformance: RecordEntry[];
}

export interface RivalryRecord extends RecordEntry {
  opponentId: string;
  opponentName: string;
  meetings: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface RivalryRecords {
  mostPlayed: RivalryRecord[];
  dominance: RivalryRecord[];
  reversals: RivalryRecord[];
  nemesisIndex: RivalryRecord[];
  closest: RivalryRecord[];
}

export interface TeamRecord extends RecordEntry {
  team: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
}

export interface TeamRecords {
  clubSpecialists: TeamRecord[];
  bestCombinations: TeamRecord[];
  versatileWinners: RecordEntry[];
}
