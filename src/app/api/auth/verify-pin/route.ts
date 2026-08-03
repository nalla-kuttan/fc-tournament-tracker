import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { handleApiError, rateLimit, readJsonBody, verifyTournamentPin } from '@/lib/api-guards';
import { verifyPinRequestSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'pin:verify', 6, 5 * 60);
    if (limited) return limited;
    const { tournamentId, pin } = await readJsonBody(request, verifyPinRequestSchema);

    const supabase = createServerClient();
    const pinCheck = await verifyTournamentPin(supabase, tournamentId, pin);
    if (!pinCheck.ok) return NextResponse.json({ success: false }, { status: pinCheck.response.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Verify tournament PIN');
  }
}
