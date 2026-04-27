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
- **Status**: done — Plan 1.1b Task 8, see Done section

### TD-1-FOLLOWUP — Vitest collects e2e Playwright specs (pre-existing tooling drift)
- **Category**: Tech-debt (test tooling)
- **Discovered during**: Plan 1.1b Task 8 (TD-1) verification — `pnpm test` in `apps/web` fails with "Playwright Test did not expect test.describe() to be called here" against 4 files in `e2e/`.
- **Why deferred**: Pre-existing on HEAD `c305520`. Verified via `git stash` test on the unmodified branch — same 4 failures. Vitest config in `apps/web` has no `test.exclude` for `e2e/**`, so `vitest run` picks up Playwright specs and fails. Out of scope for T8 (lint setup).
- **Pickup trigger**: Next test-related task, OR before relying on `pnpm test` as a green-bar gate locally.
- **Estimated cost**: 10–15 min — add `apps/web/vitest.config.ts` with `test: { exclude: ['e2e/**', 'node_modules/**'] }` (or `include` whitelist for `**/*.test.{ts,tsx}` if any unit tests get added).
- **Impact if skipped**: `pnpm test` is red locally. CI is unaffected today because root `pnpm test` may not gate on this currently — verify CI behavior before next test step is added.
- **Status**: done in commit `c34ee7c` — `apps/web/vitest.config.ts` excludes `e2e/**`, `node_modules/**`, `.next/**`. `pnpm -r test` green.

### TD-1-FOLLOWUPS — Code-review nits from T8 (low-priority polish)
- **Category**: Tech-debt
- **Discovered during**: Plan 1.1b Task 8 (TD-1) code-quality review (commit `a350297`).
- **Why deferred**: All three are NIT/LOW severity per reviewer. T8 verdict was APPROVE; nits are polish, not correctness.
- **Pickup trigger**: Next time touching the affected files, OR a dedicated polish-pass before 1.1b PR open.
- **Estimated cost**: ~15 min total.
- **Items**:
  1. **`apps/web/components/theme/theme-toggle.tsx:65`** — replace `tabIndex={-1}` on radiogroup container with per-line `// eslint-disable-next-line jsx-a11y/interactive-supports-focus -- WAI-ARIA APG: radiogroup is composite role; roving tabindex on children handles focus`. Update Playwright spec to focus the active radio child instead of the container. WAI-ARIA APG explicitly says the radiogroup container is non-focusable.
  2. **`apps/web/features/employees/list/employees-list-shell.tsx`** — add a `TODO(plan-1.2)` comment near `_nextCursor` documenting that cursor-based pagination is not yet wired to the shell UI (carry-over from 1.1a). Prevents the rename from looking like dead code.
  3. **`apps/web/eslint.config.mjs`** — add `out/**` to ignores defensively (in case a future task adds Next.js static export).
- **Impact if skipped**: Cosmetic only. No functional break.
- **Status**: open

### B-1-FOLLOWUPS — Code-review nits from T11 (EmployeeWizard mode-aware)
- **Category**: Mixed (UX + TS + Product + Test)
- **Discovered during**: Plan 1.1b Task 11 (B-1) full-pad review (commit `70588f3`).
- **Why deferred**: T11 verdict was APPROVE-WITH-NITS; geen blocker, geen high. 5 polish-items waarvan 2 MEDIUM (UX + product), 3 LOW (TS + test).
- **Pickup trigger**: B-1-FOLLOWUP-1 zodra opnieuw aan stepper wordt gewerkt; B-1-FOLLOWUP-3 bij eerste user-feedback over invite-email confusion; rest bij polish-pass voor 1.1b PR open.
- **Estimated cost**: ~1.5h totaal.
- **Items**:
  1. **[UX/MEDIUM] `apps/web/features/employees/drawer/wizard/components/stepper.tsx:18`** — Stepper-pill leest "Stuur" in zowel create als edit-mode; in edit-mode toont header al "Wijzigingen — Controleer voor opslaan" via `EDIT_STEPS`. Refactor: `<Stepper>` accepteert een `steps?: typeof STEPS` prop; `EditWizard` geeft `EDIT_STEPS` mee. ~15 regels.
  2. **[TS/LOW] `apps/web/app/api/admin/employees/[id]/route.ts:38`** — `addr.country as "NL"` cast. Tighten zodra non-NL-adressen daadwerkelijk in scope komen (BE/DE cross-border). Voor nu pragmatic; runtime-check (`addr.country === "NL" ? "NL" : ...`) als alternatief.
  3. **[Product/MEDIUM]** Beslissen of `inviteEmail` UI-read-only moet worden in edit-mode na eerste activatie (`userId !== null`). Huidig: editable. PATCH triggert geen re-invite, audit-trail dekt het, dus geen direct risico — alleen ambiguity in welke email "the invite" was. Beslissing kan via product-discussion of bij eerste user-feedback.
  4. **[Test/LOW]** Unit-tests toevoegen voor `diffForm()` en `pdokAddressToAddressInput`/`addressInputToPdokAddress` round-trip in `apps/web/features/employees/drawer/wizard/helpers/employee-mapping.ts`. Pure functions, behavior-rich, niet covered.
  5. **[Test/LOW]** Manual smoke voor T11 is overgeslagen door implementer; T12 e2e (`apps/web/e2e/edit-employee.spec.ts`) is de juiste plek voor full edit-flow coverage.
