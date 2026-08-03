import 'server-only';

import { z } from 'zod';

const supabaseReadSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing'),
});

const supabaseAdminSchema = supabaseReadSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY is missing'),
});

const geminiSchema = z.object({
  GEMINI_API_KEY: z.string().min(20, 'GEMINI_API_KEY is missing'),
  GEMINI_MODEL: z.string().trim().min(1).default('gemini-2.5-flash'),
});

export class ConfigurationError extends Error {
  readonly code = 'APP_NOT_CONFIGURED';

  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function parseEnvironment<T>(schema: z.ZodType<T>, values: unknown, area: string): T {
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.')).filter(Boolean).join(', ');
    throw new ConfigurationError(`${area} is not configured${missing ? `: ${missing}` : ''}`);
  }
  return parsed.data;
}

export function getSupabaseReadEnv() {
  return parseEnvironment(supabaseReadSchema, process.env, 'Supabase');
}

export function getSupabaseAdminEnv() {
  return parseEnvironment(supabaseAdminSchema, process.env, 'Supabase admin access');
}

export function getGeminiEnv() {
  return parseEnvironment(geminiSchema, process.env, 'AI features');
}
