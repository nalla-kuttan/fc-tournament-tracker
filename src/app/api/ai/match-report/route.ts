import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured' },
                { status: 500 }
            );
        }

        const { match, stats } = await request.json();

        if (!match) {
            return NextResponse.json(
                { error: 'Match data is required' },
                { status: 400 }
            );
        }

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
      ${JSON.stringify(match.goals // ensure only basic info is passed if available
            ? match.goals.map((g: any) => `${g.player?.name} at ${g.minute}'`)
            : [], null, 2)}

      First, write a **Bold Headline**.
      Then, write a dynamic summary of how the match unfolded considering the score and stats (e.g. if xG was high but score was low, mention the lack of finishing. Or if possession was heavily skewed).
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return NextResponse.json({ report: response.text });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate match report' },
            { status: 500 }
        );
    }
}
