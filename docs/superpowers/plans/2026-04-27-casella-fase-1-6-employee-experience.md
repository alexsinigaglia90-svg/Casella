# Casella Fase 1.6 — Employee Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bouw de complete employee-self-service experience volgens spec `2026-04-27-casella-employee-experience-design.md` — 12 onderdelen verdeeld over 6 chapters, ~37 tasks. Eindresultaat: medewerkers kunnen via Casella alle wettelijk-relevante functies zelf afhandelen (verlof / verzuim / declaraties / contract-inzage / loonstroken / bonus / werkgeversverklaring / profiel) met admin-approval-flows + 16 email-flows.

**Architecture:** Hergebruik bestaande patterns van Fase 1.1c (Clients/Projects/Assignments CRUDs) + 1.2 (uren-grid + Mapbox) + 1.3 (Nmbrs SOAP) + 1.4 (reminders/anomaly) + 1.5 (Claude Design handoff). Nmbrs leidend voor saldi (cache via `leave_balance_snapshots`); Casella eigen source-of-truth voor `leave_requests`/`expense_claims`/`bonus_ledger`/`care_package_ledger`/`statements`/`contracts`/`employee_change_requests`/`broadcasts`. Email-bodies krijgen placeholder-content; definitieve copy komt in addendum.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM, Postgres (Supabase local), Auth.js + Entra SSO, Tailwind + shadcn-style primitives, design-tokens (cream/ink/aurora-*), `@casella/email` (Nodemailer + Ascentra SMTP), `@casella/maps` (Mapbox + PDOK), `@casella/nmbrs` (SOAP via fast-xml-parser), Supabase Storage voor PDFs, `@react-pdf/renderer` voor werkgeversverklaring.

---

## File structure overview

**Nieuwe packages**: geen — alles binnen bestaande structuur.

**Nieuwe schema-bestanden in `packages/db/src/schema/`:**
- `contracts.ts` — `contracts` tabel
- `expenses.ts` — `expense_claims` tabel + categorie-enum
- `change-requests.ts` — `employee_change_requests` tabel
- `broadcasts.ts` — `broadcasts` tabel + relatie naar `notifications`
- `leave-balance-snapshots.ts` — Nmbrs-cache van saldi
- `bonus-config.ts` — jaarconfig voor bonus-formule

**Schema-uitbreidingen (Drizzle migrations):**
- `employees`: + language_preference, bio, avatar_storage_path, email_notification_preferences
- `projects`: + hourly_rate_excl_btw
- `bonus_ledger`: + project_id, bonus_period_start/end, pct_applied
- `statements`: + nhg_indicator, lender_name, loan_amount_indicative_cents, landlord_name, landlord_address, monthly_rent_cents, purpose_other_reason
- `notifications`: type-enum uitbreiden

**Employee routes (`apps/web/app/(authed)/`):**
- `verlof/page.tsx` + `verlof/aanvragen/page.tsx`
- `verzuim/page.tsx`
- `declaraties/page.tsx` + `declaraties/nieuw/page.tsx`
- `contract/page.tsx`
- `loonstroken/page.tsx`
- `bonus/page.tsx`
- `winstdeling/page.tsx`
- `werkgeversverklaring/page.tsx`
- `profiel/page.tsx`
- (`dashboard/page.tsx` is bestaand — wordt herschreven)
- (`uren/page.tsx` is bestaand — ongewijzigd)

**Admin routes (`apps/web/app/(admin)/admin/`):**
- `verlof/page.tsx` (approval queue)
- `verzuim/page.tsx` (read-only overview)
- `declaraties/page.tsx` (approval queue)
- `bonus/page.tsx` (over-performance + config)
- `broadcasts/page.tsx` (broadcast UI)
- (`medewerkers/[id]/page.tsx` uitbreiden met contract-upload + change-request-handling)

**API routes (`apps/web/app/api/`):**
- `verlof/(submit|cancel|template)/route.ts` + `admin/verlof/[id]/(approve|reject)/route.ts`
- `verzuim/(submit|recover)/route.ts`
- `declaraties/route.ts` (POST submit) + `admin/declaraties/[id]/(approve|reject)/route.ts`
- `contract/[id]/download/route.ts`
- `loonstroken/route.ts` (lijst + on-demand PDF-stream)
- `bonus/saldo/route.ts`
- `winstdeling/saldo/route.ts`
- `werkgeversverklaring/route.ts` (POST request → instant PDF)
- `profiel/route.ts` (PATCH direct fields)
- `profiel/change-request/route.ts` (POST address/iban)
- `admin/broadcasts/route.ts`
- `admin/contracts/route.ts` (POST upload)
- `admin/change-requests/[id]/(approve|reject)/route.ts`
- `notifications/route.ts` (GET + mark-read)
- `cron/(reminders|low-balance|termination-warn)/route.ts`

**Feature dirs (`apps/web/features/`):**
- `leave/` (employee + admin componenten)
- `sick/` (employee + admin)
- `expenses/`
- `contracts/`
- `payslips/`
- `bonus/`
- `care-package/`
- `statements/` (werkgeversverklaring)
- `profile/`
- `notifications/employee/` (employee-bell)
- `dashboard/` (homepage cards)
- `broadcasts/` (admin)

**Lib helpers (`apps/web/lib/`):**
- `leave/` — types, queries, balance-resolver, validation
- `expenses/` — types, queries, validation, nmbrs-push
- `bonus/` — formula, accrual-calc, working-hours-calendar
- `statements/` — pdf-generator (@react-pdf/renderer)
- `nmbrs/` — uitbreiden met `getEmployeePayslips`, `getYearStatement`, `getLeaveBalances`
- `notifications/` — type-enum, helpers voor enqueue

**Email templates (`packages/email/src/templates/`):**
- 14 nieuwe templates volgens skeleton (subject + minimal body + link). Definitief tekst-format komt in addendum.

---

## Chapter A — Fundament

### Task 1: Schema-uitbreiding — employees + projects + bonus_ledger + statements + notifications

**Files:**
- Modify: `packages/db/src/schema/identity.ts` (employees-velden)
- Modify: `packages/db/src/schema/work.ts` (projects.hourly_rate_excl_btw + bonus_ledger uitbreiden)
- Modify: `packages/db/src/schema/statements.ts` (purpose-fields)
- Modify: `packages/db/src/schema/system.ts` (notification type-enum)
- Modify: `packages/db/src/schema/enums.ts` (language_preference + nieuwe notification types)
- Test: `packages/db/__tests__/schema.test.ts`

- [ ] **Step 1: Voeg language_preference enum toe**

In `packages/db/src/schema/enums.ts`:
```ts
export const languagePreferenceEnum = pgEnum("language_preference", ["nl", "en"]);
```

- [ ] **Step 2: Breid employees uit**

In `packages/db/src/schema/identity.ts`, voeg toe aan `employees`:
```ts
languagePreference: languagePreferenceEnum("language_preference").notNull().default("nl"),
bio: text("bio"),
avatarStoragePath: text("avatar_storage_path"),
emailNotificationPreferences: jsonb("email_notification_preferences").$type<Record<string, boolean>>().notNull().default({}),
```

- [ ] **Step 3: Voeg projects.hourly_rate_excl_btw toe**

In `packages/db/src/schema/work.ts`, voeg toe aan `projects`:
```ts
hourlyRateExclBtw: numeric("hourly_rate_excl_btw", { precision: 8, scale: 2 }),
```

(Nullable: bestaande projecten zonder tarief blijven valid; bonus-formule rekent met `?? 0` of skip-waarschuwing.)

- [ ] **Step 4: Breid bonus_ledger uit**

In `packages/db/src/schema/system.ts` (of waar bonus_ledger leeft), voeg toe:
```ts
projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
bonusPeriodStart: date("bonus_period_start"),
bonusPeriodEnd: date("bonus_period_end"),
pctApplied: numeric("pct_applied", { precision: 5, scale: 2 }),
```

- [ ] **Step 5: Breid statements uit met purpose-velden**

In `packages/db/src/schema/statements.ts`:
```ts
nhgIndicator: boolean("nhg_indicator"),
lenderName: text("lender_name"),
loanAmountIndicativeCents: integer("loan_amount_indicative_cents"),
landlordName: text("landlord_name"),
landlordAddress: text("landlord_address"),
monthlyRentCents: integer("monthly_rent_cents"),
purposeOtherReason: text("purpose_other_reason"),
generatedPdfStoragePath: text("generated_pdf_storage_path"),
generatedAt: timestamp("generated_at", { withTimezone: true }),
deliveredAt: timestamp("delivered_at", { withTimezone: true }),
```

- [ ] **Step 6: Genereer + run migration**

```bash
pnpm db:generate
pnpm db:migrate
```

Hernoem naar `0009_employee_experience_fundament.sql`. Verifieer `\d employees` toont nieuwe kolommen.

- [ ] **Step 7: Commit**

```bash
git add packages/db/src/schema/ packages/db/drizzle/
git commit -m "feat(db): schema-uitbreidingen voor employee experience (1.6 fundament)

- employees: language_preference, bio, avatar_storage_path, email_notification_preferences
- projects: hourly_rate_excl_btw (numeric 8,2)
- bonus_ledger: project_id, bonus_period_start/end, pct_applied
- statements: purpose-velden (nhg_indicator/lender_name/loan_amount/landlord_*/monthly_rent/other_reason) + pdf-paths

Migration 0009.

Plan 1.6 Task 1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Nieuwe tabellen — contracts + expense_claims + change_requests + broadcasts + leave_balance_snapshots + bonus_config + care_package_ledger

**Files:**
- Create: `packages/db/src/schema/contracts.ts`
- Create: `packages/db/src/schema/expenses.ts`
- Create: `packages/db/src/schema/change-requests.ts`
- Create: `packages/db/src/schema/broadcasts.ts`
- Create: `packages/db/src/schema/leave-balance-snapshots.ts`
- Create: `packages/db/src/schema/bonus-config.ts`
- Create: `packages/db/src/schema/care-package.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/schema/enums.ts` (expense_category, change_request_type/status, care_package_company)

- [ ] **Step 1: Voeg enums toe**

In `enums.ts`:
```ts
export const expenseCategoryEnum = pgEnum("expense_category", [
  "travel", "client_meal", "conference", "materials",
  "software", "telecom", "client_gift", "other"
]);

export const expenseStatusEnum = pgEnum("expense_status", [
  "submitted", "approved", "rejected", "paid"
]);

export const changeRequestTypeEnum = pgEnum("change_request_type", ["address", "iban"]);
export const changeRequestStatusEnum = pgEnum("change_request_status", ["pending", "approved", "rejected"]);

