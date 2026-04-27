# Casella — Employee Experience Design

**Datum:** 2026-04-27
**Status:** Goedgekeurd (brainstorm-fase) — klaar voor implementatieplan
**Auteurs:** Alex Sinigaglia (Ascentra), Claude
**Voorgangers:** Master design-spec (`2026-04-23-casella-design.md`), Fase 1.1a/1.1b/1.1c/1.2/1.3/1.4/1.5 (admin-platform + employee-uren).

---

## 1. Context en doel

Casella's master spec §1.1 noemt 7 employee-functies; tot Fase 1.5 was alleen `/uren` functioneel. Sidebar verwees naar 3 dode pagina's (`/verlof`, `/contract`, `/loonstroken`). Dit document specificeert de complete employee-experience: 12 onderdelen, met als kernuitgangspunten **AAA-grade UX**, **Nmbrs leidend voor saldi**, **AVG-compliant**, **NL-only v1**, **<25 medewerkers**.

Iedere medewerker moet via Casella zijn gehele werk-zelf kunnen overzien en beheren. Het portaal vervangt geen handmatige admin-werk maar minimaliseert het.

## 2. Scope — 12 onderdelen

| # | Onderdeel | Status pre-design |
|---|---|---|
| 1 | Dashboard | Placeholder (4 regels) |
| 2 | Uren invullen | Functioneel |
| 3 | Verlof aanvragen | Niet gebouwd |
| 4 | Verzuim | Niet gebouwd |
| 5 | Declaraties | Niet gebouwd |
| 6 | Contract inzage | Niet gebouwd (sidebar-link → 404) |
| 7 | Loonstroken | Niet gebouwd (sidebar-link → 404) |
| 8 | Bonus + Care Package | Niet gebouwd |
| 9 | Werkgeversverklaring | Niet gebouwd |
| 10 | Profiel & instellingen | Niet gebouwd |
| 11 | Inbox / notificaties | Niet gebouwd voor employee |
| 12 | Email-flows | 2/16 gebouwd (welcome + reminder) |

## 3. Onderdeel-specificaties

### 3.1 Dashboard (`/dashboard`)

**Layout** — vertical stack:

1. **Hero** — persoonlijke begroeting (`Goedemorgen, {firstName}`) + huidige opdracht-kaart breed (project-naam, klant, % allocatie, looptijd). Bij meerdere parallel-assignments alle tonen met %. Bij 0 actief → soft empty-state.
2. **Saldo-strip** — 3 cards naast elkaar:
   - Vakantiesaldo: uren-over (uit Nmbrs sync) + sparkline trend
   - Opgebouwde bonus: €-bedrag + YTD mini-grafiek (uit `bonus_ledger`)
   - Uren deze maand: totaal + percentage richting target
3. **Action-strip** (conditioneel — alleen tonen als items): max 3-5 pills met icoon + label + click-through. Voorbeelden: "1 week uren ontbreekt", "Verlof goedgekeurd → bekijken", "Werkgeversverklaring klaar".
4. **Documenten-section** — 2 koloms: links 3 recente loonstroken (uit Nmbrs), rechts laatste jaaropgave + werkgeversverklaring-status.

**Empty-state nieuwe medewerker**: warm onboarding-banner "Vul eerst je profiel aan om volledig aan de slag te gaan".

### 3.2 Uren invullen (`/uren`)

Ongewijzigd (Fase 1.2 + 1.4): weekgrid + auto-save + auto-km Mapbox + std-day auto-fill + submit.

### 3.3 Verlof aanvragen (`/verlof`)

**Verlof-types** — alle 14 wettelijke + CAO-gangbare NL-types:

