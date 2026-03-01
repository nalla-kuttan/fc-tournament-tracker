import { NextResponse } from 'next/server';
import { verifyPin } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { tournamentId, pin } = await request.json();

    if (!tournamentId || !pin) {
      return NextResponse.json({ success: false, error: 'Missing tournamentId or pin' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: tournament, error } = await supabase
      .from('tournament')
      .select('pin')
      .eq('id', tournamentId)
      .single();

    if (error || !tournament) {
      return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 });
    }

    const isValid = await verifyPin(pin, tournament.pin);
    return NextResponse.json({ success: isValid });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
