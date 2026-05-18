import { z } from 'zod';

export * from './guess';

const positiveAmount = z
  .number()
  .int('amount must be a whole number')
  .positive('amount must be greater than zero');

// Officer / admin point movements --------------------------------------------
export const givePointsBodySchema = z.object({
  player_id: z.string().uuid(),
  amount: positiveAmount,
  note: z.string().max(280).optional(),
});

export const grantPointsBodySchema = z.object({
  officer_id: z.string().uuid(),
  amount: positiveAmount,
  note: z.string().max(280).optional(),
});

export const createPlayerBodySchema = z.object({
  welcome_bonus: z.boolean().optional(),
});

export const createOfficerBodySchema = z.object({
  username: z.string().min(3).max(40),
  password: z.string().min(8).max(72),
});

// Rounds ----------------------------------------------------------------------
export const createRoundBodySchema = z.object({
  game_type: z.enum(['2d', '3d']),
  round_name: z.string().min(1).max(40).default('all'),
  round_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  open_time: z.string().datetime().nullable().optional(),
  close_time: z.string().datetime(),
  market: z.string().min(1).max(40).default('thai_myanmar'),
});

export const manualResultBodySchema = z.object({
  round_id: z.string().uuid(),
  result_number: z.string().regex(/^[0-9]{2,3}$/),
  note: z.string().max(280).optional(),
});

export const cancelRoundBodySchema = z.object({
  round_id: z.string().uuid(),
  reason: z.string().min(1).max(280),
});

export const approveSettlementBodySchema = z.object({
  round_id: z.string().uuid(),
});

// Winning rates & number limits ----------------------------------------------
export const winningRateBodySchema = z.object({
  game_type: z.enum(['2d', '3d']),
  market: z.string().default('all'),
  round_name: z.string().default('all'),
  winning_rate: z.number().positive(),
  payout_mode: z.enum(['multiplier_only', 'multiplier_plus_stake']),
  apply_to: z.string().default('future_rounds'),
});

export const numberLimitBodySchema = z.object({
  game_type: z.enum(['2d', '3d']),
  market: z.string().default('all'),
  rule_type: z.enum(['exact', 'contains', 'first_digit', 'last_digit', 'range', 'list', 'all']),
  rule_value: z.record(z.any()).default({}),
  max_points: z.number().int().nonnegative(),
});

export const resetPasswordBodySchema = z.object({
  player_id: z.string().uuid(),
});

export const officerLimitsBodySchema = z.object({
  officer_id: z.string().uuid(),
  daily_give_limit: z.number().int().nonnegative().nullable().optional(),
  max_give_per_player: z.number().int().nonnegative().nullable().optional(),
  can_grant_welcome_bonus: z.boolean().optional(),
});

export const gameSettingsBodySchema = z
  .object({
    free_mode_enabled: z.boolean(),
    new_player_bonus_enabled: z.boolean(),
    new_player_bonus_amount: z.number().int().nonnegative(),
    daily_claim_enabled: z.boolean(),
    daily_claim_amount: z.number().int().nonnegative(),
    auto_settle_enabled: z.boolean(),
    admin_approval_required: z.boolean(),
    api_result_mode: z.enum(['api', 'manual']),
    default_close_before_minutes: z.number().int().nonnegative(),
    rapidapi_calendar_path: z.string(),
    rapidapi_calendar_fallback_path: z.string(),
    rapidapi_results_path: z.string(),
    brand_name: z.string().max(60),
    brand_logo_url: z.string().max(500),
    help_title: z.string().max(160),
    help_body: z.string().max(4000),
  })
  .partial();

// Pagination ------------------------------------------------------------------
export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
});
