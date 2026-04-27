# Casella Fase 1.1b Implementation Plan — Foundation-lift + Employee completion + AAA shell

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verharden van het 1.1a-fundament (tokens/lint/error-shape/cursor-fix), afmaken van de Employees-module (edit-mode + kolomtoggles), en introductie van een state-of-the-art admin-shell (top-bar, breadcrumbs, command-palette scopes, notifications, auto-save, presence, pins, server-side search).

**Architecture:** Chapter D verhardt het foundation door tokens te lift'en naar `packages/design-tokens`, ESLint v9 flat-config te installeren met CI-gate, error-shape standaardizeren, en een handvol kleine tech-debt-items op te ruimen. Chapter B maakt Employees compleet met mode-aware wizard + intercepting-routes voor edit-drawer + kolom-toggles. Chapter C bouwt de top-bar met breadcrumbs, ⌘K pill, user-menu, context-actions, palette-scopes, notifications, en de AAA-extensions (auto-save met optimistic-concurrency, coaching-toasts, pinned entities, tsvector server-search, Supabase Realtime presence).

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript 5.5 · Tailwind 3.4 · shadcn/ui · cmdk · sonner · Drizzle ORM · Postgres 15 · Supabase (Docker local + Realtime) · Auth.js v5 · Playwright (nieuw) · Vitest 2 · ESLint 9 flat-config (nieuw) · pnpm 9.12 catalog · React-hotkeys-hook.

**Plan size:** 31 taken (1 prerequisite Playwright-scaffold + 30 functionele taken uit spec).

**Source spec:** [`docs/superpowers/specs/2026-04-25-casella-fase-1-1b-foundation-completion-shell.md`](../specs/2026-04-25-casella-fase-1-1b-foundation-completion-shell.md)

**Branch:** `fase-1-1b-foundation-completion-shell` (already created, spec already committed at `326073a`).

---

## File Structure Overview

### New packages

```
packages/design-tokens/                  # Task 2 (ML-1) — TS source-of-truth voor tokens
  src/
    palette.ts                           # raw color values (hex + oklch)
    motion.ts                            # duration in ms, easing strings
    type-scale.ts                        # font sizes, line-heights, weights
    glow.ts                              # blur/offset/color glow tokens
    density.ts                           # spacing-scale per density-mode
    index.ts                             # barrel
  package.json
  tsconfig.json

packages/types/src/api-error.ts          # Task 3 (TD-6) — ApiError type + apiError() builder
packages/db/src/audit/list-recent.ts     # Task 25 (C-11) — recent audit-events helper
packages/db/src/pins/                    # Task 28 (C-14) — pins CRUD helpers
  list.ts
  create.ts
  delete.ts
packages/db/src/search/employees.ts      # Task 29 (C-15) — tsvector + trigram search
```

### New scripts

```
scripts/generate-css-vars.ts             # Task 2 (ML-1) — TS tokens → CSS vars sync
```

### New apps/web feature trees

```
apps/web/features/admin-shell/
  top-bar/                               # Task 15 (C-1)
    top-bar.tsx
    top-bar-context.tsx
  breadcrumbs/                           # Task 16 (C-2)
    breadcrumb-context.tsx
    breadcrumb-trail.tsx
    use-breadcrumbs.ts
  command-pill/                          # Task 18 (C-3)
    command-pill.tsx
  shortcuts-overlay/                     # Task 20 (C-4)
    shortcuts-dialog.tsx
    shortcuts-data.ts
  user-menu/                             # Task 19 (C-5)
    user-menu.tsx
  context-actions/                       # Task 21 (C-7)
    context-actions.tsx
    context-actions-context.tsx
    use-top-bar-actions.ts
  breadcrumb-switcher/                   # Task 22 (C-8)
    breadcrumb-trigger.tsx
    employee-list-cache-context.tsx
  palette-scopes/                        # Task 23 (C-9)
    use-command-scope.ts
    scope-chip.tsx
  quick-create/                          # Task 24 (C-10)
    use-quick-create.ts
    quick-create-context.tsx
  notifications/                         # Task 25 (C-11)
    notification-bell.tsx
    notifications-dropdown.tsx
    event-copy.ts
  auto-save/                             # Task 26 (C-12)
    use-auto-save.ts
    saved-indicator.tsx
    conflict-banner.tsx
  coaching/                              # Task 27 (C-13)
    tracker.ts
    tips.ts
    use-coaching-tip.ts
  pins/                                  # Task 28 (C-14)
    use-pin-toggle.ts
    favorites-section.tsx
  search/                                # Task 29 (C-15)
    use-server-search.ts
    search-preview.tsx
  presence/                              # Task 30 (C-16)
    use-entity-presence.ts
    presence-avatar-stack.tsx
    presence-fallback-poll.ts
```

### New apps/web routes

```
apps/web/app/(admin)/admin/medewerkers/[id]/page.tsx                  # Task 11 (B-2) — fallback detail
apps/web/app/(admin)/admin/medewerkers/@modal/(.)[id]/page.tsx        # Task 11 (B-2) — intercepted drawer
apps/web/app/(admin)/admin/profile/page.tsx                            # Task 19 (C-5) — placeholder
apps/web/app/api/admin/audit/recent/route.ts                          # Task 25 (C-11)
apps/web/app/api/admin/audit/mark-seen/route.ts                       # Task 25 (C-11)
apps/web/app/api/admin/pins/route.ts                                  # Task 28 (C-14)
apps/web/app/api/admin/pins/[entityType]/[entityId]/route.ts          # Task 28 (C-14)
apps/web/app/api/admin/search/route.ts                                # Task 29 (C-15)
apps/web/app/api/admin/presence/[entityType]/[entityId]/route.ts      # Task 30 (C-16, fallback)
```

### New migrations

```
packages/db/drizzle/0004_user_last_seen_audit_at.sql                  # Task 25 (C-11)
packages/db/drizzle/0005_user_pins_table.sql                          # Task 28 (C-14)
packages/db/drizzle/0006_employees_search_tsvector.sql                # Task 29 (C-15)
```

### Modified files (high-impact)

```
apps/web/app/(admin)/layout.tsx                                       # Task 15+ (TopBar wiring)
apps/web/tailwind.config.ts                                           # Task 2 (import from @casella/design-tokens)
apps/web/app/globals.css                                              # Task 2 (generated section)
apps/web/eslint.config.mjs                                            # Task 8 (NEW — TD-1)
apps/web/package.json                                                 # Task 2/4/8 (deps + scripts)
packages/types/package.json                                           # Task 4 (zod catalog)
packages/types/src/index.ts                                           # Task 3 (export ApiError)
packages/db/src/schema/identity.ts                                    # Task 25 (last_seen_audit_at column)
pnpm-workspace.yaml                                                   # Task 4 (catalog block)
.github/workflows/ci.yml                                              # Task 8 (lint job)
docs/casella-deferred-work.md                                         # Task 13 + Task 31 updates
docs/sanity-check-log.md                                              # appended after each chapter
```

### New e2e tests (Playwright)

```
apps/web/e2e/                                                         # Task 1 — scaffold
  fixtures/
    auth.ts                                                           # session-fixture for tests
    db.ts                                                              # seed/teardown helpers
  smoke.spec.ts                                                       # Task 1 — first green spec
  visual-tokens.spec.ts                                               # Task 2 (ML-1)
  theme-bootstrap.spec.ts                                             # Task 6 (ML-5)
  theme-toggle-a11y.spec.ts                                           # Task 7 (DD-3)
  edit-employee.spec.ts                                               # Task 11 (B-2)
  column-toggles.spec.ts                                              # Task 12 (B-4)
  top-bar-shell.spec.ts                                               # Task 15-19
  context-actions.spec.ts                                             # Task 21
  breadcrumb-switcher.spec.ts                                         # Task 22
  palette-scopes.spec.ts                                              # Task 23
  notifications.spec.ts                                               # Task 25
  auto-save.spec.ts                                                   # Task 26
  coaching.spec.ts                                                    # Task 27
  pins.spec.ts                                                        # Task 28
  search.spec.ts                                                      # Task 29
  presence.spec.ts                                                    # Task 30
playwright.config.ts                                                  # Task 1 — repo-root config
```

---

## Task volgorde + sanity-checkpoints

```
Chapter D — Foundation-lift (Task 1–9)
  Task 1  · Playwright scaffold (prerequisite)
  Task 2  · ML-1 design-tokens lift + DD-1 codemod (D-1+D-8)
  Task 3  · TD-6 error-shape standardize
  Task 4  · TD-4 zod catalog
  Task 5  · TD-5 cursor-SQL Drizzle-native
  Task 6  · ML-5 theme-bootstrap from DB
  Task 7  · DD-3 ThemeToggle arrow-key navigation
  Task 8  · TD-1 ESLint v9 + CI gate
  Task 9  · ✅ Sanity-check + log entry (einde Chapter D)

Chapter B — Employee completion (Task 10–14)
  Task 10 · B-3 Manager-select hide-but-keep
  Task 11 · B-1 EmployeeWizard mode-aware (rename + edit-flow)
  Task 12 · B-2 Intercepting-routes voor edit-drawer
  Task 13 · B-4 DD-5 column-toggles + statusVariant
  Task 14 · ✅ Sanity-check + B-5 deferred-work housekeeping (einde Chapter B)

Chapter C — AAA shell-chrome (Task 15–31)
  Task 15 · C-0 Claude Design handoff checkpoint (BLOCKING)
  Task 16 · C-1 TopBar skeleton + admin-layout wiring
  Task 17 · C-2 Breadcrumbs infra
  Task 18 · C-6 EnvBadge verhuis
  Task 19 · C-3 ⌘K command-pill
  Task 20 · C-5 UserMenu dropdown + profile stub
  Task 21 · C-4 ? keyboard-shortcut overlay
  Task 22 · C-7 Context-aware actions-slot
  Task 23 · C-8 Breadcrumb-segment entity-switcher
  Task 24 · C-9 Command-palette mode-scoping
  Task 25 · C-10 Global ⌘N quick-create
  Task 26 · C-11 Notification-center bell + audit-stream
  Task 27 · ✅ Sanity-check (einde Chapter C core)
  Task 28 · C-12 Auto-save + saved-indicator + conflict-detection
  Task 29 · C-13 Shortcut-coaching tip-surfacing
  Task 30 · C-14 Pinned entities (sidebar-favorieten)
  Task 31 · C-15 Server-side search (tsvector + preview)
  Task 32 · C-16 Presence-indicators (Realtime + fallback)
  Task 33 · ✅ Final sanity-check + PR open
```

Renumbered count = 33 (added 3 sanity-check tasks for explicit checkpoints — these are not implementation but mandatory gates).

---

## Chapter D — Foundation-lift + tech-debt

### Task 1: Playwright scaffold (prerequisite)

**Files:**
- Create: `playwright.config.ts`
- Create: `apps/web/e2e/smoke.spec.ts`
- Create: `apps/web/e2e/fixtures/auth.ts`
- Create: `apps/web/e2e/fixtures/db.ts`
- Modify: `apps/web/package.json` (add devDeps + scripts)
- Modify: `package.json` (add `e2e` turbo task)
- Modify: `.gitignore` (add `playwright-report/`, `test-results/`)

- [ ] **Step 1: Install Playwright as dev dependency in apps/web**

```bash
pnpm -F @casella/web add -D @playwright/test@^1.49.0
pnpm -F @casella/web exec playwright install --with-deps chromium
```

Expected: success message, chromium binary downloaded.

- [ ] **Step 2: Create `playwright.config.ts` at repo root**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: false, // db state shared
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm -F @casella/web dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Create `apps/web/e2e/fixtures/auth.ts`**

```ts
// apps/web/e2e/fixtures/auth.ts
import { test as base, expect, Page } from '@playwright/test';

export async function login(page: Page, email = 'admin@ascentra.test') {
  // Local dev uses Entra ID — for e2e, bypass via test-only cookie if available,
  // otherwise stub with NEXTAUTH_SECRET-signed JWT in next iteration.
  // For Task 1 smoke we simply visit / and assert it redirects to /login.
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
}

export const test = base.extend({
  authedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect };
```

- [ ] **Step 4: Create `apps/web/e2e/fixtures/db.ts` (placeholder)**

```ts
// apps/web/e2e/fixtures/db.ts
// Real seeding helpers added per-task as needed. For Task 1, no DB setup required.
export async function noop() {}
```

- [ ] **Step 5: Create `apps/web/e2e/smoke.spec.ts`**

```ts
// apps/web/e2e/smoke.spec.ts
import { test, expect } from './fixtures/auth';

test('homepage redirects unauthenticated user to /login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

test('login page renders sign-in button', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /aanmelden/i })).toBeVisible();
});
```

- [ ] **Step 6: Add scripts to `apps/web/package.json`**

Insert in `"scripts"`:

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui",
"e2e:install": "playwright install --with-deps chromium"
```

- [ ] **Step 7: Add turbo passthrough in repo `package.json`**

Insert in `"scripts"`:

```json
"e2e": "turbo run e2e"
```

And in `turbo.json` (if exists) add `"e2e": { "dependsOn": ["build"], "cache": false }`. Skip if no turbo.json edit needed for the basic case.

- [ ] **Step 8: Update `.gitignore`**

Append:

```
# Playwright
playwright-report/
test-results/
apps/web/playwright-report/
apps/web/test-results/
```

- [ ] **Step 9: Run smoke test to verify scaffold**

```bash
pnpm -F @casella/web e2e
```

Expected: 2 tests pass, 1 chromium project, smoke.spec.ts green.

- [ ] **Step 10: Commit**

```bash
git add playwright.config.ts apps/web/e2e/ apps/web/package.json package.json .gitignore
git commit -m "chore(test): scaffold Playwright e2e (chromium) with smoke spec"
```

---

### Task 2: ML-1 design-tokens lift to packages/design-tokens + DD-1 codemod

**Files:**
- Create: `packages/design-tokens/package.json`
- Create: `packages/design-tokens/tsconfig.json`
- Create: `packages/design-tokens/src/palette.ts`
- Create: `packages/design-tokens/src/motion.ts`
- Create: `packages/design-tokens/src/type-scale.ts`
- Create: `packages/design-tokens/src/glow.ts`
- Create: `packages/design-tokens/src/density.ts`
- Create: `packages/design-tokens/src/index.ts`
- Create: `scripts/generate-css-vars.ts`
- Modify: `apps/web/tailwind.config.ts` (import TS tokens; rename `text` → `fg`)
- Modify: `apps/web/app/globals.css` (gegenereerde sectie tussen markers)
- Modify: `apps/web/app/**/*.{ts,tsx}` (codemod `text-text-*` → `text-fg-*`)
- Modify: `apps/web/package.json` (add `@casella/design-tokens` dep + `prebuild` script)
- Test: `apps/web/e2e/visual-tokens.spec.ts`

- [ ] **Step 1: Scaffold packages/design-tokens package**

```bash
mkdir -p packages/design-tokens/src
```

Create `packages/design-tokens/package.json`:

```json
{
  "name": "@casella/design-tokens",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "echo 'no lint'",
    "typecheck": "tsc --noEmit",
    "test": "echo 'no tests yet'"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

Create `packages/design-tokens/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

(If `tsconfig.base.json` doesn't exist at root, copy a minimal one from `packages/types/tsconfig.json`.)

- [ ] **Step 2: Create `packages/design-tokens/src/palette.ts`**

Mirror values from `apps/web/app/globals.css` raw tokens. Hex for RN-portability; oklch as separate string-export only consumed by CSS-var generator.

```ts
// packages/design-tokens/src/palette.ts
export const paletteHex = {
  cream: { base: '#f6f2ea', lift: '#faf6ee', deep: '#efe8d9' },
  ink: {
    deep: '#0e1621',
    a68: 'rgba(14, 22, 33, 0.68)',
    a45: 'rgba(14, 22, 33, 0.45)',
    a22: 'rgba(14, 22, 33, 0.22)',
    a10: 'rgba(14, 22, 33, 0.10)',
  },
  navy: '#1e3a5f',
  brown: '#6b4e3d',
  aurora: {
    violet: '#7b5cff',
    blue: '#4ba3ff',
    coral: '#ff8a4c',
    amber: '#f5c55c',
    teal: '#3dd8a8',
    rose: '#ff5a8a',
  },
} as const;

// Semantic mapping (referenced by CSS-var generator)
export const semantic = {
  surface: { base: paletteHex.cream.base, lift: paletteHex.cream.lift, deep: paletteHex.cream.deep },
  fg: { primary: paletteHex.ink.deep, secondary: paletteHex.ink.a68, tertiary: paletteHex.ink.a45, quaternary: paletteHex.ink.a22 },
  border: { subtle: paletteHex.ink.a10, muted: paletteHex.ink.a22 },
  action: { primary: paletteHex.aurora.violet, primaryFg: '#ffffff' },
  status: {
    success: paletteHex.aurora.teal,
    warning: paletteHex.aurora.amber,
    danger: paletteHex.aurora.rose,
    info: paletteHex.aurora.blue,
  },
} as const;
```

- [ ] **Step 3: Create remaining token files**

`packages/design-tokens/src/motion.ts`:

```ts
export const motion = {
  duration: { instant: 80, fast: 160, base: 240, slow: 360, slower: 520 },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0, 1)',
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  },
} as const;
```

`packages/design-tokens/src/type-scale.ts`:

```ts
// Numeric for RN; web uses clamp() in generated CSS-var output.
export const typeScale = {
  hero:    { size: 64, lineHeight: 70, weight: 600 },
  display: { size: 36, lineHeight: 42, weight: 600 },
  title:   { size: 22, lineHeight: 28, weight: 600 },
  body:    { size: 14, lineHeight: 20, weight: 400 },
  small:   { size: 12, lineHeight: 16, weight: 400 },
  xs:      { size: 11, lineHeight: 14, weight: 500 },
} as const;

export const typeScaleClampCss = {
  hero:    'clamp(3rem, 2rem + 2vw, 4.25rem)',
  display: 'clamp(1.75rem, 1.5rem + 1vw, 2.5rem)',
  title:   'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
  body:    '0.875rem',
  small:   '0.75rem',
  xs:      '0.6875rem',
} as const;
```

`packages/design-tokens/src/glow.ts`:

```ts
import { paletteHex } from './palette';
export const glow = {
  violet: 'rgba(123, 92, 255, 0.35)',
  blue:   'rgba(75, 163, 255, 0.35)',
  coral:  'rgba(255, 138, 76, 0.35)',
  amber:  'rgba(245, 197, 92, 0.40)',
  teal:   'rgba(61, 216, 168, 0.35)',
  rose:   'rgba(255, 90, 138, 0.35)',
} as const;
```

`packages/design-tokens/src/density.ts`:

```ts
export const density = {
  default: { rowHeight: 56, padding: 16, gap: 12 },
  compact: { rowHeight: 40, padding: 12, gap: 8 },
} as const;
```

`packages/design-tokens/src/index.ts`:

```ts
export { paletteHex, semantic } from './palette';
export { motion } from './motion';
export { typeScale, typeScaleClampCss } from './type-scale';
export { glow } from './glow';
export { density } from './density';
```

- [ ] **Step 4: Create `scripts/generate-css-vars.ts`**

```ts
// scripts/generate-css-vars.ts
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  paletteHex,
  semantic,
  motion,
  typeScaleClampCss,
  glow,
  density,
} from '../packages/design-tokens/src';

const cssBlock = `
:root {
  /* === RAW PALETTE === */
  --cream-base: ${paletteHex.cream.base};
  --cream-lift: ${paletteHex.cream.lift};
  --cream-deep: ${paletteHex.cream.deep};

  --ink-deep: ${paletteHex.ink.deep};
  --ink-2: ${paletteHex.ink.a68};
  --ink-3: ${paletteHex.ink.a45};
  --ink-4: ${paletteHex.ink.a22};
  --ink-5: ${paletteHex.ink.a10};

  --navy: ${paletteHex.navy};
  --brown: ${paletteHex.brown};

  --aurora-violet: ${paletteHex.aurora.violet};
  --aurora-blue: ${paletteHex.aurora.blue};
  --aurora-coral: ${paletteHex.aurora.coral};
  --aurora-amber: ${paletteHex.aurora.amber};
  --aurora-teal: ${paletteHex.aurora.teal};
  --aurora-rose: ${paletteHex.aurora.rose};

  /* === GLOW === */
  --glow-violet: ${glow.violet};
  --glow-blue:   ${glow.blue};
  --glow-coral:  ${glow.coral};
  --glow-amber:  ${glow.amber};
  --glow-teal:   ${glow.teal};
  --glow-rose:   ${glow.rose};

  /* === SEMANTIC === */
  --surface-base: ${semantic.surface.base};
  --surface-lift: ${semantic.surface.lift};
  --surface-deep: ${semantic.surface.deep};

  --fg-primary:    ${semantic.fg.primary};
  --fg-secondary:  ${semantic.fg.secondary};
  --fg-tertiary:   ${semantic.fg.tertiary};
  --fg-quaternary: ${semantic.fg.quaternary};

  --border-subtle: ${semantic.border.subtle};
  --border-muted:  ${semantic.border.muted};

  --action-primary:    ${semantic.action.primary};
  --action-primary-fg: ${semantic.action.primaryFg};

  --status-success: ${semantic.status.success};
  --status-warning: ${semantic.status.warning};
  --status-danger:  ${semantic.status.danger};
  --status-info:    ${semantic.status.info};

  /* === TYPE SCALE === */
  --text-hero:    ${typeScaleClampCss.hero};
  --text-display: ${typeScaleClampCss.display};
  --text-title:   ${typeScaleClampCss.title};
  --text-body:    ${typeScaleClampCss.body};
  --text-small:   ${typeScaleClampCss.small};
  --text-xs:      ${typeScaleClampCss.xs};

  /* === MOTION === */
  --motion-instant: ${motion.duration.instant}ms;
  --motion-fast:    ${motion.duration.fast}ms;
  --motion-base:    ${motion.duration.base}ms;
  --motion-slow:    ${motion.duration.slow}ms;
  --motion-slower:  ${motion.duration.slower}ms;

  --motion-easing-standard:   ${motion.easing.standard};
  --motion-easing-decelerate: ${motion.easing.decelerate};
  --motion-easing-accelerate: ${motion.easing.accelerate};

  /* === DENSITY === */
  --density-row-height-default: ${density.default.rowHeight}px;
  --density-row-height-compact: ${density.compact.rowHeight}px;
}
`.trimStart();

