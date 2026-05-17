import { test, expect } from '@playwright/test';
import { login } from './helpers';

// Seed player P000001 / player12345 (supabase/seed.sql).
test('player can log in, view rounds, place a guess and see history', async ({ page }) => {
  await login(page, 'P000001', 'player12345');

  // Home shows today's rounds.
  await expect(page.getByRole('heading', { name: "Today's Rounds" })).toBeVisible();

  // Place a guess.
  await page.getByRole('link', { name: 'Guess' }).click();
  await expect(page).toHaveURL(/\/guess/);
  await page.getByLabel(/Number/).fill('25');
  await page.getByLabel('Points').fill('100');
  await page.getByRole('button', { name: 'Submit guess' }).click();
  await expect(page.getByText(/Guess placed|room|full/)).toBeVisible();

  // The guess shows up in history.
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'My Guesses' })).toBeVisible();

  // Results page renders.
  await page.getByRole('link', { name: 'Results' }).click();
  await expect(page.getByRole('heading', { name: "Today's Results" })).toBeVisible();
});
