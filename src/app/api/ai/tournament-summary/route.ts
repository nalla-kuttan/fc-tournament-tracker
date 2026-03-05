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

        const { tournament, standings, matches } = await request.json();

        if (!tournament || !standings) {
            return NextResponse.json(
                { error: 'Tournament data and standings are required' },
                { status: 400 }
            );
        }

        const prompt = `
      You are an energetic, slightly cheeky football pundit analyzing a tournament on the "FC Tournament Tracker" app.
      
      Here is the data for the tournament "${tournament.name}" (${tournament.format}):
      Status: ${tournament.status}
      
      Standings:
      ${JSON.stringify(standings, null, 2)}
      
      Matches (if any):
      ${JSON.stringify(matches?.slice(0, 5) || [], null, 2)}
      
      Write a colorful, engaging summary of how the tournament is going (or how it ended, if completed).
      Call out the best players, anyone who is underperforming, and note any interesting goal differences or win rates.
      Format your response using Markdown (make use of bolding, italics, and lists where appropriate).
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return NextResponse.json({ summary: response.text });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate AI summary' },
            { status: 500 }
        );
    }
}