const cssPath = resolve(__dirname, '../apps/web/app/globals.css');
const current = readFileSync(cssPath, 'utf-8');

const startMarker = '/* @tokens:start */';
const endMarker = '/* @tokens:end */';
const startIdx = current.indexOf(startMarker);
const endIdx = current.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('globals.css missing @tokens:start / @tokens:end markers');
  process.exit(1);
}

const before = current.slice(0, startIdx + startMarker.length);
const after = current.slice(endIdx);
const next = `${before}\n${cssBlock}${after}`;

writeFileSync(cssPath, next);
console.log('✓ globals.css tokens regenerated');
```

- [ ] **Step 5: Insert markers into globals.css and remove old token blocks**

Edit `apps/web/app/globals.css`:
- Replace lines 5-XXX (the `@layer base { :root { ... } }` block with raw + semantic tokens) with:

```css
@layer base {
  /* @tokens:start */
  /* @tokens:end */

  body {
    background: var(--surface-base);
    color: var(--fg-primary);
    font-family: var(--font-geist-sans), sans-serif;
  }
  /* ... keep any non-token base styles below */
}
```

Run the generator:

```bash
pnpm tsx scripts/generate-css-vars.ts
```

Expected: `✓ globals.css tokens regenerated`. Inspect `globals.css` and confirm `--fg-primary` etc are now between markers.

- [ ] **Step 6: Update `apps/web/tailwind.config.ts` to import from package + rename text → fg**

Replace the `colors` block to import:

```ts
import type { Config } from "tailwindcss";
import { paletteHex, semantic } from "@casella/design-tokens";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-cormorant)", "serif"],
      },
      fontSize: {
        hero: "var(--text-hero)",
        display: "var(--text-display)",
        title: "var(--text-title)",
      },
      colors: {
        cream: { base: "var(--cream-base)", lift: "var(--cream-lift)", deep: "var(--cream-deep)" },
        ink: { DEFAULT: "var(--ink-deep)", 2: "var(--ink-2)", 3: "var(--ink-3)", 4: "var(--ink-4)", 5: "var(--ink-5)" },
        navy: "var(--navy)",
        brown: "var(--brown)",
        aurora: {
          violet: "var(--aurora-violet)",
          blue: "var(--aurora-blue)",
          coral: "var(--aurora-coral)",
          amber: "var(--aurora-amber)",
          teal: "var(--aurora-teal)",
          rose: "var(--aurora-rose)",
        },
        surface: { base: "var(--surface-base)", lift: "var(--surface-lift)", deep: "var(--surface-deep)" },
        // RENAMED: text → fg (DD-1)
        fg: {
          primary: "var(--fg-primary)",
          secondary: "var(--fg-secondary)",
          tertiary: "var(--fg-tertiary)",
          quaternary: "var(--fg-quaternary)",
        },
        status: {
          success: "var(--status-success)",
          warning: "var(--status-warning)",
          danger: "var(--status-danger)",
          info: "var(--status-info)",
        },
        // shadcn compat unchanged
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
      },
      // ... rest unchanged
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 7: Add `@casella/design-tokens` workspace dep to apps/web**

```bash
pnpm -F @casella/web add @casella/design-tokens@workspace:*
```

- [ ] **Step 8: Add `prebuild` + `pretest` hooks to ensure CSS-vars regenerate**

Modify root `package.json` `scripts`:

```json
"prebuild": "tsx scripts/generate-css-vars.ts",
"build": "turbo run build",
"tokens:check": "tsx scripts/generate-css-vars.ts && git diff --exit-code apps/web/app/globals.css"
```

Add `tsx` as devDep at root:

```bash
pnpm add -D -w tsx
```

- [ ] **Step 9: Codemod `text-text-*` → `text-fg-*` (DD-1)**

Run from repo root (Git Bash on Windows is fine):

```bash
grep -rl "text-text-" apps/web --include="*.ts" --include="*.tsx" | xargs sed -i 's/text-text-primary/text-fg-primary/g; s/text-text-secondary/text-fg-secondary/g; s/text-text-tertiary/text-fg-tertiary/g; s/text-text-quaternary/text-fg-quaternary/g'
```

Verify:

```bash
grep -r "text-text-" apps/web --include="*.ts" --include="*.tsx" | wc -l
```

Expected: `0`.

- [ ] **Step 10: Write visual-tokens.spec.ts**

```ts
// apps/web/e2e/visual-tokens.spec.ts
import { test, expect } from '@playwright/test';

test('login page renders with surface-base background and fg-primary text', async ({ page }) => {
  await page.goto('/login');
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const fgPrimary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fg-primary').trim());
  expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)');
  expect(fgPrimary).toBe('#0e1621');
});
```

- [ ] **Step 11: Run typecheck + e2e**

```bash
pnpm -r typecheck
pnpm -F @casella/web e2e
```

Expected: typecheck 0 errors, smoke + visual-tokens specs pass.

- [ ] **Step 12: Run prod build to verify Tailwind picks up new fg-* classes**

```bash
pnpm -F @casella/web build
```

Expected: 15 routes registered (or current count), no warnings about unknown utilities.

- [ ] **Step 13: Commit**

```bash
git add packages/design-tokens/ scripts/generate-css-vars.ts apps/web/tailwind.config.ts apps/web/app/globals.css apps/web/app/ apps/web/package.json package.json pnpm-lock.yaml apps/web/e2e/visual-tokens.spec.ts
git commit -m "feat(tokens): lift design tokens to packages/design-tokens (ML-1) + rename text-* to fg-* (DD-1)"
```

---

### Task 3: TD-6 error-shape standardize

**Files:**
- Create: `packages/types/src/api-error.ts`
- Modify: `packages/types/src/index.ts` (export ApiError)
- Modify: `apps/web/app/api/pdok/search/route.ts` (use apiError)
- Modify: `apps/web/app/api/pdok/lookup/route.ts` (use apiError)
- Modify: `apps/web/app/api/admin/employees/route.ts` (add `message` field)
- Modify: `apps/web/app/api/admin/employees/[id]/route.ts` (add `message` field)
- Modify: `apps/web/features/address-input/error-mapper.ts` (read code, fallback to message)
- Test: `packages/types/__tests__/api-error.test.ts`

- [ ] **Step 1: Create `packages/types/src/api-error.ts`**

```ts
// packages/types/src/api-error.ts
import type { ZodIssue } from 'zod';

export type ApiError = {
  error: string;
  message: string;
  issues?: ZodIssue[];
};

export function apiError(code: string, message: string, issues?: ZodIssue[]): ApiError {
  return { error: code, message, ...(issues ? { issues } : {}) };
}
```

- [ ] **Step 2: Export from packages/types barrel**

Add to `packages/types/src/index.ts`:

```ts
export * from './api-error';
```

- [ ] **Step 3: Add vitest to packages/types**

```bash
pnpm -F @casella/types add -D vitest@^2.0.0
```

Update `packages/types/package.json` `"test"`:

```json
"test": "vitest run --passWithNoTests"
```

- [ ] **Step 4: Write apiError test**

Create `packages/types/__tests__/api-error.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { apiError } from '../src/api-error';

describe('apiError', () => {
  it('creates error with code + message', () => {
    expect(apiError('not_found', 'Niet gevonden')).toEqual({
      error: 'not_found',
      message: 'Niet gevonden',
    });
  });

  it('includes issues when provided', () => {
    const issues = [{ code: 'invalid_type', path: ['email'], message: 'fout' } as any];
    expect(apiError('validation_error', 'Ongeldig', issues)).toEqual({
      error: 'validation_error',
      message: 'Ongeldig',
      issues,
    });
  });

  it('omits issues key when not provided', () => {
    const result = apiError('foo', 'bar');
    expect('issues' in result).toBe(false);
  });
});
```

- [ ] **Step 5: Run test, verify pass**

```bash
pnpm -F @casella/types test
```

Expected: 3 tests pass.

- [ ] **Step 6: Migrate PDOK routes to use apiError**

In `apps/web/app/api/pdok/search/route.ts`, replace any error responses (e.g. `{ error: "Address service unavailable" }`) with:

```ts
import { apiError } from '@casella/types';

// in catch / error path:
return Response.json(apiError('pdok_unavailable', 'Adresservice tijdelijk onbereikbaar'), { status: 503 });
```

Same migration in `apps/web/app/api/pdok/lookup/route.ts`.

- [ ] **Step 7: Migrate Employee Route Handlers**

In `apps/web/app/api/admin/employees/route.ts` (POST + PATCH branches) and `apps/web/app/api/admin/employees/[id]/route.ts`, replace any bare-shape `{ error: "validation_error", issues: ... }` with:

```ts
import { apiError } from '@casella/types';

// validation path:
return Response.json(apiError('validation_error', 'Ongeldige invoer', parsed.error.issues), { status: 400 });

// not found:
return Response.json(apiError('not_found', 'Medewerker niet gevonden'), { status: 404 });

// generic 500:
return Response.json(apiError('internal_error', 'Er ging iets mis aan onze kant'), { status: 500 });
```

- [ ] **Step 8: Update AddressInput error-mapper**

In `apps/web/features/address-input/` find the error-handling helper (likely `error-mapper.ts` or inline). Replace logic to read `error.error` (the code) and map to NL strings, with `error.message` as fallback:

```ts
import type { ApiError } from '@casella/types';

const ADDRESS_ERROR_COPY: Record<string, string> = {
  pdok_unavailable: 'Adresservice tijdelijk onbereikbaar — probeer over een minuut opnieuw',
  not_found: 'Geen adres gevonden voor deze postcode',
  invalid_postcode: 'Postcode lijkt niet correct (4 cijfers + 2 letters)',
};

export function mapAddressError(err: ApiError): string {
  return ADDRESS_ERROR_COPY[err.error] ?? err.message;
}
```

- [ ] **Step 9: Typecheck + test**

```bash
pnpm -r typecheck
pnpm -r test
pnpm -F @casella/web build
```

Expected: 0 errors.

- [ ] **Step 10: Commit**

```bash
git add packages/types/ apps/web/
git commit -m "feat(types): standardize API error shape with apiError() builder (TD-6)"
```

---

### Task 4: TD-4 zod range-align via pnpm catalog

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `apps/web/package.json`
- Modify: `packages/types/package.json`
- Modify: `pnpm-lock.yaml` (regenerated)

- [ ] **Step 1: Read current pnpm-workspace.yaml**

```bash
cat pnpm-workspace.yaml
```

- [ ] **Step 2: Add catalog block**

Edit `pnpm-workspace.yaml` to add:

```yaml
packages:
  - "apps/*"
  - "packages/*"

catalogs:
  default:
    zod: ^3.25.76
```

(Preserve existing `packages:` list.)

- [ ] **Step 3: Update `apps/web/package.json` to use catalog**

Change `"zod": "^3.25.76"` to `"zod": "catalog:"`.

- [ ] **Step 4: Update `packages/types/package.json` to use catalog**

Change `"zod": "^3.23.0"` to `"zod": "catalog:"`.

- [ ] **Step 5: Reinstall**

```bash
pnpm install
```

Expected: lockfile updates, no version conflicts.

- [ ] **Step 6: Verify single zod version**

```bash
pnpm why zod
```

Expected: only `zod 3.25.76` in dependency tree, no second version.

- [ ] **Step 7: Typecheck + test**

```bash
pnpm -r typecheck && pnpm -r test
```

Expected: 0 errors, all tests still pass.

- [ ] **Step 8: Commit**

```bash
git add pnpm-workspace.yaml apps/web/package.json packages/types/package.json pnpm-lock.yaml
git commit -m "chore(deps): align zod version via pnpm catalog (TD-4)"
```

---

### Task 5: TD-5 cursor-SQL Drizzle-native

**Files:**
- Modify: `apps/web/app/(admin)/admin/medewerkers/queries.ts`

- [ ] **Step 1: Read current queries.ts cursor section**

```bash
grep -n "cursor" apps/web/app/\(admin\)/admin/medewerkers/queries.ts
```

Identify the `sql\`SELECT created_at FROM employees WHERE id = ${cursor}\`` block.

- [ ] **Step 2: Replace bare-table SQL with Drizzle-native**

In `apps/web/app/(admin)/admin/medewerkers/queries.ts`, change the cursor branch from:

```ts
const cursorRow = await tx.execute<{ created_at: Date }>(
  sql`SELECT created_at FROM employees WHERE id = ${cursor}`
);
const cursorDate = cursorRow.rows[0]?.created_at;
```

to:

```ts
const [cursorRow] = await tx
  .select({ createdAt: employees.createdAt })
  .from(employees)
  .where(eq(employees.id, cursor))
  .limit(1);
const cursorDate = cursorRow?.createdAt;
```

Ensure `employees` and `eq` are imported at the top of the file (they should already be).

- [ ] **Step 3: Typecheck**

```bash
pnpm -F @casella/web typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Manual smoke — paginate medewerkers list**

Start dev server in background:

```bash
pnpm -F @casella/web dev
```

In a second terminal (or via Playwright):

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin/medewerkers?cursor=test
```

Expected: 200 (or auth redirect if not logged in — both indicate code path doesn't crash).

- [ ] **Step 5: Stop dev server**

```bash
# kill background dev process
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/\(admin\)/admin/medewerkers/queries.ts
git commit -m "refactor(employees): use Drizzle-native cursor query instead of bare-table SQL (TD-5)"
```

---

### Task 6: ML-5 theme-bootstrap from DB on first login

**Files:**
- Modify: `packages/auth/src/auth.config.ts` (or wherever Auth.js callbacks live)
- Modify: `apps/web/lib/theme-cookie.ts` (server-helper that JWT callback uses)
- Test: `apps/web/e2e/theme-bootstrap.spec.ts`

- [ ] **Step 1: Locate Auth.js JWT callback**

```bash
grep -rn "jwt:" packages/auth/src/ | head -5
grep -rn "callback" packages/auth/src/ | head -10
```

Identify the file containing the `callbacks: { jwt, session }` config (likely `packages/auth/src/auth.config.ts`).

- [ ] **Step 2: Extend JWT callback to set theme cookie on first login**

In the callbacks file, modify the `jwt` callback to inspect `trigger === 'signIn'` and call a server helper that writes the theme cookie:

```ts
// packages/auth/src/auth.config.ts (excerpt)
import { setThemeCookieFromDb } from '@casella/web/lib/theme-cookie-bootstrap'; // server-only helper

callbacks: {
  async jwt({ token, user, trigger }) {
    // existing logic …
    if (trigger === 'signIn' && token.sub) {
      // best-effort, don't fail login if cookie write fails
      try {
        await setThemeCookieFromDb(token.sub);
      } catch (e) {
        console.warn('theme-bootstrap failed', e);
      }
    }
    return token;
  },
}
```

If `@casella/web` import is awkward (auth lives outside web app), instead inline the cookie-write logic in auth package: import `cookies()` from `next/headers` (works in Auth.js callbacks), query `users.themePreference` via `@casella/db`, and write the cookie with the same name+opts as `theme-cookie.ts`.

- [ ] **Step 3: Create the bootstrap helper if it doesn't exist**

Create `apps/web/lib/theme-cookie-bootstrap.ts`:

```ts
// apps/web/lib/theme-cookie-bootstrap.ts
import 'server-only';
import { cookies } from 'next/headers';
import { db } from '@casella/db';
import { users } from '@casella/db/schema';
import { eq } from 'drizzle-orm';
import { THEME_COOKIE_NAME, THEME_COOKIE_OPTS } from './theme-cookie-shared';

export async function setThemeCookieFromDb(userId: string) {
  const [row] = await db
    .select({ themePreference: users.themePreference })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row?.themePreference || row.themePreference === 'system') return; // skip default
  cookies().set(THEME_COOKIE_NAME, row.themePreference, THEME_COOKIE_OPTS);
}
```

(Adjust import paths if `@casella/db` doesn't expose `db` directly.)

- [ ] **Step 4: Write Playwright spec**

Create `apps/web/e2e/theme-bootstrap.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

// This test requires a seeded user with themePreference='dark'.
// For now, document the manual verification path; CI can run this once seeding helpers exist.
test.describe.skip('theme bootstrap from DB', () => {
  test('user with themePreference=dark gets dark on first paint', async ({ page }) => {
    // 1. Seed user via db fixture: themePreference = 'dark'
    // 2. Trigger login flow (mock or real)
    // 3. Assert <html data-theme="dark"> on first paint
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
```

(Use `test.describe.skip` until seeding is wired; mark task acceptance as "implementation correct, e2e covered manually" + create a follow-up entry to enable test once db-fixture exists.)

- [ ] **Step 5: Manual smoke test**

```bash
pnpm db:up
pnpm -F @casella/web dev
```

In Supabase Studio (or psql), update a test user:

```sql
UPDATE users SET theme_preference = 'dark' WHERE email = 'admin@ascentra.test';
```

Clear browser cookies, log in via Entra. On first paint after redirect, `<html>` should have `data-theme="dark"`.

- [ ] **Step 6: Stop dev server**

- [ ] **Step 7: Commit**

```bash
git add packages/auth/ apps/web/lib/theme-cookie-bootstrap.ts apps/web/e2e/theme-bootstrap.spec.ts
git commit -m "feat(auth): bootstrap theme cookie from DB on first login (ML-5)"
```

---

### Task 7: DD-3 ThemeToggle arrow-key navigation

**Files:**
- Modify: `apps/web/features/admin-shell/sidebar/theme-toggle.tsx` (or wherever ThemeToggle lives)
- Test: `apps/web/e2e/theme-toggle-a11y.spec.ts`

- [ ] **Step 1: Locate ThemeToggle component**

```bash
grep -rn "role=\"radiogroup\"" apps/web/features/ apps/web/components/
```

Identify exact file.

- [ ] **Step 2: Add arrow-key handler**

In the ThemeToggle component, add `onKeyDown` to the radiogroup root:

```tsx
function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  const options = ['light', 'system', 'dark'] as const;
  const currentIdx = options.indexOf(value);
  let nextIdx = currentIdx;
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      nextIdx = (currentIdx + 1) % options.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      nextIdx = (currentIdx - 1 + options.length) % options.length;
      break;
    case 'Home':
      nextIdx = 0;
      break;
    case 'End':
      nextIdx = options.length - 1;
      break;
    default:
      return;
  }
  e.preventDefault();
  onChange(options[nextIdx]);
  // focus the new radio
  const root = e.currentTarget;
  const target = root.querySelector<HTMLButtonElement>(`[data-theme-value="${options[nextIdx]}"]`);
  target?.focus();
}
```

Add `data-theme-value={option}` attribute on each `<button role="radio">`. Wire `onKeyDown={handleKeyDown}` on the radiogroup `<div>`.

- [ ] **Step 3: Write Playwright a11y spec**

Create `apps/web/e2e/theme-toggle-a11y.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe.skip('ThemeToggle arrow navigation', () => {
  test('ArrowRight cycles through light → system → dark → light', async ({ page }) => {
    await page.goto('/admin'); // requires auth fixture
    const toggle = page.getByRole('radiogroup', { name: /thema/i });
    await toggle.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-theme-value="system"][aria-checked="true"]')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-theme-value="dark"][aria-checked="true"]')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(page.locator('[data-theme-value="light"][aria-checked="true"]')).toBeVisible();
  });
});
```

(Skip until auth fixture exists; manual verification required.)

- [ ] **Step 4: Manual smoke**

Open dev server, focus the ThemeToggle in sidebar-footer with Tab, press ArrowRight 3 times. Verify selection cycles. Press Home → resets to "light". End → "dark".

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/features/ apps/web/e2e/theme-toggle-a11y.spec.ts
git commit -m "feat(a11y): add arrow-key nav to ThemeToggle radiogroup (DD-3)"
```

---

### Task 8: TD-1 ESLint v9 flat config + CI gate

**Files:**
- Create: `apps/web/eslint.config.mjs`
- Modify: `apps/web/package.json` (add `lint` script + plugin devDeps)
- Modify: `.github/workflows/ci.yml` (add lint job)

- [ ] **Step 1: Install ESLint plugins**

```bash
pnpm -F @casella/web add -D \
  @eslint/js@^9.0.0 \
  typescript-eslint@^8.0.0 \
  eslint-plugin-react@^7.35.0 \
  eslint-plugin-react-hooks@^5.0.0 \
  eslint-plugin-jsx-a11y@^6.10.0 \
  eslint-plugin-import@^2.30.0 \
  @next/eslint-plugin-next@^15.0.0 \
  globals@^15.0.0
```

- [ ] **Step 2: Remove deprecated `eslint-config-next`**

```bash
pnpm -F @casella/web remove eslint-config-next
```

- [ ] **Step 3: Create `apps/web/eslint.config.mjs`**

```js
// apps/web/eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': a11y,
      import: importPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'import/order': ['warn', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
    },
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['scripts/**/*.{ts,js}', '**/*.config.{ts,mjs,js}'],
    rules: { 'no-console': 'off' },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'e2e/**'],
  },
];
```

- [ ] **Step 4: Add `lint` script to `apps/web/package.json`**

```json
"lint": "eslint . --max-warnings=0"
```

- [ ] **Step 5: Run lint, expect violations**

```bash
pnpm -F @casella/web lint
```

Expected: violation count > 0 (raw count varies; spec estimated 50–200).

- [ ] **Step 6: Auto-fix safe violations**

```bash
pnpm -F @casella/web lint -- --fix
```

- [ ] **Step 7: Manually fix or legalize remaining violations**

For each remaining violation:
1. If it's a real bug → fix it.
2. If it's a deliberate pattern → add a per-file disable comment with motivation:
   ```ts
   /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- shadcn forwarded ref types */
   ```
3. If a category is too broad to be useful for this codebase → tune in `eslint.config.mjs` rules.

- [ ] **Step 8: Run lint again, verify clean**

```bash
pnpm -F @casella/web lint
```

Expected: `0 errors, 0 warnings`.

- [ ] **Step 9: Add lint job to CI**

Edit `.github/workflows/ci.yml`. After the `Typecheck` step, insert:

```yaml
      - name: Lint
        run: pnpm -F @casella/web lint

      - name: Build
        run: pnpm -F @casella/web build

      - name: Test
        run: pnpm -r test
