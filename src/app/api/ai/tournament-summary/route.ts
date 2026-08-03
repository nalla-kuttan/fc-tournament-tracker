import { NextResponse } from 'next/server';
import { generateAiText } from '@/lib/ai';
import { getTournamentSummaryFacts } from '@/lib/ai-data';
import { handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { aiTournamentSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'ai:tournament-summary', 4, 5 * 60);
    if (limited) return limited;
    const { tournamentId } = await readJsonBody(request, aiTournamentSchema);
    const facts = await getTournamentSummaryFacts(tournamentId);
    const summary = await generateAiText(
      'Summarize the tournament state. Call out leaders and notable recorded results without speculating about real-world ability.',
      facts
    );
    return NextResponse.json({ summary });
  } catch (error) {
    return handleApiError(error, 'Generate tournament summary');
  }
}
