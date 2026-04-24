# Casella Fase 1.1b — Foundation-lift + Employee completion + AAA shell (Design Spec)

**Datum:** 2026-04-25
**Status:** Brainstorm output, klaar voor user-review
**Auteurs:** Alex Sinigaglia (Ascentra), Claude
**Parent spec:** [2026-04-23-casella-fase-1-1-admin-fundament-design.md](./2026-04-23-casella-fase-1-1-admin-fundament-design.md)
**Volgt op plan:** [2026-04-23-casella-fase-1-1a-foundation-employees.md](../plans/2026-04-23-casella-fase-1-1a-foundation-employees.md)
**Governance:** [docs/casella-deferred-work.md](../../casella-deferred-work.md) · [docs/sanity-check-protocol.md](../../sanity-check-protocol.md)

---

## 1. Productcontext + doel

Plan 1.1a leverde de foundation (design-tokens als CSS-vars, theme-systeem, shadcn-primitives) en de volledige Employees-CRUD (list Variant A, 4-step wizard, terminate-flow, invite-binding, tweaks-dock). Wat nog ontbreekt voordat we in Plan 1.1c het Employees-patroon kunnen kopiëren naar Clients + Projects + Assignments:

1. **Foundation-hardening**: tokens staan in CSS-vars (niet TS-package), ESLint staat uit, error-shapes zijn inconsistent, kleine tech-debt-items blijven liggen.
2. **Employees-completion**: edit-mode ontbreekt (wizard is create-only), DD-5 kolom-toggles staan in backlog, Manager-select toont dummy-data.
3. **Shell-chrome**: er is een sidebar maar geen top-bar. Breadcrumbs, command-pill, user-menu, notifications, keyboard-overlay, quick-create, context-actions — geen van deze bestaan.

**Plan 1.1b verhoogt 1.1a's baseline naar productieklaar niveau zodat Plan 1.1c (Clients/Projects/Assignments) het gehardde template kopieert i.p.v. een zachter pattern te vermenigvuldigen.**

### Kwaliteitsstandaard

Casella volgt een **AAA-grade** standaard in alle dimensies (techniek, infrastructuur, UI, UX, logica, innovatie). Plan 1.1b is daar geen uitzondering op — de shell-extensions (Chapter C) zijn expliciet gekozen om op het niveau van Linear / Arc / Raycast / Vercel te komen, niet op "functioneel minimum".

### 1.1 Scope-split met Plan 1.1c

De originele 1.1b-backlog uit `docs/casella-deferred-work.md` bevat ook de drie nieuwe CRUDs (Clients, Projects, Assignments). Die worden **verschoven naar Plan 1.1c** om twee redenen:

1. **Template-verharding voor multiplicatie**: elke nieuwe CRUD kopieert het Employees-patroon. Fixing ESLint, error-shape, tokens, edit-mode *eenmalig* voordat het 3× gekopieerd wordt, is netter dan 3× patchen achteraf.
2. **Plan-omvang**: 1.1b + 1.1c in één plan = ~45 taken, te groot voor één PR en review-cyclus.

### 1.2 Scope van Plan 1.1b

**In-scope — drie chapters, uitgevoerd in volgorde D → B → C:**

**Chapter D — Foundation-lift + tech-debt** (8 taken)
- ML-1: Design-tokens lift naar `packages/design-tokens/` (TS-source, CSS-vars gegenereerd, Tailwind consumeert TS)
- DD-1: codemod `text-text-*` → `text-fg-*` als onderdeel van ML-1
- ML-5: Theme-bootstrap uit DB op eerste login (JWT callback schrijft cookie)
- TD-1: ESLint flat config v9 voor `apps/web`, gewired in bestaande CI
- TD-4: `zod` range-align via `pnpm.catalogs.default.zod`
- TD-5: Cursor-SQL in `listEmployees` naar Drizzle-native subquery
- TD-6: Error-response shape standaard `{ error: snake_case_code, message, issues? }`
- DD-3: ThemeToggle arrow-key navigation

**Chapter B — Employee completion** (5 taken)
- EmployeeWizard mode-aware (`'create' | 'edit'`, PATCH in edit, diff-view in step 4)
- Intercepting-routes pattern voor edit-drawer (`/admin/medewerkers/[id]`)
- Manager-select verwijderd uit wizard (DB-kolom + Zod-veld behouden)
- DD-5: kolom-toggles + statusVariant-switcher in `ListTweaksDock`
- Deferred-work housekeeping (DD-4 abandoned, DD-5 done)

**Chapter C — AAA shell-chrome** (17 taken)

Core shell (C-0 t/m C-11):
- Claude Design handoff checkpoint (blocker voor C-1 t/m C-11)
- TopBar component + admin-layout integratie
- Breadcrumbs infra (Context + `useBreadcrumbs` hook)
- ⌘K search-pill (visual affordance over cmdk-palette)
- `?` keyboard-shortcut overlay
- UserMenu dropdown (email / profile-stub / afmelden)
- EnvBadge verhuis (sidebar → top-bar)
- Context-aware actions-slot per route
- Breadcrumb-segment entity-switcher (Arc-style)
- Command-palette mode-scoping met prefix-chips (`>`, `@`, `#`, `?`)
- Global ⌘N quick-create (context-aware)
- Notification-center bell met audit-stream

AAA-extensions (C-12 t/m C-16):
- Auto-save in edit-wizard + inline saved-indicator + If-Match conflict-detection
- Shortcut coaching / tip-surfacing (local-storage tracked, opt-out)
- Pinned entities (sidebar-favorieten sectie + star-toggle in context-actions)
- Server-side search met tsvector + preview-hover in palette
- Presence-indicators via Supabase Realtime (avatar-stack op detail-pages)

**Out-of-scope (expliciet uitgesteld):**
- Clients / Projects / Assignments CRUDs → Plan 1.1c
- Capacity-conflict logic (onderdeel van Assignments) → 1.1c
- AI natural-language quick-create → niet gepland (geschrapt 2026-04-25: "voegt niks toe, kost alleen maar geld")
- Manager-rol / isManager-flag / manager-picker in UI → abandoned (scope 2026-04-25)
- `/admin/profile` echte pagina → Fase 1.2+ (user-menu toont placeholder)
- `/admin/audit` deep-dive pagina → Fase 1.2+ (notifications bell volstaat voor 1.1b)
- TD-2 Web-app unit test coverage → Fase 1.2+
- TD-3 `supabase_vector` restart-loop → Fase 4
- DD-2 status-warning contrast doc → Fase 1.2+
- SEC-1 Rate limiting → Fase 2
- SEC-2 `server-only` import guard → triggered bij next sec-lib install

### 1.3 Mobile-alignment commitments (Fase 3 prep)

Gelocked in 1.1a, herbevestigd in 1.1b:

