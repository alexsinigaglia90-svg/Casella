import { test, expect } from "@playwright/test";

/**
 * Coverage for T12 / B-2 — parallel + intercepting routes voor edit-drawer.
 *
 * Skipped until auth + DB seed fixtures bestaan; manual smoke is fine voor nu.
 * Re-enable once `e2e/fixtures` exposes a logged-in admin context plus a
 * deterministic employee row.
 */
test.describe.skip("edit employee via intercepting routes", () => {
  test("click row opens drawer over list, Esc returns to list", async ({ page }) => {
    await page.goto("/admin/medewerkers");
    const firstRow = page.getByRole("row").nth(1);
    await firstRow.click();
    await expect(page).toHaveURL(/\/admin\/medewerkers\/[a-f0-9-]+/);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/admin\/medewerkers$/);
  });

  test("direct-link renders fallback detail page", async ({ page }) => {
    // requires seeded employee — skip until db fixture exists
    await page.goto("/admin/medewerkers/00000000-0000-0000-0000-000000000000");
    // Fallback page renders with backlink + heading
  });

  test("edit save reflects in list", async ({ page }) => {
    await page.goto("/admin/medewerkers");
    const firstRow = page.getByRole("row").nth(1);
    await firstRow.click();
    await page.getByLabel("Functie").fill("Senior Consultant");
    await page.getByRole("button", { name: /opslaan/i }).click();
    await expect(page.getByText("Wijzigingen opgeslagen")).toBeVisible();
  });

  test("browser refresh on drawer URL renders fallback", async ({ page }) => {
    await page.goto("/admin/medewerkers");
    await page.getByRole("row").nth(1).click();
    const url = page.url();
    await page.reload();
    await expect(page).toHaveURL(url);
    // Fallback heading visible (full-page version)
  });
});
