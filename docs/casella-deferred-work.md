# Casella — Deferred Work Backlog

Living document. Every deliberately-deferred decision or task lands here so future sessions (and future-Alex) don't lose track.

**Review triggers** — read this file and propose items to move in-scope when:
- Starting a new plan (Plan 1.1b, 1.2, 1.3, 2, 3, 4)
- Finishing a plan (end of 1.1a, before PR merge)
- User asks for a sanity check
- Adding a task that touches the same surface as a deferred item

**Entry format**:
- **Title** — one-line summary
- **Category** — Mobile-alignment / Tech-debt / Design-debt / UX-polish / Security / Test-coverage
- **Deferred from** — where/when the decision was made
- **Why deferred** — honest reason (YAGNI / cost / waiting-on / out-of-scope)
- **Pickup trigger** — concrete condition that means "now time to do it"
- **Estimated cost** — hours, ballpark
- **Impact if skipped** — what breaks or gets worse
- **Status** — `open` / `in-progress` / `done` (with commit SHA if done) / `abandoned` (with reason)

---

## Mobile-alignment (Fase 3 prep)

### ML-1 — Lift design tokens from CSS variables to a TypeScript package
- **Category**: Mobile-alignment
- **Deferred from**: Fase 1.1a Task 3 + sanity check 2 (2026-04-23)
- **Why deferred**: Current tokens live in `apps/web/app/globals.css` + `apps/web/tailwind.config.ts`. Refactoring mid-plan would have risked a 3-way sync between CSS, Tailwind, and a new TS source. Safer to lift after foundation is stable.
- **Pickup trigger**: Start of Plan 1.1b OR first commit of Fase 3 (RN app scaffold).
- **Estimated cost**: 2–4 hours.
- **Impact if skipped**: RN app re-types every hex/rgb value by hand; every palette change needs two-file sync; design drift likely.
- **Plan**: Create `packages/design-tokens/src/index.ts` exporting pure TS objects for palette, motion, type-scale, glow, density. Have `globals.css` and `tailwind.config.ts` derive from it (runtime `var(--*)` stays for the CSS side; Tailwind config imports TS directly; future RN imports TS directly).
- **Status**: open

### ML-2 — Use Route Handlers (not Server Actions) for all admin mutations
- **Category**: Mobile-alignment
- **Deferred from**: Plan 1.1a Task 16 (and dependent tasks 20, 25) — decision locked 2026-04-23 during sanity check 2
- **Why deferred**: Plan snippets use Server Actions; controller overrides to Route Handlers at dispatch time instead of rewriting the plan file.
- **Pickup trigger**: already in progress — applies to Tasks 16, 20, 25 at dispatch.
- **Estimated cost**: ~4 hours over three tasks, vs plan-snippet baseline.
- **Impact if skipped**: Every admin mutation needs a second implementation for mobile. Also blocks external integrations (AstraSign, future public API).
- **Plan**: At dispatch of Task 16, rewrite the snippet to build `app/api/admin/employees/**/route.ts` with zod body-validation, cookie/session auth, and JSON responses. Web forms POST via `fetch`. Same pattern for Task 20 (drawer submit) and Task 25 (terminate).
- **Status**: in-progress (scheduled for Task 16+)

### ML-3 — Evaluate NativeWind for Tailwind-class portability
- **Category**: Mobile-alignment
- **Deferred from**: Sanity check 2 (2026-04-23)
- **Why deferred**: Big architectural call; doesn't affect web; needs to be decided when starting Fase 3 alongside RN library choices (Expo Router, navigation, state).
- **Pickup trigger**: First brainstorm session for Fase 3 RN app.
- **Estimated cost**: Decision = 1 hour research. If yes, ongoing cost of occasional class-incompatibility fixes.
- **Impact if skipped**: Every web component reimplemented from scratch in RN using Expo/native primitives. Higher consistency risk between web and mobile.
- **Status**: open — not urgent until Fase 3 planning

### ML-4 — Plan Expo AuthSession / Entra flow for mobile
- **Category**: Mobile-alignment
- **Deferred from**: Sanity check 2 (2026-04-23)
- **Why deferred**: Web uses Auth.js v5; mobile needs a parallel Expo AuthSession flow. Same Entra app registration, different client implementation.
- **Pickup trigger**: Start of Fase 3 RN planning.
- **Estimated cost**: 1 day (including testing on iOS simulator + Android emulator).
- **Impact if skipped**: Blocker for mobile MVP — no login.
- **Status**: open

