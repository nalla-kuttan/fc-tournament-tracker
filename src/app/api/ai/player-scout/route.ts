import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getErrorMessage, rateLimit, readJsonBody } from '@/lib/api-guards';
import type { CareerStats, RegisteredPlayer } from '@/lib/types';

type PlayerScoutRequest = {
    player?: RegisteredPlayer;
    stats?: CareerStats;
};

export async function POST(request: Request) {
    try {
        const limited = rateLimit(request, 'ai:player-scout', 8);
        if (limited) return limited;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured' },
                { status: 500 }
            );
        }

        const { player, stats } = await readJsonBody<PlayerScoutRequest>(request);

        if (!player || !stats) {
            return NextResponse.json(
                { error: 'Player data and stats are required' },
                { status: 400 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
      You are an expert football scout evaluating a player on the "FC Tournament Tracker" app.
      
      Player Name: ${player.name}
      Favorite Team: ${player.base_team}
      
      All-Time Career Stats:
      ${JSON.stringify(stats, null, 2)}
      
      Write a concise, colorful scouting report based on these stats.
      Identify their core strengths (e.g., strong win rate, high goal difference, many clean sheets),
      weaknesses or areas to improve (e.g., poor possession, low xG), and summarize their current play style.
      Format your response using Markdown (make use of bolding, italics, and lists where appropriate).
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return NextResponse.json({ report: response.text });
    } catch (error: unknown) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: getErrorMessage(error, 'Failed to generate scouting report') },
            { status: 500 }
        );
    }
}
