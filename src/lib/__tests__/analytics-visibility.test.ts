import { describe, expect, it } from 'vitest';
import { hasTimedGoals } from '../analytics-visibility';

describe('analytics visibility', () => {
  it('shows time-based analysis only when at least one goal has a recorded minute', () => {
    expect(hasTimedGoals([])).toBe(false);
    expect(hasTimedGoals([{ minute: null }, { minute: null }])).toBe(false);
    expect(hasTimedGoals([{ minute: null }, { minute: 0 }])).toBe(true);
    expect(hasTimedGoals([{ minute: 90 }])).toBe(true);
  });
});
