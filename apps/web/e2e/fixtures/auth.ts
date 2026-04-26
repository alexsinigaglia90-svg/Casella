// apps/web/e2e/fixtures/auth.ts
import { test as base, expect, Page } from '@playwright/test';

export async function login(page: Page, email = 'admin@ascentra.test') {
  // Local dev uses Entra ID — for e2e, bypass via test-only cookie if available,
  // otherwise stub with NEXTAUTH_SECRET-signed JWT in next iteration.
  // For Task 1 smoke we simply visit / and assert the login button is visible.
  await page.goto('/');
  await expect(page.getByRole('button', { name: /log in met microsoft/i })).toBeVisible();
}

export const test = base.extend({
  authedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect };
