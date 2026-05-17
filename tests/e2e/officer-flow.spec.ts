import { test, expect } from '@playwright/test';
import { login } from './helpers';

// Seed officer officer1 / officer12345 (supabase/seed.sql).
test('officer can create a player and give points', async ({ page }) => {
  await login(page, 'officer1', 'officer12345');
  await expect(page).toHaveURL(/\/officer/);

  // Create a player — the password is shown exactly once.
  await page.getByRole('link', { name: 'Create Player' }).click();
  await page.getByRole('button', { name: 'Create player' }).click();
  await expect(page.getByText('will not be shown again')).toBeVisible();
  await expect(page.getByText('Username', { exact: true })).toBeVisible();
  await expect(page.getByText('Password', { exact: true })).toBeVisible();

  // Give points to an existing player.
  await page.getByRole('link', { name: 'Give Points' }).click();
  await page.getByLabel('Amount').fill('250');
  await page.getByRole('button', { name: 'Give points' }).click();
  await expect(page.getByText(/Done\. Player balance/)).toBeVisible();

  // Distribution history reflects it.
  await page.getByRole('link', { name: 'Distribution' }).click();
  await expect(page.getByRole('heading', { name: 'Distribution History' })).toBeVisible();
});
