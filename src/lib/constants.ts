export const TEAMS = [
  'Arsenal',
  'Aston Villa',
  'Barcelona',
  'Bayern Munich',
  'Borussia Dortmund',
  'Chelsea',
  'Inter Milan',
  'Juventus',
  'Liverpool',
  'Man City',
  'Man United',
  'AC Milan',
  'Newcastle',
  'Paris Saint-Germain',
  'Real Madrid',
  'Tottenham',
] as const;

export type TeamName = (typeof TEAMS)[number];

export const STAGE_LABELS: Record<string, string> = {
  R16: 'Round of 16',
  QF: 'Quarter-Finals',
  SF: 'Semi-Finals',
  F: 'Final',
};

export const TOURNAMENT_FORMATS = [
  { value: 'league', label: 'League', description: 'Round-robin format where every player plays each other' },
  { value: 'knockout', label: 'Knockout', description: 'Single-elimination bracket tournament' },
  { value: 'cup', label: 'Cup', description: 'Group stage followed by knockout rounds' },
] as const;

export const TOURNAMENT_STATUSES = {
  draft: { label: 'Draft', color: '#a1a1aa' },
  active: { label: 'Active', color: '#00d4ff' },
  completed: { label: 'Completed', color: '#22c55e' },
} as const;

export const FORM_COLORS = {
  W: '#22c55e',
  D: '#a1a1aa',
  L: '#ef4444',
} as const;