- **ML-2** — Alle admin-mutaties zijn Route Handlers (niet Server Actions). Geldt voor alle nieuwe routes in 1.1b: `POST/DELETE /api/admin/pins` (C-14), `GET /api/admin/audit/recent` (C-11), `GET /api/admin/search` (C-15), `POST /api/admin/audit/mark-seen` (C-11).
- **ML-1** — Tokens worden in 1.1b lift-af van CSS-vars naar TS-package. RN-vriendelijkheid: palette-hex, motion-numbers, type-scale-numbers (geen `rem`). CSS-vars blijven op `globals.css` als render-target maar worden **gegenereerd** uit TS-source door een prebuild-script.
- **Server-only import pattern** — nieuwe client-components die constants uit server-only files nodig hebben splitsen naar `*-shared.ts` (precedent: `theme-cookie-shared.ts`, `list-prefs-cookie-shared.ts`).

---

## 2. Chapter D — Foundation-lift + tech-debt

### D-1 · ML-1 design-tokens lift + D-8 DD-1 rename

**Package-structuur:**
```
packages/design-tokens/
  src/
    palette.ts       // hex raw (RN-vriendelijk) + oklch-string (CSS-only)
    motion.ts        // duration in ms (number), easing (string)
    type-scale.ts    // size + lineHeight + weight (numbers)
    glow.ts          // blur/offset/color tokens
    density.ts       // spacing-scale per density-mode ('compact' | 'default')
    index.ts         // barrel
  package.json       // "type": "module", "exports": "./dist/..."
  tsconfig.json
```

**Consumptie:**
- `apps/web/tailwind.config.ts` importeert direct uit `@casella/design-tokens` (geen string-interpolation, pure TS-objecten).
- `apps/web/app/globals.css` wordt **gegenereerd** door `scripts/generate-css-vars.ts` (node-script, zero deps). Runt in `prebuild`. Output gaat naar een gemarkeerde sectie in `globals.css` tussen `/* @tokens:start */` en `/* @tokens:end */`. Overige CSS (resets, pre-hydration-script) blijft handmatig beheerd.
- CI-step in `.github/workflows/ci.yml` re-runt script + `git diff --exit-code apps/web/app/globals.css` → faalt op drift.

**DD-1 rename** (uitgevoerd als onderdeel van ML-1-codemod):
- Rename token-group `colors.text.*` → `colors.fg.*` in Tailwind-config source.
- Sed-codemod over `apps/web/**/*.{ts,tsx}`: `text-text-primary` → `text-fg-primary`, etc.
- Verify: `grep -r "text-text-" apps/web` → 0 matches.

**RN-vriendelijkheid:** palette in hex, motion in ms, type-scale in numbers. Oklch-variant leeft alleen als string-export die tokens-script gebruikt voor CSS-var-generatie — niet geïmporteerd door components.

**Risico-mitigatie:** drift tussen TS-tokens en gegenereerde CSS = visuele regressies. CI-diff-check + prebuild-hook vangen dit. Extra: Playwright-smoke `visual-tokens.spec.ts` neemt screenshots van 3 canonical components en vergelijkt met baseline.

### D-2 · ML-5 theme-bootstrap uit DB op login

**Flow:**
- Auth.js `jwt` callback (reeds uitgebreid in 1.1a Task 21 voor invite-binding) leest bij eerste login `users.themePreference` uit DB.
- Schrijft cookie met dezelfde naam/opts als de client-side toggle (naam is gedeeld via `theme-cookie-shared.ts`).
- Client-side pre-hydration-script leest cookie bij eerste paint — geen flash-of-system-theme.

**Edge case** — user heeft nog geen themePreference (default `'system'` in DB): callback schrijft niets, cookie blijft ongezet. Gedrag identiek aan huidig pattern.

**Test:** Playwright `theme-bootstrap.spec.ts`:
1. Seed user met `themePreference: 'dark'` in DB
2. Fresh browser-context login
3. Eerste DOM-paint inspecteren → `<html data-theme="dark">` aanwezig

### D-3 · TD-1 ESLint flat config v9 + CI gate

**Scope:** `apps/web` in 1.1b; packages bleven zonder lint (enkel typecheck). Uitgebreid naar packages in 1.1c wanneer Clients/Projects hun eigen code toevoegen.

**Config (`apps/web/eslint.config.mjs`):**
- `@eslint/js` recommended
- `typescript-eslint` recommended-type-checked
- `eslint-plugin-react` + `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y` recommended
- `eslint-plugin-import` met monorepo-resolver
- `@next/eslint-plugin-next` voor Next.js-specifieke regels
- Overrides: geen `no-console` in `scripts/**`; custom "tabular-nums op table numeric-cells" niet-geautomatiseerd (handmatige review).

**CI-integratie (`.github/workflows/ci.yml`):**
- Job `lint` na `typecheck`, vóór `build`. Fail-fast op violations.

**Fix-loop (plan-task bevat expliciete sub-stappen):**
1. Flat-config installeren, `pnpm lint` draaien
2. Violations categoriseren (probable ~50–200 in bestaande code)
3. Auto-fix waar veilig (`eslint --fix`)
4. Handmatig fixen waar semantisch; legaliseren via rule-override per file (met comment-motivatie) waar onvermijdelijk
5. CI-gate aanzetten

### D-4 · TD-4 zod range-align via pnpm catalog

**`pnpm-workspace.yaml`:**
```yaml
catalogs:
  default:
    zod: ^3.25.76
```
Vervang in `apps/web/package.json` + `packages/types/package.json`: `"zod": "catalog:"`.

Lockfile-check post-install: `pnpm why zod` → één versie.

### D-5 · TD-5 cursor-SQL naar Drizzle-native

**Bestand:** `apps/web/app/(admin)/admin/medewerkers/queries.ts`.

**Patroon:** vervang de bare-table `sql\`SELECT created_at FROM employees WHERE id = ${cursor}\`` constructie door een tweede Drizzle-select vóór de main where-clause:

```ts
// before (bare identifier in raw SQL)
const cursorRow = await tx.execute<{ created_at: Date }>(
  sql`SELECT created_at FROM employees WHERE id = ${cursor}`
);

// after (Drizzle-native, schema-aware)
const [cursorRow] = await tx
  .select({ createdAt: employees.createdAt })
  .from(employees)
  .where(eq(employees.id, cursor))
  .limit(1);
```

Geen `sql` template-literals met bare table-names meer in dit bestand.

**Waarom nu:** in Chapter A (Plan 1.1c) gaan clients + projects de lijst-query-pattern kopiëren. Fixing nu voorkomt 3 bare-table queries in 1.1c.

### D-6 · TD-6 error-response shape standardize

**Shape (helper `apiError` in `packages/types/src/api-error.ts`):**
```ts
export type ApiError = {
  error: string;      // snake_case machine code, always present
  message: string;    // NL human-readable, always present
  issues?: ZodIssue[]; // only on 400 validation errors
};

export function apiError(code: string, message: string, issues?: ZodIssue[]): ApiError {
  return { error: code, message, ...(issues ? { issues } : {}) };
}
```

**Migration:**
- PDOK routes (`/api/pdok/search`, `/api/pdok/lookup`) → use `apiError('pdok_unavailable', 'Adresservice tijdelijk onbereikbaar')`.
- Employees routes krijgen `message`-field erbij (was al code-form, nu volledig).
- AddressInput error-mapper (`apps/web/features/address-input/...`) leest `error.error` (code), mapt per-code naar NL-string met `message` als fallback.

**Test:** extend `@casella/types` tests met builder-signature assertions.

