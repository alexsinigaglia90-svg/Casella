# Casella — Design Spec

**Datum:** 2026-04-23
**Status:** Goedgekeurd (brainstorm-fase) — klaar voor implementatieplan
**Auteurs:** Alex Sinigaglia (Ascentra), Claude

---

## 1. Productcontext

**Casella** is het interne medewerkerportaal van **Ascentra**, een strategische supply chain consultancy + logistiek bedrijf.

### 1.1 Doel

Medewerkers kunnen via één portaal:

- Hun **contract** inzien
- **Uren opgeven** per project/klus (inclusief automatische kilometerberekening)
- **Verlof** aanvragen
- **Verzuim** (ziekmelding + hersteldmelding) doorgeven
- Hun **opgebouwde bonus** inzien
- Een **werkgeversverklaring** aanvragen
- Hun **loonstroken** inzien

Administratief beheer (goedkeuringen, project-aanmaken, bonusmutaties, werkgeversverklaring-uitgifte) gebeurt door admins in dezelfde applicatie.

### 1.2 Scope & schaal

- **Gebruikers**: < 25 medewerkers (Ascentra-personeel)
- **Multi-tenancy**: nee — puur intern, één organisatie
- **Platforms**: web-first (fase 1), native iOS + Android later (fase 2)
- **Taal**: Nederlands only in v1 (structuur voorbereid op meertaligheid later)
- **Compliance**: AVG — persoonsgegevens in EU-regio

### 1.3 Buiten scope (v1)

- Multi-tenant / meerdere bedrijven op hetzelfde portaal
- Salarisverwerking zelf (blijft in Nmbrs)
- Declaraties anders dan kilometers (later)
- AstraSign API-koppeling (komt terug in fase 4)
- Self-hosted BAG-database (alleen overwegen bij extreem volume)

---

## 2. Architectuurbeslissingen (met rationale)

| Beslissing | Keuze | Rationale |
|---|---|---|
| **Language** | TypeScript, overal | Eén taal voor backend + web + mobiel = gedeelde types, API-contracten die compile-time veilig zijn, maximale AI-leverage |
| **Mobile aanpak** | React Native + Expo | Native apps in App Store / Play Store, shared codebase met web, snelle iteratie. Volledig native (Swift+Kotlin) is 3× werk zonder significant winst voor formulier-gedreven HR-app |
| **Web framework** | Next.js 15 (App Router) | Full-stack in één deployment, server components voor performance, server actions voor mutaties, API-routes voor mobiel |
| **Database** | PostgreSQL via Supabase (EU/Frankfurt) | Managed Postgres, AVG-compliant, goedkoop, ingebouwde Row Level Security, storage inbegrepen |
| **ORM** | Drizzle | Type-safe, Postgres-native, leesbare migraties, goed op Supabase |
| **Auth** | Auth.js v5 + Microsoft Entra ID (SSO via 365) | Alle medewerkers hebben al 365 Business Standard. SSO elimineert wachtwoordbeheer; off-boarding is automatisch |
| **RBAC** | Rollen via Entra security groups | Rolbeheer in 365 dat admins al kennen; geen apart rollenscherm nodig |
| **Hosting** | Vercel (web) + Supabase (DB/storage) | Minimale ops, EU-regio, ~€45/maand op v1-schaal, schaalbaar zonder refactor |
| **Monorepo** | pnpm workspaces + Turborepo | Shared packages voor web + mobile + backend, caching, snelle builds |
| **Email** | Nodemailer via Ascentra's eigen SMTP | Jullie eigen mail-infra is al geconfigureerd; geen externe provider nodig |
| **Adressen** | PDOK Locatieserver (gratis NL-overheidsservice) | Officieel, gratis, gebaseerd op BAG, geen abonnement |
| **Routes/km** | Mapbox (free tier) | 100k requests/mnd gratis, ruim voldoende bij < 25 gebruikers; elke route gecached |
| **Signatures** | ManualUploadProvider (v1) → AstraSign later | AstraSign heeft nog geen API; abstractie achter interface maakt latere swap triviaal |
| **Error tracking** | Sentry (EU free tier) | Onmisbaar bij productie-debugging, gratis tier volstaat |
| **Nmbrs-sync** | Inline bij mutatie, fallback via email + retry-button | Simpel en robuust genoeg bij dit volume; geen aparte job-queue nodig |

