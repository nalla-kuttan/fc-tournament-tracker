import { NextResponse } from 'next/server';
import { generateAiText } from '@/lib/ai';
import { getH2HFacts } from '@/lib/ai-data';
import { handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { aiH2HSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'ai:h2h', 4, 5 * 60);
    if (limited) return limited;
    const { player1Id, player2Id } = await readJsonBody(request, aiH2HSchema);
    const facts = await getH2HFacts(player1Id, player2Id);
    const analysis = await generateAiText(
      'Analyze this rivalry using only the recorded encounters. State who has the edge, describe score patterns, and give a clearly labeled lighthearted prediction.',
      facts
    );
    return NextResponse.json({ analysis });
  } catch (error) {
    return handleApiError(error, 'Generate rivalry analysis');
  }
}
