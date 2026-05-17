import { describe, it, expect } from 'vitest';
import { guessSchema, placeGuessBodySchema, isValidGuessNumber } from '@/lib/validation/guess';

describe('guessSchema', () => {
  it('rejects 3 digits for 2d', () => {
    expect(() =>
      guessSchema.parse({ game_type: '2d', guess_number: '123', points_used: 1 }),
    ).toThrow();
  });

  it('rejects leading non-digits', () => {
    expect(() =>
      guessSchema.parse({ game_type: '2d', guess_number: 'a5', points_used: 1 }),
    ).toThrow();
  });

  it('accepts "00" and "99" for 2d', () => {
    expect(guessSchema.parse({ game_type: '2d', guess_number: '00', points_used: 1 })).toBeDefined();
    expect(guessSchema.parse({ game_type: '2d', guess_number: '99', points_used: 1 })).toBeDefined();
  });

  it('accepts 3 digits for 3d', () => {
    expect(
      guessSchema.parse({ game_type: '3d', guess_number: '007', points_used: 1 }),
    ).toBeDefined();
  });

  it('rejects 2 digits for 3d', () => {
    expect(() =>
      guessSchema.parse({ game_type: '3d', guess_number: '07', points_used: 1 }),
    ).toThrow();
  });

  it('rejects zero or negative points', () => {
    expect(() =>
      guessSchema.parse({ game_type: '2d', guess_number: '25', points_used: 0 }),
    ).toThrow();
    expect(() =>
      guessSchema.parse({ game_type: '2d', guess_number: '25', points_used: -5 }),
    ).toThrow();
  });

  it('rejects fractional points', () => {
    expect(() =>
      guessSchema.parse({ game_type: '2d', guess_number: '25', points_used: 1.5 }),
    ).toThrow();
  });
});

describe('placeGuessBodySchema', () => {
  it('requires a uuid round_id', () => {
    expect(() =>
      placeGuessBodySchema.parse({ round_id: 'nope', guess_number: '25', points_used: 1 }),
    ).toThrow();
  });

  it('accepts a valid body', () => {
    const parsed = placeGuessBodySchema.parse({
      round_id: '00000000-0000-0000-0000-000000000001',
      guess_number: '25',
      points_used: 100,
    });
    expect(parsed.points_used).toBe(100);
  });
});

describe('isValidGuessNumber', () => {
  it('matches digit count to game type', () => {
    expect(isValidGuessNumber('2d', '25')).toBe(true);
    expect(isValidGuessNumber('2d', '255')).toBe(false);
    expect(isValidGuessNumber('3d', '255')).toBe(true);
    expect(isValidGuessNumber('3d', '25')).toBe(false);
  });
});