### ML-6 — Mobile + web share `REQUIRED_CREATE_EMPLOYEE_FIELDS` constant
- **Category**: Mobile-alignment
- **Deferred from**: Claude Design wizard handoff (2026-04-24)
- **Why deferred**: Mobile (Fase 3) doesn't exist yet, so the consumer side of the constant is theoretical. The constant IS already exported from `@casella/types` (commit `af666f2`) and the web wizard validates against the same field-set the constant lists. When the RN app is built, it imports `REQUIRED_CREATE_EMPLOYEE_FIELDS` and renders its own create-form with identical required-set — zero drift.
- **Pickup trigger**: First commit of mobile create-employee form (Fase 3).
- **Estimated cost**: 0h on the web side (already done). Mobile side: ~30 min to wire the constant into RN form validation.
- **Impact if skipped**: Mobile reimplements its own ad-hoc required list that drifts from web over time, leading to "you can create a record on web that you can't on mobile" inconsistencies.
- **Status**: open (web side ready, mobile side pending Fase 3)

### ML-5 — Theme preference bootstrapping from DB on login
- **Category**: Mobile-alignment (also web polish)
- **Deferred from**: Plan 1.1a Task 7 code review (2026-04-23)
- **Why deferred**: Web today reads theme from cookie, writes to DB fire-and-forget. Works but: new device login doesn't pick up stored preference until next round-trip.
- **Pickup trigger**: When building mobile login, or as polish on Task 21 (invite-flow Auth.js changes).
- **Estimated cost**: ~1 hour — read `users.theme_preference` in the JWT callback, set cookie on initial login.
- **Impact if skipped**: Web: cosmetic only. Mobile: must implement theme-from-DB anyway, so design once.
- **Status**: open

---

## Tech debt

### TD-1 — ESLint flat config + CI gate
- **Category**: Tech-debt
- **Deferred from**: Fase 0 (scaffold-gap), confirmed sanity check 1 (2026-04-23)
- **Why deferred**: Fase 0 shipped with ESLint in devDeps but no config file. `next lint` was deprecated in Next 16 and requires interactive setup. Plan 1.1a removed the broken script (commit `82da919`); setup deferred to keep 1.1a focused.
- **Pickup trigger**: Plan 1.1b, task 1.
- **Estimated cost**: 2–3 hours (flat config for Next 15 + React 19 + TypeScript + monorepo; wire CI step; fix any violations).
- **Impact if skipped**: No linting at all. Style drift, bug-prone patterns slip through, accessibility misses (jsx-a11y).
- **Status**: open — Plan 1.1b task TBD

### TD-2 — Test coverage for `apps/web` UI + API routes
- **Category**: Test-coverage
- **Deferred from**: Plan 1.1a (scope decision — smoke test in Task 31 only)
- **Why deferred**: Plan explicitly relies on typecheck + Task 31 E2E smoke to validate web layer. Unit tests on RSC/Server Components are still awkward in Next 15.
- **Pickup trigger**: Plan 1.2 or after production incident exposes coverage gap.
- **Estimated cost**: 1–2 days for ~60% coverage on mutations, server actions/routes, and critical forms. Playwright for E2E.
- **Impact if skipped**: Regressions in PDOK integration, drawer forms, or API validation could ship silently. Relies on manual smoke test per PR.
- **Status**: open

### TD-3 — Postgres `vector` container restart loop
- **Category**: Tech-debt (operational)
- **Deferred from**: Fase 0 carry-over
- **Why deferred**: `supabase_vector_Casella` has been restarting in loop since Fase 0; not blocking any feature. Probably missing SCHEMA or extension config.
- **Pickup trigger**: When doing AI/embeddings work (Fase 4 smart features) or if logs get noisy.
- **Estimated cost**: 30 min investigation.
- **Impact if skipped**: None today; blocks pgvector-based features (embedding-search, AI features).
- **Status**: open

### TD-5 — Replace bare-table cursor SQL in `listEmployees` with Drizzle subquery
- **Category**: Tech-debt
- **Deferred from**: Plan 1.1a Task 16 code review (2026-04-24)
- **Why deferred**: `apps/web/app/(admin)/admin/medewerkers/queries.ts` cursor branch uses `sql\`SELECT created_at FROM employees WHERE id = \${cursor}\`` — bare table name. Works today; would silently break if Drizzle schema ever moves to a non-`public` schema or aliased table name. Foundation phase, low risk now.
- **Pickup trigger**: When adding a second cursor-paginated query (clients/projects in 1.1b), OR when Postgres `search_path` policy changes.
- **Estimated cost**: 30 min — extract cursor row in a separate `tx.select()` query before building the where clause, OR use Drizzle's `sql.identifier(schema.employees, 'createdAt')`.
- **Impact if skipped**: Future schema reorg breaks pagination silently. Today: zero impact.
- **Status**: open