- **Impact if skipped**: B-1-FOLLOWUP-1 = zichtbaar UX-mismatch. B-1-FOLLOWUP-3 = mogelijk product-confusion. Rest = polish + maintainability.
- **Status**: open

### B-2-FOLLOWUPS — Code-review nits from T12 (intercepting routes)
- **Category**: Mixed (UX + Tech-debt + Test)
- **Discovered during**: Plan 1.1b Task 12 (B-2) full-pad review (commit `fec033a`).
- **Why deferred**: T12 verdict was APPROVE-WITH-NITS; geen blocker. 1× HIGH-latent (geen current call-site), 2× MEDIUM, 4× LOW/NIT.
- **Pickup trigger**: Items 1-2 bij volgende auto-save iteratie (C-12); item 3 vóór map-werk in T13+; item 4 zodra deep-link-entry naar intercepted modal bestaat; item 5 zodra auth-fixture er is; item 6 vóór branch merge.
- **Estimated cost**: ~2h totaal.
- **Items**:
  1. **[Tech-debt/MEDIUM] Double `router.refresh()` na edit-save** — `EditWizard.submit()` (`employee-wizard.tsx:459`) doet `router.refresh()`; daarna roept het `onSaved?.()` aan dat in zowel `InterceptedEditDrawer:46` als `EmployeeDetailFallback` ook `router.refresh()` is. Twee server-renders per save = wasted DB roundtrip. Fix: kies één locatie en strip de andere.
  2. **[Tech-debt/LOW] DTO mapper duplicatie** — `apps/web/lib/employees/get-by-id.ts` en `apps/web/app/api/admin/employees/[id]/route.ts:29-75` bevatten near-identical employee+address → `EmployeeWithAddress` mapping (incl. `addr.country as "NL"`, `addr.lat ?? 0`, ISO normalisatie). Extract naar `apps/web/lib/employees/_dto.ts` zodat one-source-of-truth.
  3. **[Data-correctness/LOW] `addr.lat ?? 0` / `addr.lng ?? 0` produces Atlantic-Ocean coords** voor legacy address-rows met null lat/lng. Pre-existing pattern (al in T11 GET-endpoint). Fix vóór map-routes/route-cache: `AddressInput.lat` nullable maken OF backfill via PDOK OR skip-render-when-coords-missing.
  4. **[Architecture/HIGH-latent] `router.back()` durability** — `intercepted-edit-drawer.tsx:25` en wizard's Esc-handler gebruiken `router.back()`. Werkt vandaag prima omdat alle entry-points via list-row-click gaan. Risico: zodra ander deel van app `router.push("/admin/medewerkers/[id]")` doet, sluit de drawer naar de verkeerde plek. Fix: referrer-aware `handleClose` (try `back()` → check pathname → fallback `push("/admin/medewerkers")`).
  5. **[Test/LOW] E2E selectors in `apps/web/e2e/edit-employee.spec.ts`** — `page.getByRole('row').nth(1).click()` mist de hot-zone (alleen `<Link>` om naam is clickable, hele rij heeft geen onClick). Fix: target `getByRole('link', { name: <name> })` OF maak hele rij click-target (UX-beslissing). Spec is `describe.skip` totdat auth-fixture er is.
  6. **[Verification/risk] Manual smoke voor T12 is geskipped** door implementer. Build + typecheck + Next 15 routing-validatie geven hoge zekerheid, maar slide-in animatie / scroll-position behoud / Esc UX zijn nooit eyeball-getest. Run `pnpm -F @casella/web dev`, click first row, Esc, refresh, direct-link voor T14 sanity.
  7. **[UX/NIT] Save → close-then-refresh order kan stale data flashen** — drawer sluit (`router.back()`) vóór `router.refresh()` paint klaar is. Cosmetic; fix bij server-actions migratie.
  8. **[A11y/NIT] DialogTitle in `intercepted-edit-drawer.tsx:42-44`** kan `"  bewerken"` (twee spaces) renderen als beide names null zijn. Fallback-string toevoegen.
- **Impact if skipped**: B-2-FOLLOWUP-1 = wasted DB roundtrips. B-2-FOLLOWUP-3 = wrong-coords visible bij map-render. B-2-FOLLOWUP-4 = latent UX-bug. Rest = polish.
- **Status**: open

