import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AdvancedHighlights from '../AdvancedHighlights';
import type { PerformanceRecords } from '@/lib/records/types';

const empty = { finishingEfficiency: [], xgOverperformance: [], defensiveXgOverperformance: [], counterpunchWinRate: [], motmRate: [], defensiveWorkRate: [], ratingConsistency: [], expectedPointsSurplus: [], pressurePerformance: [] } satisfies PerformanceRecords;

describe('AdvancedHighlights', () => {
  it('renders compact filtered leaders and a route to the complete record book', () => {
    const records: PerformanceRecords = {
      ...empty,
      finishingEfficiency: [{ playerId: 'rp-a', playerName: 'Alex', value: 125, detail: '25 goals from 20 xG', sampleSize: 10 }],
      pressurePerformance: [{ playerId: 'rp-b', playerName: 'Ruban', value: 60, detail: '9 points', sampleSize: 5 }],
    };
    const html = renderToStaticMarkup(<AdvancedHighlights records={records} />);
    expect(html).toContain('Advanced Highlights');
    expect(html).toContain('Alex');
    expect(html).toContain('125%');
    expect(html).toContain('/competitive');
  });

  it('stays hidden when no player qualifies in the current lens', () => {
    expect(renderToStaticMarkup(<AdvancedHighlights records={empty} />)).toBe('');
  });
});
