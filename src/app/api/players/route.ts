import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { handleApiError, rateLimit, readJsonBody } from '@/lib/api-guards';
import { playerMutationSchema } from '@/lib/validation';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('registered_player')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load players');
  }
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'players:create', 10);
    if (limited) return limited;

    const { name: trimmedName, base_team: trimmedTeam } = await readJsonBody(request, playerMutationSchema);

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
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Create player');
  }
}
