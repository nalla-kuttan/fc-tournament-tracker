import type { CampaignRecord, CampaignRecords, RecordContext } from './types';

interface CampaignAggregate {
  tournamentId: string;
  tournamentName: string;
  playerId: string;
  playerName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

function rank(rows: CampaignRecord[]) {
  return rows
    .sort((a, b) => b.value - a.value || b.sampleSize - a.sampleSize || a.playerName.localeCompare(b.playerName))
    .slice(0, 10);
}

function toRecord(row: CampaignAggregate, value: number, detail: string): CampaignRecord {
  return {
    playerId: row.playerId,
    playerName: row.playerName,
    value,
    detail,
    sampleSize: row.matches,
    tournamentId: row.tournamentId,
    tournamentName: row.tournamentName,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
  };
}

export function calculateCampaignRecords(context: RecordContext): CampaignRecords {
  const aggregates = new Map<string, CampaignAggregate>();
  for (const row of context.rows) {
    const tournament = context.tournamentById.get(row.match.tournament_id);
    if (!tournament || tournament.status !== 'completed') continue;
    const key = `${tournament.id}:${row.registeredPlayerId}`;
    const current = aggregates.get(key) ?? {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      playerId: row.registeredPlayerId,
      playerName: row.playerName,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    };
    current.matches++;
    current.goalsFor += row.goalsFor;
    current.goalsAgainst += row.goalsAgainst;
    if (row.result === 'W') {
      current.wins++;
      current.points += 3;
    } else if (row.result === 'D') {
      current.draws++;
      current.points += 1;
    } else {
      current.losses++;
    }
    aggregates.set(key, current);
  }

  const qualified = [...aggregates.values()].filter((row) => row.matches >= 3);
  const recordDetail = (row: CampaignAggregate) => `${row.tournamentName} · ${row.wins}-${row.draws}-${row.losses}`;
  const perfectCampaigns = rank(qualified
    .filter((row) => row.wins === row.matches)
    .map((row) => toRecord(row, row.matches, recordDetail(row))));
  const unbeatenCampaigns = rank(qualified
    .filter((row) => row.losses === 0)
    .map((row) => toRecord(row, row.matches, recordDetail(row))));
  const bestGoalDifference = rank(qualified.map((row) => toRecord(
    row,
    row.goalsFor - row.goalsAgainst,
    `${recordDetail(row)} · ${row.goalsFor}-${row.goalsAgainst}`
  )));

  const largestTitleMargins: CampaignRecord[] = [];
  for (const tournament of context.tournaments.filter((row) => row.status === 'completed' && row.format === 'league')) {
    const table = qualified
      .filter((row) => row.tournamentId === tournament.id)
      .sort((a, b) => b.points - a.points
        || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
        || b.goalsFor - a.goalsFor);
    if (table.length < 2) continue;
    const champion = table[0];
    largestTitleMargins.push(toRecord(
      champion,
      champion.points - table[1].points,
      `${tournament.name} · ${champion.points} points`
    ));
  }

  return {
    perfectCampaigns,
    unbeatenCampaigns,
    bestGoalDifference,
    largestTitleMargins: rank(largestTitleMargins),
  };
}