| # | Type | Wettelijke basis | Max duur | Doorbetaling |
|---|---|---|---|---|
| 1 | Vakantieverlof (wettelijk) | art. 7:634 BW | 4× weekuren/jr | 100% |
| 2 | Vakantieverlof (bovenwettelijk) | Contract — Ascentra: 25 dagen totaal voor alle medewerkers | n.v.t. | 100% |
| 3 | Zwangerschapsverlof | Wazo | 4-6 wkn (8-10 meerling) | 100% UWV |
| 4 | Bevallingsverlof | Wazo | 10-12 wkn (+10 ziekenhuisopname) | 100% UWV |
| 5 | Geboorteverlof / partnerverlof | Wazo (Wieg) | 1 wk eenmalig | 100% werkgever |
| 6 | Aanvullend geboorteverlof | Wazo | 5 wkn binnen 6 mnd | 70% UWV |
| 7 | Adoptie- / pleegzorgverlof | Wazo | 6 wkn | 100% UWV |
| 8 | Ouderschapsverlof (betaald) | Wazo | 9 wkn × weekuren | 70% UWV |
| 9 | Ouderschapsverlof (onbetaald) | Wazo | 17 wkn (totaal 26) | Onbetaald |
| 10 | Kortdurend zorgverlof | Wazo | 2× weekuren/jr | 70% werkgever |
| 11 | Langdurend zorgverlof | Wazo | 6× weekuren/12mnd | Onbetaald (CAO kan aanvullen) |
| 12 | Calamiteitenverlof / kort verzuimverlof | Wazo | "Zo lang als nodig" | 100% werkgever |
| 13 | Bijzonder verlof | Contract / gangbaar | Per contract (typisch 1-2d/event) | 100% (Ascentra-keuze) |
| 14 | Onbetaald verlof | Onderhandelbaar | Onderhandelbaar | Onbetaald |

UI toont per type een **info-paneel** met de toelichting bij selectie.

**Saldo-bron**: Nmbrs is leidend. Casella sync't elke nacht 03:00 saldi via Nmbrs SOAP. UI toont "Laatst bijgewerkt: {tijd}". Geen `leave_balances` tabel in Casella DB.

**Aanvraag-flow**: per type een **custom form**:
- Standaard types (vakantie/onbetaald): start + eind + uren + opmerking
- Zwangerschap: uitgerekende datum + zwangerschapsverklaring-upload
- Bevalling: bevallingsdatum
- Geboorte/partnerverlof: geboortedatum kind
- Aanvullend geboorte: geboortedatum + opname-pattern
- Adoptie/pleegzorg: aankomstdatum + bewijs-upload
- Ouderschapsverlof: kind-koppeling + opname-pattern
- Kortdurend zorg: relatie-dropdown (kind/partner/ouder/broer/zus/huisgenoot/vriend) + korte reden
- Langdurend zorg: relatie + reden + optioneel medische-verklaring-upload
- Calamiteit: situatie-categorie (loodgieter/doktersbezoek/familie-noodgeval/partner-bevalling/overlijden/anders) + datum + uren
- Bijzonder: gelegenheid-dropdown (huwelijk/verhuizing/jubileum/anders) + datum + uren
- Onbetaald: reden + start/eind + uren + akkoord-checkbox over impact pensioen/vakantie-opbouw

**Goedkeuring per type**:
- **Self-approve** (direct naar Nmbrs, geen admin-tussenkomst): calamiteitenverlof, zwangerschap, bevalling, geboorte/partnerverlof, aanvullend geboorte, adoptie/pleegzorg, kortdurend zorg
- **Admin-goedkeuring**: vakantie, bijzonder, onbetaald, ouderschapsverlof (planning), langdurend zorg

**Eenheid**: vrije uren (4u/8u/etc., max 8u/dag, precision 4,2 — consistent met `hour_entries`). UI toont conversie naar dagen ("3 dagen + 4 uur over").

**Visibility**: privé. Alleen admin + employee zelf zien aanvragen. Geen team-kalender.

**Annulering**: altijd mogelijk door employee — saldo komt terug, admin krijgt notificatie, Nmbrs wordt teruggedraaid.

**Saldo-blokkering**: aanvraag geblokkeerd bij onvoldoende saldo voor vakantie/zorg-types; voor wettelijk-recht-types geen blokkering; onbetaald = waarschuwing over impact.

**Carry-over**: Nmbrs handelt jaartelling + carry-over; Casella toont actueel saldo + "vervalt op datum" indien bekend.

