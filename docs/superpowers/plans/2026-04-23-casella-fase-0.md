# Casella Fase 0 — Lokaal Fundament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bouw een werkend lokaal fundament voor Casella: monorepo, Next.js web-app, lokale Supabase met compleet databaseschema en RLS, werkende SSO via Entra ID, role-based layouts en navigatie, groene CI. Na dit plan kan elke Fase 1 feature-spec erop verder bouwen.

**Architecture:** pnpm + Turborepo monorepo. Next.js 15 App Router in `apps/web`. Gedeelde packages: `packages/db` (Drizzle), `packages/auth` (Auth.js v5 + permissions), `packages/types` (Zod-schemas). Lokale Supabase Postgres via Docker CLI. Geen externe hosting; alleen Entra ID (bestaande 365-tenant) voor SSO.

**Tech Stack:** TypeScript 5.5+, pnpm 9+, Turborepo 2, Next.js 15, React 19, Tailwind 3.4, shadcn/ui, Drizzle ORM + drizzle-kit, PostgreSQL 15 (Supabase local), Auth.js v5 (NextAuth), Zod, Vitest, GitHub Actions.

**Spec reference:** `docs/superpowers/specs/2026-04-23-casella-design.md`

---

## Preconditions (externe acties door user, vóór starten)

De user regelt dit eenmalig, buiten de plan-executie om:

1. **Node 20+ en pnpm 9+ geïnstalleerd** op de dev-machine
2. **Docker Desktop** geïnstalleerd en draaiend (Supabase local vereist Docker)
3. **Supabase CLI** geïnstalleerd: `npm install -g supabase` of via scoop/brew
4. **Entra ID app registration (dev)** in Ascentra's Microsoft 365 tenant:
   - Portal: `entra.microsoft.com` → App registrations → New registration
   - Name: `Casella Dev`
   - Supported account types: *Single tenant* (Ascentra only)
   - Redirect URI (type Web): `http://localhost:3000/api/auth/callback/microsoft-entra-id`
   - Na aanmaak: noteer `Application (client) ID` en `Directory (tenant) ID`
   - Certificates & secrets → New client secret → kopieer value meteen (alleen één keer zichtbaar)
   - API permissions → add → Microsoft Graph → Delegated → `User.Read`, `GroupMember.Read.All` → Grant admin consent
5. **Twee Entra security groups** aangemaakt en gevuld:
   - `Casella-Admins` (jouw admin + HR-medewerker)
   - `Casella-Employees` (iedereen, inclusief admins)
   - Noteer beide group object IDs
6. **Mapbox dev-token** aangemaakt (gratis) op `mapbox.com/account/access-tokens` — niet strikt nodig in Fase 0, wel handig als we in Fase 1 gaan bouwen

Deze waarden gaan straks in `.env.local` (Task 14).

---

## File Structure (aan einde van Fase 0)

```
casella/
├── .github/workflows/
│   └── ci.yml
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (public)/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx              Landing + login-knop
│       │   ├── (authed)/
│       │   │   ├── layout.tsx            Session guard + medewerker-nav
│       │   │   └── dashboard/page.tsx    Placeholder
│       │   ├── (admin)/
│       │   │   ├── layout.tsx            Role guard + admin-nav
│       │   │   └── dashboard/page.tsx    Placeholder
│       │   ├── api/auth/[...nextauth]/route.ts
│       │   ├── layout.tsx                Root HTML
│       │   └── globals.css
│       ├── components/
│       │   ├── nav-employee.tsx
│       │   ├── nav-admin.tsx
│       │   └── ui/                       shadcn components
│       ├── lib/
│       │   └── utils.ts                  cn() helper
│       ├── tests/
│       │   └── smoke.test.ts
│       ├── auth.ts                       Auth.js v5 config instance
│       ├── middleware.ts
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.mjs
│       ├── components.json               shadcn config
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── db/
│   │   ├── drizzle/                      gegenereerde migraties (.sql)
│   │   ├── src/
│   │   │   ├── index.ts                  exports drizzle client
│   │   │   ├── client.ts                 postgres connection
│   │   │   ├── schema/
│   │   │   │   ├── index.ts              re-exports all
│   │   │   │   ├── enums.ts              pg enums
│   │   │   │   ├── identity.ts           users, employees
│   │   │   │   ├── addresses.ts          addresses, route_cache
│   │   │   │   ├── work.ts               clients, projects, project_assignments
│   │   │   │   ├── hours.ts              hour_entries
│   │   │   │   ├── leave.ts              leave_requests, sick_reports
│   │   │   │   ├── statements.ts         employer_statements
│   │   │   │   ├── bonus.ts              bonus_ledger
│   │   │   │   └── system.ts             documents, notifications, audit_log
│   │   │   └── rls/
│   │   │       └── 0001_enable_rls.sql   RLS policies
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── auth/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── config.ts                 Auth.js shared config
│   │   │   ├── entra.ts                  Entra provider + group→role mapping
│   │   │   ├── upsert.ts                 Upsert user on first SSO
│   │   │   └── permissions.ts            can() + role matrix
│   │   ├── tests/
│   │   │   └── permissions.test.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── types/
│       ├── src/
│       │   ├── index.ts
│       │   └── common.ts                 shared Zod primitives
│       ├── tsconfig.json
│       └── package.json
├── supabase/
│   └── config.toml                       supabase init output
├── docs/
│   └── superpowers/
│       ├── specs/2026-04-23-casella-design.md
│       └── plans/2026-04-23-casella-fase-0.md   (dit bestand)
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── README.md
```

---

## Task 1: Repo scaffolding — pnpm workspace + Turborepo

**Files:**
- Create: `.nvmrc`
- Create: `.gitignore`
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`

- [ ] **Step 1.1: Create `.nvmrc`**

```
20
```

- [ ] **Step 1.2: Create `.gitignore`**

```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
.turbo/
*.tsbuildinfo

# Env
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Supabase
supabase/.branches/
supabase/.temp/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Coverage
coverage/
.nyc_output/
```

- [ ] **Step 1.3: Create root `package.json`**

```json
{
  "name": "casella",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "db:generate": "pnpm -F @casella/db generate",
    "db:migrate": "pnpm -F @casella/db migrate",
    "db:studio": "pnpm -F @casella/db studio"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0"
  }
}
```

- [ ] **Step 1.4: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 1.5: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 1.6: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist", "build", ".next"]
}
```

- [ ] **Step 1.7: Install and verify**

Run: `pnpm install`
Expected: exits with 0, creates `node_modules/` and `pnpm-lock.yaml`.

Run: `pnpm turbo --version`
Expected: prints Turbo version (2.x).

- [ ] **Step 1.8: Commit**

```bash
git add .nvmrc .gitignore package.json pnpm-workspace.yaml turbo.json tsconfig.base.json pnpm-lock.yaml
git commit -m "chore: initialize pnpm + Turborepo monorepo"
```

---

