import { NextResponse } from 'next/server';
import { generateAiText } from '@/lib/ai';
import { getPlayerScoutFacts } from '@/lib/ai-data';
import { handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { aiPlayerSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'ai:player-scout', 4, 5 * 60);
    if (limited) return limited;
    const { playerId } = await readJsonBody(request, aiPlayerSchema);
    const facts = await getPlayerScoutFacts(playerId);
    const report = await generateAiText(
      'Write a concise scouting report grounded in the career statistics. Cover strengths, an evidence-based improvement area, and a short play-style summary.',
      facts
    );
    return NextResponse.json({ report });
  } catch (error) {
    return handleApiError(error, 'Generate player scouting report');
  }
}
