import type { RecordContext, RivalryRecord, RivalryRecords } from './types';

type PairAggregate = {
  firstId: string;
  firstName: string;
  secondId: string;
  secondName: string;
  meetings: number;
  draws: number;
  wins: Map<string, number>;
  goals: Map<string, number>;
  reversals: Map<string, number>;
  marginTotal: number;
  previousWinnerId: string | null;
};

export function calculateRivalryRecords(context: RecordContext): RivalryRecords {
  const pairs = new Map<string, PairAggregate>();
  const awayRowByMatch = new Map(context.rows.filter((row) => row.side === 'away').map((row) => [row.match.id, row]));

  for (const home of context.rows.filter((row) => row.side === 'home')) {
    const away = awayRowByMatch.get(home.match.id);
    if (!away) continue;
    const ordered = [home, away].sort((a, b) => a.registeredPlayerId.localeCompare(b.registeredPlayerId));
    const key = `${ordered[0].registeredPlayerId}:${ordered[1].registeredPlayerId}`;
    const pair = pairs.get(key) ?? {
      firstId: ordered[0].registeredPlayerId,
      firstName: ordered[0].playerName,
      secondId: ordered[1].registeredPlayerId,
      secondName: ordered[1].playerName,
      meetings: 0,
      draws: 0,
      wins: new Map<string, number>(),
      goals: new Map<string, number>(),
      reversals: new Map<string, number>(),
      marginTotal: 0,
      previousWinnerId: null,
    };

    pair.meetings++;
    pair.marginTotal += Math.abs(home.goalsFor - away.goalsFor);
    pair.goals.set(home.registeredPlayerId, (pair.goals.get(home.registeredPlayerId) ?? 0) + home.goalsFor);
    pair.goals.set(away.registeredPlayerId, (pair.goals.get(away.registeredPlayerId) ?? 0) + away.goalsFor);
    if (home.result === 'D') {
      pair.draws++;
      pair.previousWinnerId = null;
    } else {
      const winner = home.result === 'W' ? home : away;
      const loser = home.result === 'W' ? away : home;
      pair.wins.set(winner.registeredPlayerId, (pair.wins.get(winner.registeredPlayerId) ?? 0) + 1);
      if (pair.previousWinnerId === loser.registeredPlayerId) {
        pair.reversals.set(winner.registeredPlayerId, (pair.reversals.get(winner.registeredPlayerId) ?? 0) + 1);
      }
      pair.previousWinnerId = winner.registeredPlayerId;
    }
    pairs.set(key, pair);
  }

  const qualified = [...pairs.values()].filter((pair) => pair.meetings >= 5);
  const mostPlayed = qualified.map((pair) => pairEntry(pair, pair.firstId, pair.meetings, `${pair.meetings} meetings`));
  const dominance = qualified.map((pair) => {
    const leaderId = leadingPlayerId(pair, pair.wins);
    const leaderWins = pair.wins.get(leaderId) ?? 0;
    return pairEntry(pair, leaderId, round((leaderWins / pair.meetings) * 100, 1), rivalryDetail(pair, leaderId));
  });
  const reversals = qualified
    .map((pair) => {
      const leaderId = leadingPlayerId(pair, pair.reversals);
      return pairEntry(pair, leaderId, pair.reversals.get(leaderId) ?? 0, `${pair.reversals.get(leaderId) ?? 0} reversal wins`);
    })
    .filter((row) => row.value > 0);
  const closest = qualified.map((pair) => pairEntry(
    pair,
    pair.firstId,
    round(pair.marginTotal / pair.meetings, 2),
    `${round(pair.marginTotal / pair.meetings, 2)} average goal margin`
  ));

  const careerLosses = new Map<string, number>();
  for (const row of context.rows) {
    if (row.result === 'L') careerLosses.set(row.registeredPlayerId, (careerLosses.get(row.registeredPlayerId) ?? 0) + 1);
  }
  const nemesisCandidates: RivalryRecord[] = [];
  for (const pair of qualified) {
    for (const playerId of [pair.firstId, pair.secondId]) {
      const lossesToOpponent = pair.meetings - pair.draws - (pair.wins.get(playerId) ?? 0);
      const totalLosses = careerLosses.get(playerId) ?? 0;
      if (lossesToOpponent === 0 || totalLosses === 0) continue;
      nemesisCandidates.push(pairEntry(pair, playerId, round((lossesToOpponent / totalLosses) * 100, 1), `${lossesToOpponent} of ${totalLosses} career losses`));
    }
  }
  const nemesisIndex = [...new Map(
    nemesisCandidates
      .sort(rankHigh)
      .map((row) => [row.playerId, row])
  ).values()].sort(rankHigh);

  return {
    mostPlayed: mostPlayed.sort(rankHigh).slice(0, 10),
    dominance: dominance.sort(rankHigh).slice(0, 10),
    reversals: reversals.sort(rankHigh).slice(0, 10),
    nemesisIndex: nemesisIndex.slice(0, 10),
    closest: closest.sort((a, b) => a.value - b.value || b.meetings - a.meetings || a.playerName.localeCompare(b.playerName)).slice(0, 10),
  };
}

function pairEntry(pair: PairAggregate, playerId: string, value: number, detail: string): RivalryRecord {
  const playerIsFirst = playerId === pair.firstId;
  const wins = pair.wins.get(playerId) ?? 0;
  return {
    playerId,
    playerName: playerIsFirst ? pair.firstName : pair.secondName,
    opponentId: playerIsFirst ? pair.secondId : pair.firstId,
    opponentName: playerIsFirst ? pair.secondName : pair.firstName,
    value,
    detail,
    sampleSize: pair.meetings,
    meetings: pair.meetings,
    wins,
    draws: pair.draws,
    losses: pair.meetings - pair.draws - wins,
  };
}

function rivalryDetail(pair: PairAggregate, playerId: string) {
  const wins = pair.wins.get(playerId) ?? 0;
  const losses = pair.meetings - pair.draws - wins;
  const opponentId = playerId === pair.firstId ? pair.secondId : pair.firstId;
  const goalDifference = (pair.goals.get(playerId) ?? 0) - (pair.goals.get(opponentId) ?? 0);
  return `${wins}-${pair.draws}-${losses} · ${goalDifference >= 0 ? '+' : ''}${goalDifference} GD`;
}

function leadingPlayerId(pair: PairAggregate, values: Map<string, number>) {
  const firstValue = values.get(pair.firstId) ?? 0;
  const secondValue = values.get(pair.secondId) ?? 0;
  if (firstValue !== secondValue) return firstValue > secondValue ? pair.firstId : pair.secondId;
  return pair.firstName.localeCompare(pair.secondName) <= 0 ? pair.firstId : pair.secondId;
}

function rankHigh(a: RivalryRecord, b: RivalryRecord) {
  return b.value - a.value || b.sampleSize - a.sampleSize || a.playerName.localeCompare(b.playerName) || a.opponentName.localeCompare(b.opponentName);
}

function round(value: number, places: number) {
  const factor = Math.pow(10, places);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
