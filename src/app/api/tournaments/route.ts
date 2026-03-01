import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { hashPin } from '@/lib/auth';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('tournament')
    .select('id, name, format, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const { name, format, pin, playerSelections } = await request.json();

    if (!name || !format || !pin) {
      return NextResponse.json({ error: 'Name, format, and pin are required' }, { status: 400 });
    }

    if (!['league', 'knockout', 'cup'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const hashedPin = await hashPin(pin);
    const supabase = createAdminClient();

    // Create tournament
    const { data: tournament, error: tError } = await supabase
      .from('tournament')
      .insert({ name, format, pin: hashedPin })
      .select()
      .single();

    if (tError) {
      return NextResponse.json({ error: tError.message }, { status: 500 });
    }

    // Add players if provided
    // playerSelections: [{registered_player_id, name, team}]
    if (playerSelections && playerSelections.length > 0) {
      const playerRows = playerSelections.map((ps: { registered_player_id: string; name: string; team: string }, idx: number) => ({
        tournament_id: tournament.id,
        registered_player_id: ps.registered_player_id,
        name: ps.name,
        team: ps.team,
        seed: idx + 1,
      }));

      const { error: pError } = await supabase.from('player').insert(playerRows);

      if (pError) {
        return NextResponse.json({ error: pError.message }, { status: 500 });
      }
    }

    return NextResponse.json(tournament, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