## Task 2: Next.js 15 web app skeleton

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/next-env.d.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`

- [ ] **Step 2.1: Create `apps/web/package.json`**

```json
{
  "name": "@casella/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --dir app --dir components --dir lib",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.5.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2.2: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "allowJs": true,
    "incremental": true,
    "noEmit": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2.3: Create `apps/web/next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
```

- [ ] **Step 2.4: Create `apps/web/next-env.d.ts`**

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 2.5: Create `apps/web/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casella",
  description: "Medewerkerportaal Ascentra",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2.6: Create `apps/web/app/page.tsx`**

```typescript
export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Casella</h1>
      <p>Medewerkerportaal Ascentra</p>
    </main>
  );
}
```

- [ ] **Step 2.7: Create `apps/web/app/globals.css` (leeg voor nu)**

```css
/* Tailwind directives worden in Task 3 toegevoegd */
```

- [ ] **Step 2.8: Install and verify**

Run from repo root: `pnpm install`
Run: `pnpm dev`
Open `http://localhost:3000` — verify "Casella" header zichtbaar.
Stop dev server (Ctrl+C).

- [ ] **Step 2.9: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 2.10: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): scaffold Next.js 15 app with landing page"
```

---

## Task 3: Tailwind CSS + shadcn/ui

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Modify: `apps/web/app/globals.css`
- Create: `apps/web/components.json`
- Create: `apps/web/lib/utils.ts`
- Create: `apps/web/components/ui/button.tsx` (via shadcn CLI)
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 3.1: Install Tailwind + dependencies**

Run from `apps/web/`:
```bash
pnpm add -D tailwindcss@^3.4 postcss autoprefixer tailwindcss-animate class-variance-authority clsx tailwind-merge
pnpm add lucide-react
```

- [ ] **Step 3.2: Create `apps/web/tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 3.3: Create `apps/web/postcss.config.mjs`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 3.4: Replace `apps/web/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }

  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 3.5: Create `apps/web/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3.6: Create `apps/web/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3.7: Add first shadcn component via CLI**

Run from `apps/web/`:
```bash
pnpm dlx shadcn@latest add button
```
Expected: creates `components/ui/button.tsx`.

- [ ] **Step 3.8: Replace `apps/web/app/page.tsx`**

```typescript
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">Casella</h1>
      <p className="text-muted-foreground">Medewerkerportaal Ascentra</p>
      <Button>Log in met Microsoft</Button>
    </main>
  );
}
```

- [ ] **Step 3.9: Verify**

Run from repo root: `pnpm dev`
Open `http://localhost:3000` — verify gestyled, button werkt visueel.
Stop dev server.

- [ ] **Step 3.10: Typecheck + lint**

```bash
pnpm typecheck
pnpm lint
```
Expected: no errors.

- [ ] **Step 3.11: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): add Tailwind + shadcn/ui with initial button"
```

---

## Task 4: packages/types — gedeelde Zod-schemas

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/common.ts`

- [ ] **Step 4.1: Create `packages/types/package.json`**

```json
{
  "name": "@casella/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "echo 'no lint'",
    "typecheck": "tsc --noEmit",
    "test": "echo 'no tests yet'"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 4.2: Create `packages/types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4.3: Create `packages/types/src/common.ts`**

```typescript
import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const nonEmptyStringSchema = z.string().min(1);

export const dateIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be ISO date (YYYY-MM-DD)");

export const roleSchema = z.enum(["admin", "employee"]);
export type Role = z.infer<typeof roleSchema>;
```

- [ ] **Step 4.4: Create `packages/types/src/index.ts`**

```typescript
export * from "./common";
```

- [ ] **Step 4.5: Install + typecheck**

Run from repo root:
```bash
pnpm install
pnpm -F @casella/types typecheck
```
Expected: no errors.

- [ ] **Step 4.6: Commit**

```bash
git add packages/types pnpm-lock.yaml
git commit -m "feat(types): initial shared Zod schemas package"
```

---

## Task 5: packages/db — Drizzle + verbinding

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema/index.ts` (tijdelijk leeg)

- [ ] **Step 5.1: Create `packages/db/package.json`**

```json
{
  "name": "@casella/db",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "studio": "drizzle-kit studio",
    "lint": "echo 'no lint'",
    "typecheck": "tsc --noEmit",
    "test": "echo 'no tests yet'"
  },
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0"
  }
}
```

- [ ] **Step 5.2: Create `packages/db/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": true
  },
  "include": ["src/**/*", "drizzle.config.ts"]
}
```

- [ ] **Step 5.3: Create `packages/db/drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is niet gezet");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
```

- [ ] **Step 5.4: Create `packages/db/src/client.ts`**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _client: ReturnType<typeof postgres> | undefined;
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is niet gezet");
  _client = postgres(url, { prepare: false });
  _db = drizzle(_client, { schema });
  return _db;
}

export type Database = ReturnType<typeof getDb>;
```

- [ ] **Step 5.5: Create `packages/db/src/schema/index.ts` (tijdelijk leeg)**

```typescript
// Re-exports worden in Tasks 6–9 toegevoegd
export {};
```

- [ ] **Step 5.6: Create `packages/db/src/index.ts`**

```typescript
export { getDb, type Database } from "./client";
export * as schema from "./schema";
```

- [ ] **Step 5.7: Install + typecheck**

Run:
```bash
pnpm install
pnpm -F @casella/db typecheck
```
Expected: no errors.

- [ ] **Step 5.8: Commit**

```bash
git add packages/db pnpm-lock.yaml
git commit -m "feat(db): scaffold Drizzle ORM client with empty schema"
```

---

## Task 6: Database schema — enums + identity + addresses

**Files:**
- Create: `packages/db/src/schema/enums.ts`
- Create: `packages/db/src/schema/identity.ts`
- Create: `packages/db/src/schema/addresses.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 6.1: Create `packages/db/src/schema/enums.ts`**

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "employee"]);

export const employmentStatusEnum = pgEnum("employment_status", [
  "active",
  "on_leave",
  "sick",
  "terminated",
]);

export const compensationTypeEnum = pgEnum("compensation_type", [
  "auto",
  "ov",
  "none",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planned",
  "active",
  "completed",
  "cancelled",
]);

export const hourStatusEnum = pgEnum("hour_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

export const leaveTypeEnum = pgEnum("leave_type", [
  "vacation",
  "special",
  "parental",
  "unpaid",
  "other",
]);

export const leaveStatusEnum = pgEnum("leave_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const statementPurposeEnum = pgEnum("statement_purpose", [
  "mortgage",
  "rent",
  "other",
]);

export const statementStatusEnum = pgEnum("statement_status", [
  "requested",
  "generated",
  "signed",
  "delivered",
  "cancelled",
]);

export const bonusLedgerTypeEnum = pgEnum("bonus_ledger_type", [
  "accrual",
  "adjustment",
  "payout",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "contract",
  "signed_statement",
  "other",
]);

export const documentSourceEnum = pgEnum("document_source", ["nmbrs", "upload"]);
```

- [ ] **Step 6.2: Create `packages/db/src/schema/addresses.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  doublePrecision,
  integer,
  unique,
} from "drizzle-orm/pg-core";

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  street: text("street").notNull(),
  houseNumber: text("house_number").notNull(),
  houseNumberAddition: text("house_number_addition"),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("NL"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const routeCache = pgTable(
  "route_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromAddressId: uuid("from_address_id")
      .notNull()
      .references(() => addresses.id, { onDelete: "cascade" }),
    toAddressId: uuid("to_address_id")
      .notNull()
      .references(() => addresses.id, { onDelete: "cascade" }),
    distanceKm: doublePrecision("distance_km").notNull(),
    durationSec: integer("duration_sec").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueRoute: unique().on(t.fromAddressId, t.toAddressId),
  })
);
```