### D-7 · DD-3 ThemeToggle arrow-key navigation

**Locatie:** ThemeToggle-component in sidebar-footer (1.1a Task 7).

**Gedrag:** toevoegen aan `role="radiogroup"`:
- `ArrowLeft` / `ArrowRight` → focus + select vorige/volgende `role="radio"`
- `Home` → focus + select eerste
- `End` → focus + select laatste
- Wrap-around bij uiterste posities

**Test:** Playwright `theme-toggle-a11y.spec.ts` + manual NVDA/VoiceOver check.

---

## 3. Chapter B — Employee completion

### B-1 · EmployeeWizard mode-aware

**Rename:** `NewEmployeeWizard` → `EmployeeWizard`. Behoud re-export `NewEmployeeWizard` als alias voor existing imports.

**Props:**
```ts
type EmployeeWizardProps =
  | { mode: 'create' }
  | { mode: 'edit'; employee: EmployeeWithAddress };
```

**Mode-verschillen:**

| Aspect | create | edit |
|---|---|---|
| HTTP | `POST /api/admin/employees` | `PATCH /api/admin/employees/:id` |
| Initial state | leeg + smart-defaults | `employee` prop gemapt naar `WizardForm` |
| Step 4 label | "Stuur" | "Overzicht" |
| Step 4 content | welkomstmail-checkbox + preview | diff-visualisatie + "Opslaan" / "Geen wijzigingen" |
| Success-panel | "Medewerker uitgenodigd" | "Wijzigingen opgeslagen" |
| Email side-effect | best-effort send | geen |

**Diff-visualisatie (step 4 edit):**
- Per gewijzigd veld render `<row><label>…</label><old>oudewaarde</old>→<new>nieuwewaarde</new></row>`.
- Ongewijzigde velden verborgen.
- CTA disabled wanneer `dirtyFields.length === 0` met copy "Geen wijzigingen om op te slaan".

**Zod-schemas:**
- `createEmployeeSchema` bestaand.
- `updateEmployeeSchema` = `createEmployeeSchema.omit({ inviteEmail: true }).partial()`. Expliciet in `packages/types`.

### B-2 · Intercepting-routes voor edit-drawer

**Route-structuur (Next.js App Router):**
```
apps/web/app/(admin)/admin/medewerkers/
  page.tsx                              // list
  [id]/
    page.tsx                            // detail (fallback voor direct-link)
  @modal/
    (.)[id]/
      page.tsx                          // intercepted drawer over list
```

**Gedrag:**
- Klik op row in list → URL wordt `/admin/medewerkers/abc-123` → `@modal/(.)[id]/page.tsx` intercepteert → drawer opent boven list.
- Esc of click-buiten → back-navigation → URL `/admin/medewerkers`.
- Direct-link/bookmark → `[id]/page.tsx` fallback rendert → detail-view als full-page (rendert óók wizard in edit-mode, alleen zonder list-context erachter).
- Browser-refresh op een drawer-URL → fallback rendert (acceptabel — drawer over lege bg is een degraded state).

**Data-fetching:** `[id]/page.tsx` + `@modal/(.)[id]/page.tsx` delen server-helper `getEmployeeById(id)` (caching via `React.cache`).

**Test (Playwright `edit-employee.spec.ts`):**
1. List → click row → drawer toont → Esc → back op list
2. Direct-link naar `/admin/medewerkers/abc-123` → fallback detail page
3. Edit → Save → list ververst met nieuwe waarde
4. Browser-refresh tijdens drawer open → degraded fallback rendert

### B-3 · Manager-select hide-but-keep

**Wijzigingen:**
- `apps/web/features/employees/drawer/wizard/steps/step-dienstverband.tsx`: verwijder het `<Select value={form.manager}>` block en bijbehorende TODO-comment.
- `apps/web/features/employees/drawer/wizard/types.ts`: `manager: string` veld weg uit `WizardForm`.
- `apps/web/features/employees/drawer/wizard/new-employee-wizard.tsx`: `managerId: undefined` call en bijbehorende TODO schoon.

**Behouden:**
- DB-kolom `employees.manager_id` (geen migration).
- Zod `createEmployeeSchema` + `updateEmployeeSchema` accepteren `managerId?: string` (optional). API-surface blijft klaar voor future-use.

**Deferred-work update:** DD-4 status → `abandoned` met rationale "scope 2026-04-25: no manager-role in UI now; DB column + Zod field retained as hidden API surface".

### B-4 · DD-5 column-toggles + statusVariant-switcher

**`ListPrefs` interface uitbreiding** (`apps/web/lib/list-prefs-cookie-shared.ts`):
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
```

**`ListTweaksDock` uitbreiding:**
- Nieuwe icon-group "Kolommen" — popover met 4 checkboxes.
- Nieuwe icon-group "Status-stijl" — popover met 3 radios (pill/dot/text).
- Bestaande icon-groups (Density, Avatars) blijven.

**Threading:**
- `EmployeesListShell` leest `prefs.columns.*` en conditioneel rendert `<th>` + `<td>` per kolom.
- `EmploymentBadge` krijgt `variant` prop die `prefs.statusVariant` reflecteert.

**Edge case:** user disabled alle 4 optional kolommen → naam + avatar blijven altijd zichtbaar. Geen "laatste kolom lock" — gebruiker heeft vrijheid.

**Deferred-work update:** DD-5 status → `done` met commit SHA.

### B-5 · Deferred-work housekeeping

Een dedicated Task aan eind van Chapter B dat `docs/casella-deferred-work.md` bijwerkt:
- DD-4 → `abandoned` (rationale + 2026-04-25)
- DD-5 → `done` (SHA)

Commit: `docs(deferred): update DD-4 (abandoned) + DD-5 (done) after Chapter B`.

---

## 4. Chapter C — AAA shell-chrome

Chapter C is het ambitieuze deel. Introduceert top-bar, 11 shell-features, waarvan 5 AAA-extensions (auto-save, coaching, pins, search, presence) die de shell naar state-of-the-art 2026 niveau tillen.

### C-0 · Claude Design handoff checkpoint (blocking)

**Deliverable verwacht van Alex in Claude Design:**
- Top-bar layout mockup (links/midden/rechts slots, spacing, typografie, backdrop)
- Breadcrumbs styling (separator, active-vs-inactive, max-width + ellipsis)
- ⌘K search-pill (shape, icon, states, kbd-hint)
- User-menu trigger (avatar-only vs avatar+name)
- EnvBadge nieuwe plek (niet-rommelig tussen ?-hint en user-menu)
- `?` overlay styling
- Avatar-stack (C-16 presence) visueel op detail-pages
- Pinned-entities sidebar-favorieten sectie
- Coaching-toast styling (subtiel, dismissable)
- Responsiveness voor <768px (tablet)

**Mockup-file pad:** `docs/design/2026-XX-casella-shell-chrome.md` of vergelijkbaar. Spec verwijst er later naar vanuit de plan-file.

**Fallback:** spec bevat archetype-referenties (Linear top-bar, Vercel breadcrumbs, cmdk.paco.me pill, Raycast scopes, Figma presence, Arc little-arc). Na 5 werkdagen geen mockup → start impl met fallback, later polish.

**Status van C-1 t/m C-11 tot C-0 klaar is:** task-queue blocked. C-12 t/m C-16 zijn deels blocked (pin-star-icon en presence-avatar hebben C-0 styling nodig).

### C-1 · TopBar component + admin-layout integratie

**Bestand:** `apps/web/features/admin-shell/top-bar/top-bar.tsx` (nieuw).

**Layout:** `grid grid-cols-[auto_1fr_auto]`:
- Links-slot (auto): gereserveerd voor toekomstige collapse-trigger (mobile-burger). Leeg in 1.1b.
- Midden-slot (1fr): breadcrumbs + context-actions (rechts uitgelijnd binnen midden).
- Rechts-slot (auto): ⌘K pill · `?` hint · notification-bell · EnvBadge · presence-avatar-stack · UserMenu.

**Wiring:** `apps/web/app/(admin)/layout.tsx` plaatst `<TopBar />` boven `<main>`. TopBar spant full-width; inner-container respecteert `max-w-[1180px]`.

### C-2 · Breadcrumbs infra

**Context + hook:**
```ts
// apps/web/features/admin-shell/breadcrumbs/breadcrumb-context.tsx
type Crumb = { label: string; href?: string };