**Wachttermijn**: geen hard regel; voor aanvragen >5 dagen toont form hint "Vraag minimaal 2 weken vooraf voor team-planning".

### 3.4 Verzuim (`/verzuim`)

Alleen employee zelf kan ziekmelden. Admin ziet read-only via `/admin/verzuim` + krijgt email-notificatie. AVG-compliant: **geen medische details-veld**.

**Ziekmelding form**: start-datum (default vandaag) + verwachte duur in dagen (optioneel — admin mag vragen volgens wet) + beschikbaarheid-status (optioneel: "kan thuiswerken" / "niet beschikbaar") + opmerking (optioneel, géén medische context).

**Hersteldmelding**: door employee zelf — "Ik ben hersteld"-knop op actieve ziekmelding → einddatum = vandaag → submit → admin notificatie + Nmbrs einddatum-update.

**Wet poortwachter (>4 wk)**: out-of-scope; admin handelt re-integratie elders.

**Schema**: hergebruik `leave_requests` met `type='sick'` of aparte `sick_reports` tabel — keuze tijdens implementatieplan (waarschijnlijk hergebruik leave_requests met sick-leave-type-extensie).

### 3.5 Declaraties (`/declaraties`)

**Schema bestaat niet** — nieuw `expense_claims` tabel + `expense_categories` enum.

**Categorieën** (8 + anders):
1. Reiskosten (niet-auto: trein/taxi/OV/parkeer)
2. Maaltijd-met-klant
3. Conferentie/training
4. Materiaal/boeken
5. Software/abonnement
6. Telefoon/internet
7. Klant-cadeaus
8. Anders

**Per-categorie aangepast form**:
- Reis: bedrag + datum + van-naar (optioneel) + receipt
- Maaltijd-klant: bedrag + datum + aantal personen + klantnaam + receipt
- Conferentie: bedrag + datum + evenement-naam + receipt
- Materiaal: bedrag + datum + omschrijving + receipt
- Software: bedrag + factuurdatum + tool-naam + abonnementsperiode + receipt
- Telefoon/internet: bedrag + factuurdatum + provider + receipt
- Klant-cadeaus: bedrag + datum + klant + cadeau-omschrijving + receipt
- Anders: bedrag + datum + uitgebreide omschrijving + receipt

**Receipt-upload**: ALTIJD verplicht (PDF of foto) via Supabase Storage.

**Project-koppeling**: ALTIJD verplicht — dropdown met "intern Ascentra" + alle actieve klant-projecten.

**BTW**: alleen bruto-bedrag invullen door employee. Admin splitst BTW vóór Nmbrs-push.

**Approval**: alle declaraties admin-approval. Na approval push naar Nmbrs als salaris-component → mee in eerstvolgende loonstrook.

**Status-flow**: `submitted` → `approved` / `rejected` (met reason) → `paid` (na Nmbrs-push).

### 3.6 Contract (`/contract`)

**Schema bestaat niet** — nieuw `contracts` tabel: `id, employee_id, start_date, end_date, job_title, pdf_storage_path, uploaded_at, uploaded_by`. Supabase Storage met RLS (employee mag alleen eigen contracten zien).

**Multi-contract tijdlijn**: bij verlenging wordt nieuw record toegevoegd; alle vorige blijven leesbaar voor employee + admin chronologisch.

**Toon**: minimale metadata (PDF-link + start-datum + eind-datum + functietitel). Alle details staan in PDF zelf.

**Upload**: alleen admin via `/admin/medewerkers/[id]` → "Contract toevoegen"-actie.

### 3.7 Loonstroken (`/loonstroken`)

**Real-time uit Nmbrs SOAP** — `EmployeeService_GetEmployeePayslips` voor lijst-fetch + `EmployeeService_GetPayslipPdf` voor on-demand PDF-stream. Geen Casella-storage, geen cache.

**UI**: tabel met jaar/maand/bedrag/beschikbaar-vanaf-datum + per-rij download-icoon. PDF opent in nieuw tab.