- [ ] **Step 6.3: Create `packages/db/src/schema/identity.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
} from "drizzle-orm/pg-core";
import {
  userRoleEnum,
  employmentStatusEnum,
  compensationTypeEnum,
} from "./enums";
import { addresses } from "./addresses";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  entraOid: text("entra_oid").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("employee"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  nmbrsEmployeeId: text("nmbrs_employee_id").unique(),
  homeAddressId: uuid("home_address_id").references(() => addresses.id),
  employmentStatus: employmentStatusEnum("employment_status")
    .notNull()
    .default("active"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  defaultKmRateCents: integer("default_km_rate_cents").notNull().default(23),
  compensationType: compensationTypeEnum("compensation_type")
    .notNull()
    .default("auto"),
  managerId: uuid("manager_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

- [ ] **Step 6.4: Update `packages/db/src/schema/index.ts`**

```typescript
export * from "./enums";
export * from "./addresses";
export * from "./identity";
```

- [ ] **Step 6.5: Typecheck**

```bash
pnpm -F @casella/db typecheck
```
Expected: no errors.

- [ ] **Step 6.6: Commit**

```bash
git add packages/db
git commit -m "feat(db): add enums + identity + addresses schemas"
```

---

## Task 7: Database schema — clients, projects, hours

**Files:**
- Create: `packages/db/src/schema/work.ts`
- Create: `packages/db/src/schema/hours.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 7.1: Create `packages/db/src/schema/work.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
} from "drizzle-orm/pg-core";
import { projectStatusEnum, compensationTypeEnum } from "./enums";
import { addresses } from "./addresses";
import { users, employees } from "./identity";

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  kvk: text("kvk"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  addressId: uuid("address_id")
    .notNull()
    .references(() => addresses.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: projectStatusEnum("status").notNull().default("planned"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});

export const projectAssignments = pgTable("project_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  kmRateCents: integer("km_rate_cents"),
  compensationType: compensationTypeEnum("compensation_type"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

- [ ] **Step 7.2: Create `packages/db/src/schema/hours.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import { hourStatusEnum } from "./enums";
import { users, employees } from "./identity";
import { projects } from "./work";

