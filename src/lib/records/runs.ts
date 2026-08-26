import type { PlayerMatchRow, RecordContext, RecordEntry, RunsRecords } from './types';

function roundOne(value: number) { return Math.round(value * 10) / 10; }

function rank(rows: RecordEntry[], direction: 'high' | 'low' = 'high') {
  return rows.sort((a, b) => {
    const primary = direction === 'high' ? b.value - a.value : a.value - b.value;
    return primary || b.sampleSize - a.sampleSize || a.playerName.localeCompare(b.playerName);
  }).slice(0, 10);
}

function longestStreak(rows: PlayerMatchRow[], hit: (row: PlayerMatchRow) => boolean) {
  let current = 0;
  let best = 0;
  for (const row of rows) {
    current = hit(row) ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

export function calculateRunRecords(context: RecordContext): RunsRecords {
  const longestUnbeaten: RecordEntry[] = [];
  const longestScoring: RecordEntry[] = [];
  const longestMotm: RecordEntry[] = [];
  const bounceBack: RecordEntry[] = [];
  const dominanceRate: RecordEntry[] = [];
  const threePlusGoals: RecordEntry[] = [];
  const fourPlusGoals: RecordEntry[] = [];
  const bestMatchOutput: RecordEntry[] = [];

  for (const [playerId, rows] of context.rowsByPlayer) {
    const playerName = rows[0]?.playerName ?? 'Unknown';
    const base = { playerId, playerName, sampleSize: rows.length };
    const unbeaten = longestStreak(rows, (row) => row.result !== 'L');
    const scoring = longestStreak(rows, (row) => row.goalsFor > 0);
    const motm = longestStreak(rows, (row) => row.stats.motm_player_id === row.instanceId);
    if (unbeaten > 0) longestUnbeaten.push({ ...base, value: unbeaten, detail: 'matches without defeat' });
    if (scoring > 0) longestScoring.push({ ...base, value: scoring, detail: 'consecutive scoring matches' });
    if (motm > 0) longestMotm.push({ ...base, value: motm, detail: 'consecutive MOTM awards' });

    let postLossOpportunities = 0;
    let winsAfterLoss = 0;
    for (let index = 1; index < rows.length; index++) {
      if (rows[index - 1].result !== 'L') continue;
      postLossOpportunities++;
      if (rows[index].result === 'W') winsAfterLoss++;
    }
    if (postLossOpportunities >= 3) bounceBack.push({ ...base, sampleSize: postLossOpportunities, value: roundOne((winsAfterLoss / postLossOpportunities) * 100), detail: `${winsAfterLoss}/${postLossOpportunities} wins after a loss` });

    const wins = rows.filter((row) => row.result === 'W');
    const dominantWins = wins.filter((row) => row.goalsFor - row.goalsAgainst >= 3).length;
    if (rows.length >= 10 && wins.length >= 5) dominanceRate.push({ ...base, sampleSize: wins.length, value: roundOne((dominantWins / wins.length) * 100), detail: `${dominantWins}/${wins.length} wins by 3+ goals` });

    const threePlus = rows.filter((row) => row.goalsFor >= 3).length;
    const fourPlus = rows.filter((row) => row.goalsFor >= 4).length;
    const bestOutput = Math.max(0, ...rows.map((row) => row.goalsFor));
    if (threePlus > 0) threePlusGoals.push({ ...base, value: threePlus, detail: `${rows.length} matches` });
    if (fourPlus > 0) fourPlusGoals.push({ ...base, value: fourPlus, detail: `${rows.length} matches` });
    if (bestOutput > 0) bestMatchOutput.push({ ...base, value: bestOutput, detail: 'goals in one match' });
  }

  return { longestUnbeaten: rank(longestUnbeaten), longestScoring: rank(longestScoring), longestMotm: rank(longestMotm), bounceBack: rank(bounceBack), dominanceRate: rank(dominanceRate), threePlusGoals: rank(threePlusGoals), fourPlusGoals: rank(fourPlusGoals), bestMatchOutput: rank(bestMatchOutput) };
}
