import { test, expect } from '@playwright/test';

test.describe.skip('ThemeToggle arrow navigation', () => {
  test('ArrowRight cycles through light → dark → system → light', async ({ page }) => {
    await page.goto('/admin'); // requires auth fixture
    const toggle = page.getByRole('radiogroup', { name: /thema/i });
    await toggle.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-theme-value="dark"][aria-checked="true"]')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-theme-value="system"][aria-checked="true"]')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(page.locator('[data-theme-value="light"][aria-checked="true"]')).toBeVisible();
  });
});