**Acceptable load-time**: 1-3s bij eerste page-view (Nmbrs SOAP latency).

**Jaaropgave**: aparte sectie onderaan; ook real-time uit Nmbrs (`EmployeeService_GetYearStatement` of vergelijkbaar).

### 3.8 Bonus + Care Package (`/bonus`, `/winstdeling`)

#### 3.8.1 Bonus (`/bonus`) — auto-formule per artikel 7

Alle Ascentra-medewerkers volgen het bonus-framework uit Martijn's contract artikel 7. Per-medewerker variabele percentages/tarieven via contract-velden.

**Per-contract velden** (nieuwe velden op `contracts` tabel):
- `bruto_salaris_maand` (numeric)
- `vakantietoeslag_pct` (default 8.0)
- `baseline_tarief_per_uur` (default 75.00, excl BTW)
- `bonus_pct_below_baseline` (default 10.0)
- `bonus_pct_above_baseline` (default 15.0)
- `max_overperformance_pct` (default 20.0)
- `auto_stelpost_actief` (boolean, false initially)
- `auto_stelpost_bedrag_maand` (default 1000.00)

**Per-project veld** (nieuw op `projects` tabel):
- `hourly_rate_excl_btw` (numeric — Factuurtarief)

**Admin-config jaarlijks** (nieuw `bonus_config` tabel):
- `year` (int)
- `werkgeverslasten_pct` (default 30.0)
- `indirecte_kosten_per_maand` (default 500.00)
- `werkbare_uren_per_maand` (afgeleid uit kalender, ma-vr min NL-feestdagen)

**Berekening per maand per project**:
```
bruto_omzet      = SUM(approved hour_entries) × project.hourly_rate_excl_btw
direct_kosten    = bruto_salaris + bruto_salaris × werkgeverslasten_pct + (vakantietoeslag_jaarlijks/12) + (auto_stelpost_actief ? auto_stelpost_bedrag_maand : 0)
indirect_kosten  = config.indirecte_kosten_per_maand
nettowinst_maand = bruto_omzet - direct_kosten - indirect_kosten
```

**Baseline-check** (rolling 12 mnd):
- Een maand kwalificeert als "ingezet" wanneer ≥50% werkbare uren gefactureerd EN tarief ≥`baseline_tarief_per_uur`
- Ziekte/zwangerschap/verlof/overmacht uitgesloten van noemer
- ≥9 ingezette maanden → `bonus_pct_above_baseline` (15%)
- <9 → `bonus_pct_below_baseline` (10%)

**Over-performance addendum**: admin handmatig via `/admin/bonus` UI — verhoogt % retroactief op bestaande accruals (max `max_overperformance_pct`).

**Uitbetaling**: bij project-close — `bonus_ledger` payout-record, push naar Nmbrs als loon-component, binnen 30 dagen.

**Saldo-tracking** (op `/bonus`):
- YTD running accrual (lopende bonus, nog niet uitbetaald)
- Historie van payouts
- Per-project breakdown (omzet/kosten/winst/bonus%)
- Indicatie volgende uitbetaling (geschatte datum)

**Schema-uitbreiding** `bonus_ledger`:
- Bestaande: id, employee_id, type (accrual/adjustment/payout), amount_cents, reason, created_at
- Toevoegen: `project_id` (FK, nullable), `bonus_period_start`, `bonus_period_end`, `pct_applied`

#### 3.8.2 Care Package (`/winstdeling`) — apart

Aparte tab volgens artikel 21:
- Jaarlijkse winstdeling per vennootschap (Ascentra/Operis/Astra) — default 1% van vennootschapsnettowinst
- Exitparticipatie bij verkoop/overdracht (% per event in overleg, evt. bindend advies)

**Schema** — nieuw `care_package_ledger` tabel:
- `id, employee_id, type (annual_distribution/exit_payout), company (ascentra/operis/astra), amount_cents, year, transaction_ref, created_at`

**UI**: jaarlijks overzicht per vennootschap + exit-events historie + claims (na 6mnd post-employment) per artikel 21.15.

