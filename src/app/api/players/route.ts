import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit, readJsonBody } from '@/lib/api-guards';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('registered_player')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, 'players:create', 10);
    if (limited) return limited;

    const { name, base_team } = await readJsonBody<{ name?: string; base_team?: string }>(request);
    const trimmedName = name?.trim();
    const trimmedTeam = base_team?.trim();

    if (!trimmedName || !trimmedTeam) {
      return NextResponse.json({ error: 'Name and base_team are required' }, { status: 400 });
    }

    if (trimmedName.length > 80 || trimmedTeam.length > 80) {
      return NextResponse.json({ error: 'Name and base_team must be 80 characters or fewer' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('registered_player')
      .insert({ name: trimmedName, base_team: trimmedTeam })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Player name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