export const hourEntries = pgTable("hour_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "restrict" }),
  workDate: date("work_date").notNull(),
  hours: numeric("hours", { precision: 4, scale: 2 }).notNull(),
  kmCached: numeric("km_cached", { precision: 8, scale: 2 }),
  notes: text("notes"),
  status: hourStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  nmbrsSyncedAt: timestamp("nmbrs_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

- [ ] **Step 7.3: Update `packages/db/src/schema/index.ts`**

```typescript
export * from "./enums";
export * from "./addresses";
export * from "./identity";
export * from "./work";
export * from "./hours";
```

- [ ] **Step 7.4: Typecheck + commit**

```bash
pnpm -F @casella/db typecheck
git add packages/db
git commit -m "feat(db): add clients, projects, assignments, hour_entries schemas"
```

---

## Task 8: Database schema — leave, sick, statements, bonus

**Files:**
- Create: `packages/db/src/schema/leave.ts`
- Create: `packages/db/src/schema/statements.ts`
- Create: `packages/db/src/schema/bonus.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 8.1: Create `packages/db/src/schema/leave.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { leaveTypeEnum, leaveStatusEnum } from "./enums";
import { users, employees } from "./identity";

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  nmbrsSyncedAt: timestamp("nmbrs_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sickReports = pgTable("sick_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  notes: text("notes"),
  nmbrsSyncedAt: timestamp("nmbrs_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

- [ ] **Step 8.2: Create `packages/db/src/schema/statements.ts`**

```typescript
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { statementPurposeEnum, statementStatusEnum } from "./enums";
import { employees } from "./identity";

export const employerStatements = pgTable("employer_statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  purpose: statementPurposeEnum("purpose").notNull(),
  purposeNote: text("purpose_note"),
  status: statementStatusEnum("status").notNull().default("requested"),
  generatedPdfPath: text("generated_pdf_path"),
  signedPdfPath: text("signed_pdf_path"),
  signatureProviderRef: text("signature_provider_ref"),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
});
```

- [ ] **Step 8.3: Create `packages/db/src/schema/bonus.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { bonusLedgerTypeEnum } from "./enums";
import { users, employees } from "./identity";

export const bonusLedger = pgTable("bonus_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  period: text("period").notNull(),
  amountCents: integer("amount_cents").notNull(),
  type: bonusLedgerTypeEnum("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
});
```

- [ ] **Step 8.4: Update `packages/db/src/schema/index.ts`**

```typescript
export * from "./enums";
export * from "./addresses";
export * from "./identity";
export * from "./work";
export * from "./hours";
export * from "./leave";
export * from "./statements";
export * from "./bonus";
```

- [ ] **Step 8.5: Typecheck + commit**

```bash
pnpm -F @casella/db typecheck
git add packages/db
git commit -m "feat(db): add leave, sick, statements, bonus schemas"
```

---

## Task 9: Database schema — documents, notifications, audit

**Files:**
- Create: `packages/db/src/schema/system.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 9.1: Create `packages/db/src/schema/system.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { documentTypeEnum, documentSourceEnum } from "./enums";
import { users, employees } from "./identity";

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, {
    onDelete: "cascade",
  }),
  documentType: documentTypeEnum("document_type").notNull(),
  source: documentSourceEnum("source").notNull(),
  storagePath: text("storage_path").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  payloadJson: jsonb("payload_json").notNull().$type<Record<string, unknown>>(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  changesJson: jsonb("changes_json").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

- [ ] **Step 9.2: Update `packages/db/src/schema/index.ts`**

```typescript
export * from "./enums";
export * from "./addresses";
export * from "./identity";
export * from "./work";
export * from "./hours";
export * from "./leave";
export * from "./statements";
export * from "./bonus";
export * from "./system";
```

- [ ] **Step 9.3: Typecheck + commit**

```bash
pnpm -F @casella/db typecheck
git add packages/db
git commit -m "feat(db): add documents, notifications, audit_log schemas"
```

---

## Task 10: Supabase local + apply migrations

**Files:**
- Create: `supabase/config.toml` (gegenereerd door CLI)
- Create: `packages/db/drizzle/*.sql` (gegenereerd door drizzle-kit)

- [ ] **Step 10.1: Initialize Supabase lokaal**

Run from repo root:
```bash
supabase init
```
Expected: creates `supabase/config.toml`.

- [ ] **Step 10.2: Start Supabase local**

```bash
supabase start
```
Expected: Docker containers starten (~30s eerste keer). Output toont o.a.:
- API URL
- DB URL (bv. `postgresql://postgres:postgres@127.0.0.1:54322/postgres`)
- Studio URL (bv. `http://127.0.0.1:54323`)

Kopieer de DB URL — nodig in volgende step.

- [ ] **Step 10.3: Set DATABASE_URL temporarily**

In je huidige shell (pas wachtwoord aan als afwijkend):
```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

- [ ] **Step 10.4: Generate Drizzle migrations**

```bash
pnpm -F @casella/db generate
```
Expected: creates `packages/db/drizzle/0000_<name>.sql` met alle enums, tabellen, constraints.

- [ ] **Step 10.5: Review de gegenereerde migratie**

Bekijk `packages/db/drizzle/0000_*.sql`:
- Controleer dat alle 14 tabellen aanwezig zijn: `users`, `employees`, `addresses`, `route_cache`, `clients`, `projects`, `project_assignments`, `hour_entries`, `leave_requests`, `sick_reports`, `employer_statements`, `bonus_ledger`, `documents`, `notifications`, `audit_log`
- Controleer dat alle enums aanwezig zijn

- [ ] **Step 10.6: Apply de migratie**

```bash
pnpm -F @casella/db migrate
```
Expected: migration toegepast zonder errors.

- [ ] **Step 10.7: Verify tabellen bestaan**

```bash
psql "$DATABASE_URL" -c "\dt"
```
Expected: alle 15 tabellen (14 domain + 1 `__drizzle_migrations`) worden getoond.

Of open Supabase Studio op `http://127.0.0.1:54323` en bekijk tabellen visueel.

- [ ] **Step 10.8: Commit**

```bash
git add supabase/ packages/db/drizzle/
git commit -m "feat(db): initial Supabase local + complete schema migration"
```

---

## Task 11: Row Level Security policies

**Files:**
- Create: `packages/db/drizzle/0001_rls_policies.sql` (handmatige SQL-migratie)
- Create: `packages/db/tests/rls.test.ts` (integration test)
- Modify: `packages/db/package.json` (add vitest)

Per spec §5.9: medewerkers zien alleen eigen rijen in HR-tabellen; admins zien alles. RLS wordt afgedwongen op basis van een `app.current_user_id` session variable die de applicatie zet op elk request.

- [ ] **Step 11.1: Create `packages/db/drizzle/0001_rls_policies.sql`**

```sql
-- Helper function: get current user ID from session var
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Helper function: is current user an admin?
CREATE OR REPLACE FUNCTION app_current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = app_current_user_id() AND role = 'admin'
  );
$$;

-- Helper: employee_id of current user (NULL if not an employee)
CREATE OR REPLACE FUNCTION app_current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM employees WHERE user_id = app_current_user_id();
$$;

-- Enable RLS on HR tables
ALTER TABLE hour_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sick_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: employees see only their own, admins see all

CREATE POLICY hour_entries_access ON hour_entries
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY leave_requests_access ON leave_requests
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY sick_reports_access ON sick_reports
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY employer_statements_access ON employer_statements
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY bonus_ledger_access ON bonus_ledger
  USING (app_current_user_is_admin() OR employee_id = app_current_employee_id())
  WITH CHECK (app_current_user_is_admin() OR employee_id = app_current_employee_id());

CREATE POLICY documents_access ON documents
  USING (
    app_current_user_is_admin()
    OR employee_id = app_current_employee_id()
    OR employee_id IS NULL
  )
  WITH CHECK (app_current_user_is_admin());

CREATE POLICY notifications_access ON notifications
  USING (app_current_user_is_admin() OR user_id = app_current_user_id())
  WITH CHECK (app_current_user_is_admin() OR user_id = app_current_user_id());
```

- [ ] **Step 11.2: Apply RLS migration handmatig**

RLS is geen Drizzle-auto-generated migration. Pas 'm direct toe:

```bash
psql "$DATABASE_URL" -f packages/db/drizzle/0001_rls_policies.sql
```
Expected: no errors, alle `CREATE POLICY` statements slagen.

- [ ] **Step 11.3: Add vitest to db package**

Update `packages/db/package.json` — voeg toe aan `devDependencies`:
```json
{
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "vitest": "^2.0.0"
  }
}
```
En update script:
```json
"test": "vitest run"
```

Run: `pnpm install`

- [ ] **Step 11.4: Write failing RLS test**

Create `packages/db/tests/rls.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL must be set for RLS tests");

const sql = postgres(DB_URL, { prepare: false });

describe("RLS policies", () => {
  let adminUserId: string;
  let employeeUserId: string;
  let employeeEmployeeId: string;
  let otherEmployeeId: string;

  beforeAll(async () => {
    // Seed: one admin user, one employee user with employee record, one other employee
    const [admin] = await sql<{ id: string }[]>`
      INSERT INTO users (entra_oid, email, display_name, role)
      VALUES ('test-admin-oid', 'admin@test.local', 'Test Admin', 'admin')
      RETURNING id
    `;
    adminUserId = admin.id;

    const [emp] = await sql<{ id: string }[]>`
      INSERT INTO users (entra_oid, email, display_name, role)
      VALUES ('test-emp-oid', 'emp@test.local', 'Test Employee', 'employee')
      RETURNING id
    `;
    employeeUserId = emp.id;

    const [empRec] = await sql<{ id: string }[]>`
      INSERT INTO employees (user_id, employment_status)
      VALUES (${employeeUserId}, 'active')
      RETURNING id
    `;
    employeeEmployeeId = empRec.id;

    const [other] = await sql<{ id: string }[]>`
      INSERT INTO users (entra_oid, email, display_name, role)
      VALUES ('test-other-oid', 'other@test.local', 'Other', 'employee')
      RETURNING id
    `;
    const [otherEmp] = await sql<{ id: string }[]>`
      INSERT INTO employees (user_id, employment_status)
      VALUES (${other.id}, 'active')
      RETURNING id
    `;
    otherEmployeeId = otherEmp.id;

    // Seed: a leave request for each employee
    await sql`
      INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date)
      VALUES
        (${employeeEmployeeId}, 'vacation', '2026-05-01', '2026-05-05'),
        (${otherEmployeeId}, 'vacation', '2026-05-01', '2026-05-05')
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM leave_requests WHERE leave_type = 'vacation'`;
    await sql`DELETE FROM employees WHERE user_id IN (
      SELECT id FROM users WHERE entra_oid LIKE 'test-%'
    )`;
    await sql`DELETE FROM users WHERE entra_oid LIKE 'test-%'`;
    await sql.end();
  });

  it("employee sees only their own leave_requests", async () => {
    const result = await sql.begin(async (tx) => {
      await tx`SET LOCAL row_security = on`;
      await tx`SELECT set_config('app.current_user_id', ${employeeUserId}, true)`;
      return tx<{ employee_id: string }[]>`SELECT employee_id FROM leave_requests`;
    });

    expect(result.length).toBe(1);
    expect(result[0].employee_id).toBe(employeeEmployeeId);
  });

  it("admin sees all leave_requests", async () => {
    const result = await sql.begin(async (tx) => {
      await tx`SET LOCAL row_security = on`;
      await tx`SELECT set_config('app.current_user_id', ${adminUserId}, true)`;
      return tx<{ employee_id: string }[]>`SELECT employee_id FROM leave_requests`;
    });

    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("anonymous (no user_id set) sees nothing from HR tables", async () => {
    const result = await sql.begin(async (tx) => {
      await tx`SET LOCAL row_security = on`;
      return tx<{ employee_id: string }[]>`SELECT employee_id FROM leave_requests`;
    });

    expect(result.length).toBe(0);
  });
});
```

- [ ] **Step 11.5: Run the tests**

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" pnpm -F @casella/db test
```
Expected: all 3 tests PASS. Als één faalt: lees de foutmelding, controleer of RLS policy-SQL correct geladen is.

- [ ] **Step 11.6: Commit**

```bash
git add packages/db
git commit -m "feat(db): add RLS policies + tests for employee data isolation"
```

---

## Task 12: packages/auth — Auth.js config + permissions helper

**Files:**
- Create: `packages/auth/package.json`
- Create: `packages/auth/tsconfig.json`
- Create: `packages/auth/src/index.ts`
- Create: `packages/auth/src/config.ts`
- Create: `packages/auth/src/entra.ts`
- Create: `packages/auth/src/upsert.ts`
- Create: `packages/auth/src/permissions.ts`
- Create: `packages/auth/tests/permissions.test.ts`

- [ ] **Step 12.1: Create `packages/auth/package.json`**

```json
{
  "name": "@casella/auth",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "echo 'no lint'",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@casella/db": "workspace:*",
    "@casella/types": "workspace:*",
    "next-auth": "5.0.0-beta.25",
    "@auth/core": "^0.37.0",
    "drizzle-orm": "^0.36.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 12.2: Create `packages/auth/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "noEmit": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 12.3: Create `packages/auth/src/permissions.ts`**

```typescript
import type { Role } from "@casella/types";

export type Action =
  | "hours:view_own"
  | "hours:view_all"
  | "hours:submit"
  | "hours:approve"
  | "leave:request"
  | "leave:approve"
  | "sick:report"
  | "sick:view_all"
  | "employer_statement:request"
  | "employer_statement:generate"
  | "employer_statement:upload_signed"
  | "bonus:view_own"
  | "bonus:view_all"
  | "bonus:mutate"
  | "project:create"
  | "project:assign"
  | "client:create"
  | "employee:edit"
  | "audit:view";

const ROLE_PERMISSIONS: Record<Role, Action[]> = {
  employee: [
    "hours:view_own",
    "hours:submit",
    "leave:request",
    "sick:report",
    "employer_statement:request",
    "bonus:view_own",
  ],
  admin: [
    "hours:view_own",
    "hours:view_all",
    "hours:submit",
    "hours:approve",
    "leave:request",
    "leave:approve",
    "sick:report",
    "sick:view_all",
    "employer_statement:request",
    "employer_statement:generate",
    "employer_statement:upload_signed",
    "bonus:view_own",
    "bonus:view_all",
    "bonus:mutate",
    "project:create",
    "project:assign",
    "client:create",
    "employee:edit",
    "audit:view",
  ],
};

export function can(role: Role, action: Action): boolean {
  return ROLE_PERMISSIONS[role].includes(action);
}
```

- [ ] **Step 12.4: Create `packages/auth/tests/permissions.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { can } from "../src/permissions";

describe("RBAC permissions", () => {
  describe("employee role", () => {
    it("can view their own hours", () => {
      expect(can("employee", "hours:view_own")).toBe(true);
    });

    it("can submit hours", () => {
      expect(can("employee", "hours:submit")).toBe(true);
    });

    it("cannot view all hours", () => {
      expect(can("employee", "hours:view_all")).toBe(false);
    });

    it("cannot approve leave", () => {
      expect(can("employee", "leave:approve")).toBe(false);
    });

    it("cannot create projects", () => {
      expect(can("employee", "project:create")).toBe(false);
    });
  });

  describe("admin role", () => {
    it("can approve hours", () => {
      expect(can("admin", "hours:approve")).toBe(true);
    });

    it("can approve leave", () => {
      expect(can("admin", "leave:approve")).toBe(true);
    });

    it("can view audit log", () => {
      expect(can("admin", "audit:view")).toBe(true);
    });

    it("has all employee permissions", () => {
      const employeeActions = [
        "hours:view_own",
        "hours:submit",
        "leave:request",
        "sick:report",
        "employer_statement:request",
        "bonus:view_own",
      ] as const;
      for (const action of employeeActions) {
        expect(can("admin", action)).toBe(true);
      }
    });
  });
});
```

- [ ] **Step 12.5: Run tests (should fail — not wired up yet)**

Run: `pnpm install && pnpm -F @casella/auth test`
Expected: Vitest finds tests, they PASS (since `permissions.ts` is already implemented).

- [ ] **Step 12.6: Create `packages/auth/src/entra.ts`**

```typescript
import type { Role } from "@casella/types";

export interface EntraGroupMapping {
  adminGroupId: string;
  employeeGroupId: string;
}

export function resolveRoleFromGroups(
  groupIds: string[],
  mapping: EntraGroupMapping
): Role | null {
  if (groupIds.includes(mapping.adminGroupId)) return "admin";
  if (groupIds.includes(mapping.employeeGroupId)) return "employee";
  return null;
}
```

- [ ] **Step 12.7: Create `packages/auth/src/upsert.ts`**

```typescript
import { eq } from "drizzle-orm";
import { getDb, schema } from "@casella/db";
import type { Role } from "@casella/types";

export interface EntraProfile {
  oid: string;
  email: string;
  displayName: string;
  role: Role;
}

export async function upsertUserFromEntra(profile: EntraProfile) {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.entraOid, profile.oid))
    .limit(1);

  if (existing.length > 0) {
    const [user] = existing;
    await db
      .update(schema.users)
      .set({
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));
    return user;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      entraOid: profile.oid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
    })
    .returning();

  return created;
}
```

- [ ] **Step 12.8: Create `packages/auth/src/config.ts`**

```typescript
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { NextAuthConfig } from "next-auth";
import { resolveRoleFromGroups } from "./entra";
import { upsertUserFromEntra } from "./upsert";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export function buildAuthConfig(): NextAuthConfig {
  const adminGroupId = required("ENTRA_ADMIN_GROUP_ID");
  const employeeGroupId = required("ENTRA_EMPLOYEE_GROUP_ID");

  return {
    providers: [
      MicrosoftEntraID({
        clientId: required("AUTH_MICROSOFT_ENTRA_ID_ID"),
        clientSecret: required("AUTH_MICROSOFT_ENTRA_ID_SECRET"),
        issuer: `https://login.microsoftonline.com/${required("AUTH_MICROSOFT_ENTRA_ID_ISSUER")}/v2.0`,
        authorization: {
          params: { scope: "openid profile email User.Read GroupMember.Read.All" },
        },
      }),
    ],
    callbacks: {
      async signIn({ account, profile }) {
        if (!account?.access_token || !profile) return false;

        const groupsRes = await fetch(
          "https://graph.microsoft.com/v1.0/me/memberOf?$select=id",
          { headers: { Authorization: `Bearer ${account.access_token}` } }
        );
        if (!groupsRes.ok) return false;
        const groupsJson = (await groupsRes.json()) as {
          value: { id: string }[];
        };
        const groupIds = groupsJson.value.map((g) => g.id);

        const role = resolveRoleFromGroups(groupIds, {
          adminGroupId,
          employeeGroupId,
        });
        if (!role) return false;

        const oid = (profile as { oid?: string; sub?: string }).oid ??
          (profile as { sub?: string }).sub;
        const email = (profile as { email?: string; preferred_username?: string })
          .email ?? (profile as { preferred_username?: string }).preferred_username;
        const displayName = (profile as { name?: string }).name ?? email ?? "Onbekend";

        if (!oid || !email) return false;

        await upsertUserFromEntra({ oid, email, displayName, role });
        return true;
      },
      async jwt({ token, profile }) {
        if (profile) {
          const oid = (profile as { oid?: string; sub?: string }).oid ??
            (profile as { sub?: string }).sub;
          if (oid) token.entraOid = oid;
        }
        return token;
      },
      async session({ session, token }) {
        if (token.entraOid) {
          (session as { entraOid?: string }).entraOid = token.entraOid as string;
        }
        return session;
      },
    },
    session: { strategy: "jwt" },
    pages: { signIn: "/" },
  };
}
```

- [ ] **Step 12.9: Create `packages/auth/src/index.ts`**

```typescript
export { buildAuthConfig } from "./config";
export { can, type Action } from "./permissions";
export { resolveRoleFromGroups, type EntraGroupMapping } from "./entra";
export { upsertUserFromEntra, type EntraProfile } from "./upsert";
```

- [ ] **Step 12.10: Typecheck + run tests**

```bash
pnpm -F @casella/auth typecheck
pnpm -F @casella/auth test
```
Expected: geen typefouten, alle permissions-tests groen.

- [ ] **Step 12.11: Commit**

```bash
git add packages/auth pnpm-lock.yaml
git commit -m "feat(auth): Auth.js v5 config, Entra group→role mapping, RBAC + tests"
```

---

## Task 13: Wire Auth.js in Next.js app + login flow

**Files:**
- Modify: `apps/web/package.json` (add deps)
- Create: `apps/web/auth.ts`
- Create: `apps/web/middleware.ts`
- Create: `apps/web/app/api/auth/[...nextauth]/route.ts`
- Modify: `apps/web/app/page.tsx` (move to `(public)/page.tsx`)
- Create: `apps/web/app/(public)/layout.tsx`
- Create: `apps/web/app/(public)/page.tsx`

- [ ] **Step 13.1: Add dependencies to web app**

Update `apps/web/package.json` dependencies:
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "5.0.0-beta.25",
    "@casella/auth": "workspace:*",
    "@casella/db": "workspace:*",
    "@casella/types": "workspace:*"
  }
}
```