export const carePackageCompanyEnum = pgEnum("care_package_company", ["ascentra", "operis", "astra"]);
export const carePackageLedgerTypeEnum = pgEnum("care_package_ledger_type", ["annual_distribution", "exit_payout"]);
```

- [ ] **Step 2: Schrijf contracts schema**

`packages/db/src/schema/contracts.ts`:
```ts
import { pgTable, uuid, text, date, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { employees, users } from "./identity";

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  jobTitle: text("job_title").notNull(),
  pdfStoragePath: text("pdf_storage_path").notNull(),

  // Bonus-formule velden (Fase 1.6 §3.8.1)
  brutoSalarisMaandCents: numeric("bruto_salaris_maand_cents", { precision: 12, scale: 2 }),
  vakantietoeslagPct: numeric("vakantietoeslag_pct", { precision: 5, scale: 2 }).default("8.00"),
  baselineTariefPerUur: numeric("baseline_tarief_per_uur", { precision: 8, scale: 2 }).default("75.00"),
  bonusPctBelowBaseline: numeric("bonus_pct_below_baseline", { precision: 5, scale: 2 }).default("10.00"),
  bonusPctAboveBaseline: numeric("bonus_pct_above_baseline", { precision: 5, scale: 2 }).default("15.00"),
  maxOverperformancePct: numeric("max_overperformance_pct", { precision: 5, scale: 2 }).default("20.00"),
  autoStelpostActief: boolean("auto_stelpost_actief").notNull().default(false),
  autoStelpostBedragMaand: numeric("auto_stelpost_bedrag_maand", { precision: 10, scale: 2 }).default("1000.00"),

  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
```

- [ ] **Step 3: Schrijf expense_claims schema**

`packages/db/src/schema/expenses.ts`:
```ts
import { pgTable, uuid, text, date, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { employees, users } from "./identity";
import { projects } from "./work";
import { expenseCategoryEnum, expenseStatusEnum } from "./enums";

export const expenseClaims = pgTable("expense_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  category: expenseCategoryEnum("category").notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }), // null = intern Ascentra
  isInternal: boolean("is_internal").notNull().default(false),
  amountCents: integer("amount_cents").notNull(),
  vatAmountCents: integer("vat_amount_cents"), // admin-set vóór Nmbrs-push
  date: date("date").notNull(),
  description: text("description").notNull(),
  receiptStoragePath: text("receipt_storage_path").notNull(),
  categoryPayload: jsonb("category_payload").$type<Record<string, unknown>>(), // van/naar voor reis, klantnaam voor maaltijd, etc.
  status: expenseStatusEnum("status").notNull().default("submitted"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
  rejectionReason: text("rejection_reason"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  nmbrsSyncedAt: timestamp("nmbrs_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
```

(Note: `boolean` import — voeg toe als ontbreekt.)

- [ ] **Step 4: Schrijf change-requests schema**

`packages/db/src/schema/change-requests.ts`:
```ts
import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { employees, users } from "./identity";
import { changeRequestTypeEnum, changeRequestStatusEnum } from "./enums";

export const employeeChangeRequests = pgTable("employee_change_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  type: changeRequestTypeEnum("type").notNull(),
  proposedValue: jsonb("proposed_value").notNull().$type<Record<string, unknown>>(),
  status: changeRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
  rejectionReason: text("rejection_reason"),
});
```

- [ ] **Step 5: Schrijf broadcasts schema**

`packages/db/src/schema/broadcasts.ts`:
```ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";

export const broadcasts = pgTable("broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  message: text("message").notNull(),
  // null target_employee_ids = all active employees
  targetEmployeeIds: text("target_employee_ids").array(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 6: Schrijf leave_balance_snapshots schema**

`packages/db/src/schema/leave-balance-snapshots.ts`:
```ts
import { pgTable, uuid, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { employees } from "./identity";

export const leaveBalanceSnapshots = pgTable("leave_balance_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  leaveType: text("leave_type").notNull(), // "vacation"|"short_care"|"long_care"|"parental"|"birth_partner"...
  hoursRemaining: numeric("hours_remaining", { precision: 7, scale: 2 }).notNull(),
  hoursTotal: numeric("hours_total", { precision: 7, scale: 2 }).notNull(),
  expiresAt: text("expires_at"), // ISO date or null
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 7: Schrijf bonus_config + care_package_ledger schemas**

`packages/db/src/schema/bonus-config.ts`:
```ts
import { pgTable, integer, numeric } from "drizzle-orm/pg-core";

export const bonusConfig = pgTable("bonus_config", {
  year: integer("year").primaryKey(),
  werkgeverslastenPct: numeric("werkgeverslasten_pct", { precision: 5, scale: 2 }).notNull().default("30.00"),
  indirecteKostenPerMaand: numeric("indirecte_kosten_per_maand", { precision: 10, scale: 2 }).notNull().default("500.00"),
  werkbareUrenPerMaand: integer("werkbare_uren_per_maand").notNull().default(168),
});
```

`packages/db/src/schema/care-package.ts`:
```ts
import { pgTable, uuid, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { employees } from "./identity";
import { carePackageCompanyEnum, carePackageLedgerTypeEnum } from "./enums";

export const carePackageLedger = pgTable("care_package_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  type: carePackageLedgerTypeEnum("type").notNull(),
  company: carePackageCompanyEnum("company").notNull(),
  amountCents: integer("amount_cents").notNull(),
  year: integer("year").notNull(),
  transactionRef: text("transaction_ref"), // exit-event identifier
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 8: Update barrel + generate migration**

In `packages/db/src/schema/index.ts` voeg toe:
```ts
export * from "./contracts";
export * from "./expenses";
export * from "./change-requests";
export * from "./broadcasts";
export * from "./leave-balance-snapshots";
export * from "./bonus-config";
export * from "./care-package";
```

Run:
```bash
pnpm db:generate
pnpm db:migrate
```

Hernoem naar `0010_employee_experience_tables.sql`. Verifieer alle nieuwe tabellen via `\dt` in psql.

- [ ] **Step 9: Commit**

```bash
git add packages/db/src/schema/ packages/db/drizzle/
git commit -m "feat(db): nieuwe tabellen voor employee experience (1.6 schema-base)

7 nieuwe tabellen:
- contracts (bonus-velden + PDF-storage-path)
- expense_claims (8 categorieën + project/intern + receipt + status flow)
- employee_change_requests (address/iban requests pending admin approval)
- broadcasts (admin algemeen bericht)
- leave_balance_snapshots (Nmbrs-cache, source-of-truth blijft Nmbrs)
- bonus_config (jaarlijks: werkgeverslasten/indirect/werkbare-uren)
- care_package_ledger (artikel 21: jaarlijkse winstdeling + exit)

Migration 0010.

Plan 1.6 Task 2."
```

---

### Task 3: Sidebar-fix + nieuwe nav-items

**Files:**
- Modify: `apps/web/components/shell/sidebar.tsx`

- [ ] **Step 1: Update EMPLOYEE_LINKS**

Vervang in `sidebar.tsx`:
```tsx
import { Calendar, FileText, Wallet, Receipt, HeartPulse, Trophy, PieChart, FileBadge, User, Home, Clock } from "lucide-react";

const EMPLOYEE_LINKS: NavLink[] = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: Home },
  { href: "/uren" as Route, label: "Uren", icon: Clock },
  { href: "/verlof" as Route, label: "Verlof", icon: Calendar },
  { href: "/verzuim" as Route, label: "Verzuim", icon: HeartPulse },
  { href: "/declaraties" as Route, label: "Declaraties", icon: Receipt },
  { href: "/contract" as Route, label: "Contract", icon: FileText },
  { href: "/loonstroken" as Route, label: "Loonstroken", icon: Wallet },
  { href: "/bonus" as Route, label: "Bonus", icon: Trophy },
  { href: "/winstdeling" as Route, label: "Winstdeling", icon: PieChart },
  { href: "/werkgeversverklaring" as Route, label: "Werkgeversverklaring", icon: FileBadge },
  { href: "/profiel" as Route, label: "Profiel", icon: User },
];
```

- [ ] **Step 2: Update ADMIN_LINKS**

Voeg toe:
```ts
{ href: "/admin/verlof" as Route, label: "Verlof goedkeuren", icon: Calendar },
{ href: "/admin/verzuim" as Route, label: "Verzuim", icon: HeartPulse },
{ href: "/admin/declaraties" as Route, label: "Declaraties", icon: Receipt },
{ href: "/admin/bonus" as Route, label: "Bonus-beheer", icon: Trophy },
{ href: "/admin/broadcasts" as Route, label: "Berichten", icon: Megaphone },
```

(Plaats ze logisch tussen bestaande items.)

- [ ] **Step 3: Verifieer typecheck (sommige routes bestaan nog niet — verwacht TS-failures)**

Routes worden in latere tasks aangemaakt. Voor nu: sidebar werkt visueel maar de niet-bestaande routes geven 404. Dit is bewust: elke chapter introduceert routes en eindigt met sidebar-link werkend.

- [ ] **Step 4: Tijdelijke placeholder-pagina's voor employee-routes**

Maak `apps/web/app/(authed)/_placeholder.tsx`:
```tsx
export function PlaceholderPage({ feature }: { feature: string }) {
  return (
    <div className="rounded-xl p-12 text-center" style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-lift)" }}>
      <h1 className="font-display mb-2" style={{ fontSize: "1.6rem", color: "var(--fg-primary)" }}>{feature}</h1>
      <p style={{ color: "var(--fg-tertiary)" }}>Deze pagina wordt opgebouwd in Fase 1.6 — kom binnenkort terug.</p>
    </div>
  );
}
```

Maak placeholder-pagina's voor alle nieuwe employee-routes (allemaal renderen `<PlaceholderPage feature="..." />`):
- `verlof/page.tsx`, `verzuim/page.tsx`, `declaraties/page.tsx`, `contract/page.tsx`, `loonstroken/page.tsx`, `bonus/page.tsx`, `winstdeling/page.tsx`, `werkgeversverklaring/page.tsx`, `profiel/page.tsx`.

(Same voor admin-routes als simple TODO-page.)

- [ ] **Step 5: Verify build + commit**

```bash
pnpm -F @casella/web build
git add apps/web/components/shell/sidebar.tsx apps/web/app/\(authed\)/ apps/web/app/\(admin\)/admin/
git commit -m "fix(shell): sidebar nav voor employee + admin routes (1.6 fundament)

EMPLOYEE_LINKS uitgebreid van 5 naar 11 routes (incl. de 3 dode links
van vóór 1.6: /verlof /contract /loonstroken zijn nu placeholder-pagina's,
geen 404 meer).

ADMIN_LINKS uitgebreid met /admin/verlof, /admin/verzuim,
/admin/declaraties, /admin/bonus, /admin/broadcasts.

Placeholder-pagina's (PlaceholderPage component) tonen 'wordt opgebouwd
in Fase 1.6'-banner. Vervangen route-voor-route door echte UI in
volgende tasks.

Plan 1.6 Task 3."
```

---

### Task 4: Email-notificatie-prefs helper + 16 event-types

**Files:**
- Create: `apps/web/lib/notifications/types.ts`
- Create: `apps/web/lib/notifications/preferences.ts`
- Create: `apps/web/lib/notifications/enqueue.ts`
- Test: `apps/web/lib/notifications/__tests__/enqueue.test.ts`

- [ ] **Step 1: Definieer event-types**

`apps/web/lib/notifications/types.ts`:
```ts
export const EMPLOYEE_NOTIFICATION_TYPES = [
  "leave.approved", "leave.rejected",
  "expense.approved", "expense.rejected",
  "hours.rejected", "hours.approved",
  "statement.ready", "payslip.available",
  "contract.uploaded", "bonus.paid",
  "address.change.approved", "iban.change.approved",
  "vacation.balance.low", "hours.missing.reminder", "vacation.unused.year-end",
  "broadcast.general",
] as const;
export type EmployeeNotificationType = typeof EMPLOYEE_NOTIFICATION_TYPES[number];

export const ADMIN_NOTIFICATION_TYPES = [
  "leave.submitted", "sick.submitted", "expense.submitted",
  "address.change.requested", "iban.change.requested",
  "termination.upcoming",
] as const;
export type AdminNotificationType = typeof ADMIN_NOTIFICATION_TYPES[number];

export const EMAILABLE_EMPLOYEE_TYPES: ReadonlySet<EmployeeNotificationType> = new Set([
  "leave.approved", "leave.rejected", "expense.approved", "expense.rejected",
  "hours.rejected", "hours.approved", "statement.ready", "payslip.available",
  "contract.uploaded", "bonus.paid", "address.change.approved", "iban.change.approved",
  "vacation.balance.low", "hours.missing.reminder", "vacation.unused.year-end",
  "broadcast.general",
]);
```

- [ ] **Step 2: Preferences helper**

`apps/web/lib/notifications/preferences.ts`:
```ts
import "server-only";
import { getDb, schema, eq } from "@casella/db";
import type { EmployeeNotificationType } from "./types";

export async function shouldSendEmail(
  employeeId: string,
  type: EmployeeNotificationType,
): Promise<boolean> {
  const db = getDb();
  const [emp] = await db
    .select({ prefs: schema.employees.emailNotificationPreferences })
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId));
  if (!emp) return false;
  const prefs = (emp.prefs ?? {}) as Record<string, boolean>;
  return prefs[type] !== false; // default: ON unless explicitly false
}

export const DEFAULT_EMAIL_PREFS: Record<EmployeeNotificationType, boolean> = {
  "leave.approved": true, "leave.rejected": true,
  "expense.approved": true, "expense.rejected": true,
  "hours.rejected": true, "hours.approved": false, // low-noise default
  "statement.ready": true, "payslip.available": true,
  "contract.uploaded": true, "bonus.paid": true,
  "address.change.approved": true, "iban.change.approved": true,
  "vacation.balance.low": true, "hours.missing.reminder": true, "vacation.unused.year-end": true,
  "broadcast.general": true,
};
```

- [ ] **Step 3: Enqueue helper (in-app + email)**

`apps/web/lib/notifications/enqueue.ts`:
```ts
import "server-only";
import { getDb, schema } from "@casella/db";
import { sendEmail } from "@casella/email";
import { shouldSendEmail } from "./preferences";
import type { EmployeeNotificationType, AdminNotificationType } from "./types";
import { EMAILABLE_EMPLOYEE_TYPES } from "./types";

interface EnqueueArgs {
  userId: string; // resolves to employee
  employeeId?: string;
  type: EmployeeNotificationType | AdminNotificationType;
  payload: Record<string, unknown>;
  emailRender?: () => { subject: string; text: string; html: string; to: string };
}

export async function enqueueNotification({ userId, employeeId, type, payload, emailRender }: EnqueueArgs): Promise<void> {
  const db = getDb();
  await db.insert(schema.notifications).values({
    userId,
    type,
    payloadJson: payload,
  });

  if (employeeId && emailRender && EMAILABLE_EMPLOYEE_TYPES.has(type as EmployeeNotificationType)) {
    const ok = await shouldSendEmail(employeeId, type as EmployeeNotificationType);
    if (!ok) return;
    const tpl = emailRender();
    try {
      await sendEmail(tpl);
    } catch (e) {
      console.error("notification email failed", { type, userId, error: e });
    }
  }
}
```

- [ ] **Step 4: Test (TDD-light)**

`apps/web/lib/notifications/__tests__/enqueue.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@casella/db", () => ({
  getDb: () => ({ insert: () => ({ values: vi.fn(async () => undefined) }) }),
  schema: { notifications: {}, employees: {} },
  eq: vi.fn(),
}));
vi.mock("@casella/email", () => ({ sendEmail: vi.fn(async () => undefined) }));
vi.mock("../preferences", () => ({
  shouldSendEmail: vi.fn(async () => true),
  DEFAULT_EMAIL_PREFS: {},
}));

import { enqueueNotification } from "../enqueue";
import { sendEmail } from "@casella/email";

describe("enqueueNotification", () => {
  it("calls sendEmail when emailable + employeeId + emailRender provided", async () => {
    await enqueueNotification({
      userId: "u1", employeeId: "e1",
      type: "leave.approved",
      payload: { leaveId: "l1" },
      emailRender: () => ({ to: "x@y.com", subject: "S", text: "T", html: "<p>T</p>" }),
    });
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("skips email when no emailRender", async () => {
    vi.clearAllMocks();
    await enqueueNotification({ userId: "u1", type: "leave.approved", payload: {} });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
```

Run: `pnpm -F @casella/web test`. Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/notifications/
git commit -m "feat(notifications): event-types + preferences + enqueue helper (1.6 fundament)

16 employee event-types + 6 admin event-types als string-enums.
DEFAULT_EMAIL_PREFS: alles ON behalve hours.approved (low-noise default).
enqueueNotification: insert in-app + conditional email als emailable +
employee-prefs ON.

Plan 1.6 Task 4."
```

---

### Task 5: Email template skeleton

**Files:**
- Create: `packages/email/src/templates/_skeleton.ts`
- Modify: `packages/email/src/index.ts`

- [ ] **Step 1: Schrijf skeleton**

`packages/email/src/templates/_skeleton.ts`:
```ts
export interface SkeletonInput {
  to: string;
  recipientName: string;
  appUrl: string;
  ctaPath: string; // e.g. "/verlof"
}

export interface SkeletonOutput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Genereert een minimale email-body. Definitieve copy + HTML-vormgeving komt
 * in addendum-document `2026-XX-XX-casella-email-templates.md` na initial
 * implementatie. Voor de huidige iteratie: dynamische velden + link.
 */
export function skeletonEmail(
  subject: string,
  body: string,
  ctaLabel: string,
  input: SkeletonInput,
): SkeletonOutput {
  const link = `${input.appUrl}${input.ctaPath}`;
  return {
    to: input.to,
    subject,
    text: `Hoi ${input.recipientName},

${body}

${ctaLabel}: ${link}

— Casella`,
    html: `<p>Hoi ${input.recipientName},</p>
<p>${body}</p>
<p><a href="${link}">${ctaLabel} &rarr;</a></p>
<p style="color:#888;font-size:12px;">Casella</p>`,
  };
}
```

- [ ] **Step 2: Re-export**

In `packages/email/src/index.ts`:
```ts
export { skeletonEmail, type SkeletonInput, type SkeletonOutput } from "./templates/_skeleton";
```

- [ ] **Step 3: Commit**

```bash
git add packages/email/src/templates/_skeleton.ts packages/email/src/index.ts
git commit -m "feat(email): skeleton template voor 14 nieuwe email-flows (1.6 fundament)

Placeholder-template voor de 14 niet-bestaande email-flows uit 1.6.
Levert een functioneel-correcte body (subject + greeting + body + CTA-link)
zodat trigger-infrastructuur kan worden gebouwd. Definitieve copy + HTML-
branding komt in addendum-document na initial implementatie.

Plan 1.6 Task 5."
```

---

### Task 6: Sanity-check Chapter A — fundament is gelegd

**Files:**
- Modify: `docs/sanity-check-log.md`

- [ ] **Step 1: Run de 6 sanity-commands**

```bash
git status
git log --oneline main..HEAD | wc -l
pnpm -r typecheck
pnpm -r test
pnpm -F @casella/web build
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "\dt"
```

Verwacht: clean tree, ~5 commits ahead, alle gates groen, 7 nieuwe tabellen aanwezig + employees/projects/bonus_ledger/statements uitgebreid.

- [ ] **Step 2: Append sanity-log entry**

```markdown
| 2026-04-XX | <SHA> | After Chapter A (Fundament, Plan 1.6) | 🟢 GREEN | 5 commits ahead; 7 nieuwe tabellen + 5 schema-uitbreidingen; sidebar-fix met placeholder-pagina's voorkomt 404s; notification + email-skeleton gewired. Klaar voor Chapter B (Verlof + Verzuim). |
```

- [ ] **Step 3: Commit**

```bash
git add docs/sanity-check-log.md
git commit -m "docs: sanity-check Chapter A (Fundament 1.6) — green"
```

---

## Chapter B — Verlof + Verzuim

### Task 7: Verlof types config + balance-resolver

**Files:**
- Create: `apps/web/lib/leave/types.ts`
- Create: `apps/web/lib/leave/balance.ts`
- Create: `apps/web/lib/leave/validation.ts`
- Test: `apps/web/lib/leave/__tests__/validation.test.ts`

- [ ] **Step 1: Types-config**

`apps/web/lib/leave/types.ts`:
```ts
export type LeaveTypeKey =
  | "vacation_legal"        // wettelijk
  | "vacation_extra"        // bovenwettelijk
  | "pregnancy"             // zwangerschap
  | "maternity"             // bevalling
  | "birth_partner"         // geboorteverlof partner
  | "additional_birth"      // aanvullend geboorteverlof
  | "adoption"              // adoptie/pleegzorg
  | "parental_paid"         // ouderschap betaald (9 wkn)
  | "parental_unpaid"       // ouderschap onbetaald (17 wkn)
  | "short_care"            // kortdurend zorgverlof
  | "long_care"             // langdurend zorgverlof
  | "calamity"              // calamiteitenverlof
  | "special"               // bijzonder verlof
  | "unpaid";               // onbetaald

export interface LeaveTypeConfig {
  key: LeaveTypeKey;
  label: string;
  description: string;        // wettelijke basis + uitleg
  approvalMode: "self" | "admin";
  hasBalance: boolean;        // saldo bijhouden?
  attachmentRequired: boolean; // bv. zwangerschapsverklaring
  customFields: string[];     // ids van extra form-velden
}

export const LEAVE_TYPES: Record<LeaveTypeKey, LeaveTypeConfig> = {
  vacation_legal: { key: "vacation_legal", label: "Vakantieverlof", description: "Wettelijke vakantie (art. 7:634 BW). 4× weekuren per jaar (Ascentra: 25 dagen/jaar totaal incl. bovenwettelijk).", approvalMode: "admin", hasBalance: true, attachmentRequired: false, customFields: [] },
  vacation_extra: { key: "vacation_extra", label: "Vakantieverlof (extra)", description: "Bovenwettelijke vakantiedagen volgens contract.", approvalMode: "admin", hasBalance: true, attachmentRequired: false, customFields: [] },
  pregnancy: { key: "pregnancy", label: "Zwangerschapsverlof", description: "Wazo. 4-6 wkn vóór uitgerekende datum (8-10 bij meerling). 100% UWV.", approvalMode: "self", hasBalance: false, attachmentRequired: true, customFields: ["expectedBirthDate"] },
  maternity: { key: "maternity", label: "Bevallingsverlof", description: "Wazo. 10-12 wkn na bevalling (+10 bij ziekenhuisopname kind). 100% UWV.", approvalMode: "self", hasBalance: false, attachmentRequired: true, customFields: ["birthDate"] },
  birth_partner: { key: "birth_partner", label: "Geboorteverlof / partnerverlof", description: "Wazo (Wieg). 1 wk eenmalig binnen 4 wkn na geboorte. 100% werkgever.", approvalMode: "self", hasBalance: false, attachmentRequired: false, customFields: ["birthDate"] },
  additional_birth: { key: "additional_birth", label: "Aanvullend geboorteverlof", description: "Wazo. 5 wkn binnen 6 mnd na geboorte. 70% UWV.", approvalMode: "admin", hasBalance: false, attachmentRequired: false, customFields: ["birthDate", "uptakePattern"] },
  adoption: { key: "adoption", label: "Adoptie- / pleegzorgverlof", description: "Wazo. 6 wkn bij aankomst kind. 100% UWV.", approvalMode: "self", hasBalance: false, attachmentRequired: true, customFields: ["arrivalDate"] },
  parental_paid: { key: "parental_paid", label: "Ouderschapsverlof (betaald)", description: "Wazo. Eerste levensjaar van kind: 9 wkn × weekuren. 70% UWV.", approvalMode: "admin", hasBalance: true, attachmentRequired: false, customFields: ["childRef", "uptakePattern"] },
  parental_unpaid: { key: "parental_unpaid", label: "Ouderschapsverlof (onbetaald)", description: "Wazo. Tot kind 8 jaar is: 17 wkn (totaal 26 incl. betaald deel). Onbetaald.", approvalMode: "admin", hasBalance: true, attachmentRequired: false, customFields: ["childRef", "uptakePattern"] },
  short_care: { key: "short_care", label: "Kortdurend zorgverlof", description: "Wazo. Onverwachte zorg voor zieke. Max 2× weekuren/jaar. 70% werkgever.", approvalMode: "self", hasBalance: true, attachmentRequired: false, customFields: ["careRelation", "careReason"] },
  long_care: { key: "long_care", label: "Langdurend zorgverlof", description: "Wazo. Structurele zorg voor levensbedreigende ziekte. Max 6× weekuren/12mnd. Onbetaald.", approvalMode: "admin", hasBalance: true, attachmentRequired: false, customFields: ["careRelation", "careReason"] },
  calamity: { key: "calamity", label: "Calamiteitenverlof", description: "Wazo. Onverwachte situaties (loodgieter, doktersbezoek nood, partner-bevalling, overlijden directe familie). Zo lang als nodig. 100% werkgever.", approvalMode: "self", hasBalance: false, attachmentRequired: false, customFields: ["calamityCategory"] },
  special: { key: "special", label: "Bijzonder verlof", description: "Per Ascentra-beleid: huwelijk, verhuizing, jubileum. 100% werkgever (typisch 1-2 dagen/event).", approvalMode: "admin", hasBalance: false, attachmentRequired: false, customFields: ["occasion"] },
  unpaid: { key: "unpaid", label: "Onbetaald verlof", description: "Lange reis, studie, sabbatical. Onderhandelbaar. Onbetaald — let op impact pensioen/vakantie-opbouw.", approvalMode: "admin", hasBalance: false, attachmentRequired: false, customFields: ["unpaidAcknowledgment"] },
};
```

- [ ] **Step 2: Balance-resolver (Nmbrs cache + fallback)**

`apps/web/lib/leave/balance.ts`:
```ts
import "server-only";
import { getDb, schema, and, eq, desc } from "@casella/db";
import type { LeaveTypeKey } from "./types";

export interface LeaveBalance {
  type: LeaveTypeKey;
  hoursRemaining: number;
  hoursTotal: number;
  expiresAt: string | null;
  syncedAt: string | null;
}

export async function getLeaveBalances(employeeId: string, year = new Date().getFullYear()): Promise<LeaveBalance[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.leaveBalanceSnapshots)
    .where(and(
      eq(schema.leaveBalanceSnapshots.employeeId, employeeId),
      eq(schema.leaveBalanceSnapshots.year, year),
    ))
    .orderBy(desc(schema.leaveBalanceSnapshots.syncedAt));
  return rows.map((r) => ({
    type: r.leaveType as LeaveTypeKey,
    hoursRemaining: Number(r.hoursRemaining),
    hoursTotal: Number(r.hoursTotal),
    expiresAt: r.expiresAt,
    syncedAt: r.syncedAt.toISOString(),
  }));
}

// Default Ascentra: 25 dagen × 8u = 200u / jaar voor vakantie als geen Nmbrs-data.
// Voor wettelijke saldi (kortdurend zorg/etc.): afgeleid uit weekuren.
export function fallbackBalance(type: LeaveTypeKey, weeklyHours: number): { hoursTotal: number; hoursRemaining: number } | null {
  switch (type) {
    case "vacation_legal":
    case "vacation_extra":
      return { hoursTotal: 25 * 8, hoursRemaining: 25 * 8 }; // gecombineerd; Nmbrs splitst wettelijk/bovenwettelijk
    case "short_care":
      return { hoursTotal: weeklyHours * 2, hoursRemaining: weeklyHours * 2 };
    case "long_care":
      return { hoursTotal: weeklyHours * 6, hoursRemaining: weeklyHours * 6 };
    case "parental_paid":
      return { hoursTotal: weeklyHours * 9, hoursRemaining: weeklyHours * 9 };
    case "parental_unpaid":
      return { hoursTotal: weeklyHours * 17, hoursRemaining: weeklyHours * 17 };
    default:
      return null; // event-types zonder saldo
  }
}
```

- [ ] **Step 3: Validation helpers**

`apps/web/lib/leave/validation.ts`:
```ts
import { z } from "zod";
import { dateIsoSchema, uuidSchema } from "@casella/types";
import type { LeaveTypeKey } from "./types";
import { LEAVE_TYPES } from "./types";

export const leaveSubmitSchema = z.object({
  type: z.string(),
  startDate: dateIsoSchema,
  endDate: dateIsoSchema.optional().nullable(),
  hours: z.number().min(1).max(40 * 26), // sanity-cap 26 weken full-time
  notes: z.string().max(500).optional().nullable(),
  customPayload: z.record(z.unknown()).optional(),
}).refine((d) => d.type in LEAVE_TYPES, { message: "Onbekend verloftype", path: ["type"] });

export type LeaveSubmitInput = z.infer<typeof leaveSubmitSchema>;
```

- [ ] **Step 4: TDD test — type config consistency**

`apps/web/lib/leave/__tests__/validation.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { LEAVE_TYPES } from "../types";
import { leaveSubmitSchema } from "../validation";

describe("LEAVE_TYPES", () => {
  it("heeft 14 types", () => {
    expect(Object.keys(LEAVE_TYPES).length).toBe(14);
  });
  it("self-approve types: pregnancy/maternity/birth_partner/adoption/short_care/calamity", () => {
    const selfApprove = Object.values(LEAVE_TYPES).filter((t) => t.approvalMode === "self").map((t) => t.key);
    expect(selfApprove.sort()).toEqual(["adoption","birth_partner","calamity","maternity","pregnancy","short_care"]);
  });
  it("admin-approval types: vacation_legal/vacation_extra/additional_birth/parental_paid/parental_unpaid/long_care/special/unpaid", () => {
    const admin = Object.values(LEAVE_TYPES).filter((t) => t.approvalMode === "admin").map((t) => t.key);
    expect(admin.sort()).toEqual(["additional_birth","long_care","parental_paid","parental_unpaid","special","unpaid","vacation_extra","vacation_legal"]);
  });
});

describe("leaveSubmitSchema", () => {
  it("rejects unknown type", () => {
    const r = leaveSubmitSchema.safeParse({ type: "foo", startDate: "2026-05-01", hours: 8 });
    expect(r.success).toBe(false);
  });
  it("accepts valid vacation submit", () => {
    const r = leaveSubmitSchema.safeParse({ type: "vacation_legal", startDate: "2026-05-01", hours: 16 });
    expect(r.success).toBe(true);
  });
});
```

Run: `pnpm -F @casella/web test apps/web/lib/leave`. Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/leave/
git commit -m "feat(leave): types-config + balance-resolver + validation (1.6 verlof base)

LEAVE_TYPES: 14 types met label/description/approvalMode/hasBalance/
attachmentRequired/customFields per type. Self-approve = 6 (wettelijk-
noodzakelijk), admin-approval = 8.

balance.ts: getLeaveBalances leest leave_balance_snapshots cache;
fallbackBalance berekent default uit weekuren als geen Nmbrs-sync.

validation.ts: zod schema voor submit-form.

Plan 1.6 Task 7."
```

---

### Task 8: Verlof submit + cancel API + 6 self-approve direct + email enqueue

**Files:**
- Create: `apps/web/app/api/verlof/submit/route.ts`
- Create: `apps/web/app/api/verlof/cancel/route.ts`
- Create: `packages/email/src/templates/leave-status.ts` (skeleton-based)
- Modify: `apps/web/lib/leave/types.ts` (export e-mail template ref)

- [ ] **Step 1: Email-template voor verlof-status**

`packages/email/src/templates/leave-status.ts`:
```ts
import { skeletonEmail, type SkeletonInput } from "./_skeleton";

export function leaveSubmittedAdminEmail(input: SkeletonInput & { employeeName: string; leaveType: string; startDate: string }) {
  return skeletonEmail(
    `Nieuwe verlofaanvraag: ${input.employeeName}`,
    `${input.employeeName} heeft een ${input.leaveType}-aanvraag ingediend voor ${input.startDate}.`,
    "Bekijk in admin",
    input,
  );
}

export function leaveDecidedEmployeeEmail(input: SkeletonInput & { decision: "goedgekeurd" | "afgewezen"; leaveType: string; reason?: string }) {
  return skeletonEmail(
    `Je ${input.leaveType}-aanvraag is ${input.decision}`,
    input.decision === "goedgekeurd"
      ? `Je verlof is goedgekeurd en bijgewerkt in Nmbrs.`
      : `Je aanvraag is afgewezen. Reden: ${input.reason ?? "geen toelichting"}.`,
    "Bekijk in Casella",
    input,
  );
}
```

Re-export in `packages/email/src/index.ts`.

- [ ] **Step 2: Submit-route**

`apps/web/app/api/verlof/submit/route.ts`:
```ts
import { getDb, schema, auditMutation } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { leaveSubmitSchema } from "@/lib/leave/validation";
import { LEAVE_TYPES } from "@/lib/leave/types";
import { getCurrentEmployee } from "@/lib/current-employee";
import { enqueueNotification } from "@/lib/notifications/enqueue";
import { leaveSubmittedAdminEmail } from "@casella/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const employee = await getCurrentEmployee();
  if (!employee) return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json(apiError("invalid_json", "Ongeldig JSON-formaat"), { status: 400 }); }

  let input;
  try { input = leaveSubmitSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) return NextResponse.json(apiError("validation_error", "Ongeldige invoer", err.issues), { status: 400 });
    throw err;
  }

  const cfg = LEAVE_TYPES[input.type as keyof typeof LEAVE_TYPES];
  const initialStatus = cfg.approvalMode === "self" ? "approved" : "pending";

  const db = getDb();
  const created = await db.transaction(async (tx) => {
    const [row] = await tx.insert(schema.leaveRequests).values({
      employeeId: employee.id,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      hours: String(input.hours),
      status: initialStatus,
      notes: input.notes,
      customPayload: input.customPayload,
      submittedAt: new Date(),
      ...(initialStatus === "approved" ? { approvedAt: new Date() } : {}),
    }).returning();
    await auditMutation(tx, {
      actorUserId: employee.userId,
      action: `leave.${initialStatus === "approved" ? "self_approved" : "submitted"}`,
      resourceType: "leave_requests",
      resourceId: row!.id,
      changesJson: { input },
    });
    return row!;
  });

  // Notify admin (if pending) — admin gets email + in-app
  if (initialStatus === "pending") {
    const admins = await db.select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users).where(eq(schema.users.role, "admin"));
    for (const a of admins) {
      await enqueueNotification({
        userId: a.id, type: "leave.submitted",
        payload: { leaveId: created.id, employeeName: employee.displayName, leaveType: cfg.label, startDate: input.startDate },
        emailRender: () => leaveSubmittedAdminEmail({
          to: a.email, recipientName: a.email.split("@")[0],
          appUrl: process.env.AUTH_URL ?? "http://localhost:3000",
          ctaPath: "/admin/verlof",
          employeeName: employee.displayName, leaveType: cfg.label, startDate: input.startDate,
        }),
      });
    }
  }

  return NextResponse.json({ id: created.id, status: initialStatus });
}
```

(Note: `eq` import from `@casella/db`. `getCurrentEmployee` returnt `{id, userId, displayName}`.)

- [ ] **Step 3: Cancel-route**

`apps/web/app/api/verlof/cancel/route.ts`: PATCH-style, ontvangt `{ id }`, controleert ownership, zet status=`cancelled`, audit. Bij approved-state: zet ook saldo terug via Nmbrs-revert (TODO comment voor Nmbrs-revoke endpoint).

```ts
import { getDb, schema, auditMutation, eq, and } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentEmployee } from "@/lib/current-employee";

const cancelSchema = z.object({ id: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const employee = await getCurrentEmployee();
  if (!employee) return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError("validation_error", "Ongeldig"), { status: 400 });

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(schema.leaveRequests).where(and(
      eq(schema.leaveRequests.id, parsed.data.id),
      eq(schema.leaveRequests.employeeId, employee.id),
    ));
    if (!before) return { notFound: true } as const;
    if (before.status === "cancelled") return { ok: true } as const;

    await tx.update(schema.leaveRequests).set({ status: "cancelled" }).where(eq(schema.leaveRequests.id, parsed.data.id));
    await auditMutation(tx, {
      actorUserId: employee.userId,
      action: "leave.cancelled",
      resourceType: "leave_requests",
      resourceId: parsed.data.id,
      changesJson: { before },
    });
    // TODO: revert Nmbrs absence-record voor approved-cancellations
    return { ok: true } as const;
  });

  if ("notFound" in result) return NextResponse.json(apiError("not_found", "Aanvraag niet gevonden"), { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verify + commit**

```bash
pnpm -F @casella/web typecheck
pnpm -F @casella/web lint
git add apps/web/app/api/verlof/ packages/email/src/
git commit -m "feat(leave): submit + cancel API + email-templates (1.6 Chapter B)

Submit: per-type self-approve (6) of admin-pending (8). Auto admin-email
bij pending. Audit-action 'leave.self_approved' of 'leave.submitted'.

Cancel: alleen eigen aanvragen. TODO Nmbrs-revert voor approved-state.

Plan 1.6 Task 8."
```

---

### Task 9: Admin verlof-approve + reject API

**Files:**
- Create: `apps/web/app/api/admin/verlof/[id]/approve/route.ts`
- Create: `apps/web/app/api/admin/verlof/[id]/reject/route.ts`

- [ ] **Step 1: Approve**

`approve/route.ts`: POST, requireAdmin (zelfde patroon als employees PATCH), zet status='approved', approvedAt=now, approvedBy=admin.id. Audit `leave.approved`. Push naar Nmbrs (`pushLeaveRequest` van `@casella/nmbrs` — implementatie volgt in Task 10). Email naar employee via `leaveDecidedEmployeeEmail`.

```ts
import { getDb, schema, auditMutation, eq } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";
import { leaveDecidedEmployeeEmail } from "@casella/email";
import { LEAVE_TYPES, type LeaveTypeKey } from "@/lib/leave/types";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  if (admin.role !== "admin") return NextResponse.json(apiError("forbidden", "Geen toegang"), { status: 403 });

  const { id } = await params;
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.id, id));
    if (!before) return { notFound: true } as const;
    if (before.status !== "pending") return { invalidState: true } as const;
    await tx.update(schema.leaveRequests).set({
      status: "approved", approvedAt: new Date(), approvedBy: admin.id,
    }).where(eq(schema.leaveRequests.id, id));
    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "leave.approved",
      resourceType: "leave_requests",
      resourceId: id,
      changesJson: { before },
    });
    return { ok: true, leaveRequest: before } as const;
  });

  if ("notFound" in result) return NextResponse.json(apiError("not_found", "Niet gevonden"), { status: 404 });
  if ("invalidState" in result) return NextResponse.json(apiError("invalid_state", "Niet meer pending"), { status: 409 });

  // Notify employee + push naar Nmbrs (TODO: nmbrs.pushLeaveRequest in Task 10 wiring)
  const lr = result.leaveRequest;
  const [empUser] = await db.select({ id: schema.users.id, email: schema.users.email, displayName: schema.users.displayName })
    .from(schema.employees).innerJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(eq(schema.employees.id, lr.employeeId));
  if (empUser) {
    const cfg = LEAVE_TYPES[lr.type as LeaveTypeKey];
    await enqueueNotification({
      userId: empUser.id, employeeId: lr.employeeId, type: "leave.approved",
      payload: { leaveId: id, leaveType: cfg.label },
      emailRender: () => leaveDecidedEmployeeEmail({
        to: empUser.email, recipientName: empUser.displayName.split(" ")[0] ?? "collega",
        appUrl: process.env.AUTH_URL ?? "http://localhost:3000",
        ctaPath: "/verlof",
        decision: "goedgekeurd", leaveType: cfg.label,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Reject**

`reject/route.ts`: zelfde structuur, body `{ reason: string }` (verplicht), status='rejected' + rejectionReason. Email met decision='afgewezen' + reason.

- [ ] **Step 3: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint
git add apps/web/app/api/admin/verlof/
git commit -m "feat(leave): admin approve/reject API met audit + email (1.6 Chapter B)

Approve: requireAdmin, transactioneel update + audit + employee-email.
Reject: zelfde + verplicht reason in body.

Plan 1.6 Task 9."
```

---

### Task 10: Nmbrs leave-sync wiring (push + balance-pull)

**Files:**
- Modify: `packages/nmbrs/src/leave.ts`
- Create: `apps/web/lib/nmbrs/leave-sync.ts`
- Modify: `apps/web/app/api/admin/verlof/[id]/approve/route.ts` (Nmbrs-push call inhaken)

- [ ] **Step 1: Implement pushLeaveRequest**

In `packages/nmbrs/src/leave.ts` (was stub uit 1.3) — werk uit naar een functionele SOAP-call met schema-validation. Body-element naam `Leave_Insert`. Use `soapCall` helper.

(Stub blijft acceptabel als Nmbrs-test-creds ontbreken; functie geeft `NmbrsError("missing_credentials")` graceful terug.)

- [ ] **Step 2: Schrijf leave-sync helper**

`apps/web/lib/nmbrs/leave-sync.ts`:
```ts
import "server-only";
import { getDb, schema, eq } from "@casella/db";
import { pushLeaveRequest, getCredentialsFromEnv, NmbrsError } from "@casella/nmbrs";

export async function pushLeaveToNmbrs(leaveRequestId: string): Promise<{ ok: true } | { skipped: string }> {
  const db = getDb();
  const [row] = await db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.id, leaveRequestId));
  if (!row || row.status !== "approved") return { skipped: "not_approved" };

  const [emp] = await db.select({ nmbrsId: schema.employees.nmbrsEmployeeId }).from(schema.employees).where(eq(schema.employees.id, row.employeeId));
  if (!emp?.nmbrsId) return { skipped: "no_nmbrs_id" };

  try {
    getCredentialsFromEnv();
  } catch (e) {
    if (e instanceof NmbrsError && e.code === "missing_credentials") return { skipped: "missing_credentials" };
    throw e;
  }

  const leaveTypeMap: Record<string, "vacation" | "sick" | "special"> = {
    vacation_legal: "vacation", vacation_extra: "vacation",
    short_care: "special", long_care: "special",
    calamity: "special", special: "special",
    // overige types: skip — ze worden lokaal getrackt
  };
  const mapped = leaveTypeMap[row.type];
  if (!mapped) return { skipped: "no_nmbrs_mapping" };

  await pushLeaveRequest({
    nmbrsEmployeeId: emp.nmbrsId,
    startDate: row.startDate,
    endDate: row.endDate ?? row.startDate,
    hours: Number(row.hours),
    leaveType: mapped,
  });
  return { ok: true };
}
```

- [ ] **Step 3: Hook in approve-route**

In `apps/web/app/api/admin/verlof/[id]/approve/route.ts`, na de successful update + email:
```ts
import { pushLeaveToNmbrs } from "@/lib/nmbrs/leave-sync";
// ...
const syncResult = await pushLeaveToNmbrs(id);
if ("skipped" in syncResult) {
  console.log(`[leave.approve] Nmbrs sync skipped: ${syncResult.skipped}`, { leaveId: id });
}
```

- [ ] **Step 4: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add packages/nmbrs/src/leave.ts apps/web/lib/nmbrs/leave-sync.ts apps/web/app/api/admin/verlof/
git commit -m "feat(leave): Nmbrs sync bij approve (1.6 Chapter B)

@casella/nmbrs.pushLeaveRequest: SOAP Leave_Insert met type-mapping.
lib/nmbrs/leave-sync.pushLeaveToNmbrs: idempotent helper, graceful skip
bij missing_credentials of niet-mappable type.

Approve-route hook: log-skip ipv hard-fail (best-effort).

Plan 1.6 Task 10."
```

---

### Task 11: Verlof employee UI — list + new-request form

**Files:**
- Modify: `apps/web/app/(authed)/verlof/page.tsx` (was placeholder)
- Create: `apps/web/features/leave/employee/leave-list.tsx`
- Create: `apps/web/features/leave/employee/leave-form.tsx`
- Create: `apps/web/features/leave/employee/balance-cards.tsx`
- Create: `apps/web/features/leave/employee/type-selector.tsx`

- [ ] **Step 1: Server-fetch in page**

`apps/web/app/(authed)/verlof/page.tsx`:
```tsx
import { getCurrentEmployee } from "@/lib/current-employee";
import { redirect } from "next/navigation";
import { getDb, schema, eq, desc } from "@casella/db";
import { getLeaveBalances, fallbackBalance } from "@/lib/leave/balance";
import { LeaveList } from "@/features/leave/employee/leave-list";
import { LeaveBalanceCards } from "@/features/leave/employee/balance-cards";
import { LeaveForm } from "@/features/leave/employee/leave-form";
import { LEAVE_TYPES } from "@/lib/leave/types";

export const dynamic = "force-dynamic";

export default async function VerlofPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/onboarding-pending");

  const db = getDb();
  const [requests, balances, [empData]] = await Promise.all([
    db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.employeeId, employee.id))
      .orderBy(desc(schema.leaveRequests.submittedAt)).limit(50),
    getLeaveBalances(employee.id),
    db.select({ contractedHoursPerWeek: schema.employees.contractedHoursPerWeek })
      .from(schema.employees).where(eq(schema.employees.id, employee.id)),
  ]);

  const weeklyHours = empData?.contractedHoursPerWeek ?? 40;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display" style={{ fontSize: "1.6rem", color: "var(--fg-primary)" }}>Verlof</h1>
        <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
          Vraag verlof aan en bekijk je saldo. Saldi worden 's nachts gesynced uit Nmbrs.
        </p>
      </header>

      <LeaveBalanceCards balances={balances} weeklyHours={weeklyHours} />
      <LeaveForm types={LEAVE_TYPES} />
      <LeaveList requests={requests} />
    </div>
  );
}
```

- [ ] **Step 2: Balance cards**

`balance-cards.tsx` (server-component):
```tsx
import type { LeaveBalance } from "@/lib/leave/balance";
import type { LeaveTypeKey } from "@/lib/leave/types";
import { LEAVE_TYPES, type LeaveTypeConfig } from "@/lib/leave/types";

interface Props { balances: LeaveBalance[]; weeklyHours: number; }

const VISIBLE_TYPES: LeaveTypeKey[] = ["vacation_legal", "short_care", "long_care", "parental_paid"];

export function LeaveBalanceCards({ balances, weeklyHours }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {VISIBLE_TYPES.map((key) => {
        const cfg = LEAVE_TYPES[key];
        const b = balances.find((x) => x.type === key);
        const remaining = b?.hoursRemaining ?? 0;
        const total = b?.hoursTotal ?? 0;
        const pct = total > 0 ? (remaining / total) * 100 : 0;
        return (
          <div key={key} className="rounded-lg p-4" style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-card)" }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--fg-tertiary)" }}>{cfg.label}</div>
            <div className="mt-2 text-2xl font-medium" style={{ color: "var(--fg-primary)" }}>
              {remaining.toFixed(1)}<span className="text-sm font-normal" style={{ color: "var(--fg-tertiary)" }}> uur over</span>
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--fg-quaternary)" }}>
              van {total.toFixed(1)} uur ({Math.round(pct)}%)
              {b?.syncedAt && ` · synced ${new Date(b.syncedAt).toLocaleString("nl-NL")}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Type-selector + dynamic form**

`type-selector.tsx` (client): dropdown van alle 14 types met info-paneel onder selectie dat `LEAVE_TYPES[selected].description` toont.

`leave-form.tsx` (client): wraps type-selector + datum-velden + uren-input + custom-velden conditional op type. Submit naar `/api/verlof/submit` via fetch. Show toast bij success/error. Refresh router.

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LEAVE_TYPES, type LeaveTypeKey } from "@/lib/leave/types";

export function LeaveForm({ types }: { types: typeof LEAVE_TYPES }) {
  const router = useRouter();
  const [type, setType] = useState<LeaveTypeKey>("vacation_legal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState(8);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cfg = types[type];

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/verlof/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, startDate, endDate: endDate || null, hours, notes: notes || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const { status } = await res.json();
      toast.success(status === "approved" ? "Aanvraag direct goedgekeurd" : "Aanvraag ingediend — wacht op admin");
      setStartDate(""); setEndDate(""); setHours(8); setNotes("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aanvragen mislukt");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg p-6 space-y-4" style={{ border: "1px solid var(--border-subtle)", background: "var(--surface-card)" }}>
      <h2 className="text-lg font-medium" style={{ color: "var(--fg-primary)" }}>Nieuwe aanvraag</h2>
      <div>
        <label className="text-xs uppercase tracking-wide block mb-1" style={{ color: "var(--fg-tertiary)" }}>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as LeaveTypeKey)}
          className="w-full rounded border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border-subtle)", background: "var(--surface-base)", color: "var(--fg-primary)" }}>
          {Object.values(types).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <p className="mt-2 text-xs" style={{ color: "var(--fg-tertiary)" }}>{cfg.description}</p>
        <p className="mt-1 text-xs" style={{ color: "var(--fg-quaternary)" }}>
          {cfg.approvalMode === "self" ? "Direct doorgevoerd (wettelijk recht)" : "Vereist goedkeuring van admin"}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start" className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-base)" }} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
          placeholder="Eind (optioneel)" className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-base)" }} />
        <input type="number" min={1} max={208} value={hours} onChange={(e) => setHours(Number(e.target.value))}
          placeholder="Uren" className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-base)" }} />
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opmerking (optioneel)" rows={2}
        className="w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-base)" }} />
      <button type="button" onClick={submit} disabled={submitting || !startDate || hours < 1}
        className="rounded-md px-4 py-2 text-sm font-medium text-white"
        style={{ background: "var(--aurora-violet, #7b5cff)", opacity: submitting ? 0.6 : 1 }}>
        {submitting ? "Bezig…" : "Aanvragen"}
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Leave list — historie + cancel**

