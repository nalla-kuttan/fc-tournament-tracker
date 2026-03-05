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

        const { query, careerStats } = await request.json();

        if (!query || !careerStats) {
            return NextResponse.json(
                { error: 'Query and career stats are required' },
                { status: 400 }
            );
        }

        const prompt = `
      You are the "AI Oracle" for the FC Tournament Tracker app.
      A user has asked you a natural language question about the global career stats.

      User Question: "${query}"

      Here is the raw global career stats data:
      ${JSON.stringify(careerStats, null, 2)}

      Answer the user's question directly, accurately, and with a touch of sports-broadcaster flair.
      If the data does not contain the answer, politely say so.
      Format your response using Markdown (make use of bolding, italics, and lists where appropriate).
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return NextResponse.json({ answer: response.text });
    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to answer query' },
            { status: 500 }
        );
    }
}