### 2.1 Kostenindicatie (v1 operationeel)

| Dienst | Kosten/mnd |
|---|---|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| PDOK Locatieserver | €0 |
| Mapbox (directions) | €0 (free tier) |
| SMTP via Ascentra | €0 (eigen) |
| Sentry | €0 (free tier) |
| **Totaal** | **~€40–45** |

---

## 3. Stack (samengevat)

| Laag | Keuze |
|---|---|
| Taal | TypeScript |
| Web + API | Next.js 15 (App Router) |
| Mobiel (fase 3) | React Native + Expo (EAS Build) |
| Database | PostgreSQL (Supabase, EU/Frankfurt) |
| ORM | Drizzle |
| Auth | Auth.js v5 (web) + expo-auth-session (mobile), Entra ID provider |
| UI | Tailwind CSS + shadcn/ui |
| Validatie | Zod (gedeeld client/server) |
| Email | Nodemailer + React Email templates |
| Monorepo | pnpm workspaces + Turborepo |
| Hosting | Vercel (web) + Supabase (DB/storage) |
| Error tracking | Sentry |
| CI/CD | GitHub Actions |

---

## 4. Repositorystructuur

```
casella/
├── apps/
│   ├── web/                    Next.js 15 (UI + API routes)
│   └── mobile/                 React Native + Expo (fase 3)
├── packages/
│   ├── db/                     Drizzle schema + migraties + queries
│   ├── types/                  Gedeelde TS types + Zod schemas
│   ├── nmbrs/                  Nmbrs API client wrapper
│   ├── maps/                   PDOK + Mapbox + route-cache
│   ├── email/                  Nodemailer + React Email templates
│   ├── auth/                   Auth.js config + RBAC permissions
│   ├── signatures/             SignatureProvider interface
│   └── ui/                     Gedeelde UI-componenten (fase 3)
├── docs/
│   └── superpowers/specs/
├── .github/workflows/          CI/CD
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

**Regels:**
- Elke integratie (Nmbrs, maps, email, signatures) zit achter een eigen package met interface. Leverancier swappen = één package aanpassen.
- `apps/*` bevatten geen business logic; die leeft in `packages/` of in `services/` binnen de app.
- Gedeelde types leven één keer in `packages/types`.

---

## 5. Datamodel

### 5.1 Identity & HR

```sql
users
  id                PK
  entra_oid         unique         -- Entra ID object ID (persistent)
  email             unique
  display_name
  role              enum: admin | employee
  created_at, updated_at, disabled_at (nullable)

employees
  id                PK
  user_id           → users
  nmbrs_employee_id unique
  home_address_id   → addresses (nullable)
  employment_status enum: active | on_leave | sick | terminated
  start_date, end_date (nullable)
  default_km_rate_cents
  compensation_type enum: auto | ov | none
  manager_id        → users (nullable, voor toekomstige manager-hiërarchie)
  created_at, updated_at
```

### 5.2 Adressen & routes

```sql
addresses
  id                PK
  street, house_number, house_number_addition (nullable)
  postal_code, city, country (default 'NL')
  lat, lng                         -- gevuld via PDOK
  created_at

route_cache
  id                PK
  from_address_id   → addresses
  to_address_id     → addresses
  distance_km       numeric
  duration_sec      int
  computed_at
  unique(from_address_id, to_address_id)
```

### 5.3 Klanten & projecten

```sql
clients
  id                PK
  name
  kvk               (nullable)
  contact_name, contact_email, contact_phone (nullable)
  address_id        → addresses
  created_at, archived_at (nullable)

projects
  id                PK
  client_id         → clients
  name
  description       (nullable)
  start_date, end_date (nullable)
  status            enum: planned | active | completed | cancelled
  created_at, created_by → users

project_assignments
  id                PK
  project_id        → projects
  employee_id       → employees
  start_date, end_date (nullable)
  km_rate_cents     (nullable, overschrijft employee default)
  compensation_type (nullable, overschrijft employee default)
  created_at
```

### 5.4 Uren

```sql
hour_entries
  id                PK
  employee_id       → employees
  project_id        → projects
  work_date         date
  hours             numeric(4,2)
  km_cached         numeric (nullable)    -- gekopieerd uit route_cache bij save
  notes             (nullable)
  status            enum: draft | submitted | approved | rejected
  submitted_at, approved_at (nullable)
  approved_by       → users (nullable)
  rejection_reason  (nullable)
  nmbrs_synced_at   (nullable)
  created_at, updated_at
```

### 5.5 Verlof / verzuim

```sql
leave_requests
  id                PK
  employee_id       → employees
  leave_type        enum: vacation | special | parental | unpaid | other
  start_date, end_date
  reason            (nullable)
  status            enum: pending | approved | rejected | cancelled
  reviewed_by       → users (nullable)
  reviewed_at       (nullable)
  review_note       (nullable)
  nmbrs_synced_at   (nullable)
  created_at

sick_reports
  id                PK
  employee_id       → employees
  start_date
  end_date          (nullable — leeg = nog ziek)
  notes             (nullable)
  nmbrs_synced_at   (nullable)
  created_at
```

### 5.6 Werkgeversverklaringen

```sql
employer_statements
  id                         PK
  employee_id                → employees
  purpose                    enum: mortgage | rent | other
  purpose_note               (nullable)
  status                     enum: requested | generated | signed | delivered | cancelled
  generated_pdf_path         (nullable, Supabase Storage)
  signed_pdf_path            (nullable, handmatig geüpload door admin)
  signature_provider_ref     (nullable)  -- toekomst: AstraSign envelope-ID
  requested_at
  generated_at, signed_at, delivered_at (nullable)
```

### 5.7 Bonus

```sql
bonus_ledger                 -- append-only grootboek
  id                PK
  employee_id       → employees
  period            -- bv. '2026-Q2'
  amount_cents
  type              enum: accrual | adjustment | payout
  description       (nullable)
  created_at, created_by → users
```

*Exacte bonus-berekeningslogica wordt later gespecificeerd (aparte spec wanneer we de bonus-feature oppakken).*

### 5.8 Systeem

```sql
documents
  id                PK
  employee_id       → employees (nullable)
  document_type     enum: contract | signed_statement | other
  source            enum: nmbrs | upload
  storage_path                     -- Supabase Storage
  file_name, mime_type
  uploaded_by       → users (nullable)
  created_at

notifications
  id                PK
  user_id           → users
  type              -- bv. 'leave_approved'
  payload_json
  read_at           (nullable)
  created_at

audit_log                          -- AVG-verplicht
  id                PK
  actor_user_id     → users (nullable)
  action            -- bv. 'leave.approve'
  resource_type, resource_id
  changes_json      (nullable)
  created_at
```

### 5.9 Row Level Security (RLS)

- Medewerkers zien alleen **hun eigen** rijen in `hour_entries`, `leave_requests`, `sick_reports`, `employer_statements`, `bonus_ledger`, `documents`
- Admins zien alles
- Afgedwongen op DB-niveau via Supabase RLS policies (derde verdedigingslinie na frontend + backend)

---

## 6. Backend-architectuur

### 6.1 Lagen

```
app/api/*/route.ts     HTTP-handlers (auth, validatie, delegeer naar service)
services/*             Business logic (leave, hours, nmbrs, etc.)
  ↓
packages/db            Drizzle queries, transacties
packages/nmbrs         Nmbrs API
packages/maps          PDOK + Mapbox
packages/email         SMTP
packages/signatures    Signature providers
```

### 6.2 Regels

- **Routes bevatten geen business logic.** Max 30 regels: auth check, Zod-validatie, service-aanroep, response-mapping.
- **Services zijn pure waar mogelijk.** Side-effects expliciet.
- **Transacties** voor mutaties die meerdere tabellen raken (bv. goedkeuring → update status + audit_log + Nmbrs-push).
- **Alle HR-mutaties schrijven naar `audit_log`** via centrale `auditMutation()` helper.

### 6.3 API-conventies

- REST voor resources: `GET /api/hours`, `POST /api/hours`, `PATCH /api/hours/:id/approve`
- Server Actions voor formulieren op web
- Gedeelde Zod-schemas in `packages/types` → web, API en mobile valideren identiek

---

## 7. Frontend (web) architectuur

### 7.1 Routestructuur

```
app/
├── (public)/                    Landing + login
├── (authed)/                    Alleen met sessie
│   ├── dashboard/
│   ├── uren/
│   ├── verlof/
│   ├── verzuim/
│   ├── contract/
│   ├── loonstroken/
│   ├── bonus/
│   ├── werkgeversverklaring/
│   └── profiel/
├── (admin)/                     Alleen met role=admin
│   ├── medewerkers/
│   ├── klanten/
│   ├── projecten/
│   ├── goedkeuringen/
│   ├── werkgeversverklaringen/
│   └── bonus/
└── api/
```

### 7.2 Rendering-strategie

- Server Components als default
- Client Components alleen waar nodig (formulieren, interactiviteit)
- Server Actions voor mutaties
- `useOptimistic` voor snappy goedkeuringsflows

### 7.3 UI-framework

- **Tailwind CSS + shadcn/ui** als basis
- Licht/donker thema vanaf dag 1
- Taal: NL (via `next-intl` met locale `nl` actief, structureel voorbereid op EN)

### 7.4 Design-integratieflow

De feature-ontwikkeling volgt een drie-stappen proces:

1. **Skeleton hier**: werkende backend + data-ophalen + basis-UI (Tailwind) per pagina
2. **UI ontwerp in Claude-design** (artifacts): jij ontwerpt de visuele laag
3. **Integratie hier**: design wordt als client-component op de data-laag gelegd, aangesloten op echte data/routes/permissies

Codestructuur faciliteert dit door strikte scheiding tussen **data-laag** (server component) en **view-laag** (client component met props).

---

## 8. Authenticatie & autorisatie

### 8.1 Authenticatie

**Web:**
1. "Log in met Microsoft" → Auth.js redirect naar login.microsoftonline.com
2. Succes → Auth.js callback → Graph `/me/memberOf` voor groepen
3. Upsert in `users` (eerste login = auto-create)
4. Role bepalen via mapping `entraGroupId → role` in code
5. Sessie-cookie + Auth.js JWT

**Mobiel (fase 3):**
- `expo-auth-session` met OAuth2 PKCE tegen zelfde Entra tenant
- Token in Expo SecureStore
- API-calls met `Authorization: Bearer <jwt>`
- Backend valideert JWT via Entra signing keys

### 8.2 Autorisatie (RBAC)

- Centrale `packages/auth/permissions.ts`: `can(user, action, resource?)`
- Check op drie niveaus:
  1. Frontend: UI hiden
  2. Backend: permission check per route
  3. Database: RLS policy
- Entra security groups bepalen rollen:
  - `Casella-Admins` → `admin`
  - iedereen anders → `employee`
- Uitbreidbaar: nieuwe rol toevoegen = nieuwe Entra group + mapping-entry + permission-lijst

---

## 9. Integraties

### 9.1 Nmbrs

- **Package**: `packages/nmbrs` — client achter interface
- **Auth**: API-token in env var
- **Richting**:
  - *Pull* (periodiek + on-demand): medewerkers, contracten, loonstroken, verlofsaldi
  - *Push* (inline bij mutatie): goedgekeurd verlof, ziekmelding/hersteldmelding, goedgekeurde uren
- **Sync-aanpak (simpel)**:
  - Push gebeurt inline na goedkeuring (transactie commit → Nmbrs call)
  - Success: `nmbrs_synced_at = now()`
  - Failure: `nmbrs_synced_at` blijft NULL → email naar admin met foutmelding
  - Admin heeft per record een **"opnieuw proberen"** knop
  - Geen job-queue, geen worker, geen sync-dashboard

### 9.2 PDOK Locatieserver

- **Package**: `packages/maps` (samen met Mapbox)
- Postcode + huisnummer → volledig adres + lat/lng
- Gratis overheidsservice, geen auth

### 9.3 Mapbox (directions)

- Afstand tussen twee lat/lng coördinaten
- Elke `(home × client)` paar: één call → `route_cache`
- Hour entry gebruikt cached waarde; herberekend alleen bij adreswijziging
- Geen persoonsgegevens verlaten onze infra via Mapbox (alleen coördinaten)

### 9.4 Email (Ascentra SMTP)

- **Package**: `packages/email`
- Nodemailer + React Email templates
- Env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Fallback: als Ascentra tenant basic SMTP auth uitschakelt → migreren naar Microsoft Graph `sendMail` met Entra App Registration
- Gebruikt voor: welkomst, verlof-status, uren-herinnering, werkgeversverklaring-klaar, Nmbrs-sync-failure-notificatie

### 9.5 Signatures

- **Package**: `packages/signatures`
- Interface `SignatureProvider`:
  - `requestSignature(pdf, signer) → envelopeId`
  - `getStatus(envelopeId) → status`
  - `downloadSigned(envelopeId) → Buffer`
- **V1**: `ManualUploadProvider` — admin upload getekende PDF via admin-UI
- **Toekomst**: `AstraSignProvider` drop-in wanneer AstraSign API beschikbaar is

### 9.6 Push notifications (fase 3)

- Expo Push Notifications (gratis)
- `push_tokens` tabel per user
- Backend stuurt via Expo HTTP API

---

## 10. Security & compliance

### 10.1 Datalokatie (AVG)

| Dienst | Lokatie | Persoonsgegevens? |
|---|---|---|
| Supabase | EU (Frankfurt) | Ja |
| Vercel | EU | Ja (request-routing) |
| PDOK | NL (overheid) | Nee (alleen adres-lookup) |
| Mapbox | Extern | Nee (alleen coördinaten) |
| Nmbrs | NL | Ja (bestaande verwerker) |
| Ascentra SMTP | Jullie eigen | Ja |
| Sentry | EU | Error metadata (geen persoonsgegevens in payload) |

### 10.2 Authenticatie & autorisatie

- MFA: afgedwongen op Entra ID-niveau (al in 365 Business Standard)
- Geen wachtwoorden in Casella; alles via Entra
- Drie-laagse autorisatie: frontend, backend, DB RLS
- Audit-log op alle HR-mutaties

### 10.3 Secrets

- Productie secrets in Vercel env vars
- Lokaal: `.env.local` (git-ignored)
- `.env.example` met dummy waarden wel in git
- Service accounts minimale scope (Entra app: `User.Read`, `GroupMember.Read.All`)

### 10.4 Backups

- Supabase Pro: dagelijkse automatische backups, 7 dagen retentie
- Supabase Storage: versioning aan
- Optioneel later: wekelijkse export naar eigen S3/Backblaze

### 10.5 Vulnerability hygiëne

- Dependabot voor dependency updates
- GitHub security alerts
- `pnpm audit` in CI

---

## 11. Omgevingen & deployment

### 11.1 Omgevingen

| Omgeving | Web | DB | Nmbrs | Vanaf |
|---|---|---|---|---|
| local | `pnpm dev` op localhost | Supabase lokaal (Docker) | Nmbrs sandbox of mock | Fase 0 |
| preview | Vercel preview per PR | Supabase preview-branch per PR | Nmbrs sandbox of mock | Fase 2 |
| production | `casella.ascentra.nl` | Supabase prod (EU) | Nmbrs live | Fase 2 |

In Fase 0 en Fase 1 werken we uitsluitend lokaal; `preview` en `production` worden in Fase 2 opgezet.

**Regel:** productie DB is nooit bereikbaar vanaf lokaal. Migraties via CI bij merge naar `main`.

### 11.2 CI/CD (GitHub Actions)

*Bij push/PR:*
1. `pnpm install` (cache)
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build`

*Bij merge naar `main`:*
6. Drizzle migrate op prod DB
7. Vercel deploy production
8. Health-check smoketest

### 11.3 Logging & monitoring

- Vercel Logs (app-logs)
- Supabase Logs (DB-queries)
- Sentry (errors, web + mobiel)
- Geen APM in v1

---

## 12. Fasering

### Fase 0 — Lokaal fundament

Alles werkend op localhost, nog geen externe betaalde infrastructuur. Wel aan te maken:

- **Entra ID app registration (dev)** met `http://localhost:3000/api/auth/callback/microsoft-entra-id` als redirect URI. Entra is jullie bestaande IdP en kost niets extra.
- **Mapbox dev-token** (gratis) voor km-berekening
- **PDOK** vereist geen auth

Stappen:

1. Monorepo setup (pnpm + Turborepo)
2. Next.js web app + Tailwind + shadcn/ui
3. Lokale Supabase (Docker via Supabase CLI) + Drizzle schema + migraties (alle tabellen uit §5)
4. Auth.js + Entra ID SSO werkend tegen lokale redirect URI
5. Basis layout + navigatie (medewerker + admin)
6. RLS policies actief op lokale Supabase
7. `.env.example` + README met setup-instructies (hoe dev-Entra-app aanmaken, Mapbox token ophalen, Supabase lokaal starten)
8. CI: typecheck + lint + test + build (nog geen deploy)

### Fase 1 — Features (per feature eigen mini-spec + Claude-design UI)

Allemaal lokaal gebouwd en getest. Per feature:

1. Uren registreren (+ PDOK + Mapbox + km-cache)
2. Verlof aanvragen + goedkeuren (+ Nmbrs-push)
3. Verzuim melden (+ Nmbrs-push)
4. Contract inzien (+ Nmbrs-pull)
5. Loonstroken inzien (+ Nmbrs-pull)
6. Bonus inzien (bonus-logica apart spec'en met stakeholder)
7. Werkgeversverklaring aanvragen + PDF-generatie + manual-upload ondertekening

### Fase 2 — Productie-infrastructuur

Nu pas cloud-diensten aanhaken:

1. Supabase productie-project (EU/Frankfurt)
2. Vercel project + domein `casella.ascentra.nl`
3. Entra ID app registration met prod redirect URIs
4. Sentry project (EU)
5. Productie SMTP-config aan Ascentra-mail hangen
6. Nmbrs productie-token
7. CI/CD deployment-stappen activeren
8. Eerste productie-deploy + smoketest
9. Eindgebruikers-onboarding

### Fase 3 — Mobiel

1. Expo app in `apps/mobile`, shared packages aanhaken
2. Auth op mobiel (expo-auth-session + Entra)
3. Features 1-op-1 porten
4. Push notifications
5. EAS Build + release naar TestFlight + Play Console internal
6. App Store + Play Store review

### Fase 4 — Verfijning

- AstraSign API-integratie (wanneer beschikbaar)
- Eventueel self-hosted BAG als volume explodeert
- Volgende features naar wens (declaraties, rapportages, etc.)

---

## 13. Open vragen (voor latere specs)

- **Bonus-berekeningslogica** — stakeholder (Alex) specificeert bij feature-spec voor bonus
- **Werkgeversverklaring-template** — exacte velden en layout bij feature-spec
- **Default km-tarief(f)en** per medewerker — in te stellen per medewerker, start-waardes bij go-live
- **Verlof-types mapping** naar Nmbrs — welke Nmbrs-soortcodes corresponderen met `vacation | special | parental | unpaid | other`
- **E-mailteksten** per notificatie-type (welkomst, goedkeuring, afwijzing, herinnering, etc.)

---

## 14. Succescriteria

Casella v1 is succesvol als:

- Alle < 25 medewerkers kunnen inloggen met hun 365-account zonder apart wachtwoordbeheer
- Medewerkers vullen dagelijks hun uren in met automatisch berekende kilometers
- Verlof/verzuim-flows werken end-to-end inclusief Nmbrs-sync
- Admins doen alle goedkeuringen binnen het portaal
- Werkgeversverklaringen worden in minuten in plaats van dagen afgehandeld
- Operationele kosten blijven onder €50/maand in jaar 1
- AVG-compliance is aantoonbaar (audit-log, RLS, EU-datalokatie)
