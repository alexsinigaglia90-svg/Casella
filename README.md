# Casella

Medewerkerportaal voor Ascentra. Zie [design spec](docs/superpowers/specs/2026-04-23-casella-design.md) voor achtergrond en architectuur, en [Fase 0 plan](docs/superpowers/plans/2026-04-23-casella-fase-0.md) voor de implementatie-blueprint.

## Stack

TypeScript · Next.js 15 App Router · PostgreSQL (Supabase local) · Drizzle ORM · Auth.js v5 met Microsoft Entra ID · Tailwind + shadcn/ui · pnpm + Turborepo · Vitest.

## Lokaal opzetten (eerste keer)

### Prerequisites

- **Node 20+** (Node 24 aanbevolen — gepinned in `.nvmrc`)
- **pnpm 9.12.x** — installeer via corepack:
  ```bash
  corepack enable
  corepack prepare pnpm@9.12.0 --activate
  ```
  Als `corepack enable` faalt met EPERM op Windows (Node in Program Files), run als admin óf gebruik `corepack enable --install-directory "$env:APPDATA\npm"`.
- **Docker Desktop** (draaiend) — voor lokale Supabase Postgres.

### Entra ID dev app registration

Eenmalig, in Ascentra's Microsoft 365 tenant op [entra.microsoft.com](https://entra.microsoft.com):

1. **Applications → App registrations → + New registration**
   - Name: `Casella Dev`
   - Supported account types: **Single tenant**
   - Redirect URI (Web): `http://localhost:3000/api/auth/callback/microsoft-entra-id`
2. Noteer **Application (client) ID** en **Directory (tenant) ID** van de Overview-pagina.
3. **Certificates & secrets → + New client secret** (6–12 maanden expiry). Kopieer de **Value** meteen (eenmalig zichtbaar).
4. **API permissions → + Add a permission → Microsoft Graph → Delegated**: voeg `User.Read` en `GroupMember.Read.All` toe, klik dan **Grant admin consent for [tenant]**.

Maak daarna twee security groups in **Groups**:
- `Casella-Admins` — jij + HR-medewerker(s)
- `Casella-Employees` — alle Casella-gebruikers (inclusief admins)

Noteer de **Object ID** van beide groups.

### Repo setup

```bash
git clone <repo-url> casella
cd casella
pnpm install

# Kopieer env-templates
cp .env.example apps/web/.env.local
cp .env.example .env

# Vul apps/web/.env.local aan met:
# - AUTH_SECRET: genereer met `openssl rand -base64 32` of `npx auth secret`
# - AUTH_MICROSOFT_ENTRA_ID_ID + _SECRET + _ISSUER: uit Entra
# - ENTRA_ADMIN_GROUP_ID + ENTRA_EMPLOYEE_GROUP_ID: uit Entra
#
# .env (repo root) heeft alleen DATABASE_URL nodig voor drizzle-kit
```

### Supabase local starten + DB opzetten

```bash
# Start lokale Postgres (Docker) — eerste keer ~5 min image pull
pnpm db:up

# Generate en apply Drizzle migraties
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" pnpm db:generate
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" pnpm db:migrate

# Apply RLS policies (handmatig, buiten drizzle-kit journal)
docker exec -i supabase_db_Casella psql -U postgres -d postgres < packages/db/sql/rls.sql
```

Optioneel: open Supabase Studio op `http://127.0.0.1:54323` voor een SQL-UI.

### Dev server starten

```bash
pnpm dev
```

Open `http://localhost:3000`. Klik "Log in met Microsoft" → login met een Ascentra-account dat in `Casella-Employees` zit.

## Commands

| Command | Doet |
|---|---|
| `pnpm dev` | Start web dev server op localhost:3000 |
| `pnpm build` | Build alle apps (productie-output) |
| `pnpm typecheck` | Typecheck alle packages |
| `pnpm lint` | Lint alle apps (momenteel no-op in meeste packages) |
| `pnpm test` | Run alle tests (vitest) |
| `pnpm db:up` | Start lokale Supabase (Docker) |
| `pnpm db:down` | Stop lokale Supabase |
| `pnpm db:reset` | Reset lokale DB (drop + re-apply migraties) |
| `pnpm db:generate` | Drizzle: genereer migratie uit schema |
| `pnpm db:migrate` | Drizzle: apply pending migraties |
| `pnpm db:studio` | Drizzle Studio (schema browser) |

## Project structuur

```
casella/
├── apps/
│   └── web/                    Next.js 15 web app
├── packages/
│   ├── types/                  Gedeelde Zod schemas + types
│   ├── db/                     Drizzle ORM schema + client + RLS
│   └── auth/                   Auth.js v5 config + RBAC + Entra integratie
├── supabase/                   Supabase CLI config (lokale dev)
├── docs/superpowers/
│   ├── specs/                  Design specs
│   └── plans/                  Implementatieplannen per fase
└── .env.example
```

## Tests

Elke package heeft eigen tests:
- `packages/db/tests/rls.test.ts` — 7 RLS integratietests (vereist DATABASE_URL)
- `packages/auth/tests/permissions.test.ts` — 9 RBAC unit tests
- `packages/auth/tests/entra.test.ts` — 5 role-resolver tests

Run all: `pnpm test`.

## Troubleshooting

**`supabase start` faalt met "port already in use"**: een ander Supabase-project gebruikt dezelfde default-ports. Stop het met `pnpm exec supabase stop --project-id <naam>`.

**`pnpm db:generate` zegt "DATABASE_URL is niet gezet"**: exporteer de env-var eerst (of prefix met `DATABASE_URL="postgresql://..." pnpm db:generate`). Zie het `.env`-bestand aan de repo-root.

**Login loopt vast op Microsoft-pagina**: controleer de redirect URI in Entra — moet exact `http://localhost:3000/api/auth/callback/microsoft-entra-id` zijn.

**Build faalt op "Missing env var"**: `apps/web/.env.local` is niet volledig ingevuld. Controleer alle vijf `AUTH_MICROSOFT_ENTRA_ID_*` en `ENTRA_*_GROUP_ID` variabelen.

## Volgende stappen

Fase 0 is het lokale fundament. Volgende fases (elk met eigen spec + plan):

- **Fase 1** — Features: uren, verlof, verzuim, contract, loonstroken, bonus, werkgeversverklaring
- **Fase 2** — Productie-infrastructuur (Vercel, productie Supabase, Sentry, DNS)
- **Fase 3** — React Native mobile app
- **Fase 4** — Verfijning (AstraSign, push notifications, etc.)