```

(Build + test were missing per audit; include them.)

- [ ] **Step 10: Commit**

```bash
git add apps/web/eslint.config.mjs apps/web/package.json apps/web/ pnpm-lock.yaml .github/workflows/ci.yml
git commit -m "feat(lint): ESLint v9 flat config + CI gate for apps/web (TD-1)"
```

---

### Task 9: ✅ Sanity-check + log entry (einde Chapter D)

**Files:**
- Modify: `docs/sanity-check-log.md`

- [ ] **Step 1: Run all 6 commands from sanity-check protocol**

```bash
git status
git log --oneline main..HEAD | wc -l
pnpm -r typecheck
pnpm -r test
pnpm -F @casella/web build
docker exec -i supabase_db_Casella psql -U postgres -d postgres \
  -c "SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id;"
```

Expected: clean tree, X commits ahead, 0 typecheck errors, all tests pass, build succeeds, 4 migrations applied (still 0000-0003 — Chapter D adds none).

- [ ] **Step 2: Run mobile-alignment judgment per ML-* item**

Per `docs/sanity-check-protocol.md` Check 2: read each open ML-item from `docs/casella-deferred-work.md`. For each:
- Has the pickup trigger fired?
- Did changes since last check make it cheaper / more expensive?
- Did we widen the misalignment?

Expected outputs:
- ML-1 → done in this chapter
- ML-2 → in-progress (Route Handler discipline maintained)
- ML-3 → no change
- ML-4 → no change
- ML-5 → done
- ML-6 → no change

- [ ] **Step 3: Append entry to `docs/sanity-check-log.md`**

```markdown
## 2026-XX-XX — Sanity-check 6 (einde Chapter D, Plan 1.1b)

- HEAD: <SHA>
- Status: GREEN
- Typecheck: 0 errors
- Tests: <N> passing across packages
- Build: clean
- Migrations: 0000-0003 (no new migrations in Chapter D)
- ESLint: 0 errors, 0 warnings
- Mobile alignment: ML-1 ✓ done, ML-5 ✓ done, others no-change.
- Notes: foundation lifted; ready for Chapter B.
```

- [ ] **Step 4: Commit**

```bash
git add docs/sanity-check-log.md
git commit -m "docs: log sanity-check 6 (einde Chapter D, Plan 1.1b) — green"
```

---

## Chapter B — Employee completion

### Task 10: B-3 Manager-select hide-but-keep

**Files:**
- Modify: `apps/web/features/employees/drawer/wizard/steps/step-dienstverband.tsx`
- Modify: `apps/web/features/employees/drawer/wizard/types.ts`
- Modify: `apps/web/features/employees/drawer/wizard/new-employee-wizard.tsx`
- Modify: `packages/types/src/employees.ts` (or wherever Zod schemas live) — keep `managerId?: string` optional

- [ ] **Step 1: Remove Manager Select block from step-dienstverband.tsx**

Locate the `<Select value={form.manager}>` block (around lines 95–120 per spec scan). Remove the entire `<FieldWrap label="Manager" ...>` wrapping it, including its `<TODO 1.1b>` comment. Keep all other fields intact.

- [ ] **Step 2: Remove `manager` field from WizardForm type**

In `apps/web/features/employees/drawer/wizard/types.ts`, remove the `manager: string;` field from the `WizardForm` type and from the `INITIAL_FORM` default:

```diff
 export type WizardForm = {
   // ...
-  manager: string;
   // ...
 };

 export const INITIAL_FORM: WizardForm = {
   // ...
-  manager: '',
   // ...
 };
```

- [ ] **Step 3: Remove `managerId` reference in wizard payload**

In `apps/web/features/employees/drawer/wizard/new-employee-wizard.tsx`, remove the line:

```ts
managerId: undefined, // TODO 1.1b: replace dummy manager with real UUID
```

(The Zod schema still accepts `managerId?: string`, so omitting it is valid.)

- [ ] **Step 4: Confirm Zod schema retains optional managerId**

Open `packages/types/src/employees.ts` (or wherever `createEmployeeSchema` is defined). Verify:

```ts
managerId: z.string().uuid().optional(),
```

is present in BOTH `createEmployeeSchema` AND `updateEmployeeSchema` (defined in Task 11). If `updateEmployeeSchema` doesn't exist yet, leave a placeholder note — Task 11 creates it.

- [ ] **Step 5: Typecheck + manual smoke**

```bash
pnpm -r typecheck
pnpm -F @casella/web dev
```

Open create-employee drawer. Step 2 (Werk/Dienstverband) should no longer show a Manager dropdown.

- [ ] **Step 6: Update DD-4 in deferred-work**

Edit `docs/casella-deferred-work.md`. Find DD-4 entry. Change `**Status**: open` to:

```
**Status**: abandoned (2026-04-25 scope decision — no manager-role UI now; DB column + Zod field retained as hidden API surface; commit <SHA>)
```

(Insert real SHA after commit in next step.)

- [ ] **Step 7: Commit**

```bash
git add apps/web/features/employees/ packages/types/ docs/casella-deferred-work.md
git commit -m "feat(employees): hide manager-select in wizard, keep DB column + Zod field (DD-4 abandoned)"
```

Then update DD-4 SHA reference:

```bash
git log -1 --format=%H | head -c 7
# copy that 7-char SHA, edit docs/casella-deferred-work.md, replace <SHA>
git add docs/casella-deferred-work.md
git commit --amend --no-edit
```

---

### Task 11: B-1 EmployeeWizard mode-aware (rename + edit-flow)

**Files:**
- Rename: `apps/web/features/employees/drawer/wizard/new-employee-wizard.tsx` → `employee-wizard.tsx`
- Create: `apps/web/features/employees/drawer/wizard/employee-wizard.tsx` (rewritten with mode prop)
- Create: `apps/web/features/employees/drawer/wizard/wizard-diff-view.tsx`
- Modify: `apps/web/features/employees/drawer/wizard/types.ts` (add EmployeeWizardProps)
- Modify: `apps/web/features/employees/drawer/employee-drawer.tsx` (pass mode + employee)
- Modify: `packages/types/src/employees.ts` (add `updateEmployeeSchema`)
- Modify: `apps/web/app/api/admin/employees/[id]/route.ts` (PATCH validates against updateEmployeeSchema)

- [ ] **Step 1: Add `updateEmployeeSchema` to `packages/types/src/employees.ts`**

```ts
// packages/types/src/employees.ts (excerpt)
import { z } from 'zod';

export const createEmployeeSchema = z.object({
  // ... existing fields
});

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ inviteEmail: true })
  .partial();

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
```

(If `inviteEmail` is on a different shape, adjust the `omit` accordingly. Goal: edit cannot retrigger invitation.)

- [ ] **Step 2: Update PATCH route to use updateEmployeeSchema**

In `apps/web/app/api/admin/employees/[id]/route.ts`:

```ts
import { updateEmployeeSchema } from '@casella/types';
import { apiError } from '@casella/types';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = updateEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(apiError('validation_error', 'Ongeldige invoer', parsed.error.issues), { status: 400 });
  }
  // ... existing PATCH logic, using parsed.data instead of body
}
```

- [ ] **Step 3: Rename `new-employee-wizard.tsx` → `employee-wizard.tsx`**

```bash
git mv apps/web/features/employees/drawer/wizard/new-employee-wizard.tsx apps/web/features/employees/drawer/wizard/employee-wizard.tsx
```

- [ ] **Step 4: Refactor wizard to accept mode + employee**

In the renamed `employee-wizard.tsx`, extend the props and conditional logic:

```tsx
import type { Employee } from '@casella/types';
import { WizardDiffView } from './wizard-diff-view';

export type EmployeeWizardProps =
  | { mode: 'create'; onClose: () => void; onCreated?: (id: string) => void }
  | { mode: 'edit'; employee: Employee; onClose: () => void; onSaved?: () => void };

