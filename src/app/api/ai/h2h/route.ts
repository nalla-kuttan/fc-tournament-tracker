import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getErrorMessage, rateLimit, readJsonBody } from '@/lib/api-guards';
import type { H2HData, RegisteredPlayer } from '@/lib/types';

type H2HRequest = {
    player1?: RegisteredPlayer;
    player2?: RegisteredPlayer;
    h2hData?: H2HData;
};

export async function POST(request: Request) {
    try {
        const limited = rateLimit(request, 'ai:h2h', 8);
        if (limited) return limited;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured' },
                { status: 500 }
            );
        }

        const { player1, player2, h2hData } = await readJsonBody<H2HRequest>(request);

        if (!player1 || !player2 || !h2hData) {
            return NextResponse.json(
                { error: 'Players and H2H data are required' },
                { status: 400 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
      You are an expert football analyst discussing a rivalry on the "FC Tournament Tracker" app.
      
      Player 1: ${player1.name} (Team: ${player1.base_team})
      Player 2: ${player2.name} (Team: ${player2.base_team})
      
      Here is the head-to-head match history and aggregated stats between them:
      ${JSON.stringify(h2hData, null, 2)}
      
      Write a colorful and engaging analysis of this rivalry. 
      Identify who has the upper hand, summarize typical goal margins or play styles that might lead to these results, 
      and give a bold prediction for their next matchup.
      Format your response using Markdown (make use of bolding, italics, and lists where appropriate).
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return NextResponse.json({ analysis: response.text });
    } catch (error: unknown) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: getErrorMessage(error, 'Failed to generate H2H analysis') },
            { status: 500 }
        );
    }
}
