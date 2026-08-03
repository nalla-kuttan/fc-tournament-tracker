import { NextResponse } from 'next/server';
import { generateAiText } from '@/lib/ai';
import { getMatchReportFacts } from '@/lib/ai-data';
import { handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { aiMatchSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'ai:match-report', 4, 5 * 60);
    if (limited) return limited;
    const { matchId } = await readJsonBody(request, aiMatchSchema);
    const facts = await getMatchReportFacts(matchId);
    const report = await generateAiText(
      'Write one bold newspaper-style headline followed by a two or three sentence match report based only on the recorded score, goals, and statistics.',
      facts
    );
    return NextResponse.json({ report });
  } catch (error) {
    return handleApiError(error, 'Generate match report');
  }
}