**Apart van /bonus** — verschillende juridische basis, andere uitbetaling-cadans, andere belastingbehandeling (loon vs. winstdeling).

### 3.9 Werkgeversverklaring (`/werkgeversverklaring`)

**Custom form per purpose**:
- **Hypotheek**: NHG-checkbox + lening-bedrag-indicatief + hypotheekverstrekker-naam
- **Huur**: verhuurder-naam + verhuurder-adres + maandhuur
- **Anders**: vrije reden uitgebreid (min 50 chars)

Plus voor alle: datum-nodig-voor + opmerking optioneel.

**Auto-PDF-generatie** via `@react-pdf/renderer` (server-side, TS-native, component-based):
- Per-purpose template (NHG-style voor hypotheek, generiek voor huur/anders)
- Auto-fill: werknemer-data uit `employees` + werkgever-data uit Ascentra-config + contract-data uit `contracts` (huidig actief contract) + bonus-indicatie (gemiddeld laatste 12 mnd uit `bonus_ledger`) + vakantietoeslag uit contract + uren/week uit contract

**Auto-sign**:
- Admin uploadt eenmalig handtekening-image (PNG transparency) + functie/naam in `/admin/settings`
- Casella plakt automatisch handtekening-image + datum + Ascentra-logo + stempel op gegenereerde PDF
- Status flow: `requested` → instant `delivered` (geen tussenstadia)

**Audit-log**: wie aanvroeg, wanneer gegenereerd, wanneer gedownload (1+ keer).

**Geldigheid**: PDF metadata toont generatie-datum; banken accepteren typisch ≤3 mnd oud (UI toont waarschuwing als ouder). Employee kan opnieuw genereren wanneer nodig.

**AstraSign-integratie** (cryptografische signing): gedeferred naar Fase 4.

### 3.10 Profiel & instellingen (`/profiel`)

| Veld | Wijzig-flow | Notities |
|---|---|---|
| Telefoon | Direct (`employees.phone`) | — |
| Noodcontact (naam + tel) | Direct (`employees.emergency_contact_*`) | — |
| Thema-voorkeur | Direct (al bestaand) | light/dark/system |
| Adres-wijziging | Verzoek → admin approval → Nmbrs sync | Form: PDOK-picker |
| Bank-IBAN | Verzoek → admin → Nmbrs (payroll source-of-truth) | — |
| Email-notificatie-prefs | Direct (jsonb op employees) | Per type toggle (16 events) |
| Taal-voorkeur | Direct (`employees.language_preference`) | NL-only nu, schema-voorbereid |
| Avatar-upload | Direct (Supabase Storage path + RLS) | Fallback = bestaande gradient-monogram |
| Bio-tekst | Direct, max 500 chars | Internal display |
| 2FA / wachtwoord | Read-only badge "Beheerd via Microsoft" + deeplink naar account.microsoft.com | Entra SSO |

**Schema**: nieuwe velden op `employees`: `language_preference` (enum), `bio` (text, max 500), `avatar_storage_path` (text), `email_notification_preferences` (jsonb).

**Schema**: nieuwe tabel `employee_change_requests` met fields: `id, employee_id, type (address/iban), proposed_value (jsonb), status (pending/approved/rejected), created_at, decided_at, decided_by, rejection_reason`.

### 3.11 Inbox / notificaties (employee NotificationBell)

**Hergebruik** `notifications` tabel (system.ts) en `NotificationBell` component uit Fase 1.1b admin.

**Type-enum uitbreiden**:
- System events: `leave.approved`, `leave.rejected`, `expense.approved`, `expense.rejected`, `hours.rejected`, `hours.approved`, `statement.ready`, `payslip.available`, `contract.uploaded`, `bonus.paid`, `address.change.approved`, `iban.change.approved`
- Coaching tips: `vacation.balance.low`, `hours.missing.reminder`, `vacation.unused.year-end`
- Admin broadcasts: `broadcast.general`

**Admin-broadcast UI**: nieuwe `/admin/broadcasts` route — admin kan algemeen bericht sturen aan iedereen of geselecteerde employees (multi-select chips). Schema: `broadcasts` tabel met `id, message, target_employee_ids (uuid[] of null voor 'all'), created_by, created_at`. Inserts in `notifications` voor elke target.

