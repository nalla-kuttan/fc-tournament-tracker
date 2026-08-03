import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { hashPin } from '@/lib/auth';
import { handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { tournamentCreateSchema } from '@/lib/validation';

export async function GET() {
  try {
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
      if (fallback.error) throw fallback.error;
      return NextResponse.json(fallback.data, { headers: { 'Cache-Control': 'private, no-store' } });
    }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load tournaments');
  }
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'tournaments:create', 8);
    if (limited) return limited;

    const { name, format, pin, playerSelections, season_id } = await readJsonBody(request, tournamentCreateSchema);

    const hashedPin = await hashPin(pin);
    const supabase = createAdminClient();
    const { data: tournament, error } = await supabase.rpc('create_tournament_atomic', {
      p_name: name,
      p_format: format,
      p_pin_hash: hashedPin,
      p_season_id: season_id ?? null,
      p_player_selections: playerSelections.map(({ registered_player_id, team }) => ({ registered_player_id, team })),
    });

    if (error) throw error;

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Create tournament');
  }
}