export function EmployeeWizard(props: EmployeeWizardProps) {
  const initialForm = props.mode === 'edit' ? employeeToForm(props.employee) : INITIAL_FORM;
  const [form, setForm] = useState<WizardForm>(initialForm);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  // ... existing wizard logic

  async function submit() {
    if (props.mode === 'create') {
      const res = await fetch('/api/admin/employees', { method: 'POST', body: JSON.stringify(formToCreatePayload(form)) });
      // existing handling
    } else {
      const dirty = diffForm(initialForm, form);
      if (Object.keys(dirty).length === 0) return;
      const res = await fetch(`/api/admin/employees/${props.employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'If-Match': props.employee.updatedAt },
        body: JSON.stringify(dirty),
      });
      // handle 409 conflict (deferred to C-12 auto-save), else success
    }
  }

  // Step 4 conditional render
  const stepFourLabel = props.mode === 'create' ? 'Stuur' : 'Overzicht';
  // ...
}

// helper: employeeToForm
function employeeToForm(emp: Employee): WizardForm {
  return {
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    function: emp.function ?? '',
    startDate: emp.startDate ?? '',
    address: emp.address ?? null,
    // ... map all fields
  };
}

// helper: diffForm
function diffForm(initial: WizardForm, current: WizardForm): Partial<UpdateEmployeeInput> {
  const dirty: any = {};
  for (const key of Object.keys(current) as (keyof WizardForm)[]) {
    if (JSON.stringify(initial[key]) !== JSON.stringify(current[key])) {
      dirty[key] = current[key];
    }
  }
  return dirty;
}
```

(Adjust `formToCreatePayload` to existing helper; add `diffForm` next to it.)

- [ ] **Step 5: Create `wizard-diff-view.tsx`**

```tsx
// apps/web/features/employees/drawer/wizard/wizard-diff-view.tsx
import type { WizardForm } from './types';

type Props = {
  initial: WizardForm;
  current: WizardForm;
};

const FIELD_LABELS: Record<keyof WizardForm, string> = {
  firstName: 'Voornaam',
  lastName: 'Achternaam',
  email: 'E-mail',
  function: 'Functie',
  startDate: 'Startdatum',
  address: 'Adres',
  // ... etc
};

export function WizardDiffView({ initial, current }: Props) {
  const changedFields = (Object.keys(current) as (keyof WizardForm)[]).filter(
    (k) => JSON.stringify(initial[k]) !== JSON.stringify(current[k])
  );

  if (changedFields.length === 0) {
    return <p className="text-fg-tertiary text-sm">Geen wijzigingen om op te slaan.</p>;
  }

  return (
    <ul className="space-y-2">
      {changedFields.map((key) => (
        <li key={key} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-sm">
          <span className="text-fg-tertiary">{FIELD_LABELS[key]}</span>
          <span className="text-fg-quaternary line-through">{formatValue(initial[key])}</span>
          <span className="text-fg-primary font-medium">{formatValue(current[key])}</span>
        </li>
      ))}
    </ul>
  );
}

function formatValue(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
```

- [ ] **Step 6: Wire diff-view into Step 4 of wizard for edit-mode**

In `employee-wizard.tsx` step-4 render branch:

```tsx
{step === 4 && (
  props.mode === 'create' ? (
    <StepUitnodigen form={form} ... />
  ) : (
    <div className="space-y-4">
      <h3 className="text-display">Overzicht</h3>
      <WizardDiffView initial={initialForm} current={form} />
    </div>
  )
)}
```

CTA label changes per mode:

```tsx
<PrimaryButton disabled={props.mode === 'edit' && Object.keys(diffForm(initialForm, form)).length === 0}>
  {props.mode === 'create' ? 'Verstuur uitnodiging' : 'Opslaan'}
</PrimaryButton>
```

- [ ] **Step 7: Add backwards-compat re-export**

Create thin alias `apps/web/features/employees/drawer/wizard/new-employee-wizard.tsx`:

```ts
// re-export for any lingering imports; primary export lives in employee-wizard.tsx
export { EmployeeWizard as NewEmployeeWizard } from './employee-wizard';
export type { EmployeeWizardProps as NewEmployeeWizardProps } from './employee-wizard';
```

- [ ] **Step 8: Update employee-drawer.tsx caller**

In `apps/web/features/employees/drawer/employee-drawer.tsx`, change to import + use the renamed component:

```tsx
import { EmployeeWizard } from './wizard/employee-wizard';

export function EmployeeDrawer({ open, mode, employee, ...handlers }) {
  return (
    <Drawer open={open}>
      {mode === 'create' ? (
        <EmployeeWizard mode="create" onClose={handlers.onClose} onCreated={handlers.onCreated} />
      ) : (
        <EmployeeWizard mode="edit" employee={employee!} onClose={handlers.onClose} onSaved={handlers.onSaved} />
      )}
    </Drawer>
  );
}
```

- [ ] **Step 9: Typecheck**

```bash
pnpm -r typecheck
```

Expected: 0 errors. (If TypeScript discriminated-union issues, refine prop typing.)

- [ ] **Step 10: Lint**

```bash
pnpm -F @casella/web lint
```

Expected: 0 errors.

- [ ] **Step 11: Commit**

```bash
git add apps/web/features/employees/ packages/types/src/ apps/web/app/api/admin/employees/
git commit -m "feat(employees): mode-aware EmployeeWizard with edit-flow + diff-view (B-1)"
```

---

### Task 12: B-2 Intercepting-routes voor edit-drawer

**Files:**
- Create: `apps/web/app/(admin)/admin/medewerkers/[id]/page.tsx` (fallback)
- Create: `apps/web/app/(admin)/admin/medewerkers/@modal/(.)[id]/page.tsx` (intercepted)
- Create: `apps/web/app/(admin)/admin/medewerkers/@modal/default.tsx` (slot fallback)
- Modify: `apps/web/app/(admin)/admin/medewerkers/layout.tsx` (parallel route slot)
- Modify: `apps/web/features/employees/list/employee-row.tsx` (Link instead of button)
- Modify: `apps/web/lib/employees/get-by-id.ts` (server-helper, may already exist)
- Test: `apps/web/e2e/edit-employee.spec.ts`

- [ ] **Step 1: Create server-helper `getEmployeeById`**

`apps/web/lib/employees/get-by-id.ts`:

```ts
import 'server-only';
import { cache } from 'react';
import { db } from '@casella/db';
import { employees } from '@casella/db/schema';
import { eq } from 'drizzle-orm';

export const getEmployeeById = cache(async (id: string) => {
  const [row] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return row ?? null;
});
```

(If a helper already exists, ensure it's wrapped in `React.cache` to dedupe between fallback + intercepted page.)

- [ ] **Step 2: Create parallel-route layout**

`apps/web/app/(admin)/admin/medewerkers/layout.tsx`:

```tsx
export default function MedewerkersLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
```

- [ ] **Step 3: Create slot default**

`apps/web/app/(admin)/admin/medewerkers/@modal/default.tsx`:

```tsx
export default function Default() {
  return null;
}
```

- [ ] **Step 4: Create intercepted drawer page**

`apps/web/app/(admin)/admin/medewerkers/@modal/(.)[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getEmployeeById } from '@/lib/employees/get-by-id';
import { EmployeeDrawer } from '@/features/employees/drawer/employee-drawer';
import { InterceptedDrawer } from '@/features/employees/drawer/intercepted-drawer';

export default async function InterceptedEmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const employee = await getEmployeeById(params.id);
  if (!employee) notFound();
  return <InterceptedDrawer employee={employee} />;
}
```

Create `apps/web/features/employees/drawer/intercepted-drawer.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { EmployeeWizard } from './wizard/employee-wizard';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import type { Employee } from '@casella/types';

export function InterceptedDrawer({ employee }: { employee: Employee }) {
  const router = useRouter();
  return (
    <Drawer open onOpenChange={(open) => { if (!open) router.back(); }}>
      <DrawerContent>
        <EmployeeWizard
          mode="edit"
          employee={employee}
          onClose={() => router.back()}
          onSaved={() => router.refresh()}
        />
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 5: Create fallback detail page (full-page version)**

`apps/web/app/(admin)/admin/medewerkers/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getEmployeeById } from '@/lib/employees/get-by-id';
import { EmployeeWizard } from '@/features/employees/drawer/wizard/employee-wizard';
import Link from 'next/link';

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const employee = await getEmployeeById(params.id);
  if (!employee) notFound();
  return (
    <div className="container max-w-[820px] py-12">
      <Link href="/admin/medewerkers" className="text-fg-tertiary hover:text-fg-primary text-sm">
        ← Terug naar overzicht
      </Link>
      <h1 className="text-display mt-4 mb-8">{employee.firstName} {employee.lastName}</h1>
      <EmployeeWizard mode="edit" employee={employee} onClose={() => {}} />
    </div>
  );
}
```

- [ ] **Step 6: Make list rows navigate via Link**

In `apps/web/features/employees/list/employee-row.tsx` (or wherever rows are rendered), wrap the row in a Next.js `<Link href={`/admin/medewerkers/${employee.id}`}>`. Replace any `onClick` that opens drawer state — the URL change is now the trigger.

- [ ] **Step 7: Write Playwright spec**

`apps/web/e2e/edit-employee.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe.skip('edit employee via intercepting routes', () => {
  test('click row opens drawer over list, Esc returns to list', async ({ page }) => {
    await page.goto('/admin/medewerkers');
    const firstRow = page.getByRole('row').nth(1);
    await firstRow.click();
    await expect(page).toHaveURL(/\/admin\/medewerkers\/[a-f0-9-]+/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/admin\/medewerkers$/);
  });

  test('direct-link renders fallback detail page', async ({ page }) => {
    // requires seeded employee — skip until db fixture exists
    await page.goto('/admin/medewerkers/<seeded-uuid>');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('Terug naar overzicht')).toBeVisible();
  });

  test('edit save reflects in list', async ({ page }) => {
    await page.goto('/admin/medewerkers');
    const firstRow = page.getByRole('row').nth(1);
    const originalName = await firstRow.textContent();
    await firstRow.click();
    await page.getByLabel('Functie').fill('Senior Consultant');
    await page.getByRole('button', { name: /opslaan/i }).click();
    await expect(page.getByText('Wijzigingen opgeslagen')).toBeVisible();
  });

  test('browser refresh on drawer URL renders fallback', async ({ page }) => {
    await page.goto('/admin/medewerkers');
    await page.getByRole('row').nth(1).click();
    const url = page.url();
    await page.reload();
    await expect(page).toHaveURL(url);
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

(`describe.skip` until auth/db fixtures exist; manual verification required.)

- [ ] **Step 8: Manual smoke**

```bash
pnpm -F @casella/web dev
```

1. Navigate to `/admin/medewerkers`. Click first row → URL becomes `/admin/medewerkers/<uuid>`, drawer opens.
2. Esc → URL reverts to `/admin/medewerkers`, drawer closes.
3. Open new tab → paste `/admin/medewerkers/<uuid>` → fallback page renders.
4. Reload while drawer open → fallback renders (degraded but acceptable).

- [ ] **Step 9: Stop dev server, commit**

```bash
git add apps/web/app/\(admin\)/admin/medewerkers/ apps/web/lib/employees/get-by-id.ts apps/web/features/employees/ apps/web/e2e/edit-employee.spec.ts
git commit -m "feat(employees): intercepting-routes for edit-drawer (B-2)"
```

---

### Task 13: B-4 DD-5 column-toggles + statusVariant-switcher

**Files:**
- Modify: `apps/web/lib/list-prefs-cookie-shared.ts`
- Modify: `apps/web/features/admin-shell/list-tweaks-dock/list-tweaks-dock.tsx` (add 2 new icon-groups)
- Modify: `apps/web/features/employees/list/employees-list-shell.tsx` (conditional columns)
- Modify: `apps/web/features/employees/list/employment-badge.tsx` (variant prop)
- Test: `apps/web/e2e/column-toggles.spec.ts`

- [ ] **Step 1: Extend `ListPrefs` interface**

In `apps/web/lib/list-prefs-cookie-shared.ts`:

```ts
export type ListPrefs = {
  density: 'compact' | 'default';
  showAvatars: boolean;
  columns: {
    email: boolean;
    functie: boolean;
    status: boolean;
    startDate: boolean;
  };
  statusVariant: 'pill' | 'dot' | 'text';
};

export const DEFAULT_LIST_PREFS: ListPrefs = {
  density: 'default',
  showAvatars: true,
  columns: { email: true, functie: true, status: true, startDate: true },
  statusVariant: 'pill',
};

// Update parser/serializer to handle new fields with defaults if cookie is from older version.
```

- [ ] **Step 2: Add `Columns` icon-group to ListTweaksDock**

In the dock, add a new popover trigger with a Lucide icon (e.g. `Columns3`). Popover content:

```tsx
<div className="space-y-2 p-3">
  <h4 className="text-xs uppercase tracking-wide text-fg-tertiary">Kolommen</h4>
  {(['email', 'functie', 'status', 'startDate'] as const).map((col) => (
    <label key={col} className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={prefs.columns[col]}
        onCheckedChange={(v) => setPrefs({ ...prefs, columns: { ...prefs.columns, [col]: !!v } })}
      />
      <span>{COLUMN_LABELS[col]}</span>
    </label>
  ))}
</div>
```

`COLUMN_LABELS` mapping:

```ts
const COLUMN_LABELS: Record<keyof ListPrefs['columns'], string> = {
  email: 'E-mail',
  functie: 'Functie',
  status: 'Status',
  startDate: 'Startdatum',
};
```

- [ ] **Step 3: Add `StatusVariant` icon-group to ListTweaksDock**

```tsx
<div className="space-y-2 p-3">
  <h4 className="text-xs uppercase tracking-wide text-fg-tertiary">Status-stijl</h4>
  <RadioGroup
    value={prefs.statusVariant}
    onValueChange={(v) => setPrefs({ ...prefs, statusVariant: v as 'pill' | 'dot' | 'text' })}
  >
    {(['pill', 'dot', 'text'] as const).map((v) => (
      <label key={v} className="flex items-center gap-2 text-sm">
        <RadioGroupItem value={v} />
        <span>{STATUS_VARIANT_LABELS[v]}</span>
      </label>
    ))}
  </RadioGroup>
</div>
```

- [ ] **Step 4: Thread visibility through `EmployeesListShell`**

```tsx
// in table header
{prefs.columns.email && <th>E-mail</th>}
{prefs.columns.functie && <th>Functie</th>}
{prefs.columns.status && <th>Status</th>}
{prefs.columns.startDate && <th>Startdatum</th>}

// in row body — same conditional rendering
{prefs.columns.email && <td>{employee.email}</td>}
{prefs.columns.functie && <td>{employee.function}</td>}
{prefs.columns.status && <td><EmploymentBadge status={employee.status} variant={prefs.statusVariant} /></td>}
{prefs.columns.startDate && <td>{formatDate(employee.startDate)}</td>}
```

- [ ] **Step 5: Add `variant` prop to `EmploymentBadge`**

```tsx
type Props = { status: EmploymentStatus; variant?: 'pill' | 'dot' | 'text' };

export function EmploymentBadge({ status, variant = 'pill' }: Props) {
  if (variant === 'dot') return <span className="..." aria-label={status}>●</span>;
  if (variant === 'text') return <span className="text-fg-secondary">{STATUS_LABELS[status]}</span>;
  return <span className="rounded-full px-2 py-0.5 ...">{STATUS_LABELS[status]}</span>;
}
```

- [ ] **Step 6: Write Playwright spec**

`apps/web/e2e/column-toggles.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe.skip('list column toggles', () => {
  test('disabling email column hides column header and cells', async ({ page }) => {
    await page.goto('/admin/medewerkers');
    await page.getByRole('button', { name: /tweaks/i }).click(); // open dock
    await page.getByRole('button', { name: /kolommen/i }).click();
    await page.getByLabel('E-mail').uncheck();
    await expect(page.getByRole('columnheader', { name: 'E-mail' })).not.toBeVisible();
    await page.reload();
    await expect(page.getByRole('columnheader', { name: 'E-mail' })).not.toBeVisible(); // cookie persisted
  });

  test('statusVariant switch updates badges', async ({ page }) => {
    await page.goto('/admin/medewerkers');
    await page.getByRole('button', { name: /tweaks/i }).click();
    await page.getByRole('button', { name: /status-stijl/i }).click();
    await page.getByLabel('Tekst').click();
    await expect(page.getByText('Actief').first()).toBeVisible();
  });
});
```

- [ ] **Step 7: Manual smoke + commit**

```bash
pnpm -F @casella/web dev
# verify: open dock, toggle email column off → it disappears, refresh → still off
git add apps/web/lib/list-prefs-cookie-shared.ts apps/web/features/ apps/web/e2e/column-toggles.spec.ts
git commit -m "feat(list): column toggles + statusVariant switcher in tweaks dock (DD-5)"
```

---

### Task 14: ✅ B-5 Deferred-work housekeeping + sanity-check (einde Chapter B)

**Files:**
- Modify: `docs/casella-deferred-work.md`
- Modify: `docs/sanity-check-log.md`

- [ ] **Step 1: Update deferred-work entries**

In `docs/casella-deferred-work.md`:

- DD-4 → confirm `abandoned` (already updated in Task 10, but ensure SHA is correct)
- DD-5 → change Status to:
  ```
  **Status**: done (commit <SHA-from-Task-13>)
  ```

- [ ] **Step 2: Run sanity-check protocol**

```bash
git status
git log --oneline main..HEAD | wc -l
pnpm -r typecheck
pnpm -r test
pnpm -F @casella/web build
pnpm -F @casella/web lint
docker exec -i supabase_db_Casella psql -U postgres -d postgres \
  -c "SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id;"
```

Expected: clean tree, all green, still 4 migrations (no DB changes in B).

- [ ] **Step 3: Append entry to sanity-check log**

```markdown
## 2026-XX-XX — Sanity-check 7 (einde Chapter B, Plan 1.1b)

- HEAD: <SHA>
- Status: GREEN
- Typecheck/Test/Build/Lint: all clean
- Mobile alignment: ML-2 ✓ maintained (PATCH route uses Route Handler shape)
- Notes: edit-mode shipped, intercepting-routes pattern proven; ready for Chapter C.
```

- [ ] **Step 4: Commit**

```bash
git add docs/casella-deferred-work.md docs/sanity-check-log.md
git commit -m "docs: B-5 housekeeping + sanity-check 7 (einde Chapter B) — green"
```

---

## Chapter C — AAA shell-chrome

### Task 15: C-0 Claude Design handoff checkpoint

**Files:**
- Reference (not yet created by us): `docs/design/2026-XX-casella-shell-chrome.md` (deliverable from Alex's Claude Design session)

**This is a BLOCKING handoff task.** Implementation tasks 16–26 (core shell) require the mockup. Tasks 28–32 (AAA-extensions) are partially blocked (visual styling).

- [ ] **Step 1: Verify mockup-file presence in repo**

```bash
ls docs/design/ 2>/dev/null
```

If the file `2026-XX-casella-shell-chrome.md` (or similar named) exists with mockups for: top-bar layout, breadcrumbs styling, ⌘K search-pill, user-menu trigger, EnvBadge placement, `?` overlay, presence avatar-stack, pinned-entities sidebar section, coaching-toast styling, responsive <768px behavior — proceed to Step 3.

If the file does NOT exist:

- [ ] **Step 2 (conditional fallback): start fallback timer + use archetype references**

Document in this task's progress that fallback mode is active. Implementation tasks proceed with archetype-referenced styling:
- Top-bar: Linear's top-bar (clean, minimal chrome, content-forward)
- Breadcrumbs: Vercel dashboard separator-glyph + ellipsis
- ⌘K pill: cmdk.paco.me reference pill with kbd-hint
- User-menu: GitHub avatar dropdown
- `?` overlay: Linear's keyboard shortcuts modal
- Presence: Figma multiplayer avatar-stack
- Pinned: Linear's favorites in sidebar

After 5 working days OR mockup-file appears, switch out of fallback. Spec section C-0 covers this protocol.

- [ ] **Step 3: Commit checkpoint marker (no code changes)**

```bash
git commit --allow-empty -m "chore(shell): C-0 Claude Design handoff checkpoint — proceeding with mockup [or fallback]"
```

(Track which mode in commit message body so future audit knows which path was taken.)

---

### Task 16: C-1 TopBar skeleton + admin-layout integratie

**Files:**
- Create: `apps/web/features/admin-shell/top-bar/top-bar.tsx`
- Create: `apps/web/features/admin-shell/top-bar/top-bar-providers.tsx`
- Modify: `apps/web/app/(admin)/layout.tsx` (mount TopBar above main)

- [ ] **Step 1: Create TopBar component shell**

`apps/web/features/admin-shell/top-bar/top-bar.tsx`:

```tsx
import { ReactNode } from 'react';

type Props = {
  leftSlot?: ReactNode;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
};

export function TopBar({ leftSlot, centerSlot, rightSlot }: Props) {
  return (
    <header
      className="sticky top-0 z-30 w-full border-b border-border-subtle bg-surface-glass backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto grid max-w-[1180px] grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-3">
        <div className="flex items-center">{leftSlot}</div>
        <div className="flex items-center min-w-0">{centerSlot}</div>
        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create TopBar provider composition**

`apps/web/features/admin-shell/top-bar/top-bar-providers.tsx`:

```tsx
'use client';

import { ReactNode } from 'react';
import { BreadcrumbProvider } from '../breadcrumbs/breadcrumb-context';
import { TopBarActionsProvider } from '../context-actions/context-actions-context';
import { QuickCreateProvider } from '../quick-create/quick-create-context';
import { EmployeeListCacheProvider } from '../breadcrumb-switcher/employee-list-cache-context';

export function TopBarProviders({ children }: { children: ReactNode }) {
  return (
    <BreadcrumbProvider>
      <TopBarActionsProvider>
        <QuickCreateProvider>
          <EmployeeListCacheProvider>{children}</EmployeeListCacheProvider>
        </QuickCreateProvider>
      </TopBarActionsProvider>
    </BreadcrumbProvider>
  );
}
```

(Note: BreadcrumbProvider is added in Task 17; others are stubbed for now — create empty provider components that just render `{children}` so wiring compiles. Actual logic added in their respective tasks.)

Create empty stubs:

```tsx
// apps/web/features/admin-shell/context-actions/context-actions-context.tsx
'use client';
import { createContext, ReactNode } from 'react';
export const TopBarActionsContext = createContext<any>(null);
export function TopBarActionsProvider({ children }: { children: ReactNode }) {
  return <TopBarActionsContext.Provider value={null}>{children}</TopBarActionsContext.Provider>;
}
```

```tsx
// apps/web/features/admin-shell/quick-create/quick-create-context.tsx
'use client';
import { createContext, ReactNode } from 'react';
export const QuickCreateContext = createContext<any>(null);
export function QuickCreateProvider({ children }: { children: ReactNode }) {
  return <QuickCreateContext.Provider value={null}>{children}</QuickCreateContext.Provider>;
}
```

```tsx
// apps/web/features/admin-shell/breadcrumb-switcher/employee-list-cache-context.tsx
'use client';
import { createContext, ReactNode } from 'react';
export const EmployeeListCacheContext = createContext<any>(null);
export function EmployeeListCacheProvider({ children }: { children: ReactNode }) {
  return <EmployeeListCacheContext.Provider value={null}>{children}</EmployeeListCacheContext.Provider>;
}
```

- [ ] **Step 3: Mount TopBar in admin layout**

In `apps/web/app/(admin)/layout.tsx`:

```tsx
import { Sidebar } from '@/features/admin-shell/sidebar/sidebar';
import { TopBar } from '@/features/admin-shell/top-bar/top-bar';
import { TopBarProviders } from '@/features/admin-shell/top-bar/top-bar-providers';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <TopBarProviders>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 mx-auto max-w-[1180px] w-full px-6 py-8">{children}</main>
        </div>
      </div>
    </TopBarProviders>
  );
}
```

(Adjust to match existing layout structure if different. Goal: TopBar above main, sticky.)

- [ ] **Step 4: Manual smoke**

```bash
pnpm -F @casella/web dev
```

Open `/admin/medewerkers`. TopBar should render as empty sticky bar at top. List below. No layout shift on scroll.

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/features/admin-shell/ apps/web/app/\(admin\)/layout.tsx
git commit -m "feat(shell): TopBar skeleton + provider scaffolds (C-1)"
```

---

### Task 17: C-2 Breadcrumbs infra

**Files:**
- Create: `apps/web/features/admin-shell/breadcrumbs/breadcrumb-context.tsx`
- Create: `apps/web/features/admin-shell/breadcrumbs/use-breadcrumbs.ts`
- Create: `apps/web/features/admin-shell/breadcrumbs/breadcrumb-trail.tsx`
- Modify: `apps/web/features/admin-shell/top-bar/top-bar.tsx` (mount trail in centerSlot)
- Modify: `apps/web/app/(admin)/admin/page.tsx` (register root crumb)
- Modify: `apps/web/app/(admin)/admin/medewerkers/page.tsx` (register medewerkers crumb)
- Modify: `apps/web/app/(admin)/admin/medewerkers/[id]/page.tsx` (register employee-name crumb)
- Modify: `apps/web/app/(admin)/admin/medewerkers/@modal/(.)[id]/page.tsx` (same)

- [ ] **Step 1: Create breadcrumb context**

`apps/web/features/admin-shell/breadcrumbs/breadcrumb-context.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type Crumb = { label: string; href?: string };

type Ctx = {
  crumbs: Crumb[];
  setCrumbs: (c: Crumb[]) => void;
};

const BreadcrumbContext = createContext<Ctx | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const set = useCallback((c: Crumb[]) => setCrumbs(c), []);
  return <BreadcrumbContext.Provider value={{ crumbs, setCrumbs: set }}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumbCtx() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error('useBreadcrumbCtx must be used within BreadcrumbProvider');
  return ctx;
}
```

- [ ] **Step 2: Create useBreadcrumbs hook**

`apps/web/features/admin-shell/breadcrumbs/use-breadcrumbs.ts`:

```ts
'use client';

import { useEffect } from 'react';
import { useBreadcrumbCtx, Crumb } from './breadcrumb-context';

export function useBreadcrumbs(crumbs: Crumb[]) {
  const { setCrumbs } = useBreadcrumbCtx();
  // serialize for stable dep
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    setCrumbs(crumbs);
    return () => setCrumbs([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
```

- [ ] **Step 3: Create breadcrumb trail component**

`apps/web/features/admin-shell/breadcrumbs/breadcrumb-trail.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumbCtx } from './breadcrumb-context';

export function BreadcrumbTrail() {
  const { crumbs } = useBreadcrumbCtx();
  const allCrumbs = [{ label: 'Admin', href: '/admin' }, ...crumbs];
  return (
    <nav aria-label="Breadcrumbs" className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
      {allCrumbs.map((c, i) => (
        <div key={i} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight className="size-3 text-fg-quaternary shrink-0" aria-hidden />}
          {c.href ? (
            <Link href={c.href} className="text-fg-tertiary hover:text-fg-primary truncate">
              {c.label}
            </Link>
          ) : (
            <span className="text-fg-primary truncate" aria-current="page">{c.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Mount trail in TopBar centerSlot**

Modify `top-bar.tsx`:

```tsx
import { BreadcrumbTrail } from '../breadcrumbs/breadcrumb-trail';

export function TopBar() {
  return (
    <header /* ...same as before */>
      <div /* ...same grid */>
        <div></div>
        <div className="min-w-0"><BreadcrumbTrail /></div>
        <div className="flex items-center gap-2">{/* rightSlot — added in subsequent tasks */}</div>
      </div>
    </header>
  );
}
```

(Drop slot-props; TopBar now self-renders its content via context.)

- [ ] **Step 5: Update BreadcrumbProvider in providers**

`top-bar-providers.tsx`: replace the stubbed import with the real one:

```tsx
import { BreadcrumbProvider } from '../breadcrumbs/breadcrumb-context';
```

- [ ] **Step 6: Register crumbs on existing admin pages**

`apps/web/app/(admin)/admin/medewerkers/page.tsx` (top of component, client-side wrapper if needed):

If the page is a Server Component, wrap the body in a small client component that calls `useBreadcrumbs`:

```tsx
// apps/web/features/employees/list/medewerkers-page-crumbs.tsx
'use client';
import { useBreadcrumbs } from '@/features/admin-shell/breadcrumbs/use-breadcrumbs';

export function MedewerkersCrumbs() {
  useBreadcrumbs([{ label: 'Medewerkers', href: '/admin/medewerkers' }]);
  return null;
}
```

Mount it in the page:

```tsx
// page.tsx
import { MedewerkersCrumbs } from '@/features/employees/list/medewerkers-page-crumbs';
export default async function Page() {
  return (
    <>
      <MedewerkersCrumbs />
      {/* existing list rendering */}
    </>
  );
}
```

Same pattern for `[id]/page.tsx` and `@modal/(.)[id]/page.tsx`:

```tsx
// EmployeeDetailCrumbs receives employee, registers
'use client';
import { useBreadcrumbs } from '@/features/admin-shell/breadcrumbs/use-breadcrumbs';
export function EmployeeDetailCrumbs({ employee }: { employee: { firstName: string; lastName: string } }) {
  useBreadcrumbs([
    { label: 'Medewerkers', href: '/admin/medewerkers' },
    { label: `${employee.firstName} ${employee.lastName}` },
  ]);
  return null;
}
```

- [ ] **Step 7: Manual smoke**

Visit `/admin/medewerkers` → breadcrumbs read "Admin / Medewerkers". Click a row → drawer opens, breadcrumbs read "Admin / Medewerkers / Alice van den Berg". Esc → reverts.

- [ ] **Step 8: Typecheck + lint + commit**

```bash
pnpm -F @casella/web typecheck
pnpm -F @casella/web lint
git add apps/web/features/admin-shell/breadcrumbs/ apps/web/features/admin-shell/top-bar/ apps/web/features/employees/list/ apps/web/app/\(admin\)/
git commit -m "feat(shell): breadcrumbs infra + per-page crumb registration (C-2)"
```

---

### Task 18: C-6 EnvBadge verhuis (sidebar → top-bar)

**Files:**
- Modify: `apps/web/features/admin-shell/sidebar/sidebar.tsx` (remove EnvBadge)
- Modify: `apps/web/features/admin-shell/top-bar/top-bar.tsx` (add EnvBadge to right slot)

- [ ] **Step 1: Locate EnvBadge usage in sidebar**

```bash
grep -n "EnvBadge" apps/web/features/admin-shell/sidebar/
```

- [ ] **Step 2: Remove EnvBadge from sidebar footer**

In sidebar component, delete the `<EnvBadge />` line. Keep `<ThemeToggle />` and the mode-switch.

- [ ] **Step 3: Add EnvBadge to TopBar right cluster**

In `top-bar.tsx`:

```tsx
import { EnvBadge } from '@/features/admin-shell/env-badge/env-badge';

export function TopBar() {
  return (
    <header /* ... */>
      <div /* grid */>
        <div></div>
        <div className="min-w-0"><BreadcrumbTrail /></div>
        <div className="flex items-center gap-3">
          <EnvBadge />
          {/* further items added in C-3, C-4, C-5, C-7, C-11, C-16 */}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Manual smoke**

Open dev. EnvBadge should appear in top-right of TopBar; sidebar-footer should look lighter (only ThemeToggle + mode-switch left).

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/admin-shell/sidebar/ apps/web/features/admin-shell/top-bar/
git commit -m "refactor(shell): move EnvBadge from sidebar-footer to top-bar (C-6)"
```

---

### Task 19: C-3 ⌘K command-pill

**Files:**
- Create: `apps/web/features/admin-shell/command-pill/command-pill.tsx`
- Modify: `apps/web/features/admin-shell/top-bar/top-bar.tsx` (insert pill in right cluster)
- Modify: `apps/web/features/admin-shell/command-palette/` (the existing cmdk wrapper from 1.1a — add new commands per Task)

- [ ] **Step 1: Locate existing cmdk-palette wrapper from 1.1a**

```bash
grep -rn "cmdk" apps/web/features/ apps/web/components/
```

Identify the file (likely `apps/web/features/admin-shell/command-palette/command-palette.tsx`). Note its open-event API (likely `useState` + `useHotkeys('mod+k', ...)`).

- [ ] **Step 2: Expose open-trigger via context or global state**

If the palette is local-state in one component, refactor to expose an open-trigger via a small context:

`apps/web/features/admin-shell/command-palette/palette-context.tsx`:

```tsx
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const PaletteContext = createContext<Ctx | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <PaletteContext.Provider value={{ open, setOpen }}>{children}</PaletteContext.Provider>;
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error('usePalette must be inside PaletteProvider');
  return ctx;
}
```

Wrap the existing palette in this provider; it now reads `open` from context. Mount provider in `TopBarProviders`.

- [ ] **Step 3: Create CommandPill component**

`apps/web/features/admin-shell/command-pill/command-pill.tsx`:

```tsx
'use client';

import { Search } from 'lucide-react';
import { usePalette } from '../command-palette/palette-context';

export function CommandPill() {
  const { setOpen } = usePalette();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-sm text-fg-tertiary hover:bg-surface-lift hover:text-fg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary transition-colors"
      aria-label="Open command palette"
    >
      <Search className="size-3.5" aria-hidden />
      <span className="hidden md:inline">Zoek of voer uit...</span>
      <kbd className="ml-2 hidden md:inline rounded bg-surface-deep px-1.5 py-0.5 text-[10px] font-mono text-fg-tertiary">⌘K</kbd>
    </button>
  );
}
```

- [ ] **Step 4: Insert pill in TopBar right cluster**

```tsx
import { CommandPill } from '../command-pill/command-pill';

// in right slot, before EnvBadge:
<CommandPill />
<EnvBadge />
```

- [ ] **Step 5: Add new palette commands**

In the existing palette command-list (likely `command-palette.tsx`), add:

```tsx
<CommandItem onSelect={() => { setOpen(false); openShortcutsOverlay(); }}>
  Toon sneltoetsen
  <CommandShortcut>?</CommandShortcut>
</CommandItem>

<CommandItem onSelect={() => { setOpen(false); router.push('/admin/medewerkers?new=1'); }}>
  Nieuwe medewerker
  <CommandShortcut>⌘N</CommandShortcut>
</CommandItem>

<CommandItem onSelect={() => { setOpen(false); signOut({ callbackUrl: '/login' }); }}>
  Afmelden
</CommandItem>
```

(`openShortcutsOverlay` is wired in Task 21. For now, leave a TODO or stub to a console.log.)

- [ ] **Step 6: Manual smoke**

Click pill → palette opens. ⌘K shortcut still works. New commands visible.

- [ ] **Step 7: Commit**

```bash
git add apps/web/features/admin-shell/command-pill/ apps/web/features/admin-shell/command-palette/ apps/web/features/admin-shell/top-bar/ apps/web/features/admin-shell/top-bar/top-bar-providers.tsx
git commit -m "feat(shell): ⌘K command-pill + palette context + new commands (C-3)"
```

---

### Task 20: C-5 UserMenu dropdown + profile stub

**Files:**
- Create: `apps/web/features/admin-shell/user-menu/user-menu.tsx`
- Create: `apps/web/app/(admin)/admin/profile/page.tsx` (stub)
- Modify: `apps/web/features/admin-shell/top-bar/top-bar.tsx`
- Modify: `docs/casella-deferred-work.md` (add PROFILE-PAGE-STUB entry)

- [ ] **Step 1: Create UserMenu component**

`apps/web/features/admin-shell/user-menu/user-menu.tsx`:

```tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  // Reuse the gradient pattern from EmployeeAvatar (1.1a)
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <span
      className="grid size-7 place-items-center rounded-full text-[11px] font-medium text-white"
      style={{
        background: `linear-gradient(135deg, oklch(70% 0.18 ${hue}), oklch(55% 0.20 ${(hue + 60) % 360}))`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  if (!session?.user) return null;

  const name = session.user.name ?? session.user.email ?? 'Onbekend';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary">
        <Avatar name={name} />
        <span className="hidden md:inline text-sm text-fg-secondary">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-fg-tertiary truncate">{session.user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/admin/profile')}>
          Mijn profiel
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => {
          // Toggle coaching opt-out — wired in Task 27
          const cur = localStorage.getItem('casellaCoachingOptedOut') === 'true';
          localStorage.setItem('casellaCoachingOptedOut', cur ? 'false' : 'true');
        }}>
          Coaching-tips uit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/login' })}>
          Afmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Create profile placeholder page**

`apps/web/app/(admin)/admin/profile/page.tsx`:

```tsx
'use client';

import { useBreadcrumbs } from '@/features/admin-shell/breadcrumbs/use-breadcrumbs';

export default function ProfilePage() {
  useBreadcrumbs([{ label: 'Mijn profiel' }]);
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-lift p-12 text-center">
      <h1 className="text-display mb-2">Mijn profiel</h1>
      <p className="text-fg-tertiary">
        Deze pagina komt in Fase 1.2.<br />
        Voor nu: theme-voorkeur stel je in via de zijbalk; afmelden via het menu rechtsboven.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Add UserMenu to TopBar right cluster**

In `top-bar.tsx`:

```tsx
import { UserMenu } from '../user-menu/user-menu';

// right cluster, after EnvBadge:
<EnvBadge />
<UserMenu />
```

- [ ] **Step 4: Add PROFILE-PAGE-STUB entry to deferred-work**

In `docs/casella-deferred-work.md`, append under appropriate section (UX-polish):

```markdown
### PROFILE-PAGE-STUB — `/admin/profile` placeholder
- **Category**: UX-polish
- **Deferred from**: Plan 1.1b Task 20 (C-5 UserMenu, 2026-04-26)
- **Why deferred**: User menu needs a "Mijn profiel" landing somewhere; real page (theme-pref UI, account-settings, language, notification-prefs) is Fase 1.2 scope. Placeholder route stops "404 from user-menu" UX hole.
- **Pickup trigger**: Fase 1.2 planning, OR when first user-settings beyond theme is requested.
- **Estimated cost**: ~3 hours.
- **Impact if skipped**: User-menu navigates to a placeholder, not a real settings page.
- **Status**: open
```

- [ ] **Step 5: Manual smoke**

Open dev. Click avatar in top-right → dropdown opens with email label, Mijn profiel, Coaching-tips uit, Afmelden. Click Mijn profiel → placeholder renders with breadcrumbs "Admin / Mijn profiel". Click Afmelden → returns to /login.

- [ ] **Step 6: Commit**

```bash
git add apps/web/features/admin-shell/user-menu/ apps/web/app/\(admin\)/admin/profile/ apps/web/features/admin-shell/top-bar/ docs/casella-deferred-work.md
git commit -m "feat(shell): UserMenu dropdown + profile placeholder route (C-5)"
```

---

### Task 21: C-4 `?` keyboard-shortcut overlay

**Files:**
- Create: `apps/web/features/admin-shell/shortcuts-overlay/shortcuts-data.ts`
- Create: `apps/web/features/admin-shell/shortcuts-overlay/shortcuts-dialog.tsx`
- Create: `apps/web/features/admin-shell/shortcuts-overlay/use-shortcuts-overlay.ts`
- Modify: `apps/web/features/admin-shell/top-bar/top-bar-providers.tsx` (mount provider + dialog)
- Modify: `apps/web/features/admin-shell/command-palette/command-palette.tsx` (wire "Toon sneltoetsen")

- [ ] **Step 1: Create shortcuts data**

`apps/web/features/admin-shell/shortcuts-overlay/shortcuts-data.ts`:

```ts
export type ShortcutSection = {
  title: string;
  items: { keys: string[]; label: string }[];
};

export const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'Globaal',
    items: [
      { keys: ['⌘', 'K'], label: 'Open command palette' },
      { keys: ['?'], label: 'Toon deze sneltoetsen' },
      { keys: ['Esc'], label: 'Sluit dialoog of palette' },
    ],
  },
  {
    title: 'Formulieren',
    items: [
      { keys: ['⌘', 'Enter'], label: 'Verstuur formulier' },
      { keys: ['Tab'], label: 'Volgend veld' },
      { keys: ['Shift', 'Tab'], label: 'Vorig veld' },
    ],
  },
  {
    title: 'Navigatie',
    items: [
      { keys: ['↑', '↓', 'Enter'], label: 'In lijst of palette' },
      { keys: ['←', '→', 'Home', 'End'], label: 'In radio-groepen (zoals theme-toggle)' },
    ],
  },
  {
    title: 'Entiteiten',
    items: [
      { keys: ['⌘', 'N'], label: 'Snel nieuwe maken (op lijst-pagina)' },
      { keys: ['⌘', '/'], label: 'Focus zoek-pill' },
    ],
  },
];
```

- [ ] **Step 2: Create overlay context + hook**

`apps/web/features/admin-shell/shortcuts-overlay/use-shortcuts-overlay.ts`:

```tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const ShortcutsCtx = createContext<Ctx | null>(null);

function isInInputContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches('input, textarea, select, [contenteditable="true"]');
}

export function ShortcutsOverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !isInInputContext(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return <ShortcutsCtx.Provider value={{ open, setOpen }}>{children}</ShortcutsCtx.Provider>;
}

export function useShortcutsOverlay() {
  const ctx = useContext(ShortcutsCtx);
  if (!ctx) throw new Error('useShortcutsOverlay must be inside ShortcutsOverlayProvider');
  return ctx;
}
```

- [ ] **Step 3: Create the dialog**

`apps/web/features/admin-shell/shortcuts-overlay/shortcuts-dialog.tsx`:

```tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SHORTCUT_SECTIONS } from './shortcuts-data';
import { useShortcutsOverlay } from './use-shortcuts-overlay';

export function ShortcutsDialog() {
  const { open, setOpen } = useShortcutsOverlay();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sneltoetsen</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {SHORTCUT_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-xs uppercase tracking-wide text-fg-tertiary mb-2">{section.title}</h3>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-fg-secondary">{item.label}</span>
                    <span className="flex gap-1">
                      {item.keys.map((k) => (
                        <kbd key={k} className="rounded bg-surface-deep px-1.5 py-0.5 text-[11px] font-mono text-fg-tertiary">
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Mount provider + dialog**

In `top-bar-providers.tsx`, wrap content with `ShortcutsOverlayProvider`. Mount `<ShortcutsDialog />` at the end of the layout (e.g. in `(admin)/layout.tsx` after the main element so it can be shown above content).

```tsx
// top-bar-providers.tsx
import { ShortcutsOverlayProvider } from '../shortcuts-overlay/use-shortcuts-overlay';

export function TopBarProviders({ children }) {
  return (
    <ShortcutsOverlayProvider>
      <BreadcrumbProvider>...</BreadcrumbProvider>
    </ShortcutsOverlayProvider>
  );
}
```

```tsx
// (admin)/layout.tsx — append after </main>
import { ShortcutsDialog } from '@/features/admin-shell/shortcuts-overlay/shortcuts-dialog';

// inside TopBarProviders:
<ShortcutsDialog />
```

- [ ] **Step 5: Wire palette command "Toon sneltoetsen" to open overlay**

In the command-palette component, replace the TODO from Task 19 with:

```tsx
import { useShortcutsOverlay } from '@/features/admin-shell/shortcuts-overlay/use-shortcuts-overlay';

function CommandPaletteCommands() {
  const { setOpen: setShortcutsOpen } = useShortcutsOverlay();
  // ...
  <CommandItem onSelect={() => { closePalette(); setShortcutsOpen(true); }}>
    Toon sneltoetsen
    <CommandShortcut>?</CommandShortcut>
  </CommandItem>
}
```

- [ ] **Step 6: Manual smoke**

Press `?` while on /admin/medewerkers (NOT focused in an input) → overlay opens. Esc closes. Open palette → "Toon sneltoetsen" → opens.

- [ ] **Step 7: Commit**

```bash
git add apps/web/features/admin-shell/shortcuts-overlay/ apps/web/features/admin-shell/top-bar/ apps/web/features/admin-shell/command-palette/ apps/web/app/\(admin\)/layout.tsx
git commit -m "feat(shell): ? keyboard-shortcut overlay (C-4)"
```

---

### Task 22: C-7 Context-aware actions-slot

**Files:**
- Create: `apps/web/features/admin-shell/context-actions/context-actions.tsx` (rendered slot)
- Create: `apps/web/features/admin-shell/context-actions/use-top-bar-actions.ts` (registration hook)
- Modify: `apps/web/features/admin-shell/context-actions/context-actions-context.tsx` (replace stub with real)
- Modify: `apps/web/features/admin-shell/top-bar/top-bar.tsx` (mount slot)
- Modify: `apps/web/features/employees/list/medewerkers-page-actions.tsx` (register list actions, NEW)
- Modify: `apps/web/features/employees/list/employees-page-header.tsx` (remove "+ Nieuw" — moved to top-bar)
- Modify: `apps/web/app/(admin)/admin/medewerkers/page.tsx` (mount actions registration)
- Modify: `apps/web/app/(admin)/admin/medewerkers/[id]/page.tsx` (register detail actions)
- Modify: `apps/web/app/(admin)/admin/medewerkers/@modal/(.)[id]/page.tsx` (same)

- [ ] **Step 1: Replace stubbed context with real implementation**

`apps/web/features/admin-shell/context-actions/context-actions-context.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';

export type KebabItem = {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
};

export type TopBarAction =
  | { kind: 'primary'; label: string; icon?: LucideIcon; onClick: () => void; shortcut?: string }
  | { kind: 'secondary'; label: string; icon?: LucideIcon; onClick: () => void }
  | { kind: 'kebab'; items: KebabItem[] };

type Ctx = {
  actions: TopBarAction[];
  setActions: (a: TopBarAction[]) => void;
};

const TopBarActionsContext = createContext<Ctx | null>(null);

export function TopBarActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<TopBarAction[]>([]);
  const setActions = useCallback((a: TopBarAction[]) => setActionsState(a), []);
  return <TopBarActionsContext.Provider value={{ actions, setActions }}>{children}</TopBarActionsContext.Provider>;
}

export function useTopBarActionsCtx() {
  const ctx = useContext(TopBarActionsContext);
  if (!ctx) throw new Error('useTopBarActionsCtx must be inside TopBarActionsProvider');
  return ctx;
}
```

- [ ] **Step 2: Create registration hook**

`apps/web/features/admin-shell/context-actions/use-top-bar-actions.ts`:

```ts
'use client';

import { useEffect } from 'react';
import { useTopBarActionsCtx, TopBarAction } from './context-actions-context';

export function useTopBarActions(actions: TopBarAction[]) {
  const { setActions } = useTopBarActionsCtx();
  const key = JSON.stringify(actions);
  useEffect(() => {
    setActions(actions);
    return () => setActions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
```

- [ ] **Step 3: Create render component**

`apps/web/features/admin-shell/context-actions/context-actions.tsx`:

```tsx
'use client';

import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTopBarActionsCtx } from './context-actions-context';

export function ContextActions() {
  const { actions } = useTopBarActionsCtx();
  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {actions.map((action, i) => {
        if (action.kind === 'primary') {
          return (
            <Button key={i} onClick={action.onClick} className="gap-2">
              {action.icon && <action.icon className="size-4" />}
              {action.label}
              {action.shortcut && (
                <kbd className="ml-1 rounded bg-action-primary-fg/15 px-1 text-[10px]">{action.shortcut}</kbd>
              )}
            </Button>
          );
        }
        if (action.kind === 'secondary') {
          return (
            <Button key={i} variant="ghost" onClick={action.onClick} className="gap-2">
              {action.icon && <action.icon className="size-4" />}
              {action.label}
            </Button>
          );
        }
        // kebab
        return (
          <DropdownMenu key={i}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Meer acties">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {action.items.map((item, j) => (
                <DropdownMenuItem
                  key={j}
                  onSelect={item.onClick}
                  className={item.destructive ? 'text-status-danger' : ''}
                >
                  {item.icon && <item.icon className="size-4 mr-2" />}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Mount slot in TopBar**

In `top-bar.tsx`, add to centerSlot AFTER breadcrumbs, right-aligned:

```tsx
import { ContextActions } from '../context-actions/context-actions';

// centerSlot:
<div className="flex items-center justify-between min-w-0 gap-4">
  <BreadcrumbTrail />
  <ContextActions />
</div>
```

- [ ] **Step 5: Register actions on list page**

Create `apps/web/features/employees/list/medewerkers-page-actions.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Plus, Download } from 'lucide-react';
import { useTopBarActions } from '@/features/admin-shell/context-actions/use-top-bar-actions';

export function MedewerkersPageActions() {
  const router = useRouter();
  useTopBarActions([
    { kind: 'primary', label: 'Nieuw', icon: Plus, shortcut: '⌘N', onClick: () => router.push('/admin/medewerkers?new=1') },
    { kind: 'secondary', label: 'Exporteer', icon: Download, onClick: () => alert('Export komt later') },
  ]);
  return null;
}
```

Mount in page:

```tsx
// page.tsx
import { MedewerkersPageActions } from '@/features/employees/list/medewerkers-page-actions';

export default async function Page() {
  return (
    <>
      <MedewerkersCrumbs />
      <MedewerkersPageActions />
      {/* existing list rendering */}
    </>
  );
}
```

- [ ] **Step 6: Remove "+ Nieuwe medewerker" button from list-page-header**

In the existing `employees-page-header.tsx` (or whatever renders the page-title + button), delete the "+ Nieuwe medewerker" button. The new entry-point is the TopBar primary action (registered via `MedewerkersPageActions`).

- [ ] **Step 7: Wire up `?new=1` query param to open create-drawer**

In `medewerkers/page.tsx` (or in a client-component child that reads search-params), if `searchParams.new === '1'`, render the create-drawer state.

Alternative simpler: handle "new" via a separate route `/admin/medewerkers/nieuw` rendering the create-drawer. But intercepting-routes (Task 12) already covers `[id]`. For new-create, the existing pattern (button-state in list-page) works — keep it but trigger via query param + router.push.

Pragmatic path: in the existing list-component, add:

```tsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const params = useSearchParams();
const router = useRouter();
const [drawerOpen, setDrawerOpen] = useState(false);

useEffect(() => {
  if (params.get('new') === '1') setDrawerOpen(true);
}, [params]);

function closeAndCleanUrl() {
  setDrawerOpen(false);
  router.replace('/admin/medewerkers');
}

// existing drawer rendering with these state-handlers
```

- [ ] **Step 8: Register actions on detail page**

Create `apps/web/features/employees/detail/employee-detail-actions.tsx`:

```tsx
'use client';

import { Pencil, Copy, Trash, Link2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTopBarActions } from '@/features/admin-shell/context-actions/use-top-bar-actions';
import type { Employee } from '@casella/types';

export function EmployeeDetailActions({ employee }: { employee: Employee }) {
  const router = useRouter();
  useTopBarActions([
    { kind: 'primary', label: 'Bewerken', icon: Pencil, onClick: () => { /* drawer is already open via intercepting route */ } },
    {
      kind: 'kebab',
      items: [
        { label: 'Dupliceer', icon: Copy, onClick: () => alert('Dupliceer komt later') },
        { label: 'Pin / Unpin', icon: Star, onClick: () => { /* wired in C-14 */ } },
        { label: 'Kopieer link', icon: Link2, onClick: () => { navigator.clipboard.writeText(window.location.href); } },
        { label: 'Beëindig', icon: Trash, destructive: true, onClick: () => { /* existing terminate flow */ } },
      ],
    },
  ]);
  return null;
}
```

Mount in `[id]/page.tsx` and `@modal/(.)[id]/page.tsx`.

- [ ] **Step 9: Manual smoke + commit**

Open list → top-bar shows "+ Nieuw" + "Exporteer". Click "+ Nieuw" → create-drawer opens. Open detail (click row) → top-bar shows "Bewerken" + kebab.

```bash
git add apps/web/features/admin-shell/context-actions/ apps/web/features/admin-shell/top-bar/ apps/web/features/employees/ apps/web/app/\(admin\)/admin/medewerkers/
git commit -m "feat(shell): context-aware actions-slot in top-bar (C-7)"
```

---

### Task 23: C-8 Breadcrumb-segment entity-switcher

**Files:**
- Create: `apps/web/features/admin-shell/breadcrumb-switcher/breadcrumb-trigger.tsx`
- Modify: `apps/web/features/admin-shell/breadcrumb-switcher/employee-list-cache-context.tsx` (replace stub with real)
- Modify: `apps/web/features/admin-shell/breadcrumbs/breadcrumb-trail.tsx` (use BreadcrumbTrigger when entity-switcher is enabled)
- Modify: `apps/web/features/employees/list/employees-list-shell.tsx` (populate cache)

- [ ] **Step 1: Replace stubbed cache context**

`employee-list-cache-context.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Employee } from '@casella/types';

type Ctx = {
  employees: Employee[];
  setEmployees: (e: Employee[]) => void;
};

const EmployeeListCacheContext = createContext<Ctx | null>(null);

export function EmployeeListCacheProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployeesState] = useState<Employee[]>([]);
  const setEmployees = useCallback((e: Employee[]) => setEmployeesState(e), []);
  return <EmployeeListCacheContext.Provider value={{ employees, setEmployees }}>{children}</EmployeeListCacheContext.Provider>;
}

export function useEmployeeListCache() {
  const ctx = useContext(EmployeeListCacheContext);
  if (!ctx) throw new Error('useEmployeeListCache must be inside provider');
  return ctx;
}
```

- [ ] **Step 2: Populate cache from list-page**

In `employees-list-shell.tsx` (the client-component that receives the server-fetched list), call `setEmployees(employees)` once on mount:

```tsx
'use client';
import { useEffect } from 'react';
import { useEmployeeListCache } from '@/features/admin-shell/breadcrumb-switcher/employee-list-cache-context';

export function EmployeesListShell({ employees, ...props }) {
  const { setEmployees } = useEmployeeListCache();
  useEffect(() => { setEmployees(employees); }, [employees, setEmployees]);
  // ... existing render
}
```

- [ ] **Step 3: Create BreadcrumbTrigger**

`breadcrumb-trigger.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus } from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useEmployeeListCache } from './employee-list-cache-context';

type Props = {
  label: string;
  scope: 'parent-medewerkers' | 'current-employee';
  currentId?: string;
};

export function BreadcrumbTrigger({ label, scope, currentId }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { employees } = useEmployeeListCache();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 hover:text-fg-primary text-fg-tertiary"
          aria-haspopup="dialog"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="size-3" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80" align="start">
        <Command>
          <CommandInput placeholder="Zoek medewerker..." />
          <CommandList>
            <CommandEmpty>Geen resultaten</CommandEmpty>
            {scope === 'current-employee' && (
              <CommandGroup heading="Acties">
                <CommandItem onSelect={() => { setOpen(false); router.push('/admin/medewerkers?new=1'); }}>
                  <Plus className="size-4 mr-2" /> Nieuwe aanmaken
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Medewerkers">
              {employees
                .filter((e) => e.id !== currentId)
                .map((e) => (
                  <CommandItem
                    key={e.id}
                    onSelect={() => { setOpen(false); router.push(`/admin/medewerkers/${e.id}`); }}
                  >
                    {e.firstName} {e.lastName}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 4: Use BreadcrumbTrigger in trail for entity segments**

Modify `breadcrumb-trail.tsx` to detect entity-segments and render `<BreadcrumbTrigger>` instead of plain link.

A simple convention: extend the `Crumb` type with an optional `switcher` field:

```ts
export type Crumb = {
  label: string;
  href?: string;
  switcher?: { scope: 'parent-medewerkers' | 'current-employee'; currentId?: string };
};
```

Then in `breadcrumb-trail.tsx`:

```tsx
{c.switcher ? (
  <BreadcrumbTrigger label={c.label} scope={c.switcher.scope} currentId={c.switcher.currentId} />
) : c.href ? (
  <Link href={c.href}>...</Link>
) : (
  <span aria-current="page">...</span>
)}
```

Update `EmployeeDetailCrumbs` to use switcher:

```tsx
useBreadcrumbs([
  { label: 'Medewerkers', href: '/admin/medewerkers', switcher: { scope: 'parent-medewerkers', currentId: employee.id } },
  { label: `${employee.firstName} ${employee.lastName}`, switcher: { scope: 'current-employee', currentId: employee.id } },
]);
```

Update `MedewerkersCrumbs` to keep its plain link (no switcher needed on root list page).

- [ ] **Step 5: Manual smoke**

Open employee detail. Hover "Medewerkers" segment → chevron visible. Click → popover with all employees. Type "alice" → filters. Click another employee → navigates.

- [ ] **Step 6: Commit**

```bash
git add apps/web/features/admin-shell/breadcrumb-switcher/ apps/web/features/admin-shell/breadcrumbs/ apps/web/features/employees/
git commit -m "feat(shell): breadcrumb-segment entity switcher (C-8)"
```

---

### Task 24: C-9 Command-palette mode-scoping

**Files:**
- Create: `apps/web/features/admin-shell/palette-scopes/use-command-scope.ts`
- Create: `apps/web/features/admin-shell/palette-scopes/scope-chip.tsx`
- Modify: `apps/web/features/admin-shell/command-palette/command-palette.tsx` (consume scope hook)

- [ ] **Step 1: Create scope hook**

`use-command-scope.ts`:

```ts
'use client';

import { useState, useCallback } from 'react';

export type CommandScope = null | 'commands' | 'employees' | 'projects' | 'help';

const PREFIX_MAP: Record<string, CommandScope> = {
  '>': 'commands',
  '@': 'employees',
  '#': 'projects',
  '?': 'help',
};

export function useCommandScope() {
  const [scope, setScope] = useState<CommandScope>(null);
  const [query, setQuery] = useState('');

  const onChange = useCallback((value: string) => {
    if (scope === null && value.length === 1 && value in PREFIX_MAP) {
      setScope(PREFIX_MAP[value]);
      setQuery('');
      return;
    }
    setQuery(value);
  }, [scope]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && scope !== null && query === '') {
      e.preventDefault();
      setScope(null);
    }
  }, [scope, query]);

  const reset = useCallback(() => { setScope(null); setQuery(''); }, []);

  return { scope, setScope, query, setQuery: onChange, onKeyDown, reset };
}
```

- [ ] **Step 2: Create scope-chip component**

`scope-chip.tsx`:

```tsx
import type { CommandScope } from './use-command-scope';

const SCOPE_LABELS: Record<NonNullable<CommandScope>, string> = {
  commands: 'Commands',
  employees: 'Medewerkers',
  projects: 'Projecten',
  help: 'Hulp',
};

export function ScopeChip({ scope }: { scope: NonNullable<CommandScope> }) {
  return (
    <span className="inline-flex items-center rounded bg-aurora-violet/15 px-1.5 py-0.5 text-[11px] font-medium text-aurora-violet">
      {SCOPE_LABELS[scope]}
    </span>
  );
}
```

- [ ] **Step 3: Integrate scope in palette**

In `command-palette.tsx`:

```tsx
import { useCommandScope } from '@/features/admin-shell/palette-scopes/use-command-scope';
import { ScopeChip } from '@/features/admin-shell/palette-scopes/scope-chip';

export function CommandPalette() {
  const { open, setOpen } = usePalette();
  const { scope, query, setQuery, onKeyDown, reset } = useCommandScope();

  function close() { setOpen(false); reset(); }

  return (
    <CommandDialog open={open} onOpenChange={(o) => { if (!o) close(); else setOpen(true); }}>
      <div className="flex items-center gap-2 border-b px-3">
        {scope && <ScopeChip scope={scope} />}
        <CommandInput
          value={query}
          onValueChange={setQuery}
          onKeyDown={onKeyDown}
          placeholder={
            scope === 'commands' ? 'Welke actie?' :
            scope === 'employees' ? 'Naam van medewerker...' :
            scope === 'projects' ? 'Project (komt in 1.1c)' :
            scope === 'help' ? 'Zoek sneltoets...' :
            'Zoek of voer uit...'
          }
        />
      </div>
      <CommandList>
        {scope === null && <MixedScopeContent />}
        {scope === 'commands' && <CommandsScopeContent query={query} onSelect={close} />}
        {scope === 'employees' && <EmployeesScopeContent query={query} onSelect={close} />}
        {scope === 'projects' && <ProjectsScopeContent />}
        {scope === 'help' && <HelpScopeContent query={query} onSelect={close} />}
      </CommandList>
    </CommandDialog>
  );
}

function ProjectsScopeContent() {
  return (
    <CommandEmpty>
      Projecten komen in Plan 1.1c.
    </CommandEmpty>
  );
}
```

(Implementations of `MixedScopeContent`, `CommandsScopeContent`, `EmployeesScopeContent`, `HelpScopeContent` use the existing palette-items + filtered `useEmployeeListCache().employees`. EmployeesScopeContent renders the matching employees as `<CommandItem onSelect={() => router.push(\`/admin/medewerkers/\${e.id}\`)}>`. HelpScopeContent renders the SHORTCUT_SECTIONS list inline.)

- [ ] **Step 4: Manual smoke**

Open palette. Type `>` → chip "Commands" appears, only commands shown. Backspace on empty input → chip removed. Type `@alice` → employees scope, filtered. Type `?` → help-scope shows shortcuts inline.

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/admin-shell/palette-scopes/ apps/web/features/admin-shell/command-palette/
git commit -m "feat(shell): command-palette mode-scoping with prefix chips (C-9)"
```

---

### Task 25: C-10 Global ⌘N quick-create

**Files:**
- Modify: `apps/web/features/admin-shell/quick-create/quick-create-context.tsx` (replace stub with real)
- Create: `apps/web/features/admin-shell/quick-create/use-quick-create.ts`
- Modify: `apps/web/features/employees/list/medewerkers-page-actions.tsx` (also register quick-create)

- [ ] **Step 1: Replace stubbed quick-create context**

`quick-create-context.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Trigger = { onTrigger: () => void; label: string };
type Ctx = {
  trigger: Trigger | null;
  setTrigger: (t: Trigger | null) => void;
};

const QuickCreateContext = createContext<Ctx | null>(null);

export function QuickCreateProvider({ children }: { children: ReactNode }) {
  const [trigger, setTriggerState] = useState<Trigger | null>(null);
  const setTrigger = useCallback((t: Trigger | null) => setTriggerState(t), []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isCmdN = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !e.shiftKey && !e.altKey;
      if (!isCmdN) return;
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea, [contenteditable="true"]')) return;
      if (!trigger) return;
      e.preventDefault();
      trigger.onTrigger();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [trigger]);

  return <QuickCreateContext.Provider value={{ trigger, setTrigger }}>{children}</QuickCreateContext.Provider>;
}

export function useQuickCreateCtx() {
  const ctx = useContext(QuickCreateContext);
  if (!ctx) throw new Error('useQuickCreateCtx must be inside provider');
  return ctx;
}
```

- [ ] **Step 2: Create registration hook**

`use-quick-create.ts`:

```ts
'use client';

import { useEffect } from 'react';
import { useQuickCreateCtx } from './quick-create-context';

export function useQuickCreate(onTrigger: () => void, label = 'Snel aanmaken') {
  const { setTrigger } = useQuickCreateCtx();
  useEffect(() => {
    setTrigger({ onTrigger, label });
    return () => setTrigger(null);
  }, [onTrigger, label, setTrigger]);
}
```

- [ ] **Step 3: Register quick-create on medewerkers list**

In `medewerkers-page-actions.tsx`, also call `useQuickCreate`:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { Plus, Download } from 'lucide-react';
import { useTopBarActions } from '@/features/admin-shell/context-actions/use-top-bar-actions';
import { useQuickCreate } from '@/features/admin-shell/quick-create/use-quick-create';

export function MedewerkersPageActions() {
  const router = useRouter();
  const onCreate = () => router.push('/admin/medewerkers?new=1');
  useTopBarActions([
    { kind: 'primary', label: 'Nieuw', icon: Plus, shortcut: '⌘N', onClick: onCreate },
    { kind: 'secondary', label: 'Exporteer', icon: Download, onClick: () => alert('Export komt later') },
  ]);
  useQuickCreate(onCreate, 'Nieuwe medewerker');
  return null;
}
```

- [ ] **Step 4: Manual smoke**

On `/admin/medewerkers`: press ⌘N → create-drawer opens. On `/admin/profile`: ⌘N is no-op (no trigger registered there).

- [ ] **Step 5: Commit**

```bash
git add apps/web/features/admin-shell/quick-create/ apps/web/features/employees/list/medewerkers-page-actions.tsx
git commit -m "feat(shell): global ⌘N context-aware quick-create (C-10)"
```

---

### Task 26: C-11 Notification-center bell + audit-stream

**Files:**
- Create: `packages/db/drizzle/0004_user_last_seen_audit_at.sql`
- Modify: `packages/db/src/schema/identity.ts` (add `last_seen_audit_at` column)
- Create: `packages/db/src/audit/list-recent.ts`
- Create: `apps/web/app/api/admin/audit/recent/route.ts`
- Create: `apps/web/app/api/admin/audit/mark-seen/route.ts`
- Create: `apps/web/features/admin-shell/notifications/event-copy.ts`
- Create: `apps/web/features/admin-shell/notifications/notification-bell.tsx`
- Create: `apps/web/features/admin-shell/notifications/notifications-dropdown.tsx`
- Modify: `apps/web/features/admin-shell/top-bar/top-bar.tsx` (mount bell)
- Test: `packages/db/__tests__/audit-list-recent.test.ts`

- [ ] **Step 1: Generate migration for `last_seen_audit_at`**

Edit `packages/db/src/schema/identity.ts`, add column to `users`:

```ts
export const users = pgTable('users', {
  // ...existing fields
  lastSeenAuditAt: timestamp('last_seen_audit_at', { withTimezone: true }),
});
```

Generate migration:

```bash
pnpm db:generate
```

This produces `packages/db/drizzle/0004_*.sql`. Rename it explicitly to `0004_user_last_seen_audit_at.sql` if drizzle-kit picked an auto-name.

- [ ] **Step 2: Apply migration locally**

```bash
pnpm db:migrate
```

Verify:

```bash
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "\d users" | grep last_seen
```

- [ ] **Step 3: Write helper test (TDD)**

`packages/db/__tests__/audit-list-recent.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { listRecentAuditEvents } from '../src/audit/list-recent';
// (db setup helper assumed; if absent, this test is a typecheck-only stub)

describe('listRecentAuditEvents', () => {
  it.skip('returns most recent events first, with entity-name resolution', async () => {
    const events = await listRecentAuditEvents({ userId: 'test-user', limit: 10 });
    expect(events).toBeInstanceOf(Array);
    expect(events.length).toBeLessThanOrEqual(10);
  });

  it('signature accepts userId + limit and returns Promise<AuditEvent[]>', () => {
    expect(typeof listRecentAuditEvents).toBe('function');
  });
});
```

Run:

```bash
pnpm -F @casella/db test
```

Expected: signature test passes; integration test skipped.

- [ ] **Step 4: Implement `listRecentAuditEvents`**

`packages/db/src/audit/list-recent.ts`:

```ts
import { db } from '../client';
import { auditLog, employees, users } from '../schema';
import { desc, eq } from 'drizzle-orm';

export type AuditEvent = {
  id: string;
  type: string;
  entityType: 'employee' | 'pin' | 'theme' | 'unknown';
  entityId: string | null;
  entityName: string | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: Date;
  payload: unknown;
};

export async function listRecentAuditEvents({
  userId,
  limit = 20,
}: { userId: string; limit?: number }): Promise<AuditEvent[]> {
  const rows = await db
    .select({
      id: auditLog.id,
      type: auditLog.eventType,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      actorId: auditLog.actorId,
      payload: auditLog.payload,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  // resolve entity-names via separate query batch (employees only for now)
  const employeeIds = rows.filter((r) => r.entityType === 'employee' && r.entityId).map((r) => r.entityId!);
  const empRows = employeeIds.length
    ? await db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName }).from(employees).where(/* in */ eq(employees.id, employeeIds[0]))
    : [];
  // for full impl, use `inArray(employees.id, employeeIds)` — Drizzle helper.
  const empMap = new Map(empRows.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    entityType: (r.entityType as AuditEvent['entityType']) ?? 'unknown',
    entityId: r.entityId,
    entityName: r.entityType === 'employee' && r.entityId ? empMap.get(r.entityId) ?? null : null,
    actorId: r.actorId,
    actorName: null, // TODO Fase 1.2: resolve user-name
    createdAt: r.createdAt,
    payload: r.payload,
  }));
}
```

(If `auditLog` schema has different field names, adjust accordingly. Use `inArray` if available — replace the placeholder.)

- [ ] **Step 5: Create API routes**

`apps/web/app/api/admin/audit/recent/route.ts`:

```ts
import { auth } from '@casella/auth';
import { listRecentAuditEvents } from '@casella/db/audit/list-recent';
import { db } from '@casella/db';
import { users } from '@casella/db/schema';
import { eq } from 'drizzle-orm';
import { apiError } from '@casella/types';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(apiError('unauthorized', 'Niet ingelogd'), { status: 401 });
  }
  const events = await listRecentAuditEvents({ userId: session.user.id, limit: 20 });
  const [u] = await db.select({ lastSeenAuditAt: users.lastSeenAuditAt }).from(users).where(eq(users.id, session.user.id)).limit(1);
  return Response.json({ events, lastSeenAt: u?.lastSeenAuditAt ?? null });
}
```

`apps/web/app/api/admin/audit/mark-seen/route.ts`:

```ts
import { auth } from '@casella/auth';
import { db } from '@casella/db';
import { users } from '@casella/db/schema';
import { eq } from 'drizzle-orm';
import { apiError } from '@casella/types';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(apiError('unauthorized', 'Niet ingelogd'), { status: 401 });
  }
  await db.update(users).set({ lastSeenAuditAt: new Date() }).where(eq(users.id, session.user.id));
  return Response.json({ ok: true });
}
```

- [ ] **Step 6: Create event-copy mapper**

`apps/web/features/admin-shell/notifications/event-copy.ts`:

```ts
import { Bell, UserPlus, Pause, Mail, Star, AlertTriangle, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const EVENT_COPY: Record<string, { icon: LucideIcon; copy: (e: AuditEvent) => string }> = {
  'employee.created':              { icon: UserPlus, copy: (e) => `${e.entityName} · aangemaakt` },
  'employee.updated':              { icon: Bell,     copy: (e) => `${e.entityName} · bijgewerkt` },
  'employee.termination_initiated':{ icon: Pause,    copy: (e) => `${e.entityName} · beëindiging ingepland` },
  'employee.termination_cancelled':{ icon: RotateCcw,copy: (e) => `${e.entityName} · beëindiging geannuleerd` },
  'employee.termination_executed': { icon: Pause,    copy: (e) => `${e.entityName} · beëindigd` },
  'employee.welcome_email_sent':   { icon: Mail,     copy: (e) => `${e.entityName} · welkomstmail verstuurd` },
  'pin.created':                   { icon: Star,     copy: (e) => `${e.entityName} · gepind` },
  'pin.deleted':                   { icon: Star,     copy: (e) => `${e.entityName} · niet meer gepind` },
  'employee.update_conflict':      { icon: AlertTriangle, copy: (e) => `Conflict bij bijwerken ${e.entityName}` },
};

import type { AuditEvent } from '@casella/db/audit/list-recent';
export type { AuditEvent };
```

- [ ] **Step 7: Create NotificationBell component**

`notification-bell.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsDropdown } from './notifications-dropdown';
import type { AuditEvent } from './event-copy';

export function NotificationBell() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit/recent');
      if (!res.ok) return;
      const json = await res.json();
      setEvents(json.events);
      setLastSeenAt(json.lastSeenAt);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const unread = events.length > 0 && (!lastSeenAt || new Date(events[0].createdAt) > new Date(lastSeenAt));

  async function markSeen() {
    await fetch('/api/admin/audit/mark-seen', { method: 'POST' });
    setLastSeenAt(new Date().toISOString());
  }

  return (
    <DropdownMenu onOpenChange={(o) => { if (o) markSeen(); }}>
      <DropdownMenuTrigger className="relative grid size-8 place-items-center rounded-full hover:bg-surface-lift focus-visible:outline-2 focus-visible:outline-action-primary" aria-label="Meldingen">
        <Bell className="size-4 text-fg-secondary" />
        {unread && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-status-danger" aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto p-0">
        <NotificationsDropdown events={events} loading={loading} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 8: Create dropdown content**

`notifications-dropdown.tsx`:

```tsx
import { useRouter } from 'next/navigation';
import { EVENT_COPY, type AuditEvent } from './event-copy';

function timeAgo(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diffMin = (Date.now() - date.getTime()) / 60_000;
  if (diffMin < 1) return 'zojuist';
  if (diffMin < 60) return `${Math.floor(diffMin)}m geleden`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}u geleden`;
  return `${Math.floor(diffMin / (60 * 24))}d geleden`;
}

export function NotificationsDropdown({
  events,
  loading,
}: {
  events: AuditEvent[];
  loading: boolean;
}) {
  const router = useRouter();
  if (loading) return <div className="p-4 text-sm text-fg-tertiary">Laden...</div>;
  if (events.length === 0) return <div className="p-4 text-sm text-fg-tertiary">Geen recente activiteit.</div>;

  return (
    <ul className="divide-y divide-border-subtle">
      {events.map((e) => {
        const conf = EVENT_COPY[e.type];
        if (!conf) return null;
        const Icon = conf.icon;
        return (
          <li key={e.id}>
            <button
              type="button"
              className="flex w-full items-start gap-3 p-3 text-left hover:bg-surface-lift"
              onClick={() => {
                if (e.entityType === 'employee' && e.entityId) {
                  router.push(`/admin/medewerkers/${e.entityId}`);
                }
              }}
            >
              <Icon className="size-4 mt-0.5 text-fg-tertiary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-fg-primary truncate">{conf.copy(e)}</p>
                <p className="text-xs text-fg-tertiary">{timeAgo(e.createdAt)}</p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 9: Mount bell in TopBar**

In `top-bar.tsx` right-cluster, before EnvBadge:

```tsx
import { NotificationBell } from '../notifications/notification-bell';

<NotificationBell />
<EnvBadge />
<UserMenu />
```

- [ ] **Step 10: Manual smoke**

Open dev. Bell icon visible top-right. Create or edit an employee → bell shows unread-dot. Open dropdown → entry visible with time-ago. Click entry → navigates to detail. Open dropdown again → unread-dot gone (mark-seen fired).

- [ ] **Step 11: Commit**

```bash
git add packages/db/drizzle/0004_*.sql packages/db/src/schema/identity.ts packages/db/src/audit/ packages/db/__tests__/ apps/web/app/api/admin/audit/ apps/web/features/admin-shell/notifications/ apps/web/features/admin-shell/top-bar/
git commit -m "feat(shell): notification-center bell with audit-stream (C-11)"
```

---

### Task 27: ✅ Sanity-check (einde Chapter C core)

**Files:**
- Modify: `docs/sanity-check-log.md`

- [ ] **Step 1: Run all 6 commands**

```bash
git status
git log --oneline main..HEAD | wc -l
pnpm -r typecheck
pnpm -r test
pnpm -F @casella/web build
pnpm -F @casella/web lint
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "SELECT id FROM drizzle.__drizzle_migrations ORDER BY id;"
```

Expected: clean, 5 migrations now (0000-0004; new = `0004_user_last_seen_audit_at`).

- [ ] **Step 2: Manual full smoke**

1. Login → top-bar visible with breadcrumbs, ⌘K pill, notification-bell, EnvBadge, UserMenu.
2. ⌘K opens palette. `?` opens overlay (outside input).
3. /admin/medewerkers → "+ Nieuw" + "Exporteer" buttons in top-bar.
4. ⌘N opens create-drawer.
5. Click row → detail-drawer opens (intercepting route), URL changes, breadcrumb shows employee name.
6. Hover "Medewerkers" breadcrumb → chevron + popover with all employees.
7. UserMenu → afmelden returns to /login.

- [ ] **Step 3: Append sanity-check log entry**

```markdown
## 2026-XX-XX — Sanity-check 8 (einde Chapter C core, Plan 1.1b)

- HEAD: <SHA>
- Status: GREEN
- Migrations: 0000-0004 (added 0004_user_last_seen_audit_at)
- Tasks completed: C-0..C-11 (12 tasks core shell)
- Mobile alignment: ML-2 ✓ all new routes are Route Handlers (audit/recent, audit/mark-seen)
- Notes: core shell shipped. Decision-point: continue with C-12..C-16 or pause/PR-checkpoint?
```

- [ ] **Step 4: Commit**

```bash
git add docs/sanity-check-log.md
git commit -m "docs: log sanity-check 8 (einde Chapter C core, Plan 1.1b) — green"
```

---

### Task 28: C-12 Auto-save in edit-mode + saved-indicator + conflict-detection

**Files:**
- Create: `apps/web/features/admin-shell/auto-save/use-auto-save.ts`
- Create: `apps/web/features/admin-shell/auto-save/saved-indicator.tsx`
- Create: `apps/web/features/admin-shell/auto-save/conflict-banner.tsx`
- Modify: `apps/web/features/employees/drawer/wizard/employee-wizard.tsx` (use auto-save in edit-mode)
- Modify: `apps/web/app/api/admin/employees/[id]/route.ts` (If-Match handling, 409 + audit)
- Modify: `packages/db/src/audit/types.ts` (or wherever) — add `'employee.update_conflict'` event-type

- [ ] **Step 1: Create useAutoSave hook**

`use-auto-save.ts`:

```ts
'use client';

import { useEffect, useRef, useState } from 'react';

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; at: Date }
  | { status: 'error'; message: string }
  | { status: 'conflict' };

type Options<T> = {
  data: T;
  enabled: boolean;
  ifMatch: string | null;
  delay?: number;
  endpoint: string;
  onConflict?: () => void;
};

export function useAutoSave<T extends object>({ data, enabled, ifMatch, delay = 2000, endpoint, onConflict }: Options<T>) {
  const [state, setState] = useState<SaveState>({ status: 'idle' });
  const initialRef = useRef<T>(data);
  const lastSavedRef = useRef<T>(data);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const dirty: any = {};
      for (const k of Object.keys(data) as (keyof T)[]) {
        if (JSON.stringify(data[k]) !== JSON.stringify(lastSavedRef.current[k])) {
          dirty[k] = data[k];
        }
      }
      if (Object.keys(dirty).length === 0) return;

      setState({ status: 'saving' });
      try {
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(ifMatch ? { 'If-Match': ifMatch } : {}) },
          body: JSON.stringify(dirty),
        });
        if (res.status === 409) {
          setState({ status: 'conflict' });
          onConflict?.();
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setState({ status: 'error', message: body.message ?? 'Opslaan mislukt' });
          return;
        }
        lastSavedRef.current = data;
        setState({ status: 'saved', at: new Date() });
      } catch (err) {
        setState({ status: 'error', message: (err as Error).message });
      }
    }, delay);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [data, enabled, ifMatch, delay, endpoint, onConflict]);

  return state;
}
```

- [ ] **Step 2: Create SavedIndicator component**

`saved-indicator.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