Run: `pnpm install`

- [ ] **Step 13.2: Create `apps/web/auth.ts`**

```typescript
import NextAuth from "next-auth";
import { buildAuthConfig } from "@casella/auth";

export const { handlers, signIn, signOut, auth } = NextAuth(buildAuthConfig());
```

- [ ] **Step 13.3: Create `apps/web/app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 13.4: Create `apps/web/middleware.ts`**

```typescript
import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAuthed = !!session;

  const isPublic = nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/api/auth");

  if (!isAuthed && !isPublic) {
    return Response.redirect(new URL("/", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 13.5: Move current page to `(public)/page.tsx`**

Delete `apps/web/app/page.tsx`.

Create `apps/web/app/(public)/layout.tsx`:
```typescript
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

Create `apps/web/app/(public)/page.tsx`:
```typescript
import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">Casella</h1>
      <p className="text-muted-foreground">Medewerkerportaal Ascentra</p>
      <form
        action={async () => {
          "use server";
          await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
        }}
      >
        <Button type="submit">Log in met Microsoft</Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 13.6: Typecheck**

```bash
pnpm -F @casella/web typecheck
```
Expected: no errors (TS may have module resolution issues — fix pathing if so).

- [ ] **Step 13.7: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): wire Auth.js + Entra SSO into Next.js app"
```

---

## Task 14: .env.example + lokale env setup

**Files:**
- Create: `.env.example`
- Update: `apps/web/.env.local` (user-specific, git-ignored)

- [ ] **Step 14.1: Create `.env.example`**

```bash
# ---- Database (lokaal via Supabase CLI) ----
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# ---- Auth.js ----
# Genereer via: openssl rand -base64 32
AUTH_SECRET=""

# Canonical URL waar de app draait (lokaal: http://localhost:3000)
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# ---- Microsoft Entra ID (dev app registration) ----
# Zie README § "Entra ID dev setup"
AUTH_MICROSOFT_ENTRA_ID_ID=""            # Application (client) ID
AUTH_MICROSOFT_ENTRA_ID_SECRET=""        # Client secret value
AUTH_MICROSOFT_ENTRA_ID_ISSUER=""        # Directory (tenant) ID (UUID)

# ---- Entra security groups (voor RBAC role-mapping) ----
ENTRA_ADMIN_GROUP_ID=""                  # Object ID van Casella-Admins group
ENTRA_EMPLOYEE_GROUP_ID=""               # Object ID van Casella-Employees group

# ---- Mapbox (optioneel in Fase 0, nodig vanaf Fase 1) ----
MAPBOX_ACCESS_TOKEN=""

# ---- SMTP (optioneel in Fase 0, nodig vanaf Fase 1) ----
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@ascentra.nl"

# ---- Nmbrs (optioneel in Fase 0, nodig vanaf Fase 1) ----
NMBRS_API_DOMAIN=""
NMBRS_API_TOKEN=""
```

- [ ] **Step 14.2: Gebruiker vult `apps/web/.env.local` + repo-root `.env` in**

User doet dit handmatig (eenmalig):
- Copy `.env.example` naar `.env.local` in `apps/web/` en vul minimaal in:
  - `DATABASE_URL`
  - `AUTH_SECRET` (`openssl rand -base64 32` of `npx auth secret`)
  - `AUTH_URL`, `AUTH_TRUST_HOST`
  - `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_ISSUER`
  - `ENTRA_ADMIN_GROUP_ID`, `ENTRA_EMPLOYEE_GROUP_ID`
- Ook op repo-root `.env` met minimaal `DATABASE_URL` (voor drizzle-kit en tests)

- [ ] **Step 14.3: Commit**

```bash
git add .env.example
git commit -m "docs: add .env.example with all required variables"
```

---

## Task 15: (authed) + (admin) layouts with role guards

**Files:**
- Create: `apps/web/app/(authed)/layout.tsx`
- Create: `apps/web/app/(authed)/dashboard/page.tsx`
- Create: `apps/web/app/(admin)/layout.tsx`
- Create: `apps/web/app/(admin)/dashboard/page.tsx`
- Create: `apps/web/lib/current-user.ts`

- [ ] **Step 15.1: Create `apps/web/lib/current-user.ts`**

```typescript
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@casella/db";
import type { Role } from "@casella/types";
import { cache } from "react";

export interface CurrentUser {
  id: string;
  entraOid: string;
  email: string;
  displayName: string;
  role: Role;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const entraOid = (session as { entraOid?: string } | null)?.entraOid;
  if (!entraOid) return null;

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.entraOid, entraOid))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  return {
    id: user.id,
    entraOid: user.entraOid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
});
```

- [ ] **Step 15.2: Create `apps/web/app/(authed)/layout.tsx`**

```typescript
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { NavEmployee } from "@/components/nav-employee";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="flex min-h-screen">
      <NavEmployee user={user} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 15.3: Create `apps/web/app/(authed)/dashboard/page.tsx`**

