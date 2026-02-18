// ─── Core Data Model ──────────────────────────────────

export interface Player {
  id: string;
  name: string;
  team: string;
}

export interface GoalEntry {
  playerId: string;
  minute?: number; // optional match minute (1-90+)
}

export interface Goal {
  id: string;
  matchId: string;
  playerId: string;
  minute?: number;
}

export interface MatchStats {
  xg: number;
  possession: number;
  tackles: number;
  interceptions: number;
  motmPlayerId: string | null;
  rating: number; // 0.0 – 10.0
}

export interface Match {
  id: string;
  tournamentId: string;
  roundNumber: number;
  stage?: string; // "Round of 16", "Quarter-final", "Semi-final", "Final"
  homePlayerId: string | null; // "BYE" for bye rounds, null if not yet determined
  awayPlayerId: string | null; // "BYE" for bye rounds, null if not yet determined
  homeScore: number | null;
  awayScore: number | null;
  isPlayed: boolean;
  nextMatchId?: string;
  isHomeInNextMatch?: boolean;
  homeStats: MatchStats | null;
  awayStats: MatchStats | null;
  homeGoalscorers: GoalEntry[];
  awayGoalscorers: GoalEntry[];
}

export type TournamentFormat = "single" | "double" | "knockout";
export type TournamentStatus = "active" | "completed";

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  players: Player[];
  matches: Match[];
  createdAt: string; // ISO date
  adminPin: string;
}

// ─── Derived / Computed ──────────────────────────────

export type FormResult = "W" | "D" | "L";

export interface StandingsRow {
  playerId: string;
  playerName: string;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: FormResult[]; // last 5, most recent first
}

// ─── Player Registry (Legacy / Career Data) ──────────

export interface CareerStats {
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalGoals: number;
  totalConceded: number;
  totalCleanSheets: number;
  totalXg: number;
  totalRatingSum: number;
  totalRatedMatches: number;
  totalPossessionSum: number;
  totalPossessionMatches: number;
  totalMotm: number;
  tournamentsPlayed: string[]; // tournament IDs
}

export interface RegisteredPlayer {
  id: string;
  name: string;
  team: string; // most recent team
  createdAt: string;
  career: CareerStats;
}

export interface HallOfFameEntry {
  id: string;
  tournamentName: string;
  winnerName: string;
  winnerTeam: string;
  date: string;
}
