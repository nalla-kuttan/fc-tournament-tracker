import { z } from 'zod';

export const uuidSchema = z.uuid('A valid identifier is required');
export const pinSchema = z.string().min(4, 'PIN must contain at least 4 characters').max(64, 'PIN is too long');
export const shortTextSchema = z.string().trim().min(1, 'This field is required').max(80, 'Use 80 characters or fewer');

export const playerMutationSchema = z.object({
  name: shortTextSchema,
  base_team: shortTextSchema,
});

export const tournamentCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tournament name is required').max(100),
  format: z.enum(['league', 'knockout', 'cup']),
  pin: pinSchema,
  season_id: uuidSchema.nullish(),
  // Start a new competitive season with this name instead of joining one.
  new_season_name: z.string().trim().min(1).max(100).optional(),
  playerSelections: z.array(z.object({
    registered_player_id: uuidSchema,
    name: shortTextSchema.optional(),
    team: shortTextSchema,
  })).max(64).default([]),
}).refine((value) => !(value.season_id && value.new_season_name), 'Choose an existing season or a new one, not both');

export const pinRequestSchema = z.object({ pin: pinSchema });

export const verifyPinRequestSchema = z.object({
  tournamentId: uuidSchema,
  pin: pinSchema,
});

export const goalInputSchema = z.object({
  player_id: uuidSchema,
  minute: z.number().int().min(1).max(130).nullable().optional(),
});

export const goalsMutationSchema = z.object({
  pin: pinSchema,
  goals: z.array(goalInputSchema).max(40).default([]),
});

export const matchResultSchema = z.object({
  home_score: z.number().int().min(0).max(99),
  away_score: z.number().int().min(0).max(99),
  stats: z.record(z.string(), z.unknown()).optional(),
  goals: z.array(goalInputSchema).max(40).default([]),
  advance_bracket: z.boolean().default(false),
  pin: pinSchema,
});

export const bracketAdvanceSchema = z.object({
  pin: pinSchema,
  matchId: uuidSchema,
});

export const tournamentUpdateSchema = z.object({
  pin: pinSchema,
  status: z.enum(['draft', 'active', 'completed']).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  format: z.enum(['league', 'knockout', 'cup']).optional(),
}).refine((value) => value.status !== undefined || value.name !== undefined || value.format !== undefined, {
  message: 'Provide at least one field to update',
});

export const seasonMutationSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(1).max(100).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  starts_at: z.string().max(40).nullable().optional(),
  ends_at: z.string().max(40).nullable().optional(),
  pin: pinSchema,
  tournamentId: uuidSchema.optional(),
});

export const aiPlayerSchema = z.object({ playerId: uuidSchema });
export const aiH2HSchema = z.object({ player1Id: uuidSchema, player2Id: uuidSchema }).refine(
  (value) => value.player1Id !== value.player2Id,
  'Choose two different players'
);
export const aiTournamentSchema = z.object({ tournamentId: uuidSchema });
export const aiMatchSchema = z.object({ matchId: uuidSchema });
// Base64 of an image the browser has already downscaled; ~3 MB of base64 is
// far more than a 1600px JPEG needs.
export const MAX_STATS_IMAGE_BASE64_LENGTH = 3_000_000;
export const aiReadMatchStatsSchema = z.object({
  matchId: uuidSchema,
  pin: pinSchema,
  image: z.object({
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'], 'Use a JPEG, PNG, or WebP photo'),
    data: z.string()
      .min(100, 'The photo is empty')
      .max(MAX_STATS_IMAGE_BASE64_LENGTH, 'The photo is too large')
      .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'The photo could not be read'),
  }),
});
export const aiStatQuerySchema = z.object({
  query: z.string().trim().min(3, 'Ask a more specific question').max(300, 'Question is too long'),
});
