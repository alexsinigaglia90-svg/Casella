# Casella Fase 1.1 — Admin-fundament (Design Spec)

**Datum:** 2026-04-23
**Status:** Brainstorm output, klaar voor user-review
**Auteurs:** Alex Sinigaglia (Ascentra), Claude
**Parent spec:** [2026-04-23-casella-design.md](./2026-04-23-casella-design.md)

---

## 1. Productcontext

Fase 1.1 bouwt het **administratieve fundament** dat alle volgende Fase 1-features nodig hebben. Zonder klanten, projecten, employees en assignments kan Fase 1.2 (urenregistratie) niets doen.

Deze spec legt **niet alleen data/backend** vast, maar expliciet ook het **UI/UX-foundation** voor alle admin-pagina's — componentpatronen, designsysteem, shell-architectuur, micro-UX. Dit fundament wordt hergebruikt in alle opvolgspecs.

### Kwaliteitsstandaard

Casella volgt een **AAA-grade** standaard in alle dimensies (techniek, infrastructuur, UI, UX, logica, innovatie). Waar een keuze is tussen "MVP-simpel" en "maximaal haalbaar binnen huidige technologie", kiezen we het tweede — tenzij er een scope-reden tegen is die expliciet wordt vastgelegd.

### 1.1 Scope van Fase 1.1

**In-scope:**
- Vier admin-CRUDs: **employees**, **clients**, **projects**, **project_assignments**
- **PDOK-backed adres-input** (autocomplete + geocoding + dedupe op pdok_id)
- **Invite-first employee-onboarding** met pending-page voor niet-gematchte users
- **Critical Operation Flow** (3-laagse confirm + 72h undo + scheduler) voor destructive acties
- **Complete UI/UX-foundation** die alle opvolgspecs hergebruiken: designsysteem, admin-shell, component-patterns, micro-UX, theming
- **Dark mode** (brand-authentic, parity met light)
- **Server-side pagination, search, sort, filter** op alle lijstviews
- **Optimistische UI** via Next.js Server Actions
- **Audit-log-writes** op elke mutation
- **Command palette** (Ctrl+K / ⌘K) met cross-platform shortcut-systeem
- **WCAG 2.2 AA** als minimum; focus-management, screen-reader-support, reduced-motion
- **Geist + Cormorant Garamond Italic + Geist Mono** typografie

**Out-of-scope (opvolgspecs):**
- Employee-facing views van eigen data (Fase 1.2)
- Urenregistratie invoer (Fase 1.2)
- Nmbrs-sync (Fase 1.3)
- Smart features: reminders, anomalie-detectie, standaard-dag (Fase 1.4)
- Bulk-actie-bar (alleen multi-select-checkbox-infrastructuur in 1.1; bulk-actions bar is aparte spec)
- Audit-log viewer UI (aparte spec)
- Rapportages / exports / analytics
- File-upload flow voor logos + documents (aparte spec; voor 1.1 alleen URL-invoer)
- KVK-API lookup (aparte optionele integratie)
- Real-time updates tussen tabs (aparte spec)
- Document/attachment management (Fase 1.4-werkgeversverklaring raakt dit)

---

## 2. Design-system foundation

### 2.1 Typografie

| Role | Font | Source |
|---|---|---|
| Sans (body, UI) | **Geist Sans** | npm `geist` (Vercel) via `next/font` |
| Mono (data, code) | **Geist Mono** | idem |
| Serif display (accents) | **Cormorant Garamond** (400 italic, 500 italic) | Google Fonts |

**Waarom Geist boven Inter:** purpose-built voor productivity-UIs, tabular-cijfers in default (geen `cv11` / `ss01` feature-flags), native partner-mono, kleinere bundle via single variable-font. Inter is generiek geworden; Geist is de hedendaagse keuze.

**Cormorant Italic** wordt spaarzaam ingezet: alleen op kernwoorden in page-titles (bv. *"Medewerkers"*, *"Goedkeuringen"*) en empty-state-headings, als distinctive accent. Niet elke detail-page krijgt 'm.

**Fluid type-scale** via `clamp()`:
```css
--text-hero: clamp(3rem, 2rem + 2vw, 4.25rem);      /* 48-68px */
--text-display: clamp(1.75rem, 1.5rem + 1vw, 2.5rem); /* 28-40px */
--text-title: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem); /* 20-24px */
--text-body: 0.875rem;                                /* 14px */
--text-small: 0.75rem;                                /* 12px */
--text-xs: 0.6875rem;                                 /* 11px */
```

**Tabular-nums** altijd actief voor kolommen met cijfers (tables, stats, form-inputs voor bedragen/aantallen). Geist Sans heeft tabular in default; voor tables expliciet `font-variant-numeric: tabular-nums`.

### 2.2 Kleur-palet

**Basis (retained van Contracts-family):**

