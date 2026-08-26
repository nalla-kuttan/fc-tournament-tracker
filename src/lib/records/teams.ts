import type { RecordContext, RecordEntry, TeamRecord, TeamRecords } from './types';

type TeamAggregate = {
  playerId: string;
  playerName: string;
  team: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
};

export function calculateTeamRecords(context: RecordContext): TeamRecords {
  const combinations = new Map<string, TeamAggregate>();
  const winningTeamsByPlayer = new Map<string, Set<string>>();
  for (const row of context.rows) {
    const key = `${row.registeredPlayerId}:${row.selectedTeam}`;
    const aggregate = combinations.get(key) ?? { playerId: row.registeredPlayerId, playerName: row.playerName, team: row.selectedTeam, matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    aggregate.matches++;
    aggregate.goalsFor += row.goalsFor;
    aggregate.goalsAgainst += row.goalsAgainst;
    if (row.result === 'W') {
      aggregate.wins++;
      const teams = winningTeamsByPlayer.get(row.registeredPlayerId) ?? new Set<string>();
      teams.add(row.selectedTeam);
      winningTeamsByPlayer.set(row.registeredPlayerId, teams);
    } else if (row.result === 'D') aggregate.draws++;
    else aggregate.losses++;
    combinations.set(key, aggregate);
  }

  const qualified = [...combinations.values()].filter((row) => row.matches >= 8).map(toRecord).sort(rankTeams);
  const specialistByPlayer = new Map<string, TeamRecord>();
  for (const row of qualified) {
    if (!specialistByPlayer.has(row.playerId)) specialistByPlayer.set(row.playerId, row);
  }
  const clubSpecialists = [...specialistByPlayer.values()].sort(rankTeams);
  const nameById = new Map(context.registeredPlayers.map((player) => [player.id, player.name]));
  const versatileWinners: RecordEntry[] = [...winningTeamsByPlayer.entries()]
    .map(([playerId, teams]) => ({ playerId, playerName: nameById.get(playerId) ?? playerId, value: teams.size, detail: `${teams.size} teams with a win`, sampleSize: teams.size }))
    .sort((a, b) => b.value - a.value || a.playerName.localeCompare(b.playerName));

  return { clubSpecialists: clubSpecialists.slice(0, 10), bestCombinations: qualified.slice(0, 10), versatileWinners: versatileWinners.slice(0, 10) };
}

function toRecord(row: TeamAggregate): TeamRecord {
  const goalDifference = row.goalsFor - row.goalsAgainst;
  return { playerId: row.playerId, playerName: row.playerName, team: row.team, value: round((row.wins / row.matches) * 100, 1), detail: `${row.wins}-${row.draws}-${row.losses} · ${goalDifference >= 0 ? '+' : ''}${goalDifference} GD`, sampleSize: row.matches, matches: row.matches, wins: row.wins, draws: row.draws, losses: row.losses, goalDifference };
}

function rankTeams(a: TeamRecord, b: TeamRecord) {
  return b.value - a.value || b.matches - a.matches || (b.goalDifference / b.matches) - (a.goalDifference / a.matches) || a.playerName.localeCompare(b.playerName) || a.team.localeCompare(b.team);
}

function round(value: number, places: number) {
  const factor = Math.pow(10, places);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