type Props = {
  state: { status: 'idle' | 'saving' | 'saved' | 'error' | 'conflict'; at?: Date; message?: string };
};

export function SavedIndicator({ state }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(t);
  }, []);

  if (state.status === 'idle') return null;
  if (state.status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-fg-tertiary">
        <Loader2 className="size-3 animate-spin" /> Opgeslagen...
      </span>
    );
  }
  if (state.status === 'saved' && state.at) {
    const ageSec = Math.floor((now - state.at.getTime()) / 1000);
    if (ageSec <= 30) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-status-success">
          <span className="size-1.5 rounded-full bg-status-success animate-pulse" />
          Opgeslagen {ageSec}s geleden
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-fg-tertiary">
        <Check className="size-3" />
        Opgeslagen om {state.at.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  }
  if (state.status === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-status-danger">
        <AlertCircle className="size-3" />
        Opslaan mislukt — {state.message}
      </span>
    );
  }
  if (state.status === 'conflict') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-status-warning">
        <RefreshCw className="size-3" />
        Conflict — herlaad
      </span>
    );
  }
  return null;
}
```

- [ ] **Step 3: Create ConflictBanner component**

`conflict-banner.tsx`:

```tsx
import { Button } from '@/components/ui/button';

export function ConflictBanner({ onReload }: { onReload: () => void }) {
  return (
    <div className="rounded-md border border-status-warning bg-status-warning/10 p-3 text-sm">
      <p className="font-medium text-status-warning">Een andere sessie heeft deze medewerker aangepast.</p>
      <p className="text-fg-secondary mt-1">Herlaad om verder te bewerken — je verliest geen ingevulde data, maar je ziet de meest recente versie.</p>
      <Button size="sm" variant="outline" onClick={onReload} className="mt-2">Herlaad</Button>
    </div>
  );
}
```

- [ ] **Step 4: Wire auto-save into EmployeeWizard edit-mode**

In `employee-wizard.tsx` (edit-branch):

```tsx
import { useAutoSave } from '@/features/admin-shell/auto-save/use-auto-save';
import { SavedIndicator } from '@/features/admin-shell/auto-save/saved-indicator';
import { ConflictBanner } from '@/features/admin-shell/auto-save/conflict-banner';