| Token | Hex | Rol |
|---|---|---|
| `--cream-base` | `#f6f2ea` | canvas light-mode |
| `--cream-lift` | `#faf6ee` | surface-lift |
| `--cream-deep` | `#efe8d9` | surface-deep |
| `--ink-deep` | `#0e1621` | text primary light-mode |
| `--ink-2 / 3 / 4 / 5` | rgba 0.68 / 0.45 / 0.22 / 0.10 | text/border tiers |
| `--navy` | `#1e3a5f` | structurele accent |
| `--brown` | `#6b4e3d` | structurele accent |

**Aurora accent-palette (6 kleuren, semantische mapping):**

| Aurora | Hex | Semantiek in Casella |
|---|---|---|
| Violet `--aurora-1` | `#7b5cff` | Primary action / admin-context |
| Blue `--aurora-2` | `#4ba3ff` | Info / medewerker-context |
| Coral `--aurora-3` | `#ff8a4c` | Attention needed |
| Amber `--aurora-4` | `#f5c55c` | Pending state |
| Teal `--aurora-5` | `#3dd8a8` | Success / approved |
| Rose `--aurora-6` | `#ff5a8a` | Destructive / termination |

**Glow-tokens** (voor box-shadows / gradient-backgrounds):
- `--glow-violet: rgba(123, 92, 255, 0.35)`
- `--glow-blue: rgba(75, 163, 255, 0.35)`
- `--glow-coral: rgba(255, 138, 76, 0.35)`
- `--glow-amber: rgba(245, 197, 92, 0.40)`
- `--glow-teal: rgba(61, 216, 168, 0.35)`
- `--glow-rose: rgba(255, 90, 138, 0.35)`

Aurora-kleuren worden **primair gebruikt voor icon-gradients, glow-shadows, accent-borders, status-indicators, gradient-text op emphasized words** — niet voor grote vlakken.

### 2.3 Tokens-architectuur (semantische laag)

We scheiden **raw tokens** van **semantic tokens**. Components gebruiken alleen semantic tokens; theme-switch verandert wat ze resolven naar.

```css
:root {
  /* Raw (theme-invariant waar mogelijk) */
  --aurora-violet: #7b5cff;
  --cream-base: #f6f2ea;
  --ink-deep: #0e1621;
  /* ... */

  /* Semantic (theme-variant) */
  --surface-base: var(--cream-base);
  --surface-lift: var(--cream-lift);
  --surface-deep: var(--cream-deep);
  --text-primary: var(--ink-deep);
  --text-secondary: rgba(14, 22, 33, 0.68);
  --text-tertiary: rgba(14, 22, 33, 0.45);
  --border-subtle: rgba(14, 22, 33, 0.10);
  --action-primary: var(--aurora-violet);
  --status-success: var(--aurora-teal);
  --status-warning: var(--aurora-amber);
  --status-danger: var(--aurora-rose);
  --status-info: var(--aurora-blue);
  --status-pending: var(--aurora-amber);
  --status-attention: var(--aurora-coral);
}

.dark {
  --surface-base: #13100c;         /* warm charcoal, bruine ondertoon */
  --surface-lift: #1a1612;
  --surface-deep: #0a0806;
  --text-primary: #f5ecde;          /* warm off-white */
  --text-secondary: rgba(245, 236, 222, 0.72);
  --text-tertiary: rgba(245, 236, 222, 0.50);
  --border-subtle: rgba(245, 236, 222, 0.12);
  /* Aurora raw tokens blijven gelijk; glows worden iets sterker */
  --glow-violet: rgba(123, 92, 255, 0.45);
  /* ... */
}
```

### 2.4 Motion-taal

Vier expliciete easings, alle state-changes gebruiken deze tokens. Nooit ad-hoc `transition-all duration-150`.

```css
--ease-standard: cubic-bezier(0.165, 0.84, 0.44, 1);   /* standaard state-change */
--ease-draw: cubic-bezier(0.625, 0.05, 0, 1);          /* draw/stroke (sparklines) */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);      /* playful reveals */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);        /* entrance animations */

--duration-quick: 80ms;
--duration-standard: 200ms;
--duration-emphasized: 400ms;
```

**Ambient motion** (respect `prefers-reduced-motion` + user-toggle):
- Aurora-gradient drift: 24s alternate, 80px blur, opacity 0.55 (light) / 0.35 (dark)
- Mouse-follow warm spotlight (subtle, mix-blend-mode: screen in light; screen + lower opacity in dark)
- Status-pulse on indicators (2.5s)
- Char-rise on hero-titles (1200ms, `--ease-out-expo`, char-by-char)
- Sparkline draw (1800ms, `--ease-draw`)

### 2.5 Densiteit

Twee CSS-driven modes, user-togglable in settings:
- **`comfortable`** (default): gul whitespace, 9-24px internal padding-schaal
- **`compact`**: ~20% minder spacing, lijsten tonen ~50 rows zonder scroll

Implementatie via CSS custom properties op `<html data-density="comfortable|compact">`; alle spacing-tokens respecteren de mode.

### 2.6 Material signature: glassmorphism

- Sidebar: `rgba(251, 248, 241, 0.58)` (light) / `rgba(26, 22, 18, 0.65)` (dark), `backdrop-filter: blur(28px) saturate(1.4)`
- Cards: `rgba(255, 255, 255, 0.65)` (light) / `rgba(30, 25, 20, 0.55)` (dark), `backdrop-filter: blur(16px)`, 18px radius
- Hover: translate-Y(-4px) + accent-colored glow shadow