`leave-list.tsx` (client met cancel-button):
- Tabel/cards per request: type-label / datums / uren / status-badge / cancel-knop (alleen bij pending/approved). Click cancel → POST `/api/verlof/cancel` → router.refresh.

(Schrijf component in zelfde stijl als employee-uren-tabel, ~80 regels.)

- [ ] **Step 5: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/app/\(authed\)/verlof/ apps/web/features/leave/
git commit -m "feat(leave): employee /verlof UI — balance cards + form + history (1.6 Chapter B)

Page server-fetched: requests + balances + weeklyHours. Client components
voor interactieve form (type-selector + datums + uren + opmerking) en
historie-tabel met cancel-knop. AAA-bar styling (CSS-vars, geen Tailwind
utility colors).

Plan 1.6 Task 11."
```

---

### Task 12: Admin verlof-queue UI

**Files:**
- Modify: `apps/web/app/(admin)/admin/verlof/page.tsx` (was placeholder)
- Create: `apps/web/features/leave/admin/leave-queue.tsx`
- Create: `apps/web/features/leave/admin/approve-card.tsx` (kopieer pattern van apps/web/features/hours/admin/approval-card.tsx)

- [ ] **Step 1: Server-fetch + render**

```tsx
import { getDb, schema, eq, desc } from "@casella/db";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { LeaveQueue } from "@/features/leave/admin/leave-queue";
import { LEAVE_TYPES } from "@/lib/leave/types";