```typescript
import { getCurrentUser } from "@/lib/current-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p>Welkom, {user.displayName}</p>
      <p className="text-muted-foreground">Rol: {user.role}</p>
    </div>
  );
}
```

- [ ] **Step 15.4: Create `apps/web/app/(admin)/layout.tsx`**

```typescript
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { NavAdmin } from "@/components/nav-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <NavAdmin user={user} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 15.5: Create `apps/web/app/(admin)/dashboard/page.tsx`**

```typescript
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p>Ingelogd als {user.displayName} (admin)</p>
    </div>
  );
}
```

- [ ] **Step 15.6: Commit** (na nav-componenten in Task 16)

---

## Task 16: Navigation skeletons + sign-out

**Files:**
- Create: `apps/web/components/nav-employee.tsx`
- Create: `apps/web/components/nav-admin.tsx`
- Create: `apps/web/components/sign-out-button.tsx`

- [ ] **Step 16.1: Create `apps/web/components/sign-out-button.tsx`**

```typescript
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button variant="outline" size="sm" type="submit">
        Log uit
      </Button>
    </form>
  );
}
```

- [ ] **Step 16.2: Create `apps/web/components/nav-employee.tsx`**

```typescript
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";
import type { CurrentUser } from "@/lib/current-user";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/uren", label: "Uren" },
  { href: "/verlof", label: "Verlof" },
  { href: "/verzuim", label: "Verzuim" },
  { href: "/contract", label: "Contract" },
  { href: "/loonstroken", label: "Loonstroken" },
  { href: "/bonus", label: "Bonus" },
  { href: "/werkgeversverklaring", label: "Werkgeversverklaring" },
  { href: "/profiel", label: "Profiel" },
];