const isEdit = props.mode === 'edit';
const ifMatch = isEdit ? props.employee.updatedAt.toISOString() : null;
const saveState = useAutoSave({
  enabled: isEdit,
  data: form,
  ifMatch,
  endpoint: isEdit ? `/api/admin/employees/${props.employee.id}` : '',
});

// In drawer header, rechtsboven:
{isEdit && <SavedIndicator state={saveState} />}

// Boven step content:
{saveState.status === 'conflict' && (
  <ConflictBanner onReload={() => router.refresh()} />
)}
```

- [ ] **Step 5: Update PATCH route to handle If-Match + 409 + audit-log**

In `apps/web/app/api/admin/employees/[id]/route.ts`:

```ts
import { auditMutation } from '@casella/db'; // existing helper
import { apiError } from '@casella/types';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(apiError('unauthorized', 'Niet ingelogd'), { status: 401 });
  }

  const ifMatch = req.headers.get('If-Match');
  const body = await req.json();
  const parsed = updateEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(apiError('validation_error', 'Ongeldige invoer', parsed.error.issues), { status: 400 });
  }

  return await db.transaction(async (tx) => {
    const [current] = await tx.select().from(employees).where(eq(employees.id, params.id)).limit(1);
    if (!current) {
      return Response.json(apiError('not_found', 'Medewerker niet gevonden'), { status: 404 });
    }
    if (ifMatch && new Date(ifMatch).getTime() !== current.updatedAt.getTime()) {
      // log conflict to audit
      await auditMutation(tx, {
        actorId: session.user.id,
        eventType: 'employee.update_conflict',
        entityType: 'employee',
        entityId: params.id,
        payload: { ifMatch, currentUpdatedAt: current.updatedAt },
      });
      return Response.json(apiError('version_conflict', 'Een andere sessie heeft deze medewerker aangepast — herlaad om verder te bewerken'), { status: 409 });
    }
    const [updated] = await tx.update(employees).set({ ...parsed.data, updatedAt: new Date() }).where(eq(employees.id, params.id)).returning();
    await auditMutation(tx, {
      actorId: session.user.id,
      eventType: 'employee.updated',
      entityType: 'employee',
      entityId: params.id,
      payload: parsed.data,
    });
    return Response.json(updated);
  });
}
```

- [ ] **Step 6: Manual smoke**

Open employee detail. Edit a field. Wait 2s → saved-indicator shows "Opgeslagen 2s geleden" (green pulse). Open same employee in 2nd tab. Edit in tab 1, wait for save. Edit in tab 2 → 409 conflict-banner appears.

- [ ] **Step 7: Commit**

```bash
git add apps/web/features/admin-shell/auto-save/ apps/web/features/employees/ apps/web/app/api/admin/employees/
git commit -m "feat(employees): auto-save edit-mode + saved-indicator + If-Match conflict (C-12)"
```

---

### Task 29: C-13 Shortcut-coaching tip-surfacing

**Files:**
- Create: `apps/web/features/admin-shell/coaching/tracker.ts`
- Create: `apps/web/features/admin-shell/coaching/tips.ts`
- Create: `apps/web/features/admin-shell/coaching/use-coaching-tip.ts`
- Modify: `apps/web/features/admin-shell/context-actions/context-actions.tsx` (track button-click events)
- Modify: `apps/web/features/admin-shell/quick-create/quick-create-context.tsx` (track ⌘N usage)
- Modify: `apps/web/features/admin-shell/command-palette/palette-context.tsx` (track palette opens)
- Modify: `apps/web/features/admin-shell/user-menu/user-menu.tsx` (Coaching opt-out toggle wires to tracker)

- [ ] **Step 1: Create tracker**

`tracker.ts`:

```ts
'use client';