### 3.12 Email-flows (16 events)

| # | Trigger | Recipient | In-app | Email | Bestaand |
|---|---|---|---|---|---|
| 1 | Welcome | Employee | ✓ | ✓ | ✅ |
| 2 | Wekelijkse uren-reminder | Employee | ✓ | ✓ | ✅ |
| 3 | Uren afgewezen | Employee | ✓ | ✓ | |
| 4 | Uren goedgekeurd | Employee | ✓ | ✓ | |
| 5 | Verlof-aanvraag ingediend | Admin | ✓ | ✓ | |
| 6 | Verlof goedgekeurd/afgewezen | Employee | ✓ | ✓ | |
| 7 | Verzuim/ziekmelding | Admin | ✓ | ✓ | |
| 8 | Declaratie ingediend | Admin | ✓ | ✓ | |
| 9 | Declaratie goedgekeurd/afgewezen | Employee | ✓ | ✓ | |
| 10 | Werkgeversverklaring klaar (auto) | Employee | ✓ | ✓ | |
| 11 | Pending termination T-7d reminder | Admin | ✓ | ✓ | |
| 12 | Verlof-saldo laag | Employee | ✓ | ✓ | |
| 13 | Bonus uitbetaald | Employee | ✓ | ✓ | |
| 14 | Loonstrook beschikbaar | Employee | ✓ | ✓ | |
| 15 | Adres-wijziging-verzoek | Admin | ✓ | ✓ | |
| 16 | IBAN-wijziging-verzoek | Admin | ✓ | ✓ | |

**Strategie**: ALLE 16 events sturen zowel in-app notification als email. Employee kan **per type** uitzetten via `/profiel` toggles (jsonb `email_notification_preferences`). Admin-events zijn niet uitschakelbaar (admin krijgt altijd alle admin-mails).

**Email templates** in `packages/email/src/templates/`:
- Bestaand: `welcome.ts`, `reminder.ts`
- Nieuw: 14 templates volgens patroon (NL, kort, link naar Casella-pagina, plain text + HTML)
- **Body + HTML-format per template wordt in een separaat addendum-document uitgewerkt** na initial schema-implementatie. Voor de eerste iteratie krijgen nieuwe templates **placeholder-bodies** (functioneel correct: subject + minimale body met dynamische velden + link naar Casella-pagina) zodat de trigger-infrastructuur kan worden gebouwd en getest. Definitieve copy + HTML-vormgeving + branding-styling volgt in addendum `2026-XX-XX-casella-email-templates.md` zodra de email-flows live staan en feedback verzameld is.

**Cron-jobs** voor reminders/saldo-warnings/termination-reminder via Vercel Cron (Fase 2 deploy).

## 4. Cross-cutting

### 4.1 Sidebar-fix (kritieke regressie)

EMPLOYEE_LINKS uitbreiden naar 7 routes:
- `/dashboard` (Home)
- `/uren` (Clock)
- `/verlof` (Calendar)
- `/verzuim` (Activity / HeartPulse)
- `/declaraties` (Receipt / Wallet)
- `/contract` (FileText)
- `/loonstroken` (Wallet)
- `/bonus` (Trophy / TrendingUp)
- `/winstdeling` (PieChart)
- `/werkgeversverklaring` (FileBadge)
- `/profiel` (User)

Inbox-bell rechtsboven in TopBar (à la admin sinds 1.1b).

### 4.2 Schema-overzicht (nieuwe / gewijzigde tabellen)