export function useBreadcrumbs(crumbs: Crumb[]) {
  const { setCrumbs } = useContext(BreadcrumbContext);
  useEffect(() => {
    setCrumbs(crumbs);
    return () => setCrumbs([]);
  }, [JSON.stringify(crumbs)]);
}
```

**Root-crumb** "Admin" altijd eerst, gerendered door `<TopBar>` zelf.

**Per-page registratie:**
```tsx
// /admin/medewerkers/page.tsx
useBreadcrumbs([{ label: 'Medewerkers', href: '/admin/medewerkers' }]);

// /admin/medewerkers/[id]/page.tsx or @modal/(.)[id]
useBreadcrumbs([
  { label: 'Medewerkers', href: '/admin/medewerkers' },
  { label: employee.fullName },
]);
```

**Async edge:** detail-page fetcht server-side → `fullName` is reeds bekend bij render → geen flash-of-uuid.

### C-3 · ⌘K search-pill

**Component:** `<CommandPill>` in TopBar rechts-slot. Toont: search-icon, placeholder "Zoek of voer uit...", `<kbd>⌘K</kbd>` hint.

**Gedrag:** klik → dispatched hetzelfde open-event als ⌘K-shortcut. Visueel actief-state op hover + focus.

**Palette-commands uitgebreid voor 1.1b:**
- `Toon sneltoetsen` → open C-4 overlay (ook via `?`)
- `Nieuwe medewerker` → open create-drawer direct (ook via ⌘N — C-10)
- `Afmelden` → signOut

### C-4 · `?` keyboard-shortcut overlay

**Trigger:** `?` global key (guard tegen input-focus via `event.target.matches('input, textarea, [contenteditable]')`) + via palette-command.

**Component:** `<Dialog>` met shortcut-tabel, secties:
- Globaal: `⌘K` (palette), `?` (deze), `Esc` (sluiten)
- Formulieren: `⌘+Enter` (submit), `Tab` / `Shift+Tab`
- Navigatie: `↑/↓/Enter` (palette + lists), `←/→/Home/End` (radiogroups)
- Entities: `⌘N` (snel aanmaken — C-10), `⌘/` (focus search-pill)

**A11y:** `<Dialog>` focus-trap, Esc, aria-labelledby.

### C-5 · UserMenu dropdown

**Trigger:** `<EmployeeAvatar>`-pattern voor current-user (gradient-based, consistent met list-page), + naam op ≥md breedte.

**Dropdown-content (`<DropdownMenu>` shadcn):**
- Header label: `session.user.email` in `text-fg-tertiary` (nieuwe naam post-DD-1)
- Divider
- `Mijn profiel` → navigeert naar `/admin/profile` (**placeholder-route**: rendert "Pagina komt in Fase 1.2" — nieuw deferred-work entry `PROFILE-PAGE-STUB`)
- `Coaching-tips uit` → toggle in localStorage (opt-out voor C-13)
- `Afmelden` → `signOut({ callbackUrl: '/login' })` via `next-auth/react`

### C-6 · EnvBadge verhuis

**Verwijder uit:** `<Sidebar>` footer-slot (blijft ThemeToggle + mode-switch over).

**Toevoegen in:** TopBar rechts-cluster, vóór UserMenu, na notification-bell.

**Component ongewijzigd** — alleen placement wijzigt.

### C-7 · Context-aware actions-slot

**Bestand:** `apps/web/features/admin-shell/top-bar/context-actions.tsx`.

**API:**
```ts
type TopBarAction =
  | { kind: 'primary'; label: string; icon?: Icon; onClick: () => void; shortcut?: string }
  | { kind: 'secondary'; label: string; icon?: Icon; onClick: () => void }
  | { kind: 'kebab'; items: KebabItem[] };

export function useTopBarActions(actions: TopBarAction[]) {
  // register via context, similar to useBreadcrumbs
}
```

**Per context:**
| Route | Actions |
|---|---|
| `/admin/medewerkers` | `[+ Nieuw] (⌘N)` primary, `[Exporteer]` secondary |
| `/admin/medewerkers/[id]` | `[Bewerken]` primary (of `[Opslaan]` als edit open), `[⋯]` kebab (Dupliceer, Beëindig, Kopieer link, Pin/Unpin) |
| overige admin-routes | leeg slot |

**Effect:** de "+ Nieuwe medewerker"-button in `medewerkers/page.tsx` header wordt verwijderd — verplaatst naar TopBar context-actions.

### C-8 · Breadcrumb-segment entity-switcher

**Gedrag:** non-root breadcrumb-segmenten krijgen subtiele chevron-affordance (`<BreadcrumbTrigger>`). Klik opent scoped command-popover (cmdk onder de motorkap).

**Scoping per segment:**
- Parent segment ("Medewerkers") op `/medewerkers/[id]`: popover met alle employees, searchable, klik = navigate naar `/medewerkers/<newId>` (intercepting-route opent nieuwe drawer direct).
- Current segment ("Alice van den Berg") op `/medewerkers/[id]`: popover met alle employees + "Nieuwe aanmaken"-action.

**Data-source:** in-memory list die de list-page heeft gefetched (via React-context `EmployeeListCacheContext`, gevuld door `/medewerkers/page.tsx`). Voor direct-link-entries zonder pre-fetched cache: server-fetch on-demand.

**A11y:** segment als `<button aria-haspopup="dialog">`; Enter/Space opent; Esc sluit.

### C-9 · Command-palette mode-scoping

**Gedrag in palette (`cmdk`):**
- Empty prompt: mixed suggestions (recent actions + commands + pinned entities).
- Type `>` → scope "Commands"; chip links in input toont scope-label.
- Type `@` → scope "Medewerkers"; lookup fuzzy in in-memory list + server-search-fallback (C-15).
- Type `#` → scope "Projecten" (gereserveerd voor 1.1c); in 1.1b toont "komt in 1.1c".
- Type `?` → scope "Hulp" (shortcuts listing inline).

