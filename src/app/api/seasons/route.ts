import { NextResponse } from 'next/server';
import { handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { verifyPin } from '@/lib/auth';
import { buildTournamentDerivedSeasons } from '@/lib/competitive';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { seasonMutationSchema } from '@/lib/validation';

type SeasonMutation = {
  id?: string;
  name?: string;
  status?: 'active' | 'completed' | 'archived';
  starts_at?: string | null;
  ends_at?: string | null;
  pin?: string;
  tournamentId?: string;
};

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('season')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const fallback = await supabase
        .from('tournament')
        .select('id, name, format, status, created_at')
        .order('created_at', { ascending: false });
      if (fallback.error) throw fallback.error;
      return NextResponse.json(buildTournamentDerivedSeasons(fallback.data ?? []).seasons, {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load seasons');
  }
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'seasons:create', 6, 5 * 60);
    if (limited) return limited;
    const body = await readJsonBody(request, seasonMutationSchema);
    const adminCheck = await verifySeasonAdmin(body);
    if (!adminCheck.ok) return adminCheck.response;

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Season name is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('season')
      .insert({
        name,
        status: body.status ?? 'active',
        starts_at: body.starts_at ?? null,
        ends_at: body.ends_at ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Create season');
  }
}

export async function PATCH(request: Request) {
  try {
    const limited = await rateLimit(request, 'seasons:update', 12, 5 * 60);
    if (limited) return limited;
    const body = await readJsonBody(request, seasonMutationSchema);
    const adminCheck = await verifySeasonAdmin(body);
    if (!adminCheck.ok) return adminCheck.response;

    if (!body.id) {
      return NextResponse.json({ error: 'Season id is required' }, { status: 400 });
    }

    const updates: Record<string, string | null> = {};
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: 'Season name cannot be empty' }, { status: 400 });
      updates.name = name;
    }
    if (body.status !== undefined) updates.status = body.status;
    if (body.starts_at !== undefined) updates.starts_at = body.starts_at;
    if (body.ends_at !== undefined) updates.ends_at = body.ends_at;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('season')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'Update season');
  }
}

async function verifySeasonAdmin(body: SeasonMutation) {
  if (!body.pin) {
    return { ok: false as const, response: NextResponse.json({ error: 'PIN is required' }, { status: 400 }) };
  }

  if (process.env.SEASON_ADMIN_PIN && body.pin === process.env.SEASON_ADMIN_PIN) {
    return { ok: true as const };
  }

  if (!body.tournamentId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'tournamentId is required for season admin changes' }, { status: 400 }),
    };
  }

  const supabase = createServerClient();
  const { data: tournament, error } = await supabase
    .from('tournament')
    .select('pin')
    .eq('id', body.tournamentId)
    .single();

  if (error || !tournament) {
    return { ok: false as const, response: NextResponse.json({ error: 'Tournament not found' }, { status: 404 }) };
  }

  const valid = await verifyPin(body.pin, tournament.pin);
  if (!valid) {
    return { ok: false as const, response: NextResponse.json({ error: 'Invalid PIN' }, { status: 403 }) };
  }

  return { ok: true as const };
}
