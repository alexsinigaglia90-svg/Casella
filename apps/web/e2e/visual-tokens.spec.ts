// apps/web/e2e/visual-tokens.spec.ts
// Verifies that the design-tokens TS source-of-truth (packages/design-tokens)
// is materialised into CSS custom properties at runtime, and that DD-1 has
// removed the legacy --text-* token names.
import { test, expect } from '@playwright/test';

test.use({ colorScheme: 'light' });

test('generated --fg-* and --surface-* CSS vars are present on :root', async ({ page }) => {
  await page.goto('/');

  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      fgPrimary: cs.getPropertyValue('--fg-primary').trim(),
      fgSecondary: cs.getPropertyValue('--fg-secondary').trim(),
      surfaceBase: cs.getPropertyValue('--surface-base').trim(),
      surfaceLift: cs.getPropertyValue('--surface-lift').trim(),
      auroraViolet: cs.getPropertyValue('--aurora-violet').trim(),
      easeStandard: cs.getPropertyValue('--ease-standard').trim(),
    };
  });

  // Light theme defaults — these match @casella/design-tokens raw exports.
  expect(tokens.fgPrimary).toBe('#0e1621');
  expect(tokens.surfaceBase).toBe('#f6f2ea');
  expect(tokens.surfaceLift).toBe('#faf6ee');
  expect(tokens.auroraViolet).toBe('#7b5cff');
  // Motion + alpha tokens just need to be non-empty.
  expect(tokens.fgSecondary).toMatch(/rgba\(14, 22, 33, 0\.68\)/);
  expect(tokens.easeStandard).toContain('cubic-bezier');
});

test('legacy --text-primary CSS var has been removed (DD-1)', async ({ page }) => {
  await page.goto('/');
  const legacy = await page.evaluate(
    () => getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
  );
  expect(legacy).toBe('');
});

test('body background resolves to surface-base color', async ({ page }) => {
  await page.goto('/');
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // #f6f2ea === rgb(246, 242, 234) — chromium normalises hex to rgb()
  expect(bodyBg).toBe('rgb(246, 242, 234)');
});
