import { test, expect } from "@playwright/test";

test.describe.skip("list column toggles + statusVariant switcher", () => {
  test("disabling email column hides column header and cells, persists across reload", async ({ page }) => {
    await page.goto("/admin/medewerkers");
    // Open dock cols popover
    await page.getByRole("button", { name: /kolommen/i }).click();
    // Toggle off the E-mail switch
    await page.getByRole("switch", { name: /^e-?mail$/i }).click();
    // Header cell should disappear
    await expect(page.getByRole("columnheader", { name: /^e-?mail$/i })).not.toBeVisible();
    // Reload — cookie persists
    await page.reload();
    await expect(page.getByRole("columnheader", { name: /^e-?mail$/i })).not.toBeVisible();
  });

  test("statusVariant switch updates badge rendering across rows", async ({ page }) => {
    await page.goto("/admin/medewerkers");
    await page.getByRole("button", { name: /status-stijl/i }).click();
    // Switch to Tekst (text) variant
    await page.getByRole("radio", { name: /tekst/i }).click();
    // Badge in first row should now be a plain text element (no pill background)
    const firstStatusCell = page.getByRole("row").nth(1).locator("td").nth(2);
    await expect(firstStatusCell.getByText(/actief|afwezig|ziek|uit dienst/i).first()).toBeVisible();
  });

  test("function/status/startDate columns toggleable independently", async ({ page }) => {
    await page.goto("/admin/medewerkers");
    await page.getByRole("button", { name: /kolommen/i }).click();
    for (const label of ["Functie", "Status", "Startdatum"]) {
      await page.getByRole("switch", { name: new RegExp(`^${label}$`, "i") }).click();
      await expect(page.getByRole("columnheader", { name: new RegExp(`^${label}$`, "i") })).not.toBeVisible();
    }
  });
});