**Scope-chip:** `<Badge>` links in palette input, removable met backspace op leeg input-veld.

**Implementatie:** cmdk support voor prefix-parsing; custom `useCommandScope` hook houdt scope-state.

### C-10 · Global ⌘N quick-create

**Registratie:** `useQuickCreate({ onTrigger, label })` hook per lijst-pagina. Shell-scope hoort alle registraties, dispatched op `⌘N` event.

**Gedrag:**
- Op `/admin/medewerkers*` → opent `EmployeeWizard mode: 'create'` via zelfde route-mechaniek als de TopBar "+ Nieuw" button (C-7).
- Op routes zonder `useQuickCreate` registratie → ⌘N is no-op (feedback via coaching-toast optioneel).
- Command-palette `Nieuwe medewerker` action dispatched hetzelfde event.

### C-11 · Notification-center bell

**Component:** `<NotificationBell>` in TopBar rechts-cluster, links van EnvBadge.

**UI:**
- Bell-icon met unread-dot (als `user_last_seen_audit_at < latestAudit.createdAt`).
- Dropdown toont laatste 20 events:
  ```
  👤 Alice van den Berg · aangemaakt · 2u geleden · door jou
  ⏸ Bob de Vries · beëindiging ingepland (undo ⟳ 58u) · 4u geleden · door jou
  ✉ Carla Jansen · welkomstmail verstuurd · 1d geleden · door systeem
  ⭐ Alice van den Berg · gepind · 2d geleden · door jou
  ```
- Klik entry → navigate naar entity (intercepting-route employee-detail).

**Server:**
- Route `GET /api/admin/audit/recent?limit=20` — auth-guarded, retourneert `{ events, lastSeenAt }`.
- Route `POST /api/admin/audit/mark-seen` — updates `users.last_seen_audit_at` met timestamp.
- Helper `listRecentAuditEvents({ userId, limit })` in `packages/db/src/audit/list-recent.ts` met join naar `employees`/`users` voor entity-name resolution.

**Schema-wijziging:** kolom `users.last_seen_audit_at timestamptz` — migration `0004_user_last_seen_audit_at.sql`.

**Audit-event-types rendered:**
- `employee.created` · `employee.updated` · `employee.termination_initiated` · `employee.termination_cancelled` · `employee.termination_executed` · `employee.welcome_email_sent` (al bestaand)
- `pin.created` · `pin.deleted` (nieuw via C-14)
- `employee.update_conflict` (nieuw via C-12)

Icon per event-type + NL-copy in `apps/web/features/admin-shell/notifications/event-copy.ts`.

### C-12 · Auto-save in edit-mode + saved-indicator + conflict-detection

**Debounce:** 2000ms na laatste veld-wijziging → PATCH.

**Saved-pill component** (`<SavedIndicator>` rechts-boven in drawer):
- `Opgeslagen...` (spinner, tijdens request)
- `● Opgeslagen 2s geleden` (groen pulse-dot, ≤30s)
- `Opgeslagen om 14:32` (grijs tijd-badge, >30s)
- `✕ Opslaan mislukt — Probeer opnieuw` (rood, tap = retry)

**Conflict-detectie via optimistic-concurrency:**
- PATCH-request stuurt `If-Match: "<employee.updatedAt>"` header.
- Server: als huidige `updatedAt` ≠ header → 409 Conflict met body `apiError('version_conflict', 'Een andere sessie heeft deze medewerker aangepast — herlaad om verder te bewerken')`.
- Drawer-UI bij 409 toont conflict-banner bovenin + disabled form-inputs + "Herlaad" CTA.

**Create-mode auto-save:** **niet**. Pre-submit drafts gaan in `sessionStorage` (bestaand pattern ongemoeid), niet naar server. Rationale: anti-pattern om onvolledige employees in DB te laten.

**Audit-event voor conflict:** `employee.update_conflict` — gelogd server-side, zichtbaar in notification-bell.

### C-13 · Shortcut coaching / tip-surfacing

**Event-tracker (client-side, localStorage):**
```ts
// apps/web/features/admin-shell/coaching/tracker.ts
type CoachingState = {
  actions: Record<string, number>; // action-key → count
  dismissedTips: string[];
  optedOut: boolean;
};
```

**Registry van tips:**
```ts
// apps/web/features/admin-shell/coaching/tips.ts
const tips: Tip[] = [
  {
    id: 'cmdN-quick-create',
    trigger: { actionKey: 'clickedNewEmployeeButton', threshold: 5, withoutActionKey: 'usedCmdN' },
    copy: '💡 Snelkoppeling: druk op ⌘N om snel een nieuwe medewerker te maken.',
  },
  {
    id: 'cmdK-search',
    trigger: { actionKey: 'clickedBrandLogo', threshold: 3, withoutActionKey: 'usedCmdK' },
    copy: '💡 Druk op ⌘K om snel overal naartoe te springen.',
  },
  // ... 3–5 tips in totaal
];
```

**UI:** toast-pattern (sonner) in subtile variant. Max 1× per tip; dismissed = permanent silent voor die tip.

**Opt-out:** toggle in UserMenu dropdown "Coaching-tips uit".

### C-14 · Pinned entities

**Schema (migration `0005_user_pins_table.sql`):**
```sql
CREATE TABLE user_pins (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('employee')), -- extended in 1.1c
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE INDEX user_pins_user_id_idx ON user_pins(user_id);

-- RLS
ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users access only own pins" ON user_pins
  FOR ALL USING (user_id = auth.uid());
```

**Routes:**
- `POST /api/admin/pins` — body `{ entityType, entityId }`, validates, inserts, audits `pin.created`.
- `DELETE /api/admin/pins/:entityType/:entityId` — deletes, audits `pin.deleted`.

**Helper:** `listUserPins({ userId, entityType?, limit? })` in `packages/db/src/pins/...`. Joins to `employees` voor full entity-data.

**UI:**
- TopBar context-actions (C-7) kebab: "Pin" / "Unpin" menu-item op detail-pages.
- Sidebar krijgt `<FavoritesSection>` boven primary nav-items (collapsible), toont max 5 pinned employees als compacte rows (avatar + naam).
- Command-palette `@` scope (C-9): pinned employees bovenin onder "Gepind" groep.

**Edge case:** user heeft >5 pins → sidebar toont 5 meest-recente + "Zie alle X favorieten" link naar uitgebreide view (deferred naar 1.2 — nieuw deferred-work entry `FAVORITES-FULL-VIEW`).

### C-15 · Server-side search met tsvector + preview

**Schema (migration `0006_employees_search_tsvector.sql`):**
```sql
-- extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- tsvector kolom
ALTER TABLE employees ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('dutch',
      coalesce(first_name,'') || ' ' ||
      coalesce(last_name,'') || ' ' ||
      coalesce(function,'') || ' ' ||
      coalesce(email,'')
    )
  ) STORED;

CREATE INDEX employees_search_idx ON employees USING GIN(search_vector);
CREATE INDEX employees_trgm_idx ON employees USING GIN(
  (coalesce(first_name,'') || ' ' || coalesce(last_name,'')) gin_trgm_ops
);
```

