import { buildCompetitiveRatingTimeline } from '@/lib/competitive-ratings';
import type { MatchStats } from '@/lib/types';
import type { PerformanceRecords, PlayerMatchRow, RecordContext, RecordEntry } from './types';

const RATE_MINIMUM = 10;

type Aggregate = {
  playerId: string;
  playerName: string;
  goals: number;
  ownXg: number;
  xgMatches: number;
  goalsConceded: number;
  opponentXg: number;
  defensiveXgMatches: number;
  counterpunchMatches: number;
  counterpunchWins: number;
  motmMatches: number;
  motmAwards: number;
  defensiveActions: number;
  defensiveActionMatches: number;
  ratings: number[];
  actualXgPoints: number;
  expectedXgPoints: number;
  expectedPointsMatches: number;
  pressurePoints: number;
  pressureMatches: number;
};

export function calculatePerformanceRecords(context: RecordContext): PerformanceRecords {
  const aggregates = new Map<string, Aggregate>();
  const ratingTimeline = buildCompetitiveRatingTimeline(
    context.registeredPlayers,
    context.playerInstances,
    context.matches,
    context.scope
  );

  for (const row of context.rows) {
    const aggregate = aggregates.get(row.registeredPlayerId) ?? createAggregate(row);
    const ownXg = sideValue(row, 'home_xg', 'away_xg');
    const opponentXg = sideValue(row, 'away_xg', 'home_xg');
    const possession = sideValue(row, 'home_possession', 'away_possession');
    const tackles = sideValue(row, 'home_tackles', 'away_tackles');
    const interceptions = sideValue(row, 'home_interceptions', 'away_interceptions');
    const rating = sideValue(row, 'home_rating', 'away_rating');

    if (ownXg != null) {
      aggregate.goals += row.goalsFor;
      aggregate.ownXg += ownXg;
      aggregate.xgMatches++;
    }
    if (opponentXg != null) {
      aggregate.goalsConceded += row.goalsAgainst;
      aggregate.opponentXg += opponentXg;
      aggregate.defensiveXgMatches++;
    }
    if (possession != null && possession < 50) {
      aggregate.counterpunchMatches++;
      if (row.result === 'W') aggregate.counterpunchWins++;
    }
    if (row.stats.motm_player_id != null) {
      aggregate.motmMatches++;
      if (row.stats.motm_player_id === row.instanceId) aggregate.motmAwards++;
    }
    if (tackles != null && interceptions != null) {
      aggregate.defensiveActions += tackles + interceptions;
      aggregate.defensiveActionMatches++;
    }
    if (rating != null) aggregate.ratings.push(rating);
    if (ownXg != null && opponentXg != null) {
      aggregate.actualXgPoints += pointsFor(row.result);
      aggregate.expectedXgPoints += calculateExpectedPoints(ownXg, opponentXg);
      aggregate.expectedPointsMatches++;
    }

    const snapshot = ratingTimeline.get(row.match.id);
    const ownPreMatchRating = row.side === 'home' ? snapshot?.homeRating : snapshot?.awayRating;
    const opponentPreMatchRating = row.side === 'home' ? snapshot?.awayRating : snapshot?.homeRating;
    if (ownPreMatchRating != null && opponentPreMatchRating != null && opponentPreMatchRating > ownPreMatchRating) {
      aggregate.pressureMatches++;
      aggregate.pressurePoints += pointsFor(row.result);
    }
    aggregates.set(row.registeredPlayerId, aggregate);
  }

  const values = [...aggregates.values()];
  return {
    finishingEfficiency: rankHigh(values
      .filter((row) => row.xgMatches >= RATE_MINIMUM && row.ownXg > 0)
      .map((row) => entry(row, round((row.goals / row.ownXg) * 100, 1), `${row.goals} goals from ${round(row.ownXg, 2)} xG`, row.xgMatches))),
    xgOverperformance: rankHigh(values
      .filter((row) => row.xgMatches >= RATE_MINIMUM)
      .map((row) => entry(row, round(row.goals - row.ownXg, 2), `${round((row.goals - row.ownXg) / row.xgMatches, 2)} per match`, row.xgMatches))),
    defensiveXgOverperformance: rankHigh(values
      .filter((row) => row.defensiveXgMatches >= RATE_MINIMUM)
      .map((row) => entry(row, round(row.opponentXg - row.goalsConceded, 2), `${round((row.opponentXg - row.goalsConceded) / row.defensiveXgMatches, 2)} per match`, row.defensiveXgMatches))),
    counterpunchWinRate: rankHigh(values
      .filter((row) => row.counterpunchMatches >= 5)
      .map((row) => entry(row, round((row.counterpunchWins / row.counterpunchMatches) * 100, 1), `${row.counterpunchWins} wins below 50% possession`, row.counterpunchMatches))),
    motmRate: rankHigh(values
      .filter((row) => row.motmMatches >= RATE_MINIMUM)
      .map((row) => entry(row, round((row.motmAwards / row.motmMatches) * 100, 1), `${row.motmAwards} awards`, row.motmMatches))),
    defensiveWorkRate: rankHigh(values
      .filter((row) => row.defensiveActionMatches >= RATE_MINIMUM)
      .map((row) => entry(row, round(row.defensiveActions / row.defensiveActionMatches, 2), 'tackles + interceptions per match', row.defensiveActionMatches))),
    ratingConsistency: rankLow(values
      .filter((row) => row.ratings.length >= RATE_MINIMUM && average(row.ratings) >= 7)
      .map((row) => entry(row, round(populationStandardDeviation(row.ratings), 2), `${round(average(row.ratings), 2)} average rating`, row.ratings.length))),
    expectedPointsSurplus: rankHigh(values
      .filter((row) => row.expectedPointsMatches >= RATE_MINIMUM)
      .map((row) => entry(row, round(row.actualXgPoints - row.expectedXgPoints, 2), `${round((row.actualXgPoints - row.expectedXgPoints) / row.expectedPointsMatches, 2)} per match`, row.expectedPointsMatches))),
    pressurePerformance: rankHigh(values
      .filter((row) => row.pressureMatches >= 5)
      .map((row) => entry(row, round((row.pressurePoints / (row.pressureMatches * 3)) * 100, 1), `${row.pressurePoints} points vs higher-rated opponents`, row.pressureMatches))),
  };
}

