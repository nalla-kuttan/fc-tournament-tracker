import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { hashPin } from '@/lib/auth';
import { rateLimit, readJsonBody } from '@/lib/api-guards';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('tournament')
    .select('id, name, format, status, season_id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    const fallback = await supabase
      .from('tournament')
      .select('id, name, format, status, created_at')
      .order('created_at', { ascending: false });

    if (!fallback.error) {
      return NextResponse.json(fallback.data);
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, 'tournaments:create', 8);
    if (limited) return limited;

    const { name, format, pin, playerSelections, season_id } = await readJsonBody<{
      name?: string;
      format?: string;
      pin?: string;
      season_id?: string | null;
      playerSelections?: Array<{ registered_player_id: string; name: string; team: string }>;
    }>(request);

    if (!name || !format || !pin) {
      return NextResponse.json({ error: 'Name, format, and pin are required' }, { status: 400 });
    }

    if (!['league', 'knockout', 'cup'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const hashedPin = await hashPin(pin);
    const supabase = createAdminClient();
    const seasonId = season_id ?? await getDefaultSeasonId(supabase);

    // Create tournament
    let insertResult = await supabase
      .from('tournament')
      .insert({ name: name.trim(), format, pin: hashedPin, season_id: seasonId })
      .select()
      .single();

    if (insertResult.error && String(insertResult.error.message).includes('season_id')) {
      insertResult = await supabase
        .from('tournament')
        .insert({ name: name.trim(), format, pin: hashedPin })
        .select()
        .single();
    }

    const { data: tournament, error: tError } = insertResult;

    if (tError) {
      return NextResponse.json({ error: tError.message }, { status: 500 });
    }

    // Add players if provided
    // playerSelections: [{registered_player_id, name, team}]
    if (playerSelections && playerSelections.length > 0) {
      const playerRows = playerSelections.map((ps, idx: number) => ({
        tournament_id: tournament.id,
        registered_player_id: ps.registered_player_id,
        name: ps.name.trim(),
        team: ps.team.trim(),
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

async function getDefaultSeasonId(supabase: ReturnType<typeof createAdminClient>) {
  const { data: activeSeason } = await supabase
    .from('season')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeSeason?.id) return activeSeason.id;

  const { data: createdSeason, error } = await supabase
    .from('season')
    .insert({ name: 'Active Season', status: 'active', starts_at: new Date().toISOString() })
    .select('id')
    .single();

  if (error) throw error;
  return createdSeason.id;
}