**Route:** `GET /api/admin/search?q=...&types=employee&limit=10`.
- Input validation via Zod.
- Query: tsvector-match via `websearch_to_tsquery('dutch', $1)` + trigram-similarity-fallback voor queries <3 chars of stopword-match.
- Response: `{ results: [{ entityType, entityId, title, subtitle, score, previewData }] }`.

**Helper:** `searchEmployees({ query, limit })` in `packages/db/src/search/employees.ts`. Unit-test met fixture van 100+ rows.

**Client-integratie in palette (C-3/C-9):**
- In `@` scope of mixed scope met >2 chars → debounced fetch (300ms).
- Resultaten tonen inline in palette met entity-avatars.
- Hover op result (100ms delay) → preview-pane rechts naast palette toont entity-card (avatar, functie, employment-status, startdatum).

**Performance-target:** p50 ≤ 150ms, p95 ≤ 400ms op 1000-row fixture. Playwright `search.spec.ts` meet latency in e2e-setup.

**NL-stopwords edge-case:** "de", "van", "het" worden door `to_tsvector('dutch', ...)` genegeerd. Voor namen als "de Graaf", "van den Berg" moet trigram-fallback triggeren. Test expliciet met deze fixture-rows.

### C-16 · Presence-indicators via Supabase Realtime

**Infrastructure:** Supabase Realtime is reeds onderdeel van lokale Docker-stack (via `supabase start`). Geen nieuwe service.

**Channel-pattern:** `presence:${entityType}:${entityId}` — bijv. `presence:employee:abc-123`.

**Subscribe-hook:**
```ts
// apps/web/features/admin-shell/presence/use-entity-presence.ts
export function useEntityPresence(entityType: string, entityId: string) {
  // subscribe to channel, broadcast own user-id + avatar-url + viewing-since
  // return list of other viewers
}
```

**UI:**
- `<PresenceAvatarStack>` in TopBar rechts-cluster, alleen zichtbaar op detail-pages. Max 3 avatars stacked + "+N"-badge als meer.
- Op list-page: subtiele dot-indicator op rows van entities die momenteel door iemand anders bekeken worden (lage prioriteit — alleen als channel-data triviaal beschikbaar is).

**Fallback:** als Supabase Realtime local Docker niet meewerkt (channel-policies, RLS, of container-connectiviteit) → 5-dag timebox → fallback naar long-polling:
- Route `GET /api/admin/presence/:entityType/:entityId` retourneert active viewers (server-side TTL cache, 30s window).
- Client `useInterval(fetch, 5000)` poll-pattern. Minder realtime maar functioneel.
- Long-polling-infra wordt ook opportunistisch gebruikt door notification-bell (C-11) voor unread-count refresh.

**Self-presence toon:** als user in 2 tabs/apparaten → eigen avatar in stack 2× verschijnt (met subtiele device-indicator als feasible). Acceptabel als "eerste-gebruiker-nuttige" UX.

---

## 5. Cross-cutting concerns

### 5.1 A11y — WCAG 2.2 AA baseline

**Per task non-negotiable:**
- Alle interactieve nieuwe elementen → keyboard-reachable, focus-visible, aria-labels/aria-labelledby, juiste `role`.
- shadcn `<DropdownMenu>` + `<Dialog>` dekken uit-de-doos; custom componenten (breadcrumb-switcher, command-pill, saved-indicator, presence-avatar-stack, pin-star-toggle, coaching-toast-dismiss) expliciet valideren.
- Focus-order TopBar: breadcrumbs → context-actions → ⌘K pill → `?` hint → notification-bell → EnvBadge → presence-avatar-stack → UserMenu.
- Kleurcontrast: geen `text-status-warning` op surface-base (DD-2 open).
- `prefers-reduced-motion`: saved-pill pulse, coaching-toast-slide, pin-star-bounce, presence-avatar-enter respecteren dit.

### 5.2 Testing strategie

**Layers:**
- **Packages** unit-tests: `listRecentAuditEvents`, `searchEmployees`, `listUserPins`, `designTokens` type-guard, `apiError` builder.
- **Web-app** blijft zonder unit-tests (TD-2 deferred). Playwright-E2E suite uitgebreid:
  - `edit-employee.spec.ts` — 4 entry-flows (klik/deep-link/back/refresh) + save + diff-view
  - `top-bar-shell.spec.ts` — breadcrumbs, ⌘K, `?`, user-menu, EnvBadge placement
  - `context-actions.spec.ts` — per-route actions rendering + ⌘N
  - `breadcrumb-switcher.spec.ts` — segment-popover + entity-navigate
  - `palette-scopes.spec.ts` — prefix-chips + backspace-drop
  - `notifications.spec.ts` — bell, dropdown, mark-seen, navigate-to-entity
  - `auto-save.spec.ts` — debounced PATCH + saved-pill + 409-conflict
  - `coaching.spec.ts` — tip-trigger + dismiss + opt-out
  - `pins.spec.ts` — pin toggle + sidebar-favorieten + persistence + RLS
  - `search.spec.ts` — tsvector-match + preview-hover + performance (p95 < 400ms)
  - `presence.spec.ts` — multi-tab avatar-stack + realtime-or-polling-fallback
  - `theme-bootstrap.spec.ts` — DB → cookie → first-paint
  - `theme-toggle-a11y.spec.ts` — arrow-keys in radiogroup
  - `visual-tokens.spec.ts` — screenshot-diff op canonical components (ML-1 drift-detectie)

- **Lint-gate** (TD-1): CI blokkeert op violations.
- **Sanity-check protocol**: einde D, einde B, na C-11 (core shell), einde C-full (na C-16), pre-PR.

### 5.3 Performance-targets

| Feature | Target |
|---|---|
| Palette open-to-first-paint | ≤ 80ms |
| Server-search response | p50 ≤ 150ms, p95 ≤ 400ms (1000-row fixture) |
| Auto-save PATCH response | ≤ 250ms |
| Presence channel-join latency | ≤ 500ms |
| TopBar route-change layout-shift | 0 (CLS) |

### 5.4 Security

- **Route-auth**: elke nieuwe route (C-11 audit, C-14 pins, C-15 search, C-16 presence) guard via Auth.js session-helper. Geen anonymous access.
- **RLS**: `user_pins` policy "users access only own pins". Andere nieuwe tabellen — geen (audit + presence gebruiken bestaande tabellen of channel-state).
- **Realtime channel-policies**: authenticated-only voor `presence:*`. Configure via Supabase SQL policy op `realtime.messages`.
- **Env vars**: **geen nieuwe** — ANTHROPIC_API_KEY is geschrapt (C-17 out).
- **Rate-limiting**: SEC-1 blijft deferred tot Fase 2. Nieuwe mutatie-routes (pins, audit-seen) zijn low-risk voor 1.1b internal-only usage.

### 5.5 Observability + audit-events

**Nieuwe audit-event-types (uitbreiding bestaande `auditMutation`-pattern):**
- `pin.created` · `pin.deleted` (C-14)
- `employee.update_conflict` (C-12 — 409 paths)

**NIET audited** (te chatty / geen business-value):
- `theme.changed` (preference, niet business-state)
- `coaching.tip_shown` · `coaching.tip_dismissed` (pure UX-telemetry, local-only)
- `presence.joined` · `presence.left` (transient)