export default async function AdminVerlofPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const pending = await db
    .select({
      lr: schema.leaveRequests,
      employeeName: schema.users.displayName,
    })
    .from(schema.leaveRequests)
    .leftJoin(schema.employees, eq(schema.leaveRequests.employeeId, schema.employees.id))
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(eq(schema.leaveRequests.status, "pending"))
    .orderBy(desc(schema.leaveRequests.submittedAt));

  const items = pending.map((p) => ({
    id: p.lr.id,
    type: p.lr.type,
    typeLabel: LEAVE_TYPES[p.lr.type as keyof typeof LEAVE_TYPES]?.label ?? p.lr.type,
    startDate: p.lr.startDate,
    endDate: p.lr.endDate,
    hours: Number(p.lr.hours),
    notes: p.lr.notes,
    employeeName: p.employeeName ?? "Onbekend",
    submittedAt: p.lr.submittedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-display" style={{ fontSize: "1.6rem", color: "var(--fg-primary)" }}>Verlof goedkeuren</h1>
      <LeaveQueue items={items} />
    </div>
  );
}
```

- [ ] **Step 2: Queue + approve-card components**

`leave-queue.tsx` (client): list of `<ApproveCard>`. ApproveCard heeft Goedkeuren + Afwijzen buttons. Reject opent dialog voor reason. On click → POST naar respectievelijke endpoints → router.refresh + toast.

(Schrijf in dezelfde stijl als bestaande `features/hours/admin/approval-card.tsx`. ~120 regels combined.)

- [ ] **Step 3: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/app/\(admin\)/admin/verlof/ apps/web/features/leave/admin/
git commit -m "feat(leave): admin /admin/verlof queue + approve/reject cards (1.6 Chapter B)

Server-fetch pending leave-requests met employee-name JOIN. Client cards
met Goedkeuren-button (instant) + Afwijzen-button (dialog voor reason).

Plan 1.6 Task 12."
```

---

### Task 13: Verzuim — schema-extension + submit/recover API + UI (employee + admin read-only)

**Files:**
- Modify: `packages/db/src/schema/leave.ts` (extend leaveTypeEnum met "sick"-handling als nog niet aanwezig; voeg `availabilityStatus` veld toe)
- Create: `apps/web/app/api/verzuim/submit/route.ts`
- Create: `apps/web/app/api/verzuim/recover/route.ts`
- Modify: `apps/web/app/(authed)/verzuim/page.tsx` (was placeholder)
- Modify: `apps/web/app/(admin)/admin/verzuim/page.tsx` (was placeholder)
- Create: `apps/web/features/sick/employee/sick-form.tsx`
- Create: `apps/web/features/sick/admin/sick-overview.tsx`
- Create: `packages/email/src/templates/sick.ts`

- [ ] **Step 1: Schema (sick als sub-type)**

In `leave.ts` schema: voeg toe `availabilityStatus` veld op `leave_requests` (nullable text). Generate + migrate. Migration `0011_sick_availability.sql`.

- [ ] **Step 2: Submit-route**

`/api/verzuim/submit/route.ts`: POST body `{ startDate, expectedDurationDays?, availabilityStatus? }`. Insert `leave_requests` met `type='sick'`, `status='approved'` (self-approve), `submittedAt=now`, `approvedAt=now`. Audit `sick.submitted`. Email naar admin via `sickSubmittedAdminEmail`. Géén medische details velden.

- [ ] **Step 3: Recover-route**

`/api/verzuim/recover/route.ts`: POST body `{ id }`. Update `endDate=today` op active sick-record (waar `endDate IS NULL` en type='sick' en eigen). Audit `sick.recovered`. Push einddatum naar Nmbrs.

- [ ] **Step 4: Sick email template**

`packages/email/src/templates/sick.ts`:
```ts
import { skeletonEmail, type SkeletonInput } from "./_skeleton";
export function sickSubmittedAdminEmail(input: SkeletonInput & { employeeName: string; startDate: string; expectedDays?: number }) {
  return skeletonEmail(
    `Ziekmelding: ${input.employeeName}`,
    `${input.employeeName} heeft zich ziekgemeld vanaf ${input.startDate}${input.expectedDays ? ` (verwachte duur: ${input.expectedDays} dagen)` : ""}.`,
    "Bekijk in admin",
    input,
  );
}
```

Re-export.

- [ ] **Step 5: Employee /verzuim UI**

`(authed)/verzuim/page.tsx`: server-fetch `leaveRequests` waar type='sick', employee-eigen, gesorteerd. Render historie + active-card met "Hersteld melden"-knop indien open.

`features/sick/employee/sick-form.tsx`: simpel form (start-datum default vandaag, verwachte duur optioneel, beschikbaarheid radio "kan thuiswerken"/"niet beschikbaar"/"weet ik nog niet"). Géén "wat heb je"-veld.

- [ ] **Step 6: Admin /admin/verzuim UI**

`(admin)/admin/verzuim/page.tsx`: read-only overzicht alle sick-records met active state-badge. Geen approve/reject buttons. Toon employee-name + start + (eind?) + verwachte duur + availability. Géén medische tekst-velden zichtbaar (er staan ook geen).

- [ ] **Step 7: Verify + commit**

```bash
pnpm db:migrate && pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add packages/db/src/schema/leave.ts packages/db/drizzle/ apps/web/app/api/verzuim/ apps/web/app/\(authed\)/verzuim/ apps/web/app/\(admin\)/admin/verzuim/ apps/web/features/sick/ packages/email/src/
git commit -m "feat(sick): /verzuim employee form + /admin/verzuim read-only + AVG-compliant (1.6 Chapter B)

leave_requests + availability_status veld (nullable text).
Employee meldt zich ziek (start + verwachte duur + beschikbaarheid).
Hersteldmelding via dedicated route. Admin ziet read-only zonder
medische details. Email-trigger naar admin bij ziekmelding.

Migration 0011.

Plan 1.6 Task 13."
```

---

### Task 14: Sanity-check Chapter B

(Pattern als Task 6: 6 sanity-commands + log-entry + commit.)

- [ ] **Step 1**: Run + check 8 commits ahead, alle gates groen, 1 nieuwe migration.
- [ ] **Step 2**: Append log-entry "After Chapter B (Verlof + Verzuim)".
- [ ] **Step 3**: Commit.

---

## Chapter C — Declaraties + Contract + Loonstroken

### Task 15: Declaraties API + per-categorie validation

**Files:**
- Create: `apps/web/lib/expenses/types.ts`
- Create: `apps/web/lib/expenses/validation.ts`
- Create: `apps/web/app/api/declaraties/route.ts`
- Create: `apps/web/app/api/admin/declaraties/[id]/approve/route.ts`
- Create: `apps/web/app/api/admin/declaraties/[id]/reject/route.ts`
- Create: `packages/email/src/templates/expense.ts`

- [ ] **Step 1: Types + per-category validation**

`apps/web/lib/expenses/types.ts`:
```ts
export const EXPENSE_CATEGORIES = [
  { key: "travel", label: "Reiskosten", customFields: ["fromTo"] },
  { key: "client_meal", label: "Maaltijd met klant", customFields: ["personCount", "clientName"] },
  { key: "conference", label: "Conferentie/training", customFields: ["eventName"] },
  { key: "materials", label: "Materiaal/boeken", customFields: ["description"] },
  { key: "software", label: "Software/abonnement", customFields: ["toolName", "subscriptionPeriod"] },
  { key: "telecom", label: "Telefoon/internet", customFields: ["provider"] },
  { key: "client_gift", label: "Klant-cadeau", customFields: ["clientName", "giftDescription"] },
  { key: "other", label: "Anders", customFields: ["extendedDescription"] },
] as const;
```

`apps/web/lib/expenses/validation.ts`:
```ts
import { z } from "zod";
import { dateIsoSchema, uuidSchema } from "@casella/types";

export const expenseSubmitSchema = z.object({
  category: z.enum(["travel","client_meal","conference","materials","software","telecom","client_gift","other"]),
  projectId: uuidSchema.nullable(), // null = intern
  isInternal: z.boolean(),
  amountCents: z.number().int().min(1),
  date: dateIsoSchema,
  description: z.string().min(1).max(500),
  receiptStoragePath: z.string().min(1),
  categoryPayload: z.record(z.unknown()).optional(),
}).refine((d) => d.isInternal === (d.projectId === null), {
  message: "isInternal moet matchen met projectId-aan/afwezig",
});
```

- [ ] **Step 2: POST /api/declaraties**

```ts
// validate body, getCurrentEmployee guard, insert into expense_claims, audit.
// Receipt upload upfront (Supabase Storage signed URL) gebeurt in client (zie Task 16).
// Email naar admin via expenseSubmittedAdminEmail.
```

(Schrijf volledige route — patroon zoals leave/submit. ~80 regels.)

- [ ] **Step 3: Admin approve/reject**

`approve`: zet status=approved, decidedAt=now, decidedBy=admin.id. Push naar Nmbrs als loon-component (TODO Nmbrs `pushSalaryComponent` — voor nu stub + log skip). Email naar employee via `expenseDecidedEmployeeEmail`.

`reject`: zelfde + `rejection_reason` verplicht.

- [ ] **Step 4: Email templates**

`packages/email/src/templates/expense.ts`: `expenseSubmittedAdminEmail`, `expenseDecidedEmployeeEmail` — skeleton-based.

- [ ] **Step 5: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint
git add apps/web/lib/expenses/ apps/web/app/api/declaraties/ apps/web/app/api/admin/declaraties/ packages/email/src/
git commit -m "feat(expenses): API submit + approve/reject + email-templates (1.6 Chapter C)

8 categorieën + per-category custom-fields. Project-koppeling verplicht
(intern of klant). Receipt-storage-path verplicht. Status-flow:
submitted → approved/rejected → paid (na Nmbrs-push, TODO 1.7).

Plan 1.6 Task 15."
```

---

### Task 16: Declaraties UI — employee form + admin queue

**Files:**
- Modify: `apps/web/app/(authed)/declaraties/page.tsx`
- Create: `apps/web/app/(authed)/declaraties/nieuw/page.tsx`
- Modify: `apps/web/app/(admin)/admin/declaraties/page.tsx`
- Create: `apps/web/features/expenses/employee/expense-list.tsx`
- Create: `apps/web/features/expenses/employee/expense-form.tsx`
- Create: `apps/web/features/expenses/employee/receipt-upload.tsx`
- Create: `apps/web/features/expenses/admin/expense-queue.tsx`
- Create: `apps/web/app/api/expenses/upload-url/route.ts` (signed-URL voor Supabase Storage)

- [ ] **Step 1: Receipt upload signed-URL endpoint**

```ts
// POST /api/expenses/upload-url body: { filename, contentType }
// Returns Supabase Storage signed-URL voor PUT
// Path-pattern: receipts/{employeeId}/{uuid}-{filename}
```

(~50 regels, gebruik @supabase/supabase-js storage client met service-role key.)

- [ ] **Step 2: ReceiptUpload component**

Drag-drop area + browse button + preview thumbnail. Uploadt direct naar Supabase Storage via signed URL → returnt path naar parent form.

- [ ] **Step 3: ExpenseForm**

Multi-step (category → details → review):
- Step 1: category-select (8+anders)
- Step 2: project-dropdown (intern + actieve klant-projecten via server-fetch) + amount + date + description + receipt-upload + custom-fields per category
- Step 3: review + submit

- [ ] **Step 4: ExpenseList**

Tabel met datum / categorie / project / bedrag / status-badge. Klik → drawer met details + receipt-preview.

- [ ] **Step 5: Admin ExpenseQueue**

Cards per pending claim met Goedkeuren / Afwijzen-knoppen. BTW-split veld vóór approve (admin vult `vatAmountCents` in dialog).

- [ ] **Step 6: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/app/\(authed\)/declaraties/ apps/web/app/\(admin\)/admin/declaraties/ apps/web/features/expenses/ apps/web/app/api/expenses/
git commit -m "feat(expenses): employee form + admin queue + receipt-upload (1.6 Chapter C)

Multi-step wizard (categorie → details → review). Receipt-upload via
Supabase Storage signed-URL. Per-category custom velden via
EXPENSE_CATEGORIES config. Admin-queue met BTW-split-dialog vóór approve.

Plan 1.6 Task 16."
```

---

### Task 17: Contract — admin upload + employee tijdlijn-view

**Files:**
- Create: `apps/web/app/api/admin/contracts/route.ts` (POST)
- Create: `apps/web/app/api/contract/[id]/download/route.ts` (signed download)
- Modify: `apps/web/app/(admin)/admin/medewerkers/[id]/page.tsx` (contract-section toevoegen)
- Modify: `apps/web/app/(authed)/contract/page.tsx` (was placeholder)
- Create: `apps/web/features/contracts/employee/contract-timeline.tsx`
- Create: `apps/web/features/contracts/admin/contract-upload-form.tsx`
- Create: `packages/email/src/templates/contract.ts`

- [ ] **Step 1: Upload-API (admin)**

POST `/api/admin/contracts`. Body: `{ employeeId, startDate, endDate, jobTitle, pdfStoragePath, brutoSalarisMaandCents, ... bonus-velden }`. Insert in `contracts` tabel. Audit `contracts.uploaded`. Email naar employee via `contractUploadedEmployeeEmail`.

- [ ] **Step 2: Download-API**

GET `/api/contract/[id]/download`. Auth: alleen eigen contract OF admin. Returnt 302 redirect naar Supabase Storage signed-URL (15 min geldig).

- [ ] **Step 3: Admin upload-form**

Op `/admin/medewerkers/[id]` een nieuwe sectie "Contracten" met lijst bestaande + "Nieuw contract uploaden"-knop → dialog met form (PDF-file + alle bonus-velden + dates + jobTitle).

- [ ] **Step 4: Employee /contract page**

Server-fetch alle contracten van eigen employee. Render tijdlijn (chronologisch desc): per contract card met dates + jobTitle + download-knop.

- [ ] **Step 5: Email template**

`contract.ts`: `contractUploadedEmployeeEmail` (skeleton-based, "Je nieuwe contract staat klaar").

- [ ] **Step 6: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/app/api/admin/contracts/ apps/web/app/api/contract/ apps/web/app/\(admin\)/admin/medewerkers/ apps/web/app/\(authed\)/contract/ apps/web/features/contracts/ packages/email/src/
git commit -m "feat(contracts): admin upload + employee tijdlijn + bonus-velden (1.6 Chapter C)

Admin uploadt PDF + dates + jobTitle + alle bonus-velden (bruto-salaris,
vakantietoeslag%, baseline-tarief, bonus-pct below/above, max-overperf,
auto-stelpost). Employee ziet chronologische tijdlijn van eigen contracten
met PDF-download via signed-URL.

Plan 1.6 Task 17."
```

---

### Task 18: Loonstroken — Nmbrs SOAP + employee UI

**Files:**
- Modify: `packages/nmbrs/src/employees.ts` (voeg `getEmployeePayslips` + `getPayslipPdf` toe)
- Create: `apps/web/lib/nmbrs/payslips.ts`
- Create: `apps/web/app/api/loonstroken/route.ts`
- Create: `apps/web/app/api/loonstroken/[year]/[month]/route.ts` (PDF stream)
- Modify: `apps/web/app/(authed)/loonstroken/page.tsx` (was placeholder)
- Create: `apps/web/features/payslips/payslip-list.tsx`

- [ ] **Step 1: Nmbrs SOAP endpoints**

In `packages/nmbrs/src/employees.ts`:
```ts
export interface NmbrsPayslipSummary {
  year: number;
  period: number; // 1-12 (maand) of 1-13
  amountGrossCents: number;
  availableSince: string; // ISO
}

export async function getEmployeePayslips(nmbrsEmployeeId: string, year: number): Promise<NmbrsPayslipSummary[]>;
export async function getPayslipPdfBase64(nmbrsEmployeeId: string, year: number, period: number): Promise<string>;
```

(Implementatie wraps `EmployeeService_GetPayslip` SOAP-call. Bij missing-creds: `NmbrsError("missing_credentials")`.)

- [ ] **Step 2: Casella API-routes**

`/api/loonstroken/route.ts` GET: returns `{ payslips: [...] }` voor current employee voor afgelopen 2 jaar (combineer 2 SOAP-calls).

`/api/loonstroken/[year]/[month]/route.ts` GET: streamt PDF (Content-Type: application/pdf, Content-Disposition: attachment).

- [ ] **Step 3: Employee /loonstroken page**

Server-fetch lijst + render `<PayslipList>` met per-rij download-knop.

- [ ] **Step 4: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add packages/nmbrs/src/employees.ts apps/web/lib/nmbrs/payslips.ts apps/web/app/api/loonstroken/ apps/web/app/\(authed\)/loonstroken/ apps/web/features/payslips/
git commit -m "feat(payslips): real-time Nmbrs payslip-list + on-demand PDF-download (1.6 Chapter C)

Nmbrs.getEmployeePayslips(nmbrsId, year) + getPayslipPdfBase64. Casella
proxy-routes streamen PDF zonder caching. Employee ziet tabel met
laatste 2 jaar; klikt → PDF-download.

Plan 1.6 Task 18."
```

---

### Task 19: Sanity-check Chapter C

(Pattern als Task 6/14.)

---

## Chapter D — Bonus + Care Package + Werkgeversverklaring

### Task 20: Bonus-formule helpers + werkbare-uren-kalender

**Files:**
- Create: `apps/web/lib/bonus/working-hours-calendar.ts`
- Create: `apps/web/lib/bonus/formula.ts`
- Test: `apps/web/lib/bonus/__tests__/formula.test.ts`

- [ ] **Step 1: Werkbare-uren-kalender**

`working-hours-calendar.ts`:
```ts
// Bereken werkbare uren in maand: ma-vr min NL-feestdagen
const NL_HOLIDAYS_2026 = ["2026-01-01","2026-04-06","2026-04-27","2026-05-05","2026-05-14","2026-05-25","2026-12-25","2026-12-26"];
// (Hardcode voor 2026-2027; voor latere jaren: gebruik npm package zoals `date-holidays`.)

export function workingDaysInMonth(year: number, month: number): number;
export function workingHoursInMonth(year: number, month: number, weeklyHours = 40): number;
```

- [ ] **Step 2: Formula**

`formula.ts`:
```ts
export interface BonusInputs {
  approvedHoursPerProject: Map<string, number>; // projectId → hours
  projectRates: Map<string, number>; // projectId → hourly_rate_excl_btw
  brutoSalarisMaandCents: number;
  vakantietoeslagPctYearly: number; // bv 8.0
  werkgeverslastenPct: number; // bv 30.0
  indirecteKostenPerMaandCents: number;
  autoStelpostMaandCents: number;
  baselineTariefPerUur: number;
  workingHoursThisMonth: number;
}

export interface BonusComputeResult {
  brutoOmzetCents: number;
  directKostenCents: number;
  indirectKostenCents: number;
  nettowinstCents: number;
  qualifiesForBaseline: boolean; // ≥50% werkbare uren gefactureerd EN gem-tarief ≥75
}

export function computeMonthlyBonus(input: BonusInputs): BonusComputeResult;

export function determineApplicablePct(
  qualifiedMonthsLast12: number,
  belowPct: number, // 10
  abovePct: number, // 15
): number;
```

- [ ] **Step 3: TDD tests**

```ts
describe("computeMonthlyBonus", () => {
  it("calculates nettowinst correct", () => {
    const result = computeMonthlyBonus({
      approvedHoursPerProject: new Map([["p1", 168]]),
      projectRates: new Map([["p1", 75]]),
      brutoSalarisMaandCents: 460000,
      vakantietoeslagPctYearly: 8.0,
      werkgeverslastenPct: 30.0,
      indirecteKostenPerMaandCents: 50000,
      autoStelpostMaandCents: 0,
      baselineTariefPerUur: 75,
      workingHoursThisMonth: 168,
    });
    expect(result.brutoOmzetCents).toBe(168 * 7500); // 1.260.000
    expect(result.qualifiesForBaseline).toBe(true);
  });

  it("disqualifies when <50% werkbare uren", () => {
    const result = computeMonthlyBonus({
      approvedHoursPerProject: new Map([["p1", 80]]),
      projectRates: new Map([["p1", 75]]),
      brutoSalarisMaandCents: 460000, vakantietoeslagPctYearly: 8.0, werkgeverslastenPct: 30.0,
      indirecteKostenPerMaandCents: 50000, autoStelpostMaandCents: 0,
      baselineTariefPerUur: 75, workingHoursThisMonth: 168,
    });
    expect(result.qualifiesForBaseline).toBe(false); // 80/168 = 47%
  });

  it("disqualifies when avg-tarief <75", () => {
    const result = computeMonthlyBonus({
      approvedHoursPerProject: new Map([["p1", 100], ["p2", 80]]),
      projectRates: new Map([["p1", 70], ["p2", 60]]),
      brutoSalarisMaandCents: 460000, vakantietoeslagPctYearly: 8.0, werkgeverslastenPct: 30.0,
      indirecteKostenPerMaandCents: 50000, autoStelpostMaandCents: 0,
      baselineTariefPerUur: 75, workingHoursThisMonth: 168,
    });
    expect(result.qualifiesForBaseline).toBe(false);
  });
});

describe("determineApplicablePct", () => {
  it("returns above-pct when ≥9 qualified months", () => {
    expect(determineApplicablePct(9, 10, 15)).toBe(15);
    expect(determineApplicablePct(12, 10, 15)).toBe(15);
  });
  it("returns below-pct when <9", () => {
    expect(determineApplicablePct(8, 10, 15)).toBe(10);
  });
});
```

Run + verify all pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/bonus/
git commit -m "feat(bonus): formula-helpers per artikel 7 + 5 unit tests (1.6 Chapter D)

computeMonthlyBonus: bruto-omzet (uren×tarief) - direct (salaris+30%+
vt-toeslag/12+auto-stelpost) - indirect → nettowinst per maand.
qualifiesForBaseline: ≥50% werkbare uren gefactureerd EN gem-tarief ≥
baseline.

determineApplicablePct: rolling 12mnd qualified-count → 10% of 15%.

Plan 1.6 Task 20."
```

---

### Task 21: Bonus accrual cron + admin override-UI

**Files:**
- Create: `apps/web/app/api/cron/bonus-monthly-accrual/route.ts`
- Modify: `apps/web/app/(admin)/admin/bonus/page.tsx`
- Create: `apps/web/features/bonus/admin/employee-bonus-overview.tsx`
- Create: `apps/web/features/bonus/admin/overperformance-form.tsx`

- [ ] **Step 1: Cron-endpoint voor monthly accrual**

`/api/cron/bonus-monthly-accrual/route.ts`: POST. Header-check `Authorization: Bearer ${process.env.CRON_SECRET}` (TODO Vercel cron in Fase 2). Voor elke active employee + voor elke maand sinds laatste accrual (max 12 mnd terug):
1. Fetch approved hours per project
2. Fetch active contract → bonus-velden
3. Fetch bonus_config voor jaar
4. Fetch werkbare-uren-deze-maand
5. Run `computeMonthlyBonus`
6. Run `determineApplicablePct` over rolling 12 mnd qualified
7. Insert `bonus_ledger` accrual record met `nettowinstCents × pct`

- [ ] **Step 2: Admin bonus-page**

`/admin/bonus`: tabs voor "Per medewerker" / "Config" / "Over-performance".
- Per medewerker: tabel met YTD accrual + paid + outstanding per medewerker
- Config: form voor bonus_config van huidig + volgend jaar
- Over-performance: form per medewerker om addendum-pct in te stellen (max max_overperformance_pct uit contract)

- [ ] **Step 3: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/app/api/cron/bonus-monthly-accrual/ apps/web/app/\(admin\)/admin/bonus/ apps/web/features/bonus/admin/
git commit -m "feat(bonus): monthly-accrual cron + admin overview/config/overperformance (1.6 Chapter D)

Cron-endpoint berekent maandelijkse accrual per employee per project.
Admin /admin/bonus heeft 3 tabs: per-medewerker, config, over-performance
addenda. CRON_SECRET-guard (TODO wired in Vercel-cron Fase 2).

Plan 1.6 Task 21."
```

---

### Task 22: Bonus + Care Package employee UI

**Files:**
- Modify: `apps/web/app/(authed)/bonus/page.tsx`
- Modify: `apps/web/app/(authed)/winstdeling/page.tsx`
- Create: `apps/web/features/bonus/employee/bonus-summary.tsx`
- Create: `apps/web/features/bonus/employee/bonus-history.tsx`
- Create: `apps/web/features/care-package/employee/winstdeling-summary.tsx`
- Create: `apps/web/app/api/bonus/saldo/route.ts`
- Create: `apps/web/app/api/winstdeling/saldo/route.ts`

- [ ] **Step 1: Bonus saldo-API**

GET `/api/bonus/saldo`: returns `{ ytdAccrualCents, ytdPaidCents, outstandingCents, perProject: [...] }` voor current employee.

- [ ] **Step 2: Bonus-page**

Server-fetch saldo + history. Render summary-card (3 metrics) + `<BonusHistory>` tabel met per-rij datum/type/amount/project.

- [ ] **Step 3: Winstdeling-page**

Server-fetch `care_package_ledger` records voor employee. Render per-vennootschap-card (Ascentra / Operis / Astra) met annual-distribution-historie en exit-events. Empty-state: "Care Package wordt vastgesteld in jaarlijkse business retraite — nog geen data."

- [ ] **Step 4: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint
git add apps/web/app/\(authed\)/bonus/ apps/web/app/\(authed\)/winstdeling/ apps/web/features/bonus/employee/ apps/web/features/care-package/ apps/web/app/api/bonus/ apps/web/app/api/winstdeling/
git commit -m "feat(bonus,care-package): employee /bonus + /winstdeling pages (1.6 Chapter D)

/bonus: YTD-accrual + paid + outstanding summary + history-tabel.
/winstdeling: per-vennootschap-card (Ascentra/Operis/Astra) met annual-
distribution + exit-events.

Plan 1.6 Task 22."
```

---

### Task 23: Werkgeversverklaring — PDF-generator + auto-sign + per-purpose form

**Files:**
- Create: `apps/web/lib/statements/pdf-generator.tsx` (use @react-pdf/renderer)
- Create: `apps/web/lib/statements/templates/mortgage.tsx`
- Create: `apps/web/lib/statements/templates/rent.tsx`
- Create: `apps/web/lib/statements/templates/other.tsx`
- Create: `apps/web/app/api/werkgeversverklaring/route.ts`
- Modify: `apps/web/app/(authed)/werkgeversverklaring/page.tsx`
- Create: `apps/web/features/statements/employee/statement-form.tsx`
- Create: `apps/web/features/statements/employee/statement-list.tsx`

- [ ] **Step 1: Install @react-pdf/renderer**

```bash
pnpm -F @casella/web add @react-pdf/renderer
```

- [ ] **Step 2: Templates per purpose**

Drie React-PDF-templates met header (Ascentra-logo) + werkgever-block + werknemer-block + functie/datums/salaris-block + purpose-specific block (NHG-data / verhuurder / reden) + handtekening-block (image + datum + naam admin).

(~150 regels per template; reuse-baar via shared `<HeaderBlock>`/`<FooterBlock>`.)

- [ ] **Step 3: PDF-generator**

`pdf-generator.tsx`:
```tsx
import { renderToBuffer } from "@react-pdf/renderer";
import { MortgageTemplate } from "./templates/mortgage";
// etc.

export async function generateStatementPdf(input: StatementGenerateInput): Promise<Buffer> {
  const doc = pickTemplate(input.purpose, input);
  return renderToBuffer(doc);
}
```

- [ ] **Step 4: API + auto-sign**

POST `/api/werkgeversverklaring`. Body: `{ purpose, customFields }`. Server-fetch employee + huidig contract + admin-handtekening (uit Ascentra-config / `system_settings` tabel — voeg toe indien nog niet aanwezig). Generate PDF → upload naar Supabase Storage → insert `statements` record met status='delivered' + path. Return `{ id, downloadUrl }`. Email naar employee via `statementReadyEmployeeEmail`.

- [ ] **Step 5: Employee UI**

`/werkgeversverklaring`: server-fetch eigen statements-historie. Render form (purpose-tabs → custom-fields-per-purpose → submit) + history-list (datum / purpose / download-knop).

- [ ] **Step 6: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/lib/statements/ apps/web/app/api/werkgeversverklaring/ apps/web/app/\(authed\)/werkgeversverklaring/ apps/web/features/statements/ apps/web/package.json pnpm-lock.yaml
git commit -m "feat(statements): werkgeversverklaring auto-PDF + auto-sign + per-purpose (1.6 Chapter D)

@react-pdf/renderer voor PDF-generation. 3 templates (mortgage/rent/
other) met shared header/footer. Auto-sign: admin's geüploade
handtekening-image (uit system_settings) + naam + datum + Ascentra-logo
plakt op gegenereerde PDF. Status flow: requested → delivered (instant).

Plan 1.6 Task 23."
```

---

### Task 24: Sanity-check Chapter D

(Pattern als Task 6/14/19.)

---

## Chapter E — Profiel + Inbox + Dashboard

### Task 25: Profiel — direct-edit fields + change-requests

**Files:**
- Modify: `apps/web/app/(authed)/profiel/page.tsx`
- Create: `apps/web/app/api/profiel/route.ts` (PATCH direct fields)
- Create: `apps/web/app/api/profiel/change-request/route.ts` (POST address/iban)
- Create: `apps/web/app/api/admin/change-requests/[id]/approve/route.ts`
- Create: `apps/web/app/api/admin/change-requests/[id]/reject/route.ts`
- Create: `apps/web/features/profile/profile-form.tsx`
- Create: `apps/web/features/profile/email-preferences.tsx`
- Create: `apps/web/features/profile/change-request-form.tsx`

- [ ] **Step 1: PATCH direct-fields**

`/api/profiel/route.ts` PATCH. Body: `{ phone?, emergencyContactName?, emergencyContactPhone?, themePreference?, languagePreference?, bio?, avatarStoragePath?, emailNotificationPreferences? }`. Update employees + audit. Return updated.

- [ ] **Step 2: Change-request POST**

`/api/profiel/change-request/route.ts` POST. Body: `{ type: "address"|"iban", proposedValue }`. Insert change-request. Email naar admin.

- [ ] **Step 3: Admin approve/reject change-request**

Approve: apply proposedValue (address: insert/upsert addresses + update employees.homeAddressId; iban: TODO push naar Nmbrs als IBAN-veld). Audit. Email naar employee.
Reject: zet status=rejected + reason. Email naar employee.

- [ ] **Step 4: Profiel-page UI**

Sections: Persoonlijk (telefoon/noodcontact direct-bind) / Voorkeuren (thema/taal/bio/avatar direct) / Adres (huidig + change-request-flow met PDOK-picker) / Bank (huidige IBAN read-only + change-request) / E-mail (toggle's per type, jsonb update) / 2FA-info (read-only badge + Microsoft-deeplink).

- [ ] **Step 5: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/app/api/profiel/ apps/web/app/api/admin/change-requests/ apps/web/app/\(authed\)/profiel/ apps/web/features/profile/
git commit -m "feat(profile): /profiel direct-edit + change-request flow voor address/iban (1.6 Chapter E)

Direct-bind: telefoon / noodcontact / thema / taal / bio / avatar /
email-prefs (jsonb).

Change-request: address (PDOK) + iban → admin approval-flow → na approve
update + Nmbrs-sync (TODO IBAN-Nmbrs-push).

Plan 1.6 Task 25."
```

---

### Task 26: Employee Inbox + Bell + Admin Broadcasts

**Files:**
- Modify: `apps/web/app/(authed)/layout.tsx` (NotificationBell mounten in TopBar — voeg TopBar toe als nog niet aanwezig)
- Create: `apps/web/features/notifications/employee/notification-bell-employee.tsx`
- Create: `apps/web/app/api/notifications/route.ts`
- Create: `apps/web/app/api/notifications/[id]/mark-read/route.ts`
- Create: `apps/web/app/(admin)/admin/broadcasts/page.tsx`
- Create: `apps/web/app/api/admin/broadcasts/route.ts`
- Create: `apps/web/features/broadcasts/admin/broadcast-form.tsx`

- [ ] **Step 1: GET notifications**

GET `/api/notifications`: returns laatste 50 voor current user, met `read_at` field.

- [ ] **Step 2: PATCH mark-read**

POST `/api/notifications/[id]/mark-read`.

- [ ] **Step 3: Bell-component**

Hergebruik design van admin-NotificationBell uit 1.1b (component lives in `apps/web/features/notifications/admin/...`). Refactor tot generic `<NotificationBell variant="employee">` of dupliceer.

- [ ] **Step 4: Admin broadcasts**

`/admin/broadcasts` page: form (message + multi-select chips voor employees of "Allen"-toggle) → POST `/api/admin/broadcasts` → insert broadcast + insert N notifications.

- [ ] **Step 5: Mount bell in employee layout**

Voeg `<NotificationBell variant="employee">` toe aan `(authed)/layout.tsx` rechtsboven (employee-layout heeft nog geen TopBar — minimum: voeg een simpele top-bar div toe met alleen de bell).

- [ ] **Step 6: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/app/api/notifications/ apps/web/app/api/admin/broadcasts/ apps/web/app/\(authed\)/layout.tsx apps/web/app/\(admin\)/admin/broadcasts/ apps/web/features/notifications/employee/ apps/web/features/broadcasts/
git commit -m "feat(notifications): employee bell + admin broadcasts (1.6 Chapter E)

Employee bell rechtsboven in (authed)/layout met system-events +
coaching tips + admin-broadcasts. Admin /admin/broadcasts: form voor
algemeen bericht aan iedereen of specifieke groepen.

Plan 1.6 Task 26."
```

---

### Task 27: Dashboard — hero + saldo-strip + action-strip + documenten

**Files:**
- Modify: `apps/web/app/(authed)/dashboard/page.tsx`
- Create: `apps/web/features/dashboard/hero-card.tsx`
- Create: `apps/web/features/dashboard/balance-strip.tsx`
- Create: `apps/web/features/dashboard/action-strip.tsx`
- Create: `apps/web/features/dashboard/documents-section.tsx`

- [ ] **Step 1: Server-fetch alle dashboard-data**

```tsx
export default async function DashboardPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/onboarding-pending");

  const [activeAssignments, balances, bonusYtd, openItems, recentPayslips, latestStatement] = await Promise.all([
    fetchActiveAssignments(employee.id),
    getLeaveBalances(employee.id),
    fetchBonusYtd(employee.id),
    fetchOpenActionItems(employee.id), // missing-week / verlof rejected / etc
    fetchRecentPayslips(employee.id, 3),
    fetchLatestStatement(employee.id),
  ]);

  return (
    <div className="space-y-8">
      <HeroCard firstName={employee.firstName} assignments={activeAssignments} />
      <BalanceStrip balances={balances} bonusYtd={bonusYtd} hoursThisMonth={...} />
      {openItems.length > 0 && <ActionStrip items={openItems} />}
      <DocumentsSection payslips={recentPayslips} statement={latestStatement} />
    </div>
  );
}
```

- [ ] **Step 2: HeroCard**

Card breed met "Goedemorgen, {firstName}" + huidige opdracht(en). Bij meerdere: list met %. Bij 0: empty-state.

- [ ] **Step 3: BalanceStrip**

3 cards (gridcols-1 / md:grid-cols-3): vakantie / bonus / uren-mnd. Mini-sparklines met inline SVG (geen recharts).

- [ ] **Step 4: ActionStrip**

Conditionele banner met max 5 pills (icoon + label + click-through href).

- [ ] **Step 5: DocumentsSection**

2 koloms: links 3 recente loonstroken (uit Nmbrs cache of recent-payslips-helper), rechts laatste werkgeversverklaring + jaaropgave-link.

- [ ] **Step 6: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/app/\(authed\)/dashboard/ apps/web/features/dashboard/
git commit -m "feat(dashboard): hero + saldo-strip + action-strip + documenten (1.6 Chapter E)

Vervangt 4-regel placeholder. Server-fetched: active-assignments, leave-
balances, bonus-YTD, open-items, recent-payslips, latest-statement.
Layout: hero (begroeting + huidige opdracht) → 3 saldo-cards → conditionele
action-strip → 2-koloms documenten-section.

Plan 1.6 Task 27."
```

---

### Task 28: Sanity-check Chapter E

(Pattern als Task 6/14/19/24.)

---

## Chapter F — Email-flows wire-up + cron + final sanity + PR

### Task 29: 14 email-templates (skeleton-based) wire-up bij triggers

**Files:**
- Create: `packages/email/src/templates/{hours-rejected,hours-approved,statement-ready,payslip-available,bonus-paid,address-change,iban-change,vacation-balance-low,hours-missing-reminder,vacation-unused,broadcast-general,termination-warn}.ts`
- Modify: alle reeds geschreven trigger-points in routes + cron om de juiste email-template te enqueuen

- [ ] **Step 1: Schrijf alle 14 skeleton-emails**

(Telkens ~10 regels per template. Patroon van `leave-status.ts`. Definitieve copy komt in addendum.)

Re-export alles in `packages/email/src/index.ts`.

- [ ] **Step 2: Wire ze bij bestaande triggers**

- Hours afgewezen → in admin-uren reject-route hook, voeg toe email-call (was geen email vóór 1.6)
- Hours goedgekeurd → in admin-uren approve-route, optioneel email
- Statement ready → al gewired in werkgeversverklaring-route (Task 23)
- Payslip available → trigger via cron `payslip-available` of Nmbrs-sync hook (TODO toekomst — initial: handmatig admin-trigger)
- Bonus paid → in `bonus_ledger` paid-record insert helper
- Address/IBAN change approved → in admin change-request approve-route
- Vacation balance low → cron-job (zie Task 30)
- Hours missing reminder → al bestaand
- Vacation unused year-end → cron-job (zie Task 30)
- Broadcast general → in broadcasts POST-route
- Termination warn → cron-job

- [ ] **Step 3: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add packages/email/src/templates/ packages/email/src/index.ts apps/web/app/api/
git commit -m "feat(email): 14 nieuwe placeholder-templates + wire-up bij triggers (1.6 Chapter F)

Skeleton-bodies voor: hours-rejected/approved, statement-ready, payslip-
available, bonus-paid, address/iban-change, vacation-balance-low, hours-
missing-reminder, vacation-unused, broadcast-general, termination-warn.

Triggers gewired in respective route-handlers. Definitieve copy +
HTML-vormgeving komt in addendum-document.

Plan 1.6 Task 29."
```

---

### Task 30: Cron-endpoints voor saldo-sync + saldo-warnings + termination + bonus-accrual

**Files:**
- Modify: `packages/nmbrs/src/leave.ts` (voeg `getLeaveBalancesByYear(nmbrsId, year)` toe — SOAP `EmployeeService_GetLeaveBalances` of `Absence_GetByYear`)
- Create: `apps/web/app/api/cron/nmbrs-leave-balance-sync/route.ts`
- Create: `apps/web/app/api/cron/low-vacation-balance/route.ts`
- Create: `apps/web/app/api/cron/year-end-vacation-unused/route.ts`
- Create: `apps/web/app/api/cron/termination-warn-7d/route.ts`
- Note: `apps/web/app/api/cron/bonus-monthly-accrual/route.ts` already created in Task 21

- [ ] **Step 0: Nmbrs leave-balance pull**

In `@casella/nmbrs`: `getLeaveBalancesByYear(nmbrsEmployeeId, year)` returnt array van `{ leaveType, hoursTotal, hoursRemaining, expiresAt? }`. Bij missing-creds: `NmbrsError("missing_credentials")` (graceful skip in cron).

Cron `/api/cron/nmbrs-leave-balance-sync`: dagelijks 03:00. Voor elke employee met `nmbrsEmployeeId`: pull saldi → upsert `leave_balance_snapshots` (employee_id + year + leave_type unique). Skip als geen creds.

- [ ] **Step 1: Low vacation balance**

Wekelijkse run. Voor elke active employee: fetch latest leave_balance_snapshot voor vacation. Als `hoursRemaining ≤ weeklyHours × 0.5` (=halve werkweek over) en geen warning verstuurd in laatste 30d → enqueue notification + email.

- [ ] **Step 2: Year-end unused vacation**

Run 1 december + 1 januari. Als employee >40u vakantie ongebruikt voor lopend jaar → reminder.

- [ ] **Step 3: Termination warn T-7d**

Dagelijks. Voor elke employee met `pending_termination_at` over 7 dagen → enqueue admin-notification + email.

- [ ] **Step 4: CRON_SECRET-guard**

Alle cron-endpoints checken `Authorization: Bearer ${process.env.CRON_SECRET}`. TODO: Vercel cron-config in `vercel.json` (Fase 2 deploy).

- [ ] **Step 5: Verify + commit**

```bash
pnpm -F @casella/web typecheck && pnpm -F @casella/web lint && pnpm -F @casella/web build
git add apps/web/app/api/cron/
git commit -m "feat(cron): saldo-warnings + termination-warn + bonus-accrual cron-endpoints (1.6 Chapter F)

4 cron-endpoints met CRON_SECRET-guard. Activatie via Vercel cron-config
gebeurt in Fase 2 deploy. Voor lokaal: handmatig POST'en kan om te testen.

Plan 1.6 Task 30."
```

---

### Task 31: Final sanity-check + deferred-work bookkeeping

**Files:**
- Modify: `docs/casella-deferred-work.md`
- Modify: `docs/sanity-check-log.md`

- [ ] **Step 1: Run sanity-protocol**

```bash
git status
git log --oneline main..HEAD | wc -l
pnpm -r typecheck
pnpm -r test
pnpm -F @casella/web lint
pnpm -F @casella/web build
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

Verwacht: 30+ commits ahead, 32+ tests passing, 0 lint warnings, 7 nieuwe + uitbreid tabellen, build clean.

- [ ] **Step 2: Update deferred-work**

Mark closed: ✅ verlof, ✅ verzuim, ✅ declaraties, ✅ contract, ✅ loonstroken, ✅ bonus, ✅ Care Package, ✅ werkgeversverklaring, ✅ profiel, ✅ inbox, ✅ email-flows wire-up, ✅ sidebar-bug.

Open nieuwe entries:
- `EMAIL-COPY-ADDENDUM`: 14 templates hebben placeholder-bodies, definitieve copy nog te schrijven
- `ASTRASIGN-WERKGEVERSVERKLARING`: Fase 4
- `KVK-API-INTEGRATION`: vervangen mock — Fase 2
- `VERCEL-CRON-ACTIVATION`: vercel.json + CRON_SECRET in env — Fase 2
- `NMBRS-IBAN-PUSH`: huidige TODO bij IBAN-change-request approve
- `NMBRS-LEAVE-REVERT`: huidige TODO bij leave-cancel after approve
- `RLS-1.6-TABLES`: nieuwe tabellen (contracts, expense_claims, etc.) hebben nog geen RLS-policies → Fase 2 prep

- [ ] **Step 3: Append sanity-log entry "Plan 1.6 compleet"**

- [ ] **Step 4: Commit**

```bash
git add docs/casella-deferred-work.md docs/sanity-check-log.md
git commit -m "docs: final sanity Plan 1.6 + deferred-work close-out

Plan 1.6 (Employee Experience) compleet — 12 onderdelen + sidebar-fix
+ 14 email-flows wired. 30+ commits ahead van main. Alle gates groen.

Closed: 12 features uit open_features.md gevinkt. Open: email-copy-
addendum + 6 cross-cutting deferrals (AstraSign, KvK, Vercel cron,
Nmbrs-IBAN/leave-revert, RLS-1.6).

Plan 1.6 Task 31."
```

---

### Task 32: Push + PR + merge

- [ ] **Step 1: Push branch**

```bash
git push -u origin fase-1-6-employee-experience
```

- [ ] **Step 2: Open PR via REST API**

(Hergebruik patroon uit Plan 1.5 — token uit git credential helper, curl POST naar `/repos/.../pulls`.)

PR title: `Fase 1.6: Employee experience kern (12 onderdelen, ~32 tasks)`
PR body: link naar spec + samenvatting per chapter + test plan checklist.

- [ ] **Step 3: Wait for CI green**

Poll `/check-runs` zoals in 1.5. Verwacht 4-6 min.

- [ ] **Step 4: Merge squash + delete branch + sync local**

```bash
# REST API merge zoals 1.5
git fetch origin --prune
git checkout main
git pull origin main --ff-only
git branch -D fase-1-6-employee-experience
```

- [ ] **Step 5: Update memory**

Update `project_state.md` met nieuwe HEAD + 12 onderdelen ✅.
Update `open_features.md` met cross-references naar deferred-work entries.

---

## Self-review

**1. Spec coverage check** — elk onderdeel uit spec §3.1-3.12:
- Dashboard → Task 27 ✓
- Uren → ongewijzigd, no task needed ✓
- Verlof → Tasks 7-12 ✓
- Verzuim → Task 13 ✓
- Declaraties → Tasks 15-16 ✓
- Contract → Task 17 ✓
- Loonstroken → Task 18 ✓
- Bonus → Tasks 20-22 ✓
- Care Package → Task 22 ✓
- Werkgeversverklaring → Task 23 ✓
- Profiel → Task 25 ✓
- Inbox → Task 26 ✓
- Email-flows → Tasks 4-5 + 8 + 9 + 13 + 15 + 17 + 23 + 25 + 26 + 29-30 ✓

Schema-uitbreidingen uit spec §4.2: Task 1 + 2 ✓
Sidebar-fix uit spec §4.1: Task 3 ✓
Cron-jobs uit spec §3.12 / §6: Task 21 + 30 ✓

**2. Placeholder scan** — geen "TBD" / "implement later" in plan. Wel een aantal `TODO`-comments in code-snippets voor expliciet gedeferreerde features (Nmbrs-revert, IBAN-push, KvK-API): die zijn gedocumenteerd in deferred-work.

**3. Type consistency** — `LeaveTypeKey` (Task 7) wordt consistent gebruikt in Tasks 8/9/11/12. `expense_claims` schema-velden in Task 2 matchen API-validation in Task 15. `contracts` bonus-velden in Task 2 matchen `BonusInputs` in Task 20.

Geen wijzigingen nodig.

---

## Plan complete

Plan saved to `docs/superpowers/plans/2026-04-27-casella-fase-1-6-employee-experience.md`. **32 tasks** verdeeld over 6 chapters (A: 6 / B: 8 / C: 5 / D: 5 / E: 4 / F: 4 — incl. sanity-checkpoints en wrap).

Twee execution-opties:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review tussen tasks, snelle iteratie via `superpowers:subagent-driven-development`

**2. Inline Execution** — tasks in deze sessie via `superpowers:executing-plans`, batch met checkpoints voor review

Welke aanpak?