### TD-6 — Standardize API error-response shape across Route Handlers
- **Category**: Design-debt
- **Deferred from**: Plan 1.1a Task 16 code review (2026-04-24)
- **Why deferred**: Task 12 PDOK routes return `{ error: "Address service unavailable" }` (human-readable). Task 16 employees routes return `{ error: "validation_error", issues: ... }` (machine code). Both work; mixed style hurts client-side error mapping ergonomics.
- **Pickup trigger**: Plan 1.1b polish, OR before opening the public-facing API to mobile (Fase 3).
- **Estimated cost**: 1 hour — pick the snake_case-code shape (it serializes well for i18n + machine handling), update the four PDOK route responses + the shared `pdokErrorResponse` helper to match. Update Task 13's AddressInput error mapper accordingly.
- **Impact if skipped**: Mobile and AstraSign clients each invent their own translation layer. Eventually a translation drifts and a user sees a code instead of a message.
- **Status**: open

### TD-4 — Align `zod` range across the monorepo (catalog or matching range)
- **Category**: Tech-debt
- **Deferred from**: Plan 1.1a Task 8 code review (2026-04-23)
- **Why deferred**: `pnpm dlx shadcn@latest add ... form` bumped `apps/web/package.json` zod from `^3.23.0` to `^3.25.76`. `packages/types/package.json` still declares `^3.23.0`. Lockfile dedupes both to the same installed version today, so typechecks + runtime are unaffected. Aligning ranges mid-plan risks lockfile churn that obscures Task 8's scope.
- **Pickup trigger**: Start of Plan 1.1b (alongside ML-1 design-tokens lift), OR when next adding/upgrading any package that depends on zod.
- **Estimated cost**: 15 min — either bump `packages/types` to `^3.25.76`, or define a pnpm catalog entry (`pnpm.catalogs.default.zod`) and reference `"zod": "catalog:"` from both packages.
- **Impact if skipped**: Maintenance smell. Risk: a future install on a fresh clone could resolve packages/types to a 3.23 install while apps/web pulls 3.25, then a Zod schema shared between them via `@casella/types` could behave differently per consumer. Currently masked by the lockfile.
- **Status**: open

---

## Design debt

### DD-1 — `text-text-*` stutter convention in Tailwind
- **Category**: Design-debt
- **Deferred from**: Task 4 code review (2026-04-23)
- **Why deferred**: `colors.text.primary` produces `text-text-primary`; plan uses this stutter 30+ times downstream. Renaming to `fg.primary` means patching every plan-snippet.
- **Pickup trigger**: If a developer new to the codebase reports confusion, or during Plan 1.1b writeup (chance to rename once before more components exist).
- **Estimated cost**: ~30 min — rename token group, codemod all usages, update plan files.
- **Impact if skipped**: Ugly but works. Risk: future dev types `text-primary` expecting ink, gets violet.
- **Status**: open

### DD-2 — Status amber (`--status-warning`) contrast on surface-base
- **Category**: Design-debt
- **Deferred from**: Task 3 code review (2026-04-23)
- **Why deferred**: `#f5c55c` amber on cream has ~1.6:1 contrast — fails WCAG for text use. Status tokens are meant for backgrounds/icons, not text, but that's not documented.
- **Pickup trigger**: First time a component uses `text-status-warning` / `text-status-pending` on surface bg.
- **Estimated cost**: 1 hour — add `--status-warning-on-surface` darkened token, or document that status tokens are bg/icon-only.
- **Impact if skipped**: Eventually a warning message renders illegible.
- **Status**: open