**Server-logging**: nieuwe route handlers gebruiken bestaande `console.*` pattern uit 1.1a. Migratie naar gestructureerd logging (pino) deferred naar Fase 2.

### 5.6 Risico's + mitigaties

| Risico | Waarschijnlijk | Impact | Mitigatie |
|---|---|---|---|
| ESLint fix-loop runaway | Hoog | Medium | Expliciete task-sub-step voor fix-pass; per-rule override met motivatie; review-gate op PR |
| Intercepting-routes edge-cases (scroll, loading, direct-link) | Medium | Medium | Playwright 4-flow coverage |
| tsvector NL-stopwords filtert korte namen | Medium | Laag | pg_trgm fallback + fixture met "de Graaf" / "van den Berg" |
| Supabase Realtime local Docker channel-policies | Medium | Medium | 5-dag timebox, fallback naar long-polling |
| Auto-save conflict 2-tab UX | Laag | Laag | If-Match + 409-banner + Playwright `auto-save.spec.ts` |
| Design-tokens generate-css-vars drift | Medium | Hoog | Prebuild-hook + CI diff-check + Playwright visual-tokens.spec |
| Subagent-cutoff op 30-task plan | Hoog | Laag | Sanity-check na elke chapter + `git status` na elke dispatch |
| Claude Design handoff blocker | Medium | Hoog | 5-dag timebox + archetype-fallback in spec |
| Coaching-tracker localStorage-pollution | Laag | Laag | Max-size guard + opt-out |
| Pin-table RLS misconfiguratie | Laag | Hoog (data-leak) | Migration-test + Playwright multi-user spec |

### 5.7 Deferred-work bijwerkingen aan eind 1.1b

**Status-wijzigingen in `docs/casella-deferred-work.md`:**

| ID | Huidige status | Eind 1.1b |
|---|---|---|
| ML-1 | open | **done** (commit SHA) |
| ML-5 | open | **done** |
| TD-1 | open | **done** |
| TD-4 | open | **done** |
| TD-5 | open | **done** |
| TD-6 | open | **done** |
| DD-1 | open | **done** (onderdeel van ML-1) |
| DD-3 | open | **done** |
| DD-4 | open | **abandoned** (scope 2026-04-25 — hide UI, keep DB) |
| DD-5 | open | **done** |

**Nieuwe entries aangemaakt tijdens 1.1b:**
- `PROFILE-PAGE-STUB` — `/admin/profile` placeholder; echte pagina in 1.2+.
- `PRESENCE-MULTI-USER-POLISH` — infrastructure in place, real multi-user validation in Fase 2.
- `COACHING-DASHBOARD` — ad-hoc tips in 1.1b; geconsolideerde "learnings"-view in user-menu later.
- `FAVORITES-FULL-VIEW` — sidebar toont 5 pins + "Zie alle X favorieten" → uitgebreide view deferred.

---

## 6. Acceptance criteria + Definition-of-Done

### Per-chapter gates

**Chapter D — gate:**
- `pnpm -r typecheck && pnpm -r test && pnpm -F @casella/web lint && pnpm -F @casella/web build` → alles groen
- `grep -r "text-text-" apps/web/` → 0 matches
- `pnpm why zod` → één versie
- CI ESLint-job actief en vereist
- Sanity-check protocol + log-entry

**Chapter B — gate:**
- Alle Playwright E2E (edit-employee + bestaande 1.1a smoke) groen
- Manager-select niet meer zichtbaar in wizard; Zod + DB-kolom intact
- Cookie-persisted `ListPrefs` uitbreiding roundtript correct
- Sanity-check + log-entry

**Chapter C — gate:**
- Alle 11 Playwright-specs van 5.2 groen
- C-0 Claude Design mockup gereferenceerd in spec (of fallback-mode actief + documented)
- Visual-tokens screenshot-diff = 0 regressies
- Sanity-check + log-entry na C-11 en na C-16

### Globaal Definition-of-Done Plan 1.1b

1. ✅ Alle 30 taken groen in-commit op branch `fase-1-1b-*`
2. ✅ `docs/casella-deferred-work.md` up-to-date (10 status-wijzigingen + 4 nieuwe entries)
3. ✅ `docs/sanity-check-log.md` entries: einde-D, einde-B, einde-C-core, einde-C-full, pre-PR
4. ✅ Production build `pnpm -F @casella/web build` schoon, geen nieuwe warnings
5. ✅ Playwright E2E suite volledig groen (14 specs)
6. ✅ ESLint schoon in CI; lint-job required-status op PR
7. ✅ Lighthouse op `/admin/medewerkers` na build: a11y ≥ 95, performance ≥ 85 (localhost)
8. ✅ Manual smoke-flow: login → list → context-action "+ Nieuw" → create → detail via breadcrumb-switcher → auto-save wijziging → pin employee → ⌘K `@`-scope vindt het → notifications-bell toont events → afmelden via user-menu (presence-avatar was zichtbaar in sessie)
9. ✅ PR-body referenceert deze spec, plan-file, deferred-work-delta, sanity-check-log-entries
10. ✅ Merge naar `main`; tag `v0.2.0-fase-1-1b` optioneel

### PR-template

- **Summary** (3 bullets): "Harden foundation (D)" · "Complete Employees (B)" · "AAA shell chrome (C-core + extensions)"
- **Test plan**: checklist van DoD-items 1–8
- **Screenshots**: before/after top-bar · edit-drawer met auto-save-pill · sidebar-favorieten · palette met `@` scope · notifications-dropdown
- **Deferred-work delta**: git-diff link op `docs/casella-deferred-work.md`
- **Breaking changes**: none (alles additief; DD-1 codemod intern gecovered)

---

## 7. Volgorde, dependencies, checkpoints

### Intra-chapter dependencies

```
Chapter D:
  D-4 (zod-align) → kan anywhere
  D-2 (theme-bootstrap) → onafhankelijk
  D-3 (ESLint) → bij voorkeur laat in D (fix-loop raakt alle files)
  D-5 (cursor-SQL) → onafhankelijk
  D-6 (error-shape) → bij voorkeur vóór C-15 (search-route erft shape)
  D-7 (ThemeToggle a11y) → onafhankelijk
  D-1 (tokens-lift) + D-8 (text-fg rename) → gecombineerd, beste eerste zware D-task

Aanbevolen D-volgorde: D-1+D-8 → D-6 → D-4 → D-5 → D-2 → D-7 → D-3

Chapter B:
  B-3 (manager hide) → kan eerst (triviaal)
  B-1 (wizard mode-aware) → blocks B-2
  B-2 (intercepting-routes) → na B-1
  B-4 (DD-5 toggles) → onafhankelijk
  B-5 (deferred-work update) → laatste

Aanbevolen B-volgorde: B-3 → B-1 → B-2 → B-4 → B-5

Chapter C:
  C-0 (Claude Design handoff) → blocks C-1..C-11, partial block op C-12..C-16
  C-1 (TopBar skeleton) → na C-0, blocks C-2..C-11
  C-2, C-6 → parallel-candidates na C-1
  C-3, C-5 → parallel na C-2
  C-4 → na C-3 (palette-command "toon sneltoetsen")
  C-7 → na C-1
  C-8 → na C-2
  C-9 → na C-3
  C-10 → na C-7 (shared trigger)
  C-11 → na C-2 (audit-data + schema migration independent, UI wiring need TopBar)
  C-12 → na B-1 + B-2 (edit-mode prerequisite) + D-6 (error-shape)
  C-13 → na C-7 + C-10 (action-tracking targets)
  C-14 → na C-7 (pin-action in kebab) + C-2 (sidebar-favorieten)
  C-15 → na D-6 (error-shape) + na C-9 (palette-integration)
  C-16 → na C-5 (avatar-pattern) + eventually after other detail-page features

Aanbevolen C-volgorde: C-0 → C-1 → C-2 → C-6 → C-3 → C-5 → C-4 → C-7 → C-8 → C-9 → C-10 → C-11 → [checkpoint] → C-12 → C-13 → C-14 → C-15 → C-16
```

