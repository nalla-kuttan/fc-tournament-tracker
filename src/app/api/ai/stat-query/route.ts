import { NextResponse } from 'next/server';
import { generateAiText } from '@/lib/ai';
import { getGlobalStatFacts } from '@/lib/ai-data';
import { handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { aiStatQuerySchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'ai:stat-query', 4, 5 * 60);
    if (limited) return limited;
    const { query } = await readJsonBody(request, aiStatQuerySchema);
    const careerStats = await getGlobalStatFacts();
    const answer = await generateAiText(
      `Answer this user question directly from the supplied career statistics: ${JSON.stringify(query)}`,
      { careerStats }
    );
    return NextResponse.json({ answer });
  } catch (error) {
    return handleApiError(error, 'Answer AI statistics question');
  }
}