| Tabel | Status | Wijziging |
|---|---|---|
| `employees` | bestaand | + `language_preference`, `bio`, `avatar_storage_path`, `email_notification_preferences` (jsonb) |
| `contracts` | nieuw | id, employee_id, start_date, end_date, job_title, pdf_storage_path, bruto_salaris_maand, vakantietoeslag_pct, baseline_tarief_per_uur, bonus_pct_below/above_baseline, max_overperformance_pct, auto_stelpost_actief, auto_stelpost_bedrag_maand, uploaded_at, uploaded_by |
| `projects` | bestaand | + `hourly_rate_excl_btw` (numeric) |
| `expense_claims` | nieuw | id, employee_id, category (enum), project_id (FK), amount_cents, vat_amount_cents (admin-set), date, description, receipt_storage_path, status (submitted/approved/rejected/paid), submitted_at, decided_at, decided_by, rejection_reason, paid_at, nmbrs_synced_at |
| `bonus_ledger` | bestaand | + `project_id` (FK, nullable), `bonus_period_start`, `bonus_period_end`, `pct_applied` |
| `bonus_config` | nieuw | year, werkgeverslasten_pct, indirecte_kosten_per_maand, werkbare_uren_per_maand |
| `care_package_ledger` | nieuw | id, employee_id, type (annual_distribution/exit_payout), company (enum: ascentra/operis/astra), amount_cents, year, transaction_ref, created_at |
| `leave_requests` | bestaand | uitbreiden met type-velden voor uitgebreide types (zie 3.3); optioneel sub-table `leave_request_attachments` voor verklaring-uploads |
| `employee_change_requests` | nieuw | id, employee_id, type (address/iban), proposed_value (jsonb), status, created_at, decided_at, decided_by, rejection_reason |
| `broadcasts` | nieuw | id, message, target_employee_ids (uuid[] of null), created_by, created_at |
| `notifications` | bestaand | type-enum uitbreiden |
| `statements` | bestaand | + `nhg_indicator`, `lender_name`, `loan_amount_indicative_cents`, `landlord_name`, `landlord_address`, `monthly_rent_cents`, `purpose_other_reason` (allemaal nullable, gebruikt afhankelijk van purpose) |

### 4.3 Nieuwe routes

**Employee** (10 nieuwe):
- `/verlof` + `/verlof/aanvragen` (subroute voor form)
- `/verzuim`
- `/declaraties` + `/declaraties/nieuw`
- `/contract`
- `/loonstroken`
- `/bonus`
- `/winstdeling`
- `/werkgeversverklaring`
- `/profiel`

**Admin** (5 nieuwe):
- `/admin/verlof` (approval queue)
- `/admin/verzuim` (read-only overview)
- `/admin/declaraties` (approval queue)
- `/admin/bonus` (over-performance addenda + bonus-config + per-employee saldo-overzicht)
- `/admin/broadcasts` (algemene berichten)
- Plus uitbreiding `/admin/medewerkers/[id]` met contract-upload + change-request-handling

**API** (~25 nieuwe endpoints):
- `/api/admin/verlof/[id]/(approve|reject)`
- `/api/verlof/(submit|cancel)`
- `/api/verzuim/(submit|recover)`
- `/api/declaraties` (POST submit), `/api/admin/declaraties/[id]/(approve|reject)`
- `/api/contract/[id]/download` (signed URL)
- `/api/loonstroken` (lijst + on-demand PDF-stream)
- `/api/bonus/saldo`
- `/api/winstdeling/saldo`
- `/api/werkgeversverklaring` (POST request → instant generated PDF)
- `/api/profiel` (PATCH direct fields), `/api/profiel/change-request` (POST address/iban)
- `/api/admin/broadcasts` (POST send)
- `/api/notifications` (GET + mark-read)

## 5. Architectuurbeslissingen samengevat