### Sanity-check checkpoints

- **Einde Chapter D** (na Task D-3): full 6-command sweep + log.
- **Einde Chapter B** (na Task B-5): full sweep + log.
- **Einde Chapter C core** (na Task C-11): full sweep + log; natural decision-point om AAA-extensions door-te-gaan of te pauzeren.
- **Einde Chapter C full** (na Task C-16): full sweep + log.
- **Pre-PR**: full sweep + CI-status-check + log.

### Naar Plan 1.1c overgang

Na 1.1b-merge krijgen we:
- Gehardde foundation (tokens in package, ESLint actief, error-shape standaard)
- Complete Employees-module inclusief edit + pins + auto-save
- AAA shell chrome (top-bar + alle extensions)

Plan 1.1c schrijft zichzelf bijna: voor elk van Clients / Projects / Assignments loopt de template = Employees-template × 3. Capacity-conflict logic is het enige werkelijk nieuwe.

---

## 8. Bijlagen

### 8.1 Bestandsoverzicht per chapter (nieuw / gewijzigd)

**Chapter D:**
- Nieuw: `packages/design-tokens/` (volledig pakket)
- Nieuw: `packages/types/src/api-error.ts`
- Nieuw: `apps/web/eslint.config.mjs`
- Nieuw: `scripts/generate-css-vars.ts`
- Gewijzigd: `apps/web/tailwind.config.ts` · `apps/web/app/globals.css` (gegenereerd) · `apps/web/package.json` · `packages/types/package.json` · `pnpm-workspace.yaml` · `.github/workflows/ci.yml`
- Gewijzigd: `apps/web/app/(admin)/admin/medewerkers/queries.ts` (cursor-fix)
- Gewijzigd: alle PDOK-route-handlers + `AddressInput` error-mapper
- Gewijzigd: `apps/web/app/**/*.{ts,tsx}` (text-text-* codemod)
- Gewijzigd: ThemeToggle-component

**Chapter B:**
- Hernoemd: `new-employee-wizard.tsx` → `employee-wizard.tsx`
- Nieuw: `apps/web/app/(admin)/admin/medewerkers/[id]/page.tsx`
- Nieuw: `apps/web/app/(admin)/admin/medewerkers/@modal/(.)[id]/page.tsx`
- Nieuw: `apps/web/features/employees/wizard-diff-view.tsx`
- Gewijzigd: `apps/web/features/employees/drawer/wizard/types.ts` (manager weg) + `step-dienstverband.tsx` + `employee-wizard.tsx` + Zod update-schema in `packages/types`
- Gewijzigd: `apps/web/lib/list-prefs-cookie-shared.ts` + `ListTweaksDock` + `EmployeesListShell` + `EmploymentBadge`
- Gewijzigd: `docs/casella-deferred-work.md`

**Chapter C:**
- Nieuw: `apps/web/features/admin-shell/top-bar/top-bar.tsx`
- Nieuw: `apps/web/features/admin-shell/breadcrumbs/*`
- Nieuw: `apps/web/features/admin-shell/command-pill/*`
- Nieuw: `apps/web/features/admin-shell/shortcuts-overlay/*`
- Nieuw: `apps/web/features/admin-shell/user-menu/*`
- Nieuw: `apps/web/features/admin-shell/context-actions/*`
- Nieuw: `apps/web/features/admin-shell/breadcrumb-switcher/*`
- Nieuw: `apps/web/features/admin-shell/palette-scopes/*` (uitbreiding op bestaande cmdk-setup)
- Nieuw: `apps/web/features/admin-shell/quick-create/*`
- Nieuw: `apps/web/features/admin-shell/notifications/*`
- Nieuw: `apps/web/features/admin-shell/auto-save/*` (incl. `saved-indicator.tsx`)
- Nieuw: `apps/web/features/admin-shell/coaching/*`
- Nieuw: `apps/web/features/admin-shell/pins/*`
- Nieuw: `apps/web/features/admin-shell/search/*`
- Nieuw: `apps/web/features/admin-shell/presence/*`
- Nieuw: `apps/web/app/(admin)/admin/profile/page.tsx` (stub)
- Nieuw migrations: `0004_user_last_seen_audit_at.sql` · `0005_user_pins_table.sql` · `0006_employees_search_tsvector.sql`
- Nieuw helpers: `packages/db/src/audit/list-recent.ts` · `packages/db/src/pins/*` · `packages/db/src/search/employees.ts`
- Nieuwe routes: `/api/admin/audit/recent` · `/api/admin/audit/mark-seen` · `/api/admin/pins` · `/api/admin/pins/:type/:id` · `/api/admin/search` · `/api/admin/presence/:type/:id` (fallback)
- Gewijzigd: `apps/web/features/admin-shell/sidebar/*` (EnvBadge weg, Favorites sectie erbij, footer lichter)
- Gewijzigd: `apps/web/app/(admin)/layout.tsx`
- Gewijzigd: alle `page.tsx` onder `/admin/medewerkers*` (useBreadcrumbs + useTopBarActions + useQuickCreate registraties)
- Gewijzigd: `docs/casella-deferred-work.md`
- Nieuw: `docs/design/2026-XX-casella-shell-chrome.md` (van jouw Claude Design handoff)

### 8.2 Env-vars + infra-eisen

| Eis | Waar | Nieuw of bestaand? |
|---|---|---|
| `pg_trgm` extension | Supabase Postgres | Nieuw — aan in migration 0006 |
| `casella-employee-terminations` pg_cron | Supabase | Bestaand (1.1a) |
| Supabase Realtime authenticated channel-policy | Supabase config | Nieuw — configure via SQL |
| GitHub Actions `.github/workflows/ci.yml` | CI | Bestaand — uitgebreid met lint-job |

Geen nieuwe env vars.

### 8.3 Task-count samenvatting

| Chapter | Tasks | Opmerking |
|---|---|---|
| D | 8 | D-1..D-8 (D-8 = DD-1 rename meegepakt in D-1 codemod) |
| B | 5 | B-1..B-5 |
| C | 17 | C-0..C-11 core + C-12..C-16 AAA-extensions |
| **Totaal** | **30** | |

---

**Spec-einde.** Volgende stap: writing-plans skill om de 30 taken uit te werken naar een executable plan-file.