---

## 3. Admin-shell architectuur

### 3.1 Layout grid

```
┌────────────────────────────────────────────────────────────┐
│  Top-bar (56px)                                            │
├──────────┬─────────────────────────────────────────────────┤
│          │                                                 │
│          │                                                 │
│  Sidebar │  Content area                                   │
│  (260px) │  (max-width ~1200px, responsive)                │
│          │                                                 │
│          │                                                 │
└──────────┴─────────────────────────────────────────────────┘
```

Sidebar collapsible naar 64px icon-rail (`Ctrl+\ / ⌘\`, persistent via localStorage).

### 3.2 Sidebar

- **Brand logo** (Casella, aurora-gradient square zoals Contracts) + **env-badge** (`LOCAL` / `PREVIEW` / `PROD`) onder elkaar bovenaan
- **Nav-sections** met uppercase micro-labels:
  - "Mijn portaal" — medewerker-routes (zichtbaar voor iedereen)
  - "Admin" — alleen zichtbaar voor role=admin
- **Nav-items** met gradient-icons (Contracts-pattern, Casella-semantiek)
- **Role-switcher** (alleen voor admins) — prominente toggle onder nav ("Medewerker-view ↔ Admin-view", Ctrl+. / ⌘.)
- **User-card** onderaan: avatar + naam + rol, klikbaar → dropdown (profiel, settings incl. theme-toggle, logout)

### 3.3 Top-bar (slim 56px)

- **Links**: breadcrumb-trail + huidige page-title (Cormorant italic accent op kernwoord)
- **Midden**: cmd-K-pill ("Zoeken… `Ctrl+K`") — klik/shortcut opent command palette
- **Rechts**: env-indicator, notifications-bell (dropdown met recent activity), profile-quick-access

### 3.4 Command palette (`Ctrl+K` / `⌘K`)

Cmdk-library (Vercel/pacocoursey) als basis. Fuzzy search over:
- **Navigatie**: alle admin-routes + medewerker-routes
- **Entities**: employees, clients, projects, assignments (live zoek in DB via debounced API)
- **Quick actions**: "+ Nieuwe medewerker", "+ Nieuwe klant", "+ Nieuw project", "+ Nieuwe toewijzing"
- **Settings**: theme-switch (Light/Dark/System), density-toggle, sidebar-collapse
- **Recent items**: laatste 5 bezochte entity-detail-drawers

Iedere command toont de keyboard-shortcut (platform-adaptive) rechts.

### 3.5 Right-side drawer

- Opens from right, ~560px breed (90% op mobile)
- **Spring-ease** open/close (`--ease-spring`, 320ms)
- **URL-state** via `?id=<uuid>`: refreshbaar, deelbaar, back-button werkt
- **Drie exits**: Esc, backdrop-click, close-X
- **Header**: entity-naam groot (Cormorant italic accent op kernwoord), subtle meta, action-icons rechts (meer-menu met archive/duplicate/etc.)
- **Tabs** waar zinvol (bv. Klant: Details · Projecten · Audit; Project: Details · Team · Audit; Employee: Details · Toewijzingen · Documenten · Audit)
- **Stack-depth 2**: drawer in drawer is toegestaan (bv. klant-drawer → project-drawer erbovenop). Meer dan 2 niveaus wordt hard geweigerd met instructie "Sluit eerst bovenste drawer".

### 3.6 Toast-systeem

- **Positie**: lower-right, stack max 3, nieuw toast boven-op
- **Types met aurora-mapping**: success (teal), info (blue), warning (amber), error (rose), attention (coral)
- **Duration**: 4s standard, 8s errors, ∞ bij undo-acties
- **Undo-CTA** voor reversible mutations: archive, delete, reject, end-early
- **Hover-extend**, click-X-dismiss, reduced-motion respect

### 3.7 Responsive

- **Desktop primary**: ≥ 1024px = full layout
- **Tablet** 768-1023px: sidebar auto-collapse naar icon-rail
- **Mobile** < 768px: sidebar wordt drawer-based (slide-in via hamburger), top-bar blijft

### 3.8 Ambient motion & preferences

- Aurora-drift + mouse-spotlight standaard aan in beide themes
- Respecteert `prefers-reduced-motion`: decoratieve motion uit, contextuele motion blijft (shortened)
- User-level "Beperk animaties"-toggle in settings (ook als OS geen signal geeft) — voor focus-mode / older hardware

---

## 4. Component patterns

### 4.1 List / Table

- **Sticky-top controls**: search links + filter-pills midden + primary-action "+ Nieuwe X" rechts
- **Dense data-table** met tabular-nums, hover-lift (1px translate-X + subtle shadow)
- **Clickable rows** → open right-side drawer (geen navigate naar aparte `/id`-pagina)
- **Column-sort** via header-click (cycle asc/desc/none); shift-click = multi-sort (v2)
- **Filter-pills** boven tabel met remove-chips; "+ Filter" picker
- **Cursor-based pagination** met "Laad meer" knop (niet page-numbering)
- **Skeleton rows** tijdens load; shimmer animated met `--ease-standard`
- **Empty state**: Lucide icon + Cormorant italic heading + copy + primary CTA
- **Keyboard**: `j`/`k` door rows, `Enter` opent drawer, `c` = create, `/` = focus search, `f` = focus filter

**Multi-select infrastructuur** wordt voorbereid (checkbox-kolom prepared in table-component, bulk-action-bar out-of-scope voor 1.1).

### 4.2 Detail / Edit drawer

- **URL-driven**: `?id=<uuid>` opent drawer, shareable, deep-linkable
- **Inline auto-save** voor bestaande entities: click field → becomes input → blur = save (debounced, toast "Opgeslagen")
- **Expliciete save voor create-mode**: drawer opent leeg, submit-knop onderin, "Annuleren" keeps drawer open, "Aanmaken" closes on success
- **Optimistic UI**: lijst-update direct op save, rollback op server-error
- **Server-error mapping**: field-specifieke errors (bv. "email al in gebruik") verschijnen exact onder dat field
- **Field-level success-state**: subtle green check + fade after 600ms

### 4.3 Form pattern

- **Zod schema** als source of truth, gedeeld tussen client en server
- **React Hook Form** + `@hookform/resolvers/zod`
- **Labels boven fields**, niet floating (a11y + Dutch-label-length)
- **Real-time validation** on blur per field, niet alleen on-submit
- **Required indicator**: `*` achter label
- **Field help-text**: Lucide HelpCircle hover / expand-inline
- **Smart defaults**: start-datum = vandaag, employment-status = active, etc.
- **Conditional fields**: bv. compensation_type = `auto` → toon km-tarief; `ov` → toon OV-velden (Fase 1.2)
- **Submit-button states**: idle → loading spinner → check (600ms) → drawer close

### 4.4 Feedback / Toasts

Spec in §3.6 hierboven.

---

## 5. Micro-UX & Accessibility

### 5.1 Keyboard shortcuts (cross-platform)

UI toont platform-native: `⌘K` op Mac, `Ctrl+K` op Windows/Linux. Handlers luisteren naar beide modifiers.

**Globaal:**
- `Ctrl+K` / `⌘K` — command palette
- `Ctrl+\` / `⌘\` — sidebar collapse
- `Ctrl+,` / `⌘,` — settings
- `?` (no modifier, not focused in input) — shortcut-overlay
- `Ctrl+.` / `⌘.` — role-switcher
- `Esc` — close drawer/modal/palette

**Lijst-context**: `j`/`k`/`Enter`/`c`/`f`/`/`

**Drawer-context**: `Esc`, `Ctrl+S` / `⌘S` (handmatige save), `Ctrl+Enter` / `⌘↵` (submit-create)

Shortcut-overlay (`?`) toont alle actieve shortcuts in huidige context.

### 5.2 Focus management

- **`focus-visible` overal** — 2px aurora-violet ring met 2px offset, alleen op keyboard-nav
- **Focus-trap** in drawer en command-palette (Tab cycles, Shift+Tab reverse)
- **Focus-restore on close**: drawer sluit → focus terug naar originating element
- **Skip-to-content** link voor screen-reader-users
- **Roving tabindex** in tabellen: pijltjes door cellen, Tab verlaat tabel volledig

### 5.3 States-taal

**Loading:**
- Skeleton voor bekende content-shapes (rijen, cards, drawers)
- Progress-bar (2px) voor async ops > 1s
- Spinner alleen in buttons tijdens submit

**Empty:** Lucide icon + Cormorant italic heading + copy + primary CTA. Altijd drie-delig.

**Error:**
- Inline field error: rode AlertCircle + text
- Form-level: banner bovenin drawer
- API 4xx/5xx: toast met retry-knop
- Network offline: toast met offline-indicator
- 404: dedicated Cormorant italic page
- 500: error-boundary fallback

**Success:** toast + subtle checkmark-pulse op submit-button

### 5.4 Motion & reduced-motion

- Context-motion (drawer open, hover-lift) blijft altijd
- Decoratieve motion (aurora-drift, spotlight, char-rise) uit bij `prefers-reduced-motion: reduce` of user-toggle
- Skeletons stop shimmeren → statisch blok bij reduced-motion

### 5.5 ARIA & screen-reader

- Interactive elements: aria-label op icon-only buttons, aria-labelledby op inputs
- `aria-live="polite"` region voor toasts
- Drawers: `role="dialog" aria-modal="true" aria-labelledby="drawer-title"`
- Command palette: ARIA-combobox pattern
- Tables: `aria-sort`, proper `<thead>/<tbody>`
- WCAG 2.2 AA: contrast 4.5:1 text / 3:1 large-text / 3:1 focus-indicators

### 5.6 Route transitions

- **Tussen pages**: instant (geen page-fade — modern apps navigeren direct)
- **Binnen page** (filter change): content fades + skeleton in (200ms)
- **Drawer open/close**: spring-ease transition

---

## 6. Theming

### 6.1 Light + Dark mode

Beide themes first-class. Dark is brand-authentic (niet simple invert):
- Warm charcoal base (niet pure zwart)
- Warm off-white text (niet pure wit)
- Zelfde aurora-accents (brand-consistency)
- Sterkere glow-shadows (compensate ambient)
- Lagere aurora-drift opacity (0.35 vs 0.55)

### 6.2 Theme persistence

**DB-kolom** `users.theme_preference` ENUM (`light` | `dark` | `system`), default `system`. Gecombineerd met localStorage-cache voor instant-load.

**Pre-hydration inline `<head>` script** leest preference uit cookie → zet class op `<html>` voordat React laadt. Voorkomt FOUT (flash of unstyled theme).

### 6.3 Theme-switcher UX

In user-menu dropdown (bottom sidebar):
- ☀ Licht
- ☾ Donker
- 🖥 Systeem *(volgt OS-voorkeur)*

Switch direct via CSS-class, server-action persist DB async met optimistic-update.

---

## 7. Critical Operation Flow

Cross-cutting patroon voor **alle destructive acties**: project cancel/complete, employee terminate, client archive, assignment end-early.

### 7.1 Drie beschermingslagen

**Laag 1 — Impact-review** (forced screen voor admin bij confirm komt):
- Wat wordt afgesloten (naam, code, periode, kleur)
- Wat wordt meegetrokken (counts van sub-records)
- Wat blijft staan (historische data, audit trail)
- Gekozen closure-datum (standaard vandaag, future datum toegestaan)

**Laag 2 — Type-to-confirm** (GitHub-pattern):
- Admin typt exacte entity-code/naam in
- Submit-button disabled tot exact match
- Uitzondering: assignment end-early heeft geen type-confirm (low impact)

**Laag 3 — Scheduled execution + undo-window**:
- Entity gaat in transitional state (`pending_closure`, `pending_termination`, etc.)
- Tot scheduled datum: admin kan met één klik annuleren
- Op scheduled datum: background-job voert closure uit
- Na uitvoering: 72h rollback-window (24h voor assignments)
- Na undo-window: alleen "Reinstate" mogelijk (nieuwe init, niet auto-rollback)

### 7.2 Scheduler-infrastructuur

**Background-job requires nieuwe infra** (beslist in 1.1):
- Supabase pg_cron extension óf Vercel Cron + Supabase Edge Function
- Draait dagelijks 00:05 lokale tijd
- Queried `pending_closure_at <= NOW()` entities → executes
- Zichtbaar in admin-audit (wie / wat / wanneer)

### 7.3 Overview per entity

| Actie | Impact-review toont | Type-to-confirm | Undo-window | Auto-execute scheduler |
|---|---|---|---|---|
| Project cancel/complete | Open assignments, pending hours, impacted employees | Projectcode/naam | 72h | Ja |
| Employee terminate | Open assignments, pending hours, verlof/verzuim-records | Employee display_name | 72h | Ja |
| Client archive | Project-count, total hours, pending leaves | Klant-naam | 72h | Ja |
| Assignment end-early | Hours-to-date, km, remainder cancelled | — | 24h | Nee (direct) |

Herbruikbaar component: `<CriticalConfirmDialog>` met entity-specifieke content-slots.

---

## 8. PDOK adres-input (A+ pattern)

### 8.1 Backend

Twee proxied endpoints in `apps/web/app/api/`:

- `GET /api/pdok/suggest?q=...` — fuzzy autocomplete, debounced client-side (250ms)
- `GET /api/pdok/lookup/:id` — resolve PDOK-id naar volledig adres + lat/lng + rd-coördinaten + municipality + province

Calls gaan naar PDOK Locatieserver `v3_1/suggest` en `v3_1/lookup` (gratis NL-overheidservice). Implementatie als `packages/maps` helper.

### 8.2 Client-component: `<AddressInput>`

- **Één invoerveld** (niet postcode+huisnummer gescheiden)
- **Debounced suggest** 250ms, min 2 chars
- **Suggesties-dropdown** met keyboard-nav (arrow keys, Enter select, Esc dismiss)
- **Map preview** (Mapbox GL JS, kleine 140px hoog) na selectie
- **"Bewerk manueel"-toggle** opent alle address-fields incl. lat/lng voor power-users
- **ARIA combobox** compliant

### 8.3 Dedupe-strategie

Op save: check of `pdok_id` al bestaat in `addresses`-tabel. Als ja → hergebruik address_id. Als nee → nieuwe rij. Resultaat: `Damrak 10` heeft altijd één row ongeacht hoeveel entities ernaar verwijzen.

### 8.4 Schema-addition op `addresses`

```sql
ALTER TABLE addresses ADD COLUMN pdok_id TEXT;
CREATE UNIQUE INDEX addresses_pdok_id_unique
  ON addresses (pdok_id) WHERE pdok_id IS NOT NULL;
ALTER TABLE addresses ADD COLUMN municipality TEXT;
ALTER TABLE addresses ADD COLUMN province TEXT;
ALTER TABLE addresses ADD COLUMN full_address_display TEXT;
ALTER TABLE addresses ADD COLUMN rd_x DOUBLE PRECISION;
ALTER TABLE addresses ADD COLUMN rd_y DOUBLE PRECISION;
```

---

## 9. Invite-first employee onboarding

### 9.1 Flow

1. **Admin maakt employees-record** in admin-UI met invite_email + HR-velden; user_id blijft NULL
2. **Admin voegt user toe** aan Entra `Casella-Employees` group
3. **Employee logt voor 't eerst in** via SSO:
   - Auth.js callback creëert users-row (al bestaand)
   - Post-login: zoek employees WHERE `LOWER(invite_email) = LOWER(users.email) AND user_id IS NULL`
   - **Match**: bind user_id, clear invite_email, employee ziet dashboard
   - **Geen match**: redirect naar `/onboarding-pending` page

### 9.2 Pending-page UX

- Vriendelijke Cormorant-italic "Welkom, *[naam]*"
- Copy: "Je account is aangemeld bij Ascentra HR. Zodra je wordt geactiveerd krijg je een bevestiging per e-mail."
- Geen logout-knop; reload checkt opnieuw; long-poll every 60s voor directe activation-feedback

### 9.3 Admin-UI voor pending users

Route `/admin/medewerkers/pending`:
- Lijst van users zonder employees-record, getoond met: Entra-email, display-name, eerste-login-timestamp
- Actie per rij: "Koppel aan bestaand invite" (dropdown van pending employee-invites) of "Maak nieuwe employee-record"

### 9.4 Schema-addition op `employees`

```sql
ALTER TABLE employees ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE employees ADD COLUMN invite_email TEXT;
CREATE UNIQUE INDEX employees_invite_email_unique_ci
  ON employees (LOWER(invite_email)) WHERE invite_email IS NOT NULL;
```

---

## 10. Entity specifications

### 10.1 Employees

**Schema-additions** (op Fase 0 schema):

```sql
-- Invite-first onboarding
ALTER TABLE employees ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE employees ADD COLUMN invite_email TEXT;
CREATE UNIQUE INDEX employees_invite_email_unique_ci
  ON employees (LOWER(invite_email)) WHERE invite_email IS NOT NULL;

-- Contact + HR-metadata
ALTER TABLE employees ADD COLUMN phone TEXT;
ALTER TABLE employees ADD COLUMN emergency_contact_name TEXT;
ALTER TABLE employees ADD COLUMN emergency_contact_phone TEXT;
ALTER TABLE employees ADD COLUMN avatar_url TEXT;
ALTER TABLE employees ADD COLUMN notes TEXT;
ALTER TABLE employees ADD COLUMN job_title TEXT;
ALTER TABLE employees ADD COLUMN contracted_hours_per_week INTEGER
  CHECK (contracted_hours_per_week BETWEEN 1 AND 60) NOT NULL DEFAULT 40;

-- Termination state (voor critical-op-flow)
ALTER TABLE employees ADD COLUMN pending_termination_at DATE;
ALTER TABLE employees ADD COLUMN pending_termination_reason TEXT;
ALTER TABLE employees ADD COLUMN termination_undo_until TIMESTAMPTZ;
```

**Admin-form secties**: Basis · Dienstverband · Vergoedingen · Noodcontact · Admin-notities (uitgewerkte velden in §9.4)

**Flows:**
- **Create** (invite): sectie Basis + HR-velden, op aanmaken → welkomst-email via Ascentra SMTP
- **Terminate**: critical-op-flow (impact-review + type-to-confirm medewerker-naam + 72h undo + scheduler). Open assignments worden op termination-date mee-afgesloten (met bevestiging). User wordt **niet** uit Entra-group verwijderd (handmatige admin-actie). **Geen auto-offboarding-email** naar medewerker (admin regelt communicatie zelf).
- **Reinstate**: getermineerde medewerker → status active, einddatum geleegd, start-datum nieuw gezet

### 10.2 Clients

**Schema-additions:**

```sql
ALTER TABLE clients ADD COLUMN logo_url TEXT;
ALTER TABLE clients ADD COLUMN website_url TEXT;
ALTER TABLE clients ADD COLUMN industry TEXT;
ALTER TABLE clients ADD COLUMN account_manager_id UUID
  REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN notes TEXT;

-- Archive state voor critical-op-flow
ALTER TABLE clients ADD COLUMN pending_archive_at DATE;
ALTER TABLE clients ADD COLUMN pending_archive_reason TEXT;
ALTER TABLE clients ADD COLUMN archive_undo_until TIMESTAMPTZ;
```

**Admin-form secties**: Identiteit (naam, logo, website, KVK, branche) · Primary contact · Kantooradres · Ascentra-zijde (accountmanager) · Admin-notities

**Single primary contact** in 1.1 (multiple contacts = aparte spec later). **KVK-API auto-fill = out-of-scope**.

**Logo-URL zonder upload** — admin plakt URL; fallback: auto-generated letter-avatar met aurora-gradient op basis van naam.

**Flows:**
- **Create**: simpel formulier, save
- **Archive**: critical-op-flow (impact-review + type-to-confirm klant-naam + 72h undo + scheduler)
- **Unarchive**: één klik, direct

### 10.3 Projects

**Schema-additions:**

```sql
ALTER TABLE projects ADD COLUMN code TEXT;
CREATE UNIQUE INDEX projects_code_unique
  ON projects (code) WHERE code IS NOT NULL;

CREATE TYPE project_color AS ENUM
  ('violet', 'blue', 'teal', 'coral', 'amber', 'rose');
ALTER TABLE projects ADD COLUMN color project_color NOT NULL DEFAULT 'violet';

ALTER TABLE projects ADD COLUMN project_lead_id UUID
  REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN site_address_id UUID
  REFERENCES addresses(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN notes TEXT;

-- Pending closure voor critical-op-flow
ALTER TYPE project_status ADD VALUE 'pending_closure' BEFORE 'cancelled';
ALTER TABLE projects ADD COLUMN pending_closure_at DATE;
ALTER TABLE projects ADD COLUMN pending_closure_action TEXT
  CHECK (pending_closure_action IN ('complete', 'cancel'));
ALTER TABLE projects ADD COLUMN pending_closure_reason TEXT;
ALTER TABLE projects ADD COLUMN closed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN closed_by UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN closure_undo_until TIMESTAMPTZ;
```

**Admin-form secties**: Identiteit (naam, code auto-suggest, klant-dropdown, kleur-picker, beschrijving) · Planning (status, start/eind) · Uitvoering (lead, werkadres met fallback naar klant-adres) · Admin-notities

**Code**: optioneel met auto-suggestie `ASC-<jaar>-<volgnummer>`. Admin kan accepteren/overschrijven.

**Color-picker**: 6 aurora swatches horizontaal, huidige selectie gemarkeerd, auto-default via hash(name).

**Site-address fallback**: bij km-berekening (Fase 1.2) → `project.site_address_id ?? project.client.address_id`.

**Flows:**
- **Create**: form
- **Close** (complete of cancel): critical-op-flow volledig (impact-review toont open assignments + pending hours, type-to-confirm, scheduled met auto-execute, 72h undo). Open assignments worden mee-afgesloten met bevestiging.
- **Reinstate** van closed/cancelled: status terug naar active, assignments moeten handmatig her-ingericht

### 10.4 Project assignments

**Schema-additions:**

```sql
ALTER TABLE project_assignments ADD COLUMN role TEXT;
ALTER TABLE project_assignments ADD COLUMN hours_per_week INTEGER
  CHECK (hours_per_week BETWEEN 1 AND 60);
ALTER TABLE project_assignments ADD COLUMN notes TEXT;

-- Indexen voor capacity-queries
CREATE INDEX idx_assignments_employee_active
  ON project_assignments (employee_id)
  WHERE end_date IS NULL OR end_date >= CURRENT_DATE;

CREATE INDEX idx_assignments_project_active
  ON project_assignments (project_id)
  WHERE end_date IS NULL OR end_date >= CURRENT_DATE;
```

**Drie entry-points**:
1. Project-drawer tab "Team"
2. Employee-drawer tab "Toewijzingen"
3. Dedicated list `/admin/toewijzingen` met rijke filters (actief/ended/upcoming, by employee, by project, by date-range). Kolommen: Medewerker · Project · Klant · Periode · Uren/week · Rol.

**Admin-form secties**: Wie op wat (employee, project, role, hours_per_week) · Periode · Vergoeding (overrides) · Notities

**Hours-per-week + percentage**: primary is `hours_per_week` integer, percentage afgeleid bij weergave uit `hours_per_week / employees.contracted_hours_per_week × 100`. UI toont twee gekoppelde fields: typ percentage → auto-vul uren en vice versa.

**Validatie-stappen op create:**
1. **Hard block**: terminated employee of cancelled/completed project → blokkeer
2. **Soft warning**: capacity-conflict (totaal > 100% in overlap-periode) → dialog "Totaal wordt X%, toch toewijzen?" met "Ja, ik weet wat ik doe" knop
3. **Soft info**: duplicate-same-project detection → "Bestaande toewijzing loopt nog" + bevestiging

**End-early**: critical-op-flow lite (impact-review, geen type-confirm, 24h undo). Toast met "Ongedaan maken"-link.

---

## 11. Permissions

Fase 1.1 erft het Fase 0 RBAC-model (`packages/auth/src/permissions.ts`). **Alle admin-CRUDs** in deze spec vereisen role=`admin`. Employees hebben **geen directe toegang** tot CRUD-pagina's — hun lees/schrijf-actie over eigen data komt in Fase 1.2+.

**Relevante bestaande permissions** (gebruikt door Fase 1.1 routes):
- `employee:edit` — CRUD employees
- `project:create`, `project:assign` — CRUD projects + assignments
- `client:create` — CRUD clients

**Drie-laagse verdediging** (zoals gespec'd in Fase 0):
1. Frontend: UI hiden via `can()` check
2. Backend: Server Action / API-route checkt role voor elke mutation
3. Database: RLS policies (Fase 0) filteren employee-scoped tabellen; admin-CRUD-tabellen (clients, projects, assignments) hebben geen RLS en zijn dus alleen bereikbaar via permission-gated server code.

---

## 12. Audit-log

Elke mutatie (create/update/delete-equivalent) schrijft naar `audit_log`:
- `actor_user_id` — wie deed 't
- `action` — bv. `employees.create`, `projects.close.initiate`, `assignments.update`
- `resource_type`, `resource_id`
- `changes_json` — before/after diff
- `created_at`

Writes via centrale helper `packages/db/src/audit.ts`:

```typescript
await auditMutation(tx, {
  actorUserId: currentUserId,
  action: 'employees.update',
  resourceType: 'employees',
  resourceId: employeeId,
  changesJson: { before, after },
});
```

Altijd in dezelfde transaction als de mutation — atomisch.

**Viewer UI = aparte spec later** (1.1 schrijft alleen; viewer komt in eigen feature-spec).

---

## 13. Technische beslissingen

| Gebied | Keuze | Rationale |
|---|---|---|
| UI-library basis | shadcn/ui (radix primitives) | A11y-correct out-of-box, volledig customizable met Ascentra-tokens |
| Forms | React Hook Form + Zod-resolver | Gedeelde Zod-schemas met server, type-safe, performant |
| Data-fetching | Server Components + Server Actions | Next 15 native, geen extra library nodig |
| Command palette | `cmdk` (Vercel/pacocoursey) | De-facto standaard, ARIA-compliant, performant |
| Keyboard shortcuts | `react-hotkeys-hook` | Cross-platform, context-scope support |
| Drawer | Radix Dialog primitive | A11y gecertifieerd, custom-stylable |
| Toasts | `sonner` (Vercel) | Design-ready, stack handling, undo support |
| Map preview | `mapbox-gl` (later, voor Fase 1.2 km) | Industry-standard, Casella's token |
| Scheduler | Supabase `pg_cron` (preferred) óf Vercel Cron | `pg_cron` blijft binnen DB, simpler, Fase 2 compatible |
| PDOK | Direct REST proxying (geen SDK — niet beschikbaar) | Lichtgewicht fetch + Zod-parse |

---

## 14. Succescriteria

Fase 1.1 is klaar als:

- Admin kan **employees** creëren via invite-first flow; niet-gematchte logins krijgen pending-page
- Admin kan **clients** beheren met PDOK-address-input
- Admin kan **projects** aanmaken, koppelen aan klant, kleur + code + lead toewijzen
- Admin kan **project_assignments** beheren met hours-per-week, capacity-conflict detection
- **Alle destructive acties** gaan door critical-op-flow (impact-review + type-confirm waar van toepassing + scheduled + undo-window)
- **Scheduler draait** en voert pending-closures uit op de geplande datum
- **Light + dark mode** beide volledig werkend, theme-preference persistent
- **Command palette** werkt (navigation + entity-search + quick-actions)
- **Keyboard shortcuts** werken cross-platform (Win Ctrl / Mac ⌘)
- **All list-pages** tonen server-side paginated/sorted/filtered data met skeleton-loads
- **All drawers** URL-driven, deep-linkable, inline auto-save voor bestaande entities
- **Toast-systeem** met undo werkt
- **Audit-log** schrijft bij elke mutation
- **WCAG 2.2 AA** geverifieerd via axe / Lighthouse

---

## 15. Follow-up items (opvolgspecs)

- **Fase 1.2** — Employee uren-invoer + PDOK+Mapbox km-berekening + goedkeurings-workflow
- **Fase 1.3** — Nmbrs-sync voor goedgekeurde uren + bulk-employee-import uit Nmbrs
- **Fase 1.4** — Smart features (reminders, anomalie-detectie, standaard-dag-autofill, OV-alternatief)
- Aparte spec: audit-log viewer UI
- Aparte spec: bulk-action-bar voor multi-select
- Aparte spec: command-palette extensions (invite actions, recent searches analytics)
- Aparte spec: file-upload voor logos + documents (Supabase Storage integratie)
- Aparte spec: KVK-API lookup voor clients
- Aparte spec: client multi-contacts
- Aparte spec: real-time updates tussen tabs (Supabase Realtime)
- Optional Fase 2: scheduler-observability (failed-job retry UI, job-history)

---

## 16. Open vragen (te beantwoorden bij implementatie)

- **OV-vergoedingstype**: compensation_type = 'ov' — hoe ziet dat er in UI uit? Pure bool "vast bedrag/mnd" of per-assignment-override? → beslis bij Fase 1.2 OV-alternatief
- **Manager-relaties**: `employees.manager_id` refereert naar `users`, niet naar `employees`. Betekent dat elke manager óók een user is maar niet per se een employee-record heeft. Past bij huidige model. Bevestigen bij implementation.
- **Avatar-auto-pull uit Entra**: Graph `/users/{id}/photo/$value` geeft photo. Implementeren als background-job bij eerste login? → beslis bij implementatie of parkeren voor polish-spec
- **Welkomst-email-template** voor employee-invite: content + layout definiëren bij implementation. Placeholder: "Welkom bij Casella. Log in met je Microsoft-account: [LINK]"
