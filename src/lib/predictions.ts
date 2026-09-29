import { buildCompetitiveRatingTimeline, type CompetitivePlayerInstance } from './competitive-ratings';
import { predictResult } from './match-odds';
import { chronological, isDecided } from './player-results';
import type { Match, RegisteredPlayer } from './types';

export type ResultPick = 'home' | 'draw' | 'away';

export interface Prediction {
  match_id: string;
  predictor_id: string;
  pick: ResultPick;
}

export interface PunditRow {
  predictorId: string;
  name: string;
  picks: number;
  correct: number;
  // True for the ratings model, which "predicts" every match.
  model: boolean;
}

export const MODEL_PREDICTOR_ID = 'model';

export function outcomeOf(match: Pick<Match, 'home_score' | 'away_score'>): ResultPick {
  const home = match.home_score ?? 0;
  const away = match.away_score ?? 0;
  return home > away ? 'home' : home < away ? 'away' : 'draw';
}

// The model's pick for each match: the most likely result going in.
export function modelPicks(
  players: Pick<RegisteredPlayer, 'id' | 'name' | 'base_team'>[],
  instances: CompetitivePlayerInstance[],
  allMatches: Match[],
  matchIds: Set<string>
) {
  const timeline = buildCompetitiveRatingTimeline(players, instances, allMatches, { scope: 'all-time' });
  const picks = new Map<string, ResultPick>();
  let draws = 0;
  let seen = 0;
  for (const match of allMatches.filter(isDecided).sort(chronological)) {
    const before = timeline.get(match.id);
    if (before && matchIds.has(match.id)) {
      const odds = predictResult(before.homeRating, before.awayRating, (draws + 1) / (seen + 10));
      picks.set(match.id, (['home', 'draw', 'away'] as const).reduce((best, key) => (odds[key] > odds[best] ? key : best), 'home' as ResultPick));
    }
    seen++;
    if (match.home_score === match.away_score) draws++;
  }
  return picks;
}

// Predictors ranked by correct picks on played matches. The model is scored
// on the same matches people predicted, so the comparison is fair.
export function buildPunditTable(
  predictions: Prediction[],
  matches: Match[],
  names: Map<string, string>,
  model: Map<string, ResultPick>
): PunditRow[] {
  const played = new Map(matches.filter(isDecided).map((match) => [match.id, match]));
  const rows = new Map<string, PunditRow>();
  const predictedMatches = new Set<string>();
  for (const prediction of predictions) {
    const match = played.get(prediction.match_id);
    if (!match) continue;
    predictedMatches.add(match.id);
    const row = rows.get(prediction.predictor_id) ?? { predictorId: prediction.predictor_id, name: names.get(prediction.predictor_id) ?? 'Unknown', picks: 0, correct: 0, model: false };
    row.picks++;
    if (prediction.pick === outcomeOf(match)) row.correct++;
    rows.set(prediction.predictor_id, row);
  }
  if (predictedMatches.size > 0) {
    const modelRow: PunditRow = { predictorId: MODEL_PREDICTOR_ID, name: 'The ratings model', picks: 0, correct: 0, model: true };
    for (const id of predictedMatches) {
      const pick = model.get(id);
      if (!pick) continue;
      modelRow.picks++;
      if (pick === outcomeOf(played.get(id)!)) modelRow.correct++;
    }
    rows.set(MODEL_PREDICTOR_ID, modelRow);
  }
  return [...rows.values()].sort((a, b) => b.correct - a.correct || a.picks - b.picks || Number(a.model) - Number(b.model) || a.name.localeCompare(b.name));
}
