import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ExpandedRecords from '../ExpandedRecords';
import type { ExpandedRecords as ExpandedRecordsData } from '@/lib/records/types';

const records: ExpandedRecordsData = {
  runs: { longestUnbeaten: [], longestScoring: [], longestMotm: [], bounceBack: [], dominanceRate: [], threePlusGoals: [], fourPlusGoals: [], bestMatchOutput: [] },
  campaigns: { perfectCampaigns: [], unbeatenCampaigns: [], bestGoalDifference: [], largestTitleMargins: [] },
  performance: { finishingEfficiency: [{ playerId: 'rp-a', playerName: 'Alex', value: 125, detail: '25 goals from 20 xG', sampleSize: 10 }], xgOverperformance: [], defensiveXgOverperformance: [], counterpunchWinRate: [], motmRate: [], defensiveWorkRate: [], ratingConsistency: [], expectedPointsSurplus: [], pressurePerformance: [] },
  rivalries: { mostPlayed: [], dominance: [], reversals: [], nemesisIndex: [], closest: [] },
  teams: { clubSpecialists: [], bestCombinations: [], versatileWinners: [] },
};

describe('ExpandedRecords', () => {
  it('renders every record category with accessible section and board headings', () => {
    const html = renderToStaticMarkup(<ExpandedRecords records={records} />);
    expect(html).toContain('Runs &amp; Resilience');
    expect(html).toContain('Campaign Dominance');
    expect(html).toContain('Advanced Performance');
    expect(html).toContain('Rivalries');
    expect(html).toContain('Teams');
    expect(html).toContain('aria-label="Finishing Efficiency leaderboard"');
    expect(html).toContain('125%');
    expect(html).toContain('No qualified records yet');
  });
});
