import { defineConfig } from '@playwright/test';

// E2E_BASE_URL points at a running app wired to a seeded Supabase project.
// Local: `pnpm dev` + `supabase db reset`; smoke: a deployed preview URL.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
});