### DD-4 — Manager-select in EmployeeDrawer wizard uses dummy options
- **Category**: Design-debt (UX-feature gap)
- **Deferred from**: Claude Design wizard handoff Step 2 — Dienstverband (2026-04-24)
- **Why deferred**: Wizard step 2 has a Manager `<Select>` with 3 hardcoded names (Esmée van der Velden / Sanne Bakker / Maarten de Groot) per the design prototype. Real implementation needs a query for users with role=admin (or a managers-only role to be defined). Wizard currently persists the selection in local state but does NOT send `managerId` to the API (intentional — the dummy strings aren't valid UUIDs and would fail the Zod schema parse).
- **Pickup trigger**: Plan 1.1b (alongside Clients/Projects CRUDs which will likely also need manager pickers).
- **Estimated cost**: ~1.5 hour — define managers query in `apps/web/lib/employees/managers.ts`, server-fetch in the wizard or pass down from the page, replace the 3 SelectItems with a mapped list, send the real UUID as `managerId` in the POST body, drop the TODO comments.
- **Impact if skipped**: Admin can't actually pick a manager during create — has to edit the employee later (and edit-mode is also deferred to 1.1b). Combined: no manager assignment in 1.1a at all.
- **Status**: open — TODO comments in `apps/web/features/employees/drawer/wizard/steps/step-dienstverband.tsx` mark the spot

### DD-3 — Consider `role="group"` + keyboard arrow-nav on ThemeToggle (radiogroup polish)
- **Category**: UX-polish
- **Deferred from**: Task 7 fix-up scope (2026-04-23)
- **Why deferred**: Implemented `role="radiogroup"` + `role="radio"` + `aria-checked` — correct semantics. Missing: arrow-key navigation between options (standard radio-group keyboard behavior).
- **Pickup trigger**: Accessibility audit pass, Plan 1.1b final polish.
- **Estimated cost**: 30 min.
- **Impact if skipped**: Keyboard users tab through each button individually instead of arrow-navigating within group. Functional, not optimal.
- **Status**: open

---

## Security

### SEC-1 — Rate limiting on `/api/user/theme` (and future mutation routes)
- **Category**: Security
- **Deferred from**: Task 7 code review (2026-04-23)
- **Why deferred**: Internal staff tool, low threat model. Will add to all mutation endpoints as a Fase 2 middleware.
- **Pickup trigger**: Fase 2 (production infra) or when moving beyond single-tenant.
- **Estimated cost**: 2–3 hours — add Upstash/Redis or Postgres-based rate limiter middleware.
- **Impact if skipped**: A logged-in user could spam theme-change (or any) endpoint. Internal-only tool, so low risk.
- **Status**: open

### SEC-2 — `server-only` import guard on `apps/web/lib/theme-cookie.ts` (and future server-only helpers)
- **Category**: Security
- **Deferred from**: Task 7 code review (2026-04-23)
- **Why deferred**: Adding the `server-only` npm package requires a new dep. Next.js already surfaces a (cryptic) error if a client component imports `next/headers`, so the guard is belt-and-suspenders.
- **Pickup trigger**: When installing any other security-related lib (e.g. `zod-openapi` or Upstash).
- **Estimated cost**: 10 min.
- **Impact if skipped**: Less clear error message when a future import mistake happens.
- **Status**: open

### DD-5 — List tweaks: column visibility, statusVariant, full tweaks-panel
- **Category**: Design-debt (UX-polish)
- **Deferred from**: Plan 1.1a list-page Variant A implementation (2026-04-23)
- **Why deferred**: 1.1a ships minimal 2-toggle tweaks dock (density + showAvatars). Column visibility toggles (email, function, status, startDate) and statusVariant switching (pill/dot/text) are fully designed in the tweaks-dock reference but would double implementation scope without material user value in alpha.
- **Pickup trigger**: Plan 1.1b polish, after collecting feedback on column relevance from admin users.
- **Estimated cost**: 2–3 hours — extend `ListPrefs` interface with `columns` bitmask + `statusVariant`, update `list-prefs-cookie-shared.ts`, add toggles to `ListTweaksDock`, thread visibility props through `EmployeesListShell` table headers/cells.
- **Impact if skipped**: Users can't hide irrelevant columns. Acceptable for admin-only alpha; would degrade UX if list grows to 100+ employees.
- **Status**: open

---

## Done (audit trail)

### DONE — Task 3 color mismatch + focus-visible radius
- **Status**: done, commit `bec3b6f`
- **Category**: Design-debt
- **Resolved**: 2026-04-23

### DONE — Task 6 `secure` cookie flag + cookie-name deduplication
- **Status**: done, commit `7ba4554`
- **Category**: Security + tech-debt
- **Resolved**: 2026-04-23

### DONE — Task 7 JSON parse 500→400 + radiogroup a11y + lazy useState
- **Status**: done, commit `e5b3a0b`
- **Category**: Tech-debt + UX-polish
- **Resolved**: 2026-04-23

### DONE — Task 6/7 shared client-safe constants split (`theme-cookie-shared.ts`)
- **Status**: done, commit `4a99caf`
- **Category**: Architecture (client/server boundary)
- **Resolved**: 2026-04-23
