import { describe, expect, it } from 'vitest';
import { userFacingError } from '../user-error';

describe('user-facing errors', () => {
  it('explains a network failure instead of showing "Failed to fetch"', () => {
    expect(userFacingError(new TypeError('Failed to fetch'), 'The player', 'saved'))
      .toBe('The player could not be saved. Check your connection and try again.');
  });

  it('keeps a specific message from the server', () => {
    expect(userFacingError(new Error('Invalid PIN'), 'The schedule', 'generated')).toBe('Invalid PIN');
  });

  it('names the action when nothing more specific is known', () => {
    expect(userFacingError('boom', 'The tournament', 'created')).toBe('The tournament could not be created. Try again.');
    expect(userFacingError(new Error('  '), 'The tournament', 'created')).toBe('The tournament could not be created. Try again.');
  });
});