export function calculateExpectedPoints(ownXg: number, opponentXg: number) {
  let coveredMass = 0;
  let winMass = 0;
  let drawMass = 0;
  for (let ownGoals = 0; ownGoals <= 12; ownGoals++) {
    for (let opponentGoals = 0; opponentGoals <= 12; opponentGoals++) {
      const probability = poissonProbability(ownGoals, ownXg) * poissonProbability(opponentGoals, opponentXg);
      coveredMass += probability;
      if (ownGoals > opponentGoals) winMass += probability;
      if (ownGoals === opponentGoals) drawMass += probability;
    }
  }
  if (coveredMass === 0) return 0;
  return (3 * winMass + drawMass) / coveredMass;
}

function createAggregate(row: PlayerMatchRow): Aggregate {
  return { playerId: row.registeredPlayerId, playerName: row.playerName, goals: 0, ownXg: 0, xgMatches: 0, goalsConceded: 0, opponentXg: 0, defensiveXgMatches: 0, counterpunchMatches: 0, counterpunchWins: 0, motmMatches: 0, motmAwards: 0, defensiveActions: 0, defensiveActionMatches: 0, ratings: [], actualXgPoints: 0, expectedXgPoints: 0, expectedPointsMatches: 0, pressurePoints: 0, pressureMatches: 0 };
}

function sideValue(
  row: PlayerMatchRow,
  homeKey: keyof MatchStats,
  awayKey: keyof MatchStats
): number | undefined {
  const value = row.stats[row.side === 'home' ? homeKey : awayKey];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function entry(row: Aggregate, value: number, detail: string, sampleSize: number): RecordEntry {
  return { playerId: row.playerId, playerName: row.playerName, value, detail, sampleSize };
}

function rankHigh(rows: RecordEntry[]) {
  return rows.sort((a, b) => b.value - a.value || b.sampleSize - a.sampleSize || a.playerName.localeCompare(b.playerName)).slice(0, 10);
}

function rankLow(rows: RecordEntry[]) {
  return rows.sort((a, b) => a.value - b.value || b.sampleSize - a.sampleSize || a.playerName.localeCompare(b.playerName)).slice(0, 10);
}

function pointsFor(result: PlayerMatchRow['result']) {
  return result === 'W' ? 3 : result === 'D' ? 1 : 0;
}

function poissonProbability(goals: number, expectedGoals: number) {
  return (Math.exp(-expectedGoals) * Math.pow(expectedGoals, goals)) / factorial(goals);
}

function factorial(value: number) {
  let result = 1;
  for (let current = 2; current <= value; current++) result *= current;
  return result;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function populationStandardDeviation(values: number[]) {
  const mean = average(values);
  return Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length);
}

function round(value: number, places: number) {
  const factor = Math.pow(10, places);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
