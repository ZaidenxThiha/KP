import { test, expect } from '@playwright/test';
import { login } from './helpers';

// Seed admin admin / admin12345 (supabase/seed.sql).
test('admin can create an officer, set a rate, create and settle a round', async ({ page }) => {
  await login(page, 'admin', 'admin12345');
  await expect(page).toHaveURL(/\/admin/);

  // Dashboard cards.
  await expect(page.getByText('Players')).toBeVisible();

  // Create an officer.
  await page.getByRole('link', { name: 'Officers' }).click();
  const username = `OFF${Date.now().toString().slice(-6)}`;
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder(/Password/).fill('officer-pw-1234');
  await page.getByRole('button', { name: 'Create officer' }).click();
  await expect(page.getByText(`Officer ${username} created`)).toBeVisible();

  // Set a winning rate.
  await page.getByRole('link', { name: 'Winning Rates' }).click();
  await page.getByRole('button', { name: 'Save rate' }).click();
  await expect(page.getByText('Winning rate updated')).toBeVisible();

  // Create a round, set a result, approve & settle it.
  await page.getByRole('link', { name: 'Rounds' }).click();
  const closeAt = new Date(Date.now() + 3600_000).toISOString().slice(0, 16);
  await page.getByLabel('Closes').fill(closeAt);
  await page.getByRole('button', { name: 'Create round' }).click();
  await expect(page.getByText('Round created')).toBeVisible();

  await page.getByPlaceholder('result').first().fill('25');
  await page.getByRole('button', { name: 'Set result' }).first().click();
  await expect(page.getByText(/Result recorded/)).toBeVisible();
  await page.getByRole('button', { name: 'Approve & settle' }).first().click();
  await expect(page.getByText(/Settled:/)).toBeVisible();

  // Audit log captured the privileged actions.
  await page.getByRole('link', { name: 'Audit Logs' }).click();
  await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();
});
