import { z } from 'zod';

export const gameTypeSchema = z.enum(['2d', '3d']);
export type GameType = z.infer<typeof gameTypeSchema>;

// A guess number is exactly 2 digits for 2d, 3 digits for 3d.
export function isValidGuessNumber(gameType: GameType, value: string): boolean {
  return gameType === '2d' ? /^[0-9]{2}$/.test(value) : /^[0-9]{3}$/.test(value);
}

const positiveIntPoints = z
  .number({ invalid_type_error: 'points_used must be a number' })
  .int('points_used must be a whole number')
  .positive('points_used must be greater than zero');

// Form-level schema: validates the number against its game type. Used by the
// Guess UI and unit tests.
export const guessSchema = z
  .object({
    game_type: gameTypeSchema,
    guess_number: z.string(),
    points_used: positiveIntPoints,
  })
  .superRefine((val, ctx) => {
    if (!isValidGuessNumber(val.game_type, val.guess_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['guess_number'],
        message: `guess_number must be ${val.game_type === '2d' ? 2 : 3} digits`,
      });
    }
  });

// API body for POST /api/v1/guesses. The game type is derived server-side from
// the round, so the number is only loosely checked here (1-3 digits) and
// fully validated inside place_guess().
export const placeGuessBodySchema = z.object({
  round_id: z.string().uuid(),
  guess_number: z.string().regex(/^[0-9]{2,3}$/, 'guess_number must be 2 or 3 digits'),
  points_used: positiveIntPoints,
});

export type PlaceGuessBody = z.infer<typeof placeGuessBodySchema>;

// API body for POST /api/v1/guesses/batch — several numbers placed in one
// request. Each item is placed by its own place_guess call server-side.
export const batchGuessBodySchema = z.object({
  round_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        number: z.string().regex(/^[0-9]{2,3}$/, 'number must be 2 or 3 digits'),
        points: positiveIntPoints,
      }),
    )
    .min(1, 'at least one number is required')
    .max(50, 'at most 50 numbers per request'),
});

export type BatchGuessBody = z.infer<typeof batchGuessBodySchema>;
