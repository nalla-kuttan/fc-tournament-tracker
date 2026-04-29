import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getErrorMessage, rateLimit, readJsonBody } from '@/lib/api-guards';
import type { MatchStats } from '@/lib/types';

type MatchReportRequest = {
    match?: {
        home_player?: { name?: string; team?: string } | null;
        away_player?: { name?: string; team?: string } | null;
        home_score: number | null;
        away_score: number | null;
        round_number: number;
        goals?: { player?: { name?: string } | null; minute: number | null }[];
    };
    stats?: MatchStats;
};

export async function POST(request: Request) {
    try {
        const limited = rateLimit(request, 'ai:match-report', 8);
        if (limited) return limited;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured' },
                { status: 500 }
            );
        }

        const { match, stats } = await readJsonBody<MatchReportRequest>(request);

        if (!match) {
            return NextResponse.json(
                { error: 'Match data is required' },
                { status: 400 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const goalDescriptions = match.goals
            ? match.goals.map((goal) => `${goal.player?.name ?? 'Unknown'} at ${goal.minute ?? 'unknown minute'}'`)
            : [];

        const prompt = `
      You are a sports journalist for the "FC Tournament Tracker" app.
      A match has just been played. Your job is to generate a catchy short Newspaper-style headline and a 2-3 sentence match report.

      Match Detail:
      ${match.home_player?.name || 'Home'} ${match.home_score} - ${match.away_score} ${match.away_player?.name || 'Away'}
      Round: ${match.round_number}
      Teams: ${match.home_player?.team} vs ${match.away_player?.team}

      Match Stats:
      ${JSON.stringify(stats, null, 2)}
      
      Goals Info (if any):
      ${JSON.stringify(goalDescriptions, null, 2)}

      First, write a **Bold Headline**.
      Then, write a dynamic summary of how the match unfolded considering the score and stats (e.g. if xG was high but score was low, mention the lack of finishing. Or if possession was heavily skewed).
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return NextResponse.json({ report: response.text });
    } catch (error: unknown) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: getErrorMessage(error, 'Failed to generate match report') },
            { status: 500 }
        );
    }
}
