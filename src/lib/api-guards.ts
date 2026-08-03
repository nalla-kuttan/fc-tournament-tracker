import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import { verifyPin } from '@/lib/auth';
import { ConfigurationError } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/server';

const DEFAULT_JSON_LIMIT_BYTES = 64 * 1024;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;

type RateLimitEntry = { count: number; resetAt: number };
const fallbackRateLimitStore = new Map<string, RateLimitEntry>();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = 'BAD_REQUEST'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getErrorMessage(error: unknown, fallback = 'Server error') {
  return error instanceof Error ? error.message : fallback;
}

export function handleApiError(error: unknown, context: string) {
  const requestId = randomUUID();

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code, requestId },
      { status: error.status }
    );
  }

  if (error instanceof ConfigurationError) {
    console.error(`[${requestId}] ${context}: ${error.message}`);
    return NextResponse.json(
      {
        error: 'This deployment is missing required configuration. Contact the app administrator.',
        code: error.code,
        requestId,
      },
      { status: 503 }
    );
  }

  console.error(`[${requestId}] ${context}:`, error);
  return NextResponse.json(
    { error: 'The request could not be completed.', code: 'INTERNAL_ERROR', requestId },
    { status: 500 }
  );
}

export async function readJsonBody<T>(
  request: Request,
  schema?: ZodType<T>,
  limitBytes = DEFAULT_JSON_LIMIT_BYTES
): Promise<T> {
  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim();
  if (contentType && contentType !== 'application/json') {
    throw new ApiError('Content-Type must be application/json', 415, 'UNSUPPORTED_MEDIA_TYPE');
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > limitBytes) {
    throw new ApiError('Request body is too large', 413, 'PAYLOAD_TOO_LARGE');
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > limitBytes) {
    throw new ApiError('Request body is too large', 413, 'PAYLOAD_TOO_LARGE');
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError('Request body must contain valid JSON', 400, 'INVALID_JSON');
  }

  if (!schema) return value as T;

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new ApiError(firstIssue?.message ?? 'Invalid request body', 400, 'INVALID_REQUEST');
  }
  return parsed.data;
}

function getClientAddress(request: Request) {
  if (process.env.VERCEL) {
    return (
      request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'
    );
  }
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'local'
  );
}

function fallbackRateLimit(key: string, maxRequests: number, windowSeconds: number) {
  const now = Date.now();
  if (fallbackRateLimitStore.size > 2_000) {
    for (const [entryKey, entry] of fallbackRateLimitStore) {
      if (entry.resetAt <= now) fallbackRateLimitStore.delete(entryKey);
    }
  }

  const current = fallbackRateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    fallbackRateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1_000 });
    return { allowed: true, retryAfter: windowSeconds };
  }
  if (current.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
}

export async function rateLimit(
  request: Request,
  bucket: string,
  maxRequests: number,
  windowSeconds = DEFAULT_RATE_LIMIT_WINDOW_SECONDS
) {
  const identity = createHash('sha256')
    .update(`${bucket}:${getClientAddress(request)}`)
    .digest('hex');

  let result: { allowed: boolean; retryAfter: number };
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc('consume_rate_limit', {
      p_key: identity,
      p_limit: maxRequests,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    result = {
      allowed: Boolean(row?.allowed),
      retryAfter: Math.max(1, Number(row?.retry_after_seconds ?? windowSeconds)),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Distributed rate limiter unavailable; using local fallback.', getErrorMessage(error));
    }
    result = fallbackRateLimit(identity, maxRequests, windowSeconds);
  }

  if (result.allowed) return null;
  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.', code: 'RATE_LIMITED' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
  );
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