### PROFILE-PAGE-STUB — `/admin/profile` placeholder
- **Category**: UX-polish
- **Deferred from**: Plan 1.1b Task 20 (C-5 UserMenu, 2026-04-27)
- **Why deferred**: User-menu needs een "Mijn profiel" landing; echte page (theme-pref UI in plaats van sidebar, account-settings, taal, notification-prefs) is Fase 1.2 scope. Placeholder route stopt 404 vanuit user-menu.
- **Pickup trigger**: Fase 1.2 planning, OR wanneer eerste user-settings beyond theme wordt aangevraagd.
- **Estimated cost**: ~3 hours.
- **Impact if skipped**: User-menu navigeert naar placeholder, niet echte settings page.
- **Status**: open

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
- **Status**: abandoned (Plan 1.1b T10 / B-3 scope decision — no manager-role UI in 1.1b; manager-select removed from wizard. `managerId` blijft optional in `createEmployeeSchema` als hidden API surface voor mobile/Nmbrs sync. Real picker komt mogelijk in Fase 1.1c CRUDs.)

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
- **Status**: done — landed in Plan 1.1a Claude Design handoff (commit `5b1e3b2`). `ListPrefs` has `columns` (5 fields incl. `project`) + `statusVariant` (pill/dot/text). `ListTweaksDock` exposes "Kolommen" + "Status-stijl" popovers. `EmploymentBadge` supports all 3 variants. `EmployeesListShell` honors `prefs.columns.*` conditionals + threads `statusVariant` to badge. Plan 1.1b Task 13 added Playwright spec (`apps/web/e2e/column-toggles.spec.ts`, `describe.skip` until auth-fixture lands).

### ML-5-FOLLOWUPS — Polish items uit spec-review van Plan 1.1b Task 6
- **Category**: Tech-debt
- **Deferred from**: Plan 1.1b Task 6 spec-review (2026-04-26)
- **Why deferred**: Niet-blokkerende cosmetische nits in `feat(auth): bootstrap theme cookie from DB on first login` (commit `6d150ed`). Geen runtime-impact.
- **Pickup trigger**: Voor 1.1c start OR bij next-edit van auth package.
- **Estimated cost**: ~15 min totaal.
- **Items**:
  1. `packages/auth/package.json:19-21` — `next` as peerDependency added but no file in `packages/auth` imports anything from `next/*` (speculative). Remove dead metadata. Web app already provides `next` transitively.
  2. `packages/auth/src/config.ts` — `readThemeFromDb` returns `'system'` value verbatim; the no-op decision is enforced downstream in middleware (`themePref !== "system"`) instead of at source. Slightly bloats JWT token payload. Move guard into helper for cleaner separation of concerns.
- **Status**: open

### ML-1-FOLLOWUPS — Polish items uit code-review van Plan 1.1b Task 2
- **Category**: Tech-debt + UX-polish
- **Deferred from**: Plan 1.1b Task 2 code-quality review (2026-04-26)
- **Why deferred**: Niet-blokkerende nits gevonden tijdens code-review van ML-1 tokens-lift. Geen visuele of correctness-impact in 1.1b runtime. Gebundeld als één entry voor efficiency.
- **Pickup trigger**: Voor 1.1c start (foundation-hardening sweep) OR bij eerstvolgende design-tokens wijziging.
- **Estimated cost**: ~2 uur totaal — alle 6 items zijn klein.
- **Items**:
  1. **HIGH** — `pnpm tokens:check` schrijft naar `globals.css` als drift-check; CI runt dit voor typecheck en kan dirty tree achterlaten. Voorstel: voeg `--check-only` mode toe aan `scripts/generate-css-vars.ts` die zonder write de gegenereerde output vergelijkt met file-content en exit 1 op verschil. Vermijdt filesystem-writes in CI volledig.
  2. **MEDIUM** — `paletteHex.ink.{a68,a45,a22,a10}` bevatten rgba-strings ondanks naam "paletteHex". Ofwel object hernoemen naar `palette` (mixed format), ofwel opacity-varianten in een aparte structuur splitten. Naming-concern voor RN consumers.
  3. **MEDIUM** — `tailwind.config.ts:137` `status-pulse` keyframe `50%` gebruikt hardcoded `rgba(61, 216, 168, 0)` terwijl `0%/100%` `glowLight.teal` gebruikt. Risico op drift als teal-kleur verandert. Voorstel: extract `aurora.teal` rgba-componenten in helper of in design-tokens package.
  4. **LOW** — `apps/web/package.json:18` gebruikt `workspace:^` voor `@casella/design-tokens`; alle andere workspace-deps gebruiken `workspace:*`. Inconsistent maar functioneel identiek in pnpm. Wijzig naar `workspace:*`.
  5. **LOW** — `packages/design-tokens/` heeft geen README. Documenteer: doel van pakket, hoe tokens toevoegen, generation-workflow, CI gate.
  6. **LOW** — CI step ordering: `Tokens drift check` staat VOOR `Typecheck`. Plan vroeg om "after". Mode-functioneel identiek — beide gates moeten passeren — maar plan-intent matchen geeft schonere telemetry. Verplaats step na typecheck.
- **Impact if skipped**: Gemak / consistency-issues bij latere wijzigingen; geen runtime-impact.
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

### DONE — Task 8 ESLint v9 flat config + CI gate (TD-1)
- **Status**: done, see Plan 1.1b Task 8 commit
- **Category**: Tech-debt
- **Resolved**: 2026-04-27
