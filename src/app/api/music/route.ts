import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    const musicDir = path.join(process.cwd(), "public", "music");

    try {
        if (!fs.existsSync(musicDir)) {
            return NextResponse.json({ files: [] });
        }

        const files = fs.readdirSync(musicDir)
            .filter((f) => /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(f))
            .sort();

        return NextResponse.json({ files });
    } catch {
        return NextResponse.json({ files: [] });
    }
}
