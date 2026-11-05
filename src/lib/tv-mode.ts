import { calculateStandings } from './algorithms/standings';
import type { Match, StandingRow } from './types';

type TablePlayer = { id: string; name: string; team: string };
type LiveInput = { matchId: string; home: number; away: number };

export interface LiveTableRow extends StandingRow {
  // Places gained (positive) or lost if the live match ended now.
  live_move: number;
  playing: boolean;
}

// The table as it would stand if the match being scored ended now, with how
// far each player would move.
export function projectLiveTable(matches: Match[], players: TablePlayer[], live: LiveInput): LiveTableRow[] | null {
  const fixture = matches.find((match) => match.id === live.matchId);
  if (!fixture || fixture.is_played || fixture.is_bye || !fixture.home_player_id || !fixture.away_player_id) return null;
  const now = calculateStandings(matches, players);
  const position = new Map(now.map((row, index) => [row.player_id, index]));
  const projected = calculateStandings(
    matches.map((match) => (match.id === live.matchId
      ? { ...match, is_played: true, home_score: live.home, away_score: live.away, played_at: new Date(8.64e15).toISOString() }
      : match)),
    players
  );
  const playing = new Set([fixture.home_player_id, fixture.away_player_id]);
  return projected.map((row, index) => ({
    ...row,
    live_move: (position.get(row.player_id) ?? index) - index,
    playing: playing.has(row.player_id),
  }));
}

export interface TournamentLeader {
  label: string;
  name: string;
  value: string;
}

// Headline numbers for the tournament so far, for the TV between matches.
type NamedMatch = Omit<Match, 'home_player' | 'away_player'> & { home_player?: { name: string } | null; away_player?: { name: string } | null };

export function tournamentLeaders(standings: StandingRow[], matches: NamedMatch[]): TournamentLeader[] {
  const leaders: TournamentLeader[] = [];
  const active = standings.filter((row) => row.played > 0);
  if (active.length === 0) return leaders;
  const top = (score: (row: StandingRow) => number) => active.reduce((best, row) => (score(row) > score(best) ? row : best));

  const attack = top((row) => row.goals_for);
  leaders.push({ label: 'Most goals', name: attack.player_name, value: `${attack.goals_for} scored` });
  const defence = top((row) => -row.goals_against / row.played);
  leaders.push({ label: 'Tightest defence', name: defence.player_name, value: `${(defence.goals_against / defence.played).toFixed(1)} conceded a game` });

  const streak = (row: StandingRow) => {
    let run = 0;
    for (let i = row.form.length - 1; i >= 0 && row.form[i] === 'W'; i--) run++;
    return run;
  };
  const hot = top(streak);
  if (streak(hot) >= 2) leaders.push({ label: 'On fire', name: hot.player_name, value: `${streak(hot)} wins in a row` });

  const played = matches.filter((match) => match.is_played && !match.is_bye && match.home_score != null && match.away_score != null);
  if (played.length > 0) {
    const margin = (match: NamedMatch) => Math.abs(match.home_score! - match.away_score!);
    const biggest = played.reduce((best, match) => (margin(match) > margin(best) || (margin(match) === margin(best) && match.home_score! + match.away_score! > best.home_score! + best.away_score!) ? match : best));
    if (margin(biggest) >= 2) {
      const homeWon = biggest.home_score! > biggest.away_score!;
      const winner = homeWon ? biggest.home_player?.name : biggest.away_player?.name;
      const loser = homeWon ? biggest.away_player?.name : biggest.home_player?.name;
      const score = homeWon ? `${biggest.home_score}–${biggest.away_score}` : `${biggest.away_score}–${biggest.home_score}`;
      leaders.push({ label: 'Biggest win', name: winner ?? 'Unknown', value: `${score} v ${loser ?? 'Unknown'}` });
    }
  }
  return leaders;
}
