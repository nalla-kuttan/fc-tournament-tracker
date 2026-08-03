import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api-guards';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('music_track')
      .select('*')
      .order('title');

    if (error) throw error;

    return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return handleApiError(error, 'Load music');
  }
}
