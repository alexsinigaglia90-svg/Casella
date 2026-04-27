import { test, expect } from "@playwright/test";

/**
 * ML-5: Theme bootstrap from DB on first login.
 *
 * These tests require a seeded user with themePreference = 'dark' and a
 * db-fixture helper for seeding. Neither exists yet — deferred to a future
 * iteration. The spec is skipped so it shows up in the suite but doesn't fail.
 *
 * Manual smoke steps (document only — cannot automate without db fixture):
 *   1. pnpm db:up  (start Supabase local)
 *   2. pnpm -F @casella/web dev
 *   3. In Supabase Studio / psql:
 *        UPDATE users SET theme_preference = 'dark'
 *        WHERE email = 'admin@ascentra.test';
 *   4. Clear browser cookies for localhost.
 *   5. Login via Entra (Microsoft SSO).
 *   6. On first paint after redirect, inspect <html> — must have class "dark"
 *      without any client-side toggle (cookie was written server-side by JWT callback).
 */
test.describe.skip("theme bootstrap from DB (ML-5)", () => {
  test("user with themePreference=dark gets dark class on first paint", async ({
    page,
  }) => {
    // TODO: seed user via db fixture with themePreference = 'dark'
    // TODO: trigger login flow (mock or real Entra session)
    await page.goto("/");
    // The codebase uses .dark class (darkMode: ["class"] in tailwind.config)
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  });

  test("user with themePreference=system gets no theme cookie set", async ({
    page,
  }) => {
    // TODO: seed user via db fixture with themePreference = 'system'
    // TODO: trigger login flow
    await page.goto("/");
    // No cookie written → system preference respected → no forced class
    const cookies = await page.context().cookies();
    const themeCookie = cookies.find((c) => c.name === "casella.theme");
    expect(themeCookie).toBeUndefined();
  });
});
