// ============================================
// Database Types (matching Supabase schema)
// ============================================

export interface Tournament {
  id: string;
  name: string;
  format: 'league' | 'knockout' | 'cup';
  pin: string;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
}

export interface RegisteredPlayer {
  id: string;
  name: string;
  base_team: string;
  created_at: string;
}

export interface Player {
  id: string;
  tournament_id: string;
  registered_player_id: string;
  name: string;
  team: string;
  seed: number | null;
  created_at: string;
  // Joined
  registered_player?: RegisteredPlayer;
}

export interface MatchStats {
  home_xg?: number;
  away_xg?: number;
  home_possession?: number;
  away_possession?: number;
  home_tackles?: number;
  away_tackles?: number;
  home_interceptions?: number;
  away_interceptions?: number;
  home_rating?: number;
  away_rating?: number;
  motm_player_id?: string;
  motm_rating?: number;
}

export interface Match {
  id: string;
  tournament_id: string;
  home_player_id: string | null;
  away_player_id: string | null;
  home_score: number | null;
  away_score: number | null;
  round_number: number;
  match_number: number;
  stage: string | null;
  is_played: boolean;
  is_bye: boolean;
  stats: MatchStats;
  match_order: number | null;
  played_at: string | null;
  created_at: string;
  // Joined fields
  home_player?: Player;
  away_player?: Player;
  goals?: Goal[];
  tournament?: { id: string; name: string };
}

export interface Goal {
  id: string;
  match_id: string;
  player_id: string;
  minute: number | null;
  created_at: string;
  // Joined
  player?: Player;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number | null;
}

// ============================================
// Computed Types (application layer)
// ============================================

export interface StandingRow {
  player_id: string;
  player_name: string;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface CareerStats {
  registered_player_id: string;
  player_name: string;
  base_team: string;
  total_matches: number;
  wins: number;
  draws: number;
  losses: number;
  total_goals: number;
  total_conceded: number;
  clean_sheets: number;
  avg_xg: number;
  avg_rating: number;
  avg_possession: number;
  motm_awards: number;
  win_rate: number;
  goals_per_match: number;
}

export interface H2HData {
  player1: RegisteredPlayer;
  player2: RegisteredPlayer;
  total_encounters: number;
  player1_wins: number;
  player2_wins: number;
  draws: number;
  player1_goals: number;
  player2_goals: number;
  matches: Match[];
  player1_career: CareerStats;
  player2_career: CareerStats;
}

export interface PlayerStatsResponse {
  stats: CareerStats;
  matches: Match[];
  playerIds: string[];
}

export interface BracketSlot {
  match_number: number;
  home_player_id: string | null;
  away_player_id: string | null;
  round_number: number;
  stage: string;
  is_bye: boolean;
  next_match_number: number | null;
}

export interface ScheduledMatch {
  home_player_id: string;
  away_player_id: string | null;
  round_number: number;
  is_bye: boolean;
  match_number: number;
  stage: string | null;
}