export function NavEmployee({ user }: { user: CurrentUser }) {
  return (
    <nav className="w-64 border-r border-border bg-muted/30 p-4 flex flex-col">
      <div className="font-bold text-xl mb-6">Casella</div>
      <ul className="space-y-1 flex-1">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block px-3 py-2 rounded-md hover:bg-accent text-sm"
            >
              {l.label}
            </Link>
          </li>
        ))}
        {user.role === "admin" && (
          <li className="pt-4 mt-4 border-t border-border">
            <Link
              href="/admin/dashboard"
              className="block px-3 py-2 rounded-md hover:bg-accent text-sm font-medium"
            >
              → Admin
            </Link>
          </li>
        )}
      </ul>
      <div className="pt-4 border-t border-border space-y-2">
        <div className="text-xs text-muted-foreground">{user.displayName}</div>
        <SignOutButton />
      </div>
    </nav>
  );
}
```

- [ ] **Step 16.3: Create `apps/web/components/nav-admin.tsx`**

```typescript
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";
import type { CurrentUser } from "@/lib/current-user";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/medewerkers", label: "Medewerkers" },
  { href: "/admin/klanten", label: "Klanten" },
  { href: "/admin/projecten", label: "Projecten" },
  { href: "/admin/goedkeuringen", label: "Goedkeuringen" },
  { href: "/admin/werkgeversverklaringen", label: "Werkgeversverklaringen" },
  { href: "/admin/bonus", label: "Bonus" },
];

export function NavAdmin({ user }: { user: CurrentUser }) {
  return (
    <nav className="w-64 border-r border-border bg-primary/5 p-4 flex flex-col">
      <div className="font-bold text-xl mb-6">
        Casella <span className="text-xs text-muted-foreground">admin</span>
      </div>
      <ul className="space-y-1 flex-1">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block px-3 py-2 rounded-md hover:bg-accent text-sm"
            >
              {l.label}
            </Link>
          </li>
        ))}
        <li className="pt-4 mt-4 border-t border-border">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-md hover:bg-accent text-sm"
          >
            ← Terug naar medewerker-view
          </Link>
        </li>
      </ul>
      <div className="pt-4 border-t border-border space-y-2">
        <div className="text-xs text-muted-foreground">{user.displayName}</div>
        <SignOutButton />
      </div>
    </nav>
  );
}
```

- [ ] **Step 16.4: Typecheck + manuele test**

```bash
pnpm -F @casella/web typecheck
pnpm dev
```

Open `http://localhost:3000`:
- Klik "Log in met Microsoft"
- Log in met een Ascentra-account dat in `Casella-Employees` zit
- Verwacht: redirect naar `/dashboard`, navigatie links zichtbaar, user-naam rechtsonder
- Test: klik "Log uit" → terug naar landing
- Log in met admin-account → `/admin/dashboard` moet werken

Als login faalt: check browser network tab + server logs voor exacte foutmelding. Meest voorkomend: redirect URI mismatch in Entra (moet exact `http://localhost:3000/api/auth/callback/microsoft-entra-id` zijn).

- [ ] **Step 16.5: Commit (Task 15 + 16 samen)**

```bash
git add apps/web
git commit -m "feat(web): (authed)+(admin) layouts with role guards + nav skeletons"
```

---

## Task 17: README.md met setup-instructies

**Files:**
- Modify: `README.md`

- [ ] **Step 17.1: Replace `README.md`**

```markdown
# Casella

Medewerkerportaal voor Ascentra. Zie [design spec](docs/superpowers/specs/2026-04-23-casella-design.md) voor achtergrond en architectuur.

## Stack

TypeScript · Next.js 15 · PostgreSQL (Supabase local) · Drizzle ORM · Auth.js v5 met Microsoft Entra ID · Tailwind + shadcn/ui · pnpm + Turborepo.

## Lokaal opzetten (eerste keer)

### Prerequisites

- Node 20+ en pnpm 9+
- Docker Desktop (draaiend)
- Supabase CLI: `npm install -g supabase`
- `psql` (voor schema-verificatie; optioneel)

### Entra ID dev app registration

Eenmalig, in Ascentra's Microsoft 365 Entra admin center:

1. Ga naar `entra.microsoft.com` → **App registrations** → **New registration**
2. Name: `Casella Dev`, Supported account types: **Single tenant**
3. Redirect URI (Web): `http://localhost:3000/api/auth/callback/microsoft-entra-id`
4. Na aanmaak: noteer **Application (client) ID** en **Directory (tenant) ID**
5. **Certificates & secrets** → **New client secret** → kopieer de value meteen (eenmalig zichtbaar)
6. **API permissions** → **Add a permission** → Microsoft Graph → **Delegated** → kies `User.Read` + `GroupMember.Read.All` → **Grant admin consent**

### Entra security groups

Maak twee security groups aan (als ze er nog niet zijn):

- `Casella-Admins` — admins (jij + HR)
- `Casella-Employees` — alle Casella-gebruikers (inclusief admins)

Noteer de **Object ID** van beide groups (te vinden onder Groups → selecteer group).

### Repo setup

```bash
# Clone en installeer
git clone <repo-url> casella
cd casella
pnpm install

# Kopieer env-template
cp .env.example apps/web/.env.local
cp .env.example .env

# Open apps/web/.env.local en .env, vul alle waarden in
# - DATABASE_URL blijft zoals in example
# - AUTH_SECRET: genereer met `openssl rand -base64 32`
# - Overige Entra/group-IDs uit de stappen hierboven
```

### Supabase local starten + DB seeden

