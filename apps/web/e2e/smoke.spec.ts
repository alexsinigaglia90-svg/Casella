// apps/web/e2e/smoke.spec.ts
import { test, expect } from './fixtures/auth';

test('homepage shows login page for unauthenticated user', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: /log in met microsoft/i })).toBeVisible();
});

test('login page renders sign-in button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /log in met microsoft/i })).toBeVisible();
});
