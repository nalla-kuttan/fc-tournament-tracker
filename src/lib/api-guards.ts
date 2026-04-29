import { NextResponse } from 'next/server';
import { verifyPin } from '@/lib/auth';

const DEFAULT_JSON_LIMIT_BYTES = 64 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getErrorMessage(error: unknown, fallback = 'Server error') {
  return error instanceof Error ? error.message : fallback;
}

export async function readJsonBody<T>(
  request: Request,
  limitBytes = DEFAULT_JSON_LIMIT_BYTES
): Promise<T> {
  const raw = await request.text();
  if (raw.length > limitBytes) {
    throw new Error('Request body is too large');
  }
  return JSON.parse(raw) as T;
}

export function rateLimit(request: Request, bucket: string, maxRequests: number) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || request.headers.get('x-real-ip') || 'local';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (current.count >= maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  current.count++;
  return null;
}

export async function verifyTournamentPin(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createServerClient>,
  tournamentId: string,
  pin: string
) {
  const { data: tournament, error } = await supabase
    .from('tournament')
    .select('pin')
    .eq('id', tournamentId)
    .single();

  if (error || !tournament) {
    return { ok: false as const, response: NextResponse.json({ error: 'Tournament not found' }, { status: 404 }) };
  }

  const isValid = await verifyPin(pin, tournament.pin);
  if (!isValid) {
    return { ok: false as const, response: NextResponse.json({ error: 'Invalid PIN' }, { status: 403 }) };
  }

  return { ok: true as const };
}