| Beslissing | Keuze | Rationale |
|---|---|---|
| Saldo-bron verlof | Nmbrs leidend, nachtelijke sync | Geen dubbele source-of-truth; payroll = ultiem |
| Eenheid verlof | Vrije uren (4u/8u/etc) | Past bij hour_entries precision; flexibeler dan dagen |
| Visibility verlof | Privé | Privacy-first; <25 mensen — admin overziet |
| Goedkeuring verlof | Per-type | Wettelijk-noodzakelijk = self-approve; planbaar = admin |
| Verzuim AVG | Geen medische details | Wet vereist; admin krijgt alleen "ziekgemeld" |
| Receipt-upload | Verplicht | BTW-aftrek + audit-trail |
| Project-koppeling declaratie | Verplicht (intern of klant) | Doorbelasting helder |
| BTW-handling | Bruto van employee, admin splitst | Eenvoud + fiscale correctheid via admin |
| Reimbursement | Via Nmbrs salaris-component | Single payroll-bron; transparant op loonstrook |
| Contract-historie | Multi-contract tijdlijn | Verlengingen + audit; AAA |
| Loonstroken | Real-time uit Nmbrs | Geen storage-duplicatie; Nmbrs leidend |
| Bonus | Auto-formule | Eliminert handmatige berekening; transparant |
| Care Package | Apart van bonus | Verschillende juridische basis + cadans |
| Werkgeversverklaring | Auto-PDF + auto-sign | "Minimale effort" — instant delivery |
| Wachtwoord | Niet in Casella | Entra SSO leidend |
| Notifications | In-app + email beide | AAA: alle kanalen, employee toggle't email |

## 6. Wat NIET in scope (deferred)

- **AstraSign integratie** (cryptografische werkgeversverklaring-signing) → Fase 4
- **Mobile native app** → Fase 3
- **Wet poortwachter ziekteverzuim >4 wk** → admin handelt extern
- **Multi-tenant** → master spec §1.2: nee
- **Meertaligheid** (UI in EN/etc.) → schema-voorbereid via `language_preference`, geen i18n-implementatie nu
- **NHG-formele template-validatie** → MVP gebruikt NHG-style; formele NHG-acceptatie volgt na user-feedback
- **Echte KvK Handelsregister API** → admin-side; geen impact op employee-experience
- **Vercel cron-config** → Fase 2 deploy

## 7. Verificatie + testbaar gedrag

- Alle 16 email-templates leveren NL-tekst zonder placeholder-strings
- Verlof-saldo-display sync't binnen 24u na Nmbrs-update
- Werkgeversverklaring-PDF genereert <5s en bevat alle vereiste velden voor purpose
- Bonus-berekening reproduceerbaar bij rerun met zelfde inputs (deterministisch)
- Care Package jaarlijkse uitbetaling triggert binnen 2 mnd na vaststelling jaarrekening (admin-actie)
- Privacy: verzuim-records bevatten geen medische tekstvelden in DB
- Sidebar-link-test: alle EMPLOYEE_LINKS resolven naar bestaande routes (geen 404s)

## 8. Implementatievolgorde (aanbevolen voor implementatieplan)

1. **Fundament**: schema-uitbreidingen + sidebar-fix + email-toggle-prefs + change-request-flow + contract upload-UI
2. **Verlof**: 14 types + saldo-sync + per-type forms + admin-queue + email-templates 5 & 6
3. **Verzuim**: form + admin read-only + email-templates 7
4. **Declaraties**: schema + 8 categorieën + admin-queue + Nmbrs-push + email-templates 8 & 9
5. **Bonus + Care Package**: contract-velden + project-tarief + bonus_config + auto-formule + per-project accrual + Care Package ledger + admin over-performance UI + email-template 13
6. **Loonstroken**: Nmbrs SOAP-endpoint + UI
7. **Contract**: storage + tijdlijn-UI
8. **Werkgeversverklaring**: schema-velden + per-purpose form + @react-pdf/renderer templates + auto-sign + email-template 10
9. **Profiel**: alle velden + email-prefs + change-request-handling
10. **Inbox**: type-enum-uitbreiding + employee-bell-mount + admin-broadcasts UI
11. **Dashboard**: hero + saldo-strip + action-strip + documenten-section
12. **Cross-cutting email-flows**: 14 nieuwe templates + cron-triggers (Vercel cron in Fase 2)
13. **Sanity-check + PR**

Each step gets its own commit + sanity-check. Total: ~6-8 sub-fases binnen Fase 1.6.

## 9. Volgende stap

Implementatieplan via `superpowers:writing-plans` skill. Spec-document committed naar `docs/superpowers/specs/2026-04-27-casella-employee-experience-design.md`.
