import { ApiError } from '@/lib/api-error';

interface AiGenerationResponse {
  text?: string;
  candidates?: Array<{ finishReason?: string }>;
}

export function extractCompleteAiText(response: AiGenerationResponse) {
  if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
    throw new ApiError(
      'The AI response was cut off. Please try again.',
      502,
      'AI_TRUNCATED_RESPONSE'
    );
  }

  const text = response.text?.trim();
  if (!text) {
    throw new ApiError('The AI provider returned an empty response.', 502, 'AI_EMPTY_RESPONSE');
  }
  return text;
}
