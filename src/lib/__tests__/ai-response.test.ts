import { describe, expect, it } from 'vitest';
import { extractCompleteAiText } from '../ai-response';

describe('AI response handling', () => {
  it('rejects text cut off by the provider token limit', () => {
    expect(() => extractCompleteAiText({
      text: 'Alex leads in several key areas:\n*',
      candidates: [{ finishReason: 'MAX_TOKENS' }],
    })).toThrowError(expect.objectContaining({
      code: 'AI_TRUNCATED_RESPONSE',
      status: 502,
    }));
  });

  it('returns trimmed text when generation stops normally', () => {
    expect(extractCompleteAiText({
      text: '  Alex leads the rankings.  ',
      candidates: [{ finishReason: 'STOP' }],
    })).toBe('Alex leads the rankings.');
  });
});