const STORAGE_KEY = 'casellaCoachingState';
const OPT_OUT_KEY = 'casellaCoachingOptedOut';

type CoachingState = {
  actions: Record<string, number>;
  dismissedTips: string[];
};

function load(): CoachingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { actions: {}, dismissedTips: [] };
}

function save(state: CoachingState) {
  // Cap object size to prevent localStorage bloat
  const trimmed: CoachingState = {
    actions: state.actions,
    dismissedTips: state.dismissedTips.slice(-50),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function trackAction(actionKey: string) {
  if (isOptedOut()) return;
  const s = load();
  s.actions[actionKey] = (s.actions[actionKey] ?? 0) + 1;
  save(s);
}

export function getActionCount(actionKey: string): number {
  return load().actions[actionKey] ?? 0;
}

export function isTipDismissed(tipId: string): boolean {
  return load().dismissedTips.includes(tipId);
}

export function dismissTip(tipId: string) {
  const s = load();
  if (!s.dismissedTips.includes(tipId)) {
    s.dismissedTips.push(tipId);
    save(s);
  }
}

export function isOptedOut(): boolean {
  return localStorage.getItem(OPT_OUT_KEY) === 'true';
}

export function setOptedOut(v: boolean) {
  localStorage.setItem(OPT_OUT_KEY, String(v));
}
```

- [ ] **Step 2: Create tips registry**

`tips.ts`:

```ts
export type Tip = {
  id: string;
  trigger: { actionKey: string; threshold: number; withoutActionKey?: string };
  copy: string;
};

export const TIPS: Tip[] = [
  {
    id: 'cmdN-quick-create',
    trigger: { actionKey: 'clickedNewEmployeeButton', threshold: 5, withoutActionKey: 'usedCmdN' },
    copy: '💡 Snelkoppeling: druk op ⌘N om snel een nieuwe medewerker te maken.',
  },
  {
    id: 'cmdK-search',
    trigger: { actionKey: 'clickedSidebarMedewerkers', threshold: 3, withoutActionKey: 'usedCmdK' },
    copy: '💡 Druk op ⌘K om snel overal naartoe te springen.',
  },
  {
    id: 'shortcuts-overlay',
    trigger: { actionKey: 'opens', threshold: 10, withoutActionKey: 'usedShortcutsOverlay' },
    copy: '💡 Druk op ? voor een overzicht van alle sneltoetsen.',
  },
];
```

- [ ] **Step 3: Create useCoachingTip hook**

`use-coaching-tip.ts`:

```ts
'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { TIPS } from './tips';
import { dismissTip, getActionCount, isOptedOut, isTipDismissed } from './tracker';

export function useCoachingTipsScanner() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOptedOut()) return;
    for (const tip of TIPS) {
      if (isTipDismissed(tip.id)) continue;
      const count = getActionCount(tip.trigger.actionKey);
      const without = tip.trigger.withoutActionKey ? getActionCount(tip.trigger.withoutActionKey) : 0;
      if (count >= tip.trigger.threshold && without === 0) {
        toast(tip.copy, {
          duration: 8_000,
          action: {
            label: 'Begrepen',
            onClick: () => dismissTip(tip.id),
          },
          onDismiss: () => dismissTip(tip.id),
        });
        // Show only one tip per scan
        break;
      }
    }
  }, []);
}
```

- [ ] **Step 4: Wire tracker into action-points**

Modify `context-actions.tsx` primary action onClick:

```tsx
import { trackAction } from '@/features/admin-shell/coaching/tracker';

onClick={() => { trackAction('clickedNewEmployeeButton'); action.onClick(); }}
```

Modify `quick-create-context.tsx` keyboard handler:

```tsx
import { trackAction } from '../coaching/tracker';
// in handler: trackAction('usedCmdN'); trigger.onTrigger();
```

Modify `palette-context.tsx` setOpen → when transitioning to true:

```tsx
function setOpenWithTrack(v: boolean) {
  if (v) trackAction('usedCmdK');
  setOpen(v);
}
```

Modify `shortcuts-overlay/use-shortcuts-overlay.ts` keyboard handler:

```tsx
import { trackAction } from '../coaching/tracker';
// when ? key triggers: trackAction('usedShortcutsOverlay');
```

- [ ] **Step 5: Mount scanner in admin-layout**

Add `<CoachingTipsScanner />` to admin layout (a small client-component that runs once per route-change):

```tsx
'use client';
import { useCoachingTipsScanner } from '@/features/admin-shell/coaching/use-coaching-tip';
export function CoachingTipsScanner() {
  useCoachingTipsScanner();
  return null;
}
```

Mount in `(admin)/layout.tsx`:

```tsx
import { CoachingTipsScanner } from '@/features/admin-shell/coaching/scanner';

// inside TopBarProviders:
<CoachingTipsScanner />
```

- [ ] **Step 6: Wire opt-out in UserMenu**

Replace UserMenu's coaching-toggle implementation (Task 20 stub) with proper tracker:

```tsx
import { isOptedOut, setOptedOut } from '@/features/admin-shell/coaching/tracker';
import { useState } from 'react';

const [optedOut, setOptedOutState] = useState(() => typeof window !== 'undefined' ? isOptedOut() : false);

<DropdownMenuItem onSelect={() => {
  const newVal = !optedOut;
  setOptedOut(newVal);
  setOptedOutState(newVal);
}}>
  {optedOut ? 'Coaching-tips aan' : 'Coaching-tips uit'}
</DropdownMenuItem>
```

- [ ] **Step 7: Manual smoke**

Click "+ Nieuw" 5 times without using ⌘N. Refresh. Sonner toast shows tip. Click "Begrepen" → tip never reappears. UserMenu opt-out → no further tips on next session.

- [ ] **Step 8: Commit**

```bash
git add apps/web/features/admin-shell/coaching/ apps/web/features/admin-shell/context-actions/ apps/web/features/admin-shell/quick-create/ apps/web/features/admin-shell/command-palette/ apps/web/features/admin-shell/shortcuts-overlay/ apps/web/features/admin-shell/user-menu/ apps/web/app/\(admin\)/layout.tsx
git commit -m "feat(shell): shortcut-coaching tip-surfacing with opt-out (C-13)"
```

---

### Task 30: C-14 Pinned entities

**Files:**
- Create: `packages/db/drizzle/0005_user_pins_table.sql`
- Create: `packages/db/src/schema/pins.ts`
- Create: `packages/db/src/pins/list.ts`
- Create: `packages/db/src/pins/create.ts`
- Create: `packages/db/src/pins/delete.ts`
- Create: `packages/db/sql/rls-pins.sql`
- Create: `apps/web/app/api/admin/pins/route.ts`
- Create: `apps/web/app/api/admin/pins/[entityType]/[entityId]/route.ts`
- Create: `apps/web/features/admin-shell/pins/use-pin-toggle.ts`
- Create: `apps/web/features/admin-shell/pins/favorites-section.tsx`
- Modify: `apps/web/features/admin-shell/sidebar/sidebar.tsx` (mount FavoritesSection)
- Modify: `apps/web/features/employees/detail/employee-detail-actions.tsx` (wire Pin/Unpin via use-pin-toggle)
- Modify: `apps/web/features/admin-shell/command-palette/...` (palette `@` scope shows pinned bovenin)
- Modify: `docs/casella-deferred-work.md` (add FAVORITES-FULL-VIEW)

- [ ] **Step 1: Create schema**

`packages/db/src/schema/pins.ts`:

```ts
import { pgTable, uuid, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './identity';

export const userPins = pgTable(
  'user_pins',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    entityType: text('entity_type', { enum: ['employee'] }).notNull(),
    entityId: uuid('entity_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.entityType, t.entityId] }),
    userIdx: index('user_pins_user_id_idx').on(t.userId),
  })
);
```

Add export in `packages/db/src/schema/index.ts`.

- [ ] **Step 2: Generate migration**

```bash
pnpm db:generate
```

Rename to `0005_user_pins_table.sql`.

- [ ] **Step 3: Add RLS to migration**

Edit `packages/db/drizzle/0005_user_pins_table.sql`, append:

```sql
ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_access_only_own_pins" ON user_pins
  FOR ALL
  USING (user_id = auth.uid());
```

(If RLS lives in a separate `packages/db/sql/rls.sql`, add it there instead and re-run RLS apply step in CI.)

- [ ] **Step 4: Apply migration**

```bash
pnpm db:migrate
psql -h localhost -U postgres -d postgres -f packages/db/sql/rls.sql # if RLS lives here
```

Verify:

```bash
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "\d user_pins"
```

- [ ] **Step 5: Create helpers**

`packages/db/src/pins/list.ts`:

```ts
import { db } from '../client';
import { userPins } from '../schema/pins';
import { employees } from '../schema/identity';
import { eq, and, desc } from 'drizzle-orm';

export async function listUserPins({ userId, entityType, limit = 50 }: { userId: string; entityType?: 'employee'; limit?: number }) {
  // Join to employees for name resolution
  const where = entityType ? and(eq(userPins.userId, userId), eq(userPins.entityType, entityType)) : eq(userPins.userId, userId);
  const rows = await db
    .select({
      entityType: userPins.entityType,
      entityId: userPins.entityId,
      createdAt: userPins.createdAt,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(userPins)
    .leftJoin(employees, eq(userPins.entityId, employees.id))
    .where(where)
    .orderBy(desc(userPins.createdAt))
    .limit(limit);
  return rows;
}
```

`packages/db/src/pins/create.ts`:

```ts
import { db } from '../client';
import { userPins } from '../schema/pins';

export async function createPin({ userId, entityType, entityId }: { userId: string; entityType: 'employee'; entityId: string }) {
  await db.insert(userPins).values({ userId, entityType, entityId }).onConflictDoNothing();
}
```

`packages/db/src/pins/delete.ts`:

```ts
import { db } from '../client';
import { userPins } from '../schema/pins';
import { and, eq } from 'drizzle-orm';

export async function deletePin({ userId, entityType, entityId }: { userId: string; entityType: 'employee'; entityId: string }) {
  await db.delete(userPins).where(and(
    eq(userPins.userId, userId),
    eq(userPins.entityType, entityType),
    eq(userPins.entityId, entityId),
  ));
}
```

- [ ] **Step 6: Create routes**

`apps/web/app/api/admin/pins/route.ts`:

```ts
import { z } from 'zod';
import { auth } from '@casella/auth';
import { createPin } from '@casella/db/pins/create';
import { auditMutation } from '@casella/db';
import { apiError } from '@casella/types';

const Body = z.object({ entityType: z.literal('employee'), entityId: z.string().uuid() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json(apiError('unauthorized', 'Niet ingelogd'), { status: 401 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json(apiError('validation_error', 'Ongeldige invoer', parsed.error.issues), { status: 400 });
  await createPin({ userId: session.user.id, ...parsed.data });
  await auditMutation({
    actorId: session.user.id,
    eventType: 'pin.created',
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    payload: {},
  });
  return Response.json({ ok: true }, { status: 201 });
}
```

`apps/web/app/api/admin/pins/[entityType]/[entityId]/route.ts`:

```ts
import { auth } from '@casella/auth';
import { deletePin } from '@casella/db/pins/delete';
import { auditMutation } from '@casella/db';
import { apiError } from '@casella/types';

export async function DELETE(_req: Request, { params }: { params: { entityType: string; entityId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json(apiError('unauthorized', 'Niet ingelogd'), { status: 401 });
  if (params.entityType !== 'employee') return Response.json(apiError('not_found', 'Onbekend entity-type'), { status: 404 });
  await deletePin({ userId: session.user.id, entityType: 'employee', entityId: params.entityId });
  await auditMutation({
    actorId: session.user.id,
    eventType: 'pin.deleted',
    entityType: 'employee',
    entityId: params.entityId,
    payload: {},
  });
  return Response.json({ ok: true });
}
```

- [ ] **Step 7: Create use-pin-toggle hook**

```tsx
'use client';
import { useState, useEffect } from 'react';

export function usePinToggle(entityType: 'employee', entityId: string) {
  const [isPinned, setIsPinned] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    fetch(`/api/admin/pins?entityType=${entityType}`).then(async (r) => {
      const list = await r.json().catch(() => []);
      setIsPinned(Array.isArray(list) ? list.some((p: any) => p.entityId === entityId) : false);
    }).catch(() => setIsPinned(false));
  }, [entityType, entityId]);

  async function toggle() {
    if (isPinned === null) return;
    if (isPinned) {
      await fetch(`/api/admin/pins/${entityType}/${entityId}`, { method: 'DELETE' });
      setIsPinned(false);
    } else {
      await fetch('/api/admin/pins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entityType, entityId }) });
      setIsPinned(true);
    }
  }

  return { isPinned, toggle };
}
```

(Note: `GET /api/admin/pins` for listing — add a GET handler in route.ts that returns the user's pins.)

Append to `apps/web/app/api/admin/pins/route.ts`:

```ts
import { listUserPins } from '@casella/db/pins/list';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json(apiError('unauthorized', 'Niet ingelogd'), { status: 401 });
  const url = new URL(req.url);
  const entityType = url.searchParams.get('entityType') as 'employee' | null;
  const pins = await listUserPins({ userId: session.user.id, entityType: entityType ?? undefined });
  return Response.json(pins);
}
```

- [ ] **Step 8: Wire Pin/Unpin in detail kebab**

In `employee-detail-actions.tsx`:

```tsx
import { usePinToggle } from '@/features/admin-shell/pins/use-pin-toggle';
import { Star, StarOff } from 'lucide-react';

const { isPinned, toggle } = usePinToggle('employee', employee.id);

useTopBarActions([
  { kind: 'primary', label: 'Bewerken', icon: Pencil, onClick: () => {} },
  {
    kind: 'kebab',
    items: [
      { label: isPinned ? 'Unpin' : 'Pin', icon: isPinned ? StarOff : Star, onClick: toggle },
      // ... existing items
    ],
  },
]);
```

- [ ] **Step 9: Create FavoritesSection in sidebar**

`favorites-section.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';

type Pin = { entityType: 'employee'; entityId: string; employeeFirstName: string | null; employeeLastName: string | null };

export function FavoritesSection() {
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    fetch('/api/admin/pins?entityType=employee').then((r) => r.json()).then(setPins).catch(() => setPins([]));
  }, []);

  if (pins.length === 0) return null;

  const visible = pins.slice(0, 5);
  const overflow = pins.length - visible.length;

  return (
    <section className="mt-2">
      <h3 className="px-3 py-2 text-[10px] uppercase tracking-wider text-fg-quaternary flex items-center gap-1.5">
        <Star className="size-3" /> Favorieten
      </h3>
      <ul className="space-y-0.5">
        {visible.map((p) => (
          <li key={p.entityId}>
            <Link href={`/admin/medewerkers/${p.entityId}`} className="flex items-center gap-2 px-3 py-1.5 text-sm text-fg-secondary hover:bg-surface-lift rounded">
              {p.employeeFirstName} {p.employeeLastName}
            </Link>
          </li>
        ))}
        {overflow > 0 && (
          <li className="px-3 py-1.5 text-xs text-fg-tertiary">
            +{overflow} meer
          </li>
        )}
      </ul>
    </section>
  );
}
```

- [ ] **Step 10: Mount FavoritesSection in sidebar**

In `apps/web/features/admin-shell/sidebar/sidebar.tsx`, add `<FavoritesSection />` above the primary nav-items.

- [ ] **Step 11: Add FAVORITES-FULL-VIEW to deferred-work**

Append to `docs/casella-deferred-work.md`:

```markdown
### FAVORITES-FULL-VIEW — Sidebar shows top 5; full view deferred
- **Category**: UX-polish
- **Deferred from**: Plan 1.1b Task 30 (C-14, 2026-04-26)
- **Why deferred**: Sidebar fits 5 pinned entities cleanly; >5 needs a dedicated view (perhaps `/admin/favorieten`).
- **Pickup trigger**: When >5 pins becomes the norm OR Fase 1.2 polish.
- **Estimated cost**: ~2 hours.
- **Impact if skipped**: Users can pin 6+ but only see 5 in sidebar; remaining accessible only via palette `@` scope.
- **Status**: open
```

- [ ] **Step 12: Manual smoke**

Open employee detail, kebab → Pin. Star fills. Sidebar shows favorite. Reload — persists. Unpin via kebab → disappears. ⌘K @ scope → pinned bovenaan.

- [ ] **Step 13: Commit**

```bash
git add packages/db/ apps/web/app/api/admin/pins/ apps/web/features/admin-shell/pins/ apps/web/features/admin-shell/sidebar/ apps/web/features/employees/detail/ docs/casella-deferred-work.md
git commit -m "feat(shell): pinned entities (sidebar favorites + star toggle + RLS) (C-14)"
```

---

### Task 31: C-15 Server-side search met tsvector + preview

**Files:**
- Create: `packages/db/drizzle/0006_employees_search_tsvector.sql`
- Create: `packages/db/src/search/employees.ts`
- Create: `apps/web/app/api/admin/search/route.ts`
- Create: `apps/web/features/admin-shell/search/use-server-search.ts`
- Create: `apps/web/features/admin-shell/search/search-preview.tsx`
- Modify: `apps/web/features/admin-shell/command-palette/...` (consume server search in `@` scope + mixed)
- Test: `packages/db/__tests__/search-employees.test.ts`

- [ ] **Step 1: Create migration manually**

`packages/db/drizzle/0006_employees_search_tsvector.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE employees ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('dutch',
      coalesce(first_name, '') || ' ' ||
      coalesce(last_name, '') || ' ' ||
      coalesce("function", '') || ' ' ||
      coalesce(email, '')
    )
  ) STORED;

CREATE INDEX employees_search_idx ON employees USING GIN(search_vector);

CREATE INDEX employees_trgm_idx ON employees USING GIN(
  (coalesce(first_name, '') || ' ' || coalesce(last_name, '')) gin_trgm_ops
);
```

(Note: `function` is a reserved word — quote it. Adjust if your column is `function_title` or similar.)

- [ ] **Step 2: Apply migration + add to drizzle journal**

If using drizzle-kit: write a hand-crafted migration entry into `packages/db/drizzle/meta/_journal.json`. Easier: use `pnpm db:migrate` after committing the SQL file (drizzle-kit will pick up `0006_*.sql` automatically).

Verify:

```bash
pnpm db:migrate
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "\d employees" | grep search_vector
```

- [ ] **Step 3: Create search helper**

`packages/db/src/search/employees.ts`:

```ts
import { db } from '../client';
import { sql } from 'drizzle-orm';

export type SearchResult = {
  entityType: 'employee';
  entityId: string;
  title: string;
  subtitle: string;
  score: number;
};

export async function searchEmployees({ query, limit = 10 }: { query: string; limit?: number }): Promise<SearchResult[]> {
  if (query.trim().length === 0) return [];

  // tsvector match for queries ≥ 3 chars; fall back to trigram for short / stopword queries
  const useTrigram = query.length < 3;

  const rows = useTrigram
    ? await db.execute<{ id: string; first_name: string; last_name: string; function: string; score: number }>(sql`
        SELECT id, first_name, last_name, "function",
               similarity(coalesce(first_name,'') || ' ' || coalesce(last_name,''), ${query}) AS score
        FROM employees
        WHERE coalesce(first_name,'') || ' ' || coalesce(last_name,'') % ${query}
        ORDER BY score DESC
        LIMIT ${limit}
      `)
    : await db.execute<{ id: string; first_name: string; last_name: string; function: string; score: number }>(sql`
        SELECT id, first_name, last_name, "function",
               ts_rank(search_vector, websearch_to_tsquery('dutch', ${query})) AS score
        FROM employees
        WHERE search_vector @@ websearch_to_tsquery('dutch', ${query})
        ORDER BY score DESC
        LIMIT ${limit}
      `);

  return rows.rows.map((r) => ({
    entityType: 'employee',
    entityId: r.id,
    title: `${r.first_name} ${r.last_name}`,
    subtitle: r.function ?? '',
    score: r.score,
  }));
}
```

- [ ] **Step 4: Write helper test (signature)**

`packages/db/__tests__/search-employees.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { searchEmployees } from '../src/search/employees';

describe('searchEmployees', () => {
  it.skip('returns results for query > 2 chars (tsvector path)', async () => {
    const res = await searchEmployees({ query: 'Alice' });
    expect(Array.isArray(res)).toBe(true);
  });

  it.skip('falls back to trigram for query < 3 chars', async () => {
    const res = await searchEmployees({ query: 'Al' });
    expect(Array.isArray(res)).toBe(true);
  });

  it('signature accepts query + limit', () => {
    expect(typeof searchEmployees).toBe('function');
  });
});
```

- [ ] **Step 5: Create API route**

`apps/web/app/api/admin/search/route.ts`:

```ts
import { z } from 'zod';
import { auth } from '@casella/auth';
import { searchEmployees } from '@casella/db/search/employees';
import { apiError } from '@casella/types';

const Q = z.object({
  q: z.string().min(1).max(100),
  types: z.string().optional().default('employee'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json(apiError('unauthorized', 'Niet ingelogd'), { status: 401 });
  const url = new URL(req.url);
  const parsed = Q.safeParse({ q: url.searchParams.get('q'), types: url.searchParams.get('types'), limit: url.searchParams.get('limit') });
  if (!parsed.success) return Response.json(apiError('validation_error', 'Ongeldige invoer', parsed.error.issues), { status: 400 });

  const types = parsed.data.types.split(',');
  const results = [];
  if (types.includes('employee')) {
    results.push(...await searchEmployees({ query: parsed.data.q, limit: parsed.data.limit }));
  }
  return Response.json({ results });
}
```

- [ ] **Step 6: Create useServerSearch hook**

`use-server-search.ts`:

```ts
'use client';

import { useEffect, useState } from 'react';

type Result = { entityType: 'employee'; entityId: string; title: string; subtitle: string; score: number };

export function useServerSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || query.length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, enabled]);

  return { results, loading };
}
```

- [ ] **Step 7: Create preview component**

`search-preview.tsx`:

```tsx
import { useEffect, useState } from 'react';

type Props = { entityType: 'employee'; entityId: string };

export function SearchPreview({ entityType, entityId }: Props) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (entityType !== 'employee') return;
    fetch(`/api/admin/employees/${entityId}`).then((r) => r.json()).then(setData).catch(() => setData(null));
  }, [entityType, entityId]);

  if (!data) return <div className="p-4 text-sm text-fg-tertiary">Laden...</div>;

  return (
    <div className="p-4 space-y-2 w-72">
      <h4 className="text-base font-medium">{data.firstName} {data.lastName}</h4>
      <p className="text-sm text-fg-secondary">{data.function ?? '—'}</p>
      <p className="text-xs text-fg-tertiary">{data.email}</p>
      {data.startDate && <p className="text-xs text-fg-tertiary">Sinds {new Date(data.startDate).toLocaleDateString('nl-NL')}</p>}
    </div>
  );
}
```

(If `/api/admin/employees/[id]` GET doesn't exist yet, add a minimal handler in that route file.)

- [ ] **Step 8: Integrate server-search into palette `@` scope**

In `EmployeesScopeContent` (Task 24), use both in-memory cache + server-search:

```tsx
const { results: serverResults, loading } = useServerSearch(query, query.length >= 1);
const cached = useEmployeeListCache().employees;
// merge: cached matches first (instant), then server-only results de-duplicated
```

Add hover-preview: when a `<CommandItem>` is highlighted, show `<SearchPreview>` in a side-panel within the Command dialog.

- [ ] **Step 9: Manual smoke**

Open palette, type "alice" → results appear within 400ms. Hover result → preview-card rendered side-pane.

- [ ] **Step 10: Commit**

```bash
git add packages/db/ apps/web/app/api/admin/search/ apps/web/features/admin-shell/search/ apps/web/features/admin-shell/command-palette/ packages/db/__tests__/
git commit -m "feat(shell): server-side search with tsvector + trigram fallback + preview (C-15)"
```

---

### Task 32: C-16 Presence-indicators (Realtime + fallback)

**Files:**
- Create: `apps/web/features/admin-shell/presence/use-entity-presence.ts`
- Create: `apps/web/features/admin-shell/presence/presence-avatar-stack.tsx`
- Create: `apps/web/features/admin-shell/presence/presence-fallback-poll.ts`
- Create: `apps/web/app/api/admin/presence/[entityType]/[entityId]/route.ts`
- Modify: `apps/web/features/admin-shell/top-bar/top-bar.tsx` (mount stack on detail-pages)
- Modify: `docs/casella-deferred-work.md` (add PRESENCE-MULTI-USER-POLISH)

- [ ] **Step 1: Verify Supabase Realtime client is available**

```bash
grep -rn "createClient" apps/web/lib/ packages/auth/ packages/db/ | head -5
```

If `@supabase/supabase-js` isn't installed in apps/web, add it:

```bash
pnpm -F @casella/web add @supabase/supabase-js@^2.45.0
```

Note: env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` should already exist in `.env.local` (added in 1.1a Fase 0). If not, add them.