```bash
# Start lokale Postgres (Docker)
supabase start

# Genereer Drizzle migraties uit schema (eenmalig of na schema-wijziging)
pnpm db:generate

# Apply migraties
pnpm db:migrate

# Apply RLS policies (handmatig, geen Drizzle)
psql "$DATABASE_URL" -f packages/db/drizzle/0001_rls_policies.sql

# (Optioneel) open Supabase Studio op http://127.0.0.1:54323
```

### Dev server starten

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Commands

| Command | Doet |
|---|---|
| `pnpm dev` | Start web dev server |
| `pnpm build` | Build all apps |
| `pnpm test` | Run alle tests |
| `pnpm typecheck` | Typecheck alle packages |
| `pnpm lint` | Lint alle apps |
| `pnpm db:generate` | Drizzle: genereer migraties uit schema |
| `pnpm db:migrate` | Drizzle: apply pending migraties |
| `pnpm db:studio` | Drizzle Studio UI |
| `supabase start` | Start lokale Postgres |
| `supabase stop` | Stop lokale Postgres |
| `supabase db reset` | Reset lokale DB (drop + re-apply migraties) |

## Project structuur

Zie `docs/superpowers/plans/2026-04-23-casella-fase-0.md` § File Structure.

## Tests

Elke package heeft eigen tests:
- `packages/db/tests/rls.test.ts` — RLS policy integratietests (vereist DATABASE_URL)
- `packages/auth/tests/permissions.test.ts` — RBAC unit tests

Run all: `pnpm test`.

## Volgende stappen

Fase 0 is het lokale fundament. Volgende fases (elk met eigen spec + plan):

- **Fase 1** — Features: uren, verlof, verzuim, contract, loonstroken, bonus, werkgeversverklaring
- **Fase 2** — Productie-infrastructuur (Vercel, productie Supabase, Sentry, DNS)
- **Fase 3** — React Native mobile app
- **Fase 4** — Verfijning (AstraSign, push, etc.)
```

- [ ] **Step 17.2: Commit**

```bash
git add README.md
git commit -m "docs: README with full local setup instructions"
```

---

## Task 18: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 18.1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Run Drizzle migrations (CI DB)
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
        run: pnpm db:migrate

      - name: Apply RLS policies (CI DB)
        env:
          PGPASSWORD: postgres
        run: psql -h localhost -U postgres -d postgres -f packages/db/drizzle/0001_rls_policies.sql

      - name: Test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          # Dummy waarden zodat build slaagt; geen echte secrets nodig voor static check
          AUTH_SECRET: ci-dummy-secret-at-least-32-chars-ok
          AUTH_URL: http://localhost:3000
          AUTH_TRUST_HOST: "true"
          AUTH_MICROSOFT_ENTRA_ID_ID: ci-dummy
          AUTH_MICROSOFT_ENTRA_ID_SECRET: ci-dummy
          AUTH_MICROSOFT_ENTRA_ID_ISSUER: 00000000-0000-0000-0000-000000000000
          ENTRA_ADMIN_GROUP_ID: 00000000-0000-0000-0000-000000000000
          ENTRA_EMPLOYEE_GROUP_ID: 00000000-0000-0000-0000-000000000000
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
```

- [ ] **Step 18.2: Commit + push om CI te triggeren**

```bash
git add .github/
git commit -m "ci: add GitHub Actions pipeline (typecheck, lint, test, build)"
git push origin main
```

Expected: CI run start automatisch op GitHub. Bekijk in de Actions-tab. Alle steps groen.

Als een step faalt: lees de log, fix lokaal, nieuwe commit, push opnieuw.

---

## Task 19: Final smoke test + end-to-end verificatie

- [ ] **Step 19.1: Clean slate verificatie**

Simuleer een verse clone:
```bash
# Maak tijdelijke kopie van repo
cd ..
git clone casella casella-fresh-test
cd casella-fresh-test
```

Volg `README.md` stappen vanaf een vers machine-state:
1. `pnpm install`
2. Vul `.env` en `apps/web/.env.local`
3. `supabase start`
4. `pnpm db:generate` (zou geen nieuwe migraties moeten genereren — schema is up-to-date)
5. `pnpm db:migrate`
6. `psql ... -f .../0001_rls_policies.sql`
7. `pnpm dev`

- [ ] **Step 19.2: End-to-end manual test**

Open `http://localhost:3000`:

- [ ] Niet-ingelogd: zie landing met "Log in met Microsoft" knop
- [ ] Niet-ingelogd: direct naar `/dashboard` → redirect naar landing
- [ ] Klik login → redirect naar Microsoft → log in als **employee** (account in Casella-Employees, niet in Casella-Admins) → redirect terug naar `/dashboard`
- [ ] Zie navigatie met links Uren, Verlof, Verzuim, etc.
- [ ] Zie eigen naam + "Log uit" knop rechtsonder
- [ ] Probeer `/admin/dashboard` rechtstreeks: redirect naar `/dashboard` (role guard werkt)
- [ ] Klik "Log uit" → terug naar landing
- [ ] Log in als **admin** (account in Casella-Admins + Casella-Employees) → `/dashboard`
- [ ] Klik "→ Admin" in nav → `/admin/dashboard` toegankelijk
- [ ] Admin-nav toont andere links (Medewerkers, Klanten, Projecten, etc.)

- [ ] **Step 19.3: Verify DB state**

```bash
psql "$DATABASE_URL" -c "SELECT id, email, role FROM users;"
```
Expected: rijen voor beide testaccounts (employee en admin).

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM employees;"
```
Expected: `0` (geen employees aangemaakt in Fase 0 — dat komt in Fase 1 als admin medewerker-records kan aanmaken; voor nu is alleen `users` gevuld).

- [ ] **Step 19.4: Run CI-equivalente suite lokaal**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
Expected: alle vier groen.

- [ ] **Step 19.5: Cleanup**

```bash
cd ..
rm -rf casella-fresh-test
cd casella
```

- [ ] **Step 19.6: Tag Fase 0 als voltooid**

```bash
git tag -a v0.1.0-fase-0 -m "Fase 0 complete: local foundation"
# Niet pushen van tag tot user bevestigt
```

---

## Checkpoints & commits

Na Fase 0 heb je ongeveer 16 commits op `main` (één per taak grotendeels). Samenvatting van wat werkt:

- ✅ Monorepo met pnpm + Turborepo
- ✅ Next.js 15 web-app met Tailwind + shadcn/ui
- ✅ Lokale Supabase Postgres met compleet schema (14 tabellen + enums + RLS)
- ✅ RLS-policies actief, getest met integratietests
- ✅ Auth.js v5 + Entra ID SSO werkend
- ✅ Auto user-upsert bij eerste login, role uit Entra groups
- ✅ Role-based layouts en navigatie (medewerker + admin)
- ✅ RBAC `can()` helper met unit tests
- ✅ `.env.example` compleet
- ✅ README met volledige setup-instructies
- ✅ GitHub Actions CI groen

Wat **niet** in Fase 0 zit (komt in Fase 1):
- Feature-implementaties (uren, verlof, verzuim, etc. — alleen lege placeholder-pages)
- Nmbrs-integratie (package bestaat nog niet)
- PDOK/Mapbox-integratie (package bestaat nog niet)
- Email-sending (package bestaat nog niet)
- Signature-provider (package bestaat nog niet)
- Contract-upload, werkgeversverklaring-PDF-generatie
- Admin-CRUD voor klanten/projecten/medewerkers