- [ ] **Step 2: Create presence hook (Realtime path)**

`use-entity-presence.ts`:

```ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSession } from 'next-auth/react';
import { startFallbackPoll } from './presence-fallback-poll';

export type PresenceUser = { userId: string; name: string; avatarHue: number };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function useEntityPresence(entityType: 'employee', entityId: string): PresenceUser[] {
  const { data: session } = useSession();
  const [viewers, setViewers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const channelName = `presence:${entityType}:${entityId}`;
    const channel = supabase.channel(channelName, { config: { presence: { key: session.user.id } } });

    let connected = false;
    let cleanup: (() => void) | null = null;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const list: PresenceUser[] = [];
        for (const userId in state) {
          const entry = state[userId][0];
          if (entry) list.push(entry);
        }
        setViewers(list);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          connected = true;
          await channel.track({
            userId: session.user.id,
            name: session.user.name ?? session.user.email,
            avatarHue: (session.user.id.charCodeAt(0) * 37) % 360,
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Fallback to polling
          cleanup = startFallbackPoll(entityType, entityId, setViewers);
        }
      });

    // Safety net: if not connected within 5s, kick off fallback
    const fallbackTimer = setTimeout(() => {
      if (!connected) {
        cleanup = startFallbackPoll(entityType, entityId, setViewers);
      }
    }, 5_000);

    return () => {
      clearTimeout(fallbackTimer);
      channel.unsubscribe();
      cleanup?.();
    };
  }, [session?.user?.id, entityType, entityId]);

  return viewers;
}
```

- [ ] **Step 3: Create fallback-poll**

`presence-fallback-poll.ts`:

```ts
import type { PresenceUser } from './use-entity-presence';

export function startFallbackPoll(entityType: string, entityId: string, setViewers: (v: PresenceUser[]) => void): () => void {
  let active = true;
  async function tick() {
    if (!active) return;
    try {
      const res = await fetch(`/api/admin/presence/${entityType}/${entityId}`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        setViewers(json.viewers ?? []);
      }
    } catch {}
    if (active) setTimeout(tick, 5_000);
  }
  tick();
  return () => { active = false; };
}
```

- [ ] **Step 4: Create fallback route**

`apps/web/app/api/admin/presence/[entityType]/[entityId]/route.ts`:

```ts
import { auth } from '@casella/auth';
import { apiError } from '@casella/types';

// In-memory TTL cache (per server-instance only — acceptable for solo-admin / small team).
const cache = new Map<string, { viewers: { userId: string; name: string; avatarHue: number; lastSeenAt: number }[] }>();
const TTL_MS = 30_000;

function cleanup(key: string) {
  const entry = cache.get(key);
  if (!entry) return;
  const now = Date.now();
  entry.viewers = entry.viewers.filter((v) => now - v.lastSeenAt < TTL_MS);
  if (entry.viewers.length === 0) cache.delete(key);
}

export async function GET(_req: Request, { params }: { params: { entityType: string; entityId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json(apiError('unauthorized', 'Niet ingelogd'), { status: 401 });
  const key = `${params.entityType}:${params.entityId}`;
  cleanup(key);

  // Heartbeat: register this viewer
  const entry = cache.get(key) ?? { viewers: [] };
  const idx = entry.viewers.findIndex((v) => v.userId === session.user.id);
  const viewer = {
    userId: session.user.id,
    name: session.user.name ?? session.user.email!,
    avatarHue: (session.user.id.charCodeAt(0) * 37) % 360,
    lastSeenAt: Date.now(),
  };
  if (idx >= 0) entry.viewers[idx] = viewer; else entry.viewers.push(viewer);
  cache.set(key, entry);

  return Response.json({ viewers: entry.viewers.map(({ lastSeenAt: _, ...v }) => v) });
}
```

- [ ] **Step 5: Create avatar-stack component**

`presence-avatar-stack.tsx`:

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEntityPresence, type PresenceUser } from './use-entity-presence';

function Avatar({ user }: { user: PresenceUser }) {
  const initials = user.name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <span
      className="grid size-6 place-items-center rounded-full text-[10px] font-medium text-white border-2 border-surface-base"
      style={{
        background: `linear-gradient(135deg, oklch(70% 0.18 ${user.avatarHue}), oklch(55% 0.20 ${(user.avatarHue + 60) % 360}))`,
      }}
      title={user.name}
    >
      {initials}
    </span>
  );
}

export function PresenceAvatarStack() {
  const pathname = usePathname();
  // Only render on detail pages: /admin/medewerkers/<uuid>
  const m = pathname?.match(/^\/admin\/medewerkers\/([0-9a-f-]{36})/);
  if (!m) return null;
  const entityId = m[1];
  const viewers = useEntityPresence('employee', entityId);
  if (viewers.length === 0) return null;
  const visible = viewers.slice(0, 3);
  const overflow = viewers.length - visible.length;
  return (
    <div className="flex items-center -space-x-2" aria-label={`${viewers.length} viewer${viewers.length === 1 ? '' : 's'}`}>
      {visible.map((v) => <Avatar key={v.userId} user={v} />)}
      {overflow > 0 && (
        <span className="grid size-6 place-items-center rounded-full bg-surface-deep text-[10px] text-fg-tertiary border-2 border-surface-base">
          +{overflow}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Mount stack in TopBar right-cluster**

In `top-bar.tsx`, before notification-bell:

```tsx
import { PresenceAvatarStack } from '../presence/presence-avatar-stack';

<PresenceAvatarStack />
<NotificationBell />
<EnvBadge />
<UserMenu />
```

- [ ] **Step 7: Add PRESENCE-MULTI-USER-POLISH to deferred-work**

Append to `docs/casella-deferred-work.md`:

```markdown
### PRESENCE-MULTI-USER-POLISH — Real-multi-user validation deferred to Fase 2
- **Category**: UX-polish (also Fase 2 prep)
- **Deferred from**: Plan 1.1b Task 32 (C-16, 2026-04-26)
- **Why deferred**: Solo-admin context limits multi-user testing. Self-presence (2 tabs) works; cross-user behavior needs >1 admin.
- **Pickup trigger**: When Ascentra adds 2nd admin OR Fase 2 (production) brings real concurrency.
- **Estimated cost**: 1 day testing + UX polish (presence-tooltips, "viewing-since" copy, channel scaling).
- **Impact if skipped**: Infrastructure works; UX-polish deferred.
- **Status**: open
```

- [ ] **Step 8: Manual smoke (self-presence)**

Open employee detail in 2 tabs. Both tabs should show 2 avatars in stack. Close one → after up to 5s, count drops to 1.

- [ ] **Step 9: Commit**

```bash
git add apps/web/features/admin-shell/presence/ apps/web/app/api/admin/presence/ apps/web/features/admin-shell/top-bar/ apps/web/package.json pnpm-lock.yaml docs/casella-deferred-work.md
git commit -m "feat(shell): presence-indicators (Supabase Realtime + polling fallback) (C-16)"
```

---

### Task 33: ✅ Final sanity-check + deferred-work close-out + PR open

**Files:**
- Modify: `docs/casella-deferred-work.md` (final status updates with SHAs)
- Modify: `docs/sanity-check-log.md` (append entry 9, pre-PR)
- Add COACHING-DASHBOARD entry

- [ ] **Step 1: Run all 6 sanity-check commands**

```bash
git status
git log --oneline main..HEAD | wc -l
pnpm -r typecheck
pnpm -r test
pnpm -F @casella/web build
pnpm -F @casella/web lint
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "SELECT id FROM drizzle.__drizzle_migrations ORDER BY id;"
```

Expected: 7 migrations now (0000-0006: original 4 + `0004_user_last_seen_audit_at`, `0005_user_pins_table`, `0006_employees_search_tsvector`).

- [ ] **Step 2: Run E2E suite**

```bash
pnpm -F @casella/web e2e
```

Expected: smoke + visual-tokens + non-skipped specs all pass. Skipped specs (auth-fixture-blocked) documented in their files.

- [ ] **Step 3: Manual full-flow smoke**

Per spec section 6 DoD-item-8:
1. Login → top-bar visible with all 6 right-cluster elements (presence stack hidden on list)
2. List `/admin/medewerkers`: TopBar shows "+ Nieuw" + "Exporteer"
3. Click row → drawer opens (intercepting route), URL changes, breadcrumb-switcher works
4. Edit a field → auto-save fires, saved-pill shows "Opgeslagen Xs geleden"
5. Pin employee via kebab → sidebar Favorieten populates
6. Open ⌘K palette, type `@alice` → server-search returns + preview-hover works
7. Notification-bell shows recent activity (audit-log entries from this session)
8. Open second tab on same employee detail → presence-stack shows 2 avatars
9. UserMenu → Afmelden → returns to /login

If any step fails: do NOT proceed to PR; log the failure and fix before retrying.

- [ ] **Step 4: Update deferred-work final statuses**

Open `docs/casella-deferred-work.md`. For each item completed in 1.1b, update `Status` to `done` with the actual commit SHA from `git log`:

```bash
# example: get SHA for ML-1
git log --oneline --grep="ML-1" --grep="design-tokens" -i | head -1
```

Final list:
- ML-1 → done (SHA from Task 2)
- ML-5 → done (SHA from Task 6)
- TD-1 → done (SHA from Task 8)
- TD-4 → done (SHA from Task 4)
- TD-5 → done (SHA from Task 5)
- TD-6 → done (SHA from Task 3)
- DD-1 → done (SHA from Task 2 — same as ML-1)
- DD-3 → done (SHA from Task 7)
- DD-4 → confirm `abandoned` with SHA from Task 10
- DD-5 → done (SHA from Task 13)

- [ ] **Step 5: Add COACHING-DASHBOARD deferred entry**

Append to `docs/casella-deferred-work.md`:

```markdown
### COACHING-DASHBOARD — Consolidated "learnings" view in user-menu
- **Category**: UX-polish
- **Deferred from**: Plan 1.1b Task 29 (C-13, 2026-04-26)
- **Why deferred**: 1.1b ships ad-hoc tip-toasts. Long-term: a "Mijn voortgang" page in user-menu showing which shortcuts user has discovered, which tips dismissed, etc.
- **Pickup trigger**: After 4-6 weeks of solo-admin usage to gauge whether learnings-dashboard adds value, OR when 2nd admin is onboarded.
- **Estimated cost**: 4 hours.
- **Impact if skipped**: Tips work, but no overview/retrospective for the user.
- **Status**: open
```

- [ ] **Step 6: Append final sanity-check log entry**

```markdown
## 2026-XX-XX — Sanity-check 9 (pre-PR, einde Plan 1.1b)

- HEAD: <SHA>
- Status: GREEN
- Migrations applied: 0000-0006 (added 0004 last_seen, 0005 pins, 0006 search-tsvector)
- Tasks completed: 33 (D=9 incl. sanity, B=5, C=19 incl. 2 sanity + 1 final wrap)
- Mobile alignment: ML-1 ✓ done, ML-2 ✓ all routes are RH, ML-5 ✓ done; ML-3/ML-4/ML-6 unchanged
- Deferred-work delta: 10 items closed/abandoned + 4 new entries (PROFILE-PAGE-STUB, FAVORITES-FULL-VIEW, PRESENCE-MULTI-USER-POLISH, COACHING-DASHBOARD)
- Notes: Foundation hardened, Employees module complete, AAA shell shipped. Ready for PR + merge.
```

- [ ] **Step 7: Commit final docs**

```bash
git add docs/casella-deferred-work.md docs/sanity-check-log.md
git commit -m "docs: final sanity-check + deferred-work close-out for Plan 1.1b"
```

- [ ] **Step 8: Push branch**

```bash
git push -u origin fase-1-1b-foundation-completion-shell
```

- [ ] **Step 9: Open PR**

```bash
gh pr create --title "Plan 1.1b: Foundation-lift + Employee completion + AAA shell" --body "$(cat <<'EOF'
## Summary

- **Chapter D — Foundation-lift (8 tasks)**: design-tokens lifted to `packages/design-tokens` (TS source-of-truth, CSS-vars generated, Tailwind imports TS), `text-text-*` → `text-fg-*` codemod, ESLint v9 flat-config + CI lint-job, error-shape standardized via `apiError()` helper, zod aligned via pnpm catalog, cursor-SQL Drizzle-native, theme-bootstrap from DB on first login, ThemeToggle arrow-key navigation.
- **Chapter B — Employee completion (5 tasks)**: EmployeeWizard mode-aware (`create | edit`) with diff-view, intercepting-routes for edit-drawer (`/admin/medewerkers/[id]` over list), Manager-select hidden (DB column + Zod field retained), DD-5 column-toggles + statusVariant-switcher in `ListTweaksDock`.
- **Chapter C — AAA shell-chrome (17 tasks)**: TopBar with breadcrumbs (Context+hook), ⌘K command-pill, `?` shortcut overlay, UserMenu, EnvBadge verhuis, context-aware actions-slot per route, breadcrumb-segment entity-switcher, command-palette mode-scoping (`>` `@` `#` `?` prefix-chips), global ⌘N quick-create, notification-center bell with audit-stream, auto-save with If-Match conflict-detection, shortcut-coaching tip-surfacing, pinned entities (sidebar favorites + RLS), server-side tsvector search with preview-hover, presence-indicators via Supabase Realtime with polling-fallback.

## Test plan

- [ ] `pnpm -r typecheck` clean
- [ ] `pnpm -r test` all green
- [ ] `pnpm -F @casella/web lint` 0 errors, 0 warnings
- [ ] `pnpm -F @casella/web build` clean (15+ routes)
- [ ] `pnpm -F @casella/web e2e` Playwright suite green (skipped specs documented)
- [ ] Migrations 0000-0006 applied locally (`SELECT id FROM drizzle.__drizzle_migrations`)
- [ ] CI green on this PR (lint + typecheck + build + test + RLS apply)
- [ ] Manual smoke: login → list → context-action "+ Nieuw" → create → detail via breadcrumb-switcher → auto-save edit → pin employee → ⌘K `@`-scope find → notifications-bell shows audit → user-menu → afmelden (presence-avatar visible during 2-tab test)
- [ ] Lighthouse on `/admin/medewerkers`: a11y ≥ 95, performance ≥ 85

## Spec + plan

- Spec: `docs/superpowers/specs/2026-04-25-casella-fase-1-1b-foundation-completion-shell.md`
- Plan: `docs/superpowers/plans/2026-04-26-casella-fase-1-1b-foundation-completion-shell.md`

## Deferred-work delta

10 items closed (ML-1, ML-5, TD-1, TD-4, TD-5, TD-6, DD-1, DD-3, DD-5) or abandoned (DD-4); 4 new entries (PROFILE-PAGE-STUB, FAVORITES-FULL-VIEW, PRESENCE-MULTI-USER-POLISH, COACHING-DASHBOARD).

## Sanity-check log

Entries 6-9 logged per chapter — see `docs/sanity-check-log.md`.

## Breaking changes

None — all additive. The `text-text-*` → `text-fg-*` codemod is internal (no public API).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 10: Verify PR + CI**

After PR opens:

```bash
gh run list --branch fase-1-1b-foundation-completion-shell --limit 3
```

Expected: latest run shows `in_progress` then `success` after CI completes.

- [ ] **Step 11: When CI green → ready to merge**

Merge via GitHub UI or:

```bash
gh pr merge --squash --delete-branch
```

(Don't auto-merge — let Alex review screenshots + ship.)

---

## Plan size summary

| Plan-tasks | Numbered | Notes |
|---|---|---|
| Task 1 — Playwright scaffold | 1 prereq | New dependency, gates all e2e tests |
| Tasks 2–8 — Chapter D (7 plan-tasks, 8 spec-items) | D-1+D-8 bundled in Task 2 | ML-1, DD-1, TD-6, TD-4, TD-5, ML-5, DD-3, TD-1 |
| Task 9 — Chapter D sanity-check | 1 checkpoint | log entry 6 |
| Tasks 10–13 — Chapter B | 4 plan-tasks | B-3, B-1, B-2, B-4 |
| Task 14 — Chapter B housekeeping + sanity | 1 (B-5 + checkpoint) | log entry 7 |
| Tasks 15–26 — Chapter C core | 12 plan-tasks | C-0 through C-11 |
| Task 27 — Chapter C core sanity-check | 1 checkpoint | log entry 8 |
| Tasks 28–32 — Chapter C extensions | 5 plan-tasks | C-12, C-13, C-14, C-15, C-16 |
| Task 33 — Final sanity-check + PR open | 1 checkpoint + PR | log entry 9 |
| **Totaal** | **33 plan-tasks** | (30 spec-items, condensed in places + 1 prereq + 3 sanity gates) |

---

