# Casella Fase 1.1a — Foundation + Employees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lever het complete admin-fundament (design system, shell, themed dark+light, command palette, drawer system, toasts, PDOK address input) plus de volledige Employees CRUD end-to-end inclusief invite-first onboarding en de terminate-flow met scheduled execution.

**Architecture:** Next.js 15 App Router op de Fase 0 stack. Design-system-tokens via CSS custom properties met semantische laag, licht/donker via class-toggle op `<html>` met pre-hydration inline script. Shared packages voor typing (`@casella/types`), db + audit (`@casella/db`), auth (`@casella/auth`), maps/PDOK (`@casella/maps`, nieuw), email (`@casella/email`, nieuw), en UI-primitives (`@casella/ui`, nieuw). Alle mutaties via Server Actions met optimistic UI; alle HR-writes via een centrale `auditMutation()` helper in dezelfde transaction. Critical-op flow gebouwd als herbruikbare dialog-component en backed door pg_cron scheduler op Supabase.

**Tech Stack:** TypeScript, Next.js 15, React 19, Tailwind 3.4, shadcn/ui (Radix primitives), `next/font` met Geist + Cormorant Garamond, `cmdk` (command palette), `sonner` (toasts), `react-hotkeys-hook` (keyboard), Drizzle ORM, Supabase Postgres met pg_cron, Zod + React Hook Form, Vitest.

**Spec reference:** `docs/superpowers/specs/2026-04-23-casella-fase-1-1-admin-fundament-design.md`

---

## Preconditions

- Fase 0 merged naar `main` (commit `ff18bf3`)
- Supabase lokaal draaiend (`pnpm db:up`)
- Al werkende SSO via Entra ID (je Ascentra dev app registration uit Fase 0)
- `apps/web/.env.local` bevat alle variabelen (DATABASE_URL, AUTH_*, ENTRA_*_GROUP_ID) — al ingevuld uit Fase 0
- Docker Desktop running
- Node 24 + pnpm 9.12 via corepack

Werkt op branch `fase-1-1-admin-fundament-spec` (al aangemaakt en heeft spec-commit).

---

## File structure after Plan 1.1a

```
casella/
├── apps/web/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                 (ongewijzigd vanaf Fase 0)
│   │   │   └── onboarding-pending/page.tsx     NEW
│   │   ├── (authed)/
│   │   │   ├── layout.tsx               (verrijkt met nieuwe shell)
│   │   │   └── dashboard/page.tsx       (ongewijzigd)
│   │   ├── (admin)/
│   │   │   ├── layout.tsx               (verrijkt met admin-shell + critical-op dialogs)
│   │   │   └── admin/
│   │   │       ├── dashboard/page.tsx   (ongewijzigd)
│   │   │       └── medewerkers/
│   │   │           ├── page.tsx         NEW — list view
│   │   │           ├── actions.ts       NEW — server actions
│   │   │           └── pending/page.tsx NEW — pending invites list
│   │   ├── api/
│   │   │   └── pdok/
│   │   │       ├── suggest/route.ts     NEW
│   │   │       └── lookup/[id]/route.ts NEW
│   │   ├── head-theme-script.tsx        NEW — pre-hydration theme script
│   │   ├── layout.tsx                   (verrijkt met fonts + providers)
│   │   └── globals.css                  (rewritten met Ascentra-tokens)
│   ├── components/
│   │   ├── shell/
│   │   │   ├── brand.tsx                NEW
│   │   │   ├── env-badge.tsx            NEW
│   │   │   ├── sidebar.tsx              (rewritten — glassmorphic)
│   │   │   ├── top-bar.tsx              NEW
│   │   │   ├── user-menu.tsx            NEW
│   │   │   ├── ambient-motion.tsx       NEW — aurora + spotlight
│   │   │   └── skip-to-content.tsx      NEW
│   │   ├── shortcuts/
│   │   │   ├── kbd.tsx                  NEW — platform-adaptive shortcut pill
│   │   │   ├── use-shortcut.ts          NEW — hook wrapper
│   │   │   └── shortcuts-overlay.tsx    NEW — ? help overlay
│   │   ├── command-palette/
│   │   │   ├── command-palette.tsx      NEW — cmdk-based
│   │   │   └── command-items.tsx        NEW — default commands registry
│   │   ├── drawer/
│   │   │   ├── drawer.tsx               NEW — Radix Dialog + spring animation
│   │   │   └── drawer-header.tsx        NEW
│   │   ├── address-input/
│   │   │   ├── address-input.tsx        NEW — PDOK autocomplete component
│   │   │   └── address-input.test.ts    NEW
│   │   ├── critical-confirm/
│   │   │   └── critical-confirm-dialog.tsx NEW
│   │   ├── theme/
│   │   │   ├── theme-provider.tsx       NEW — context + toggle
│   │   │   └── theme-toggle.tsx         NEW — switcher UI
│   │   ├── toast/
│   │   │   └── toaster.tsx              NEW — sonner wrapper
│   │   └── ui/                          (shadcn, blijft bestaan, + nieuwe primitives)
│   │       ├── button.tsx               (bestaand, tweaks voor aurora)
│   │       ├── input.tsx                NEW
│   │       ├── textarea.tsx             NEW
│   │       ├── select.tsx               NEW
│   │       ├── dialog.tsx               NEW
│   │       ├── popover.tsx              NEW
│   │       ├── separator.tsx            NEW
│   │       ├── badge.tsx                NEW
│   │       ├── skeleton.tsx             NEW
│   │       └── tabs.tsx                 NEW
│   ├── lib/
│   │   ├── current-user.ts              (lichtjes verrijkt met theme)
│   │   ├── theme-cookie.ts              NEW
│   │   ├── use-theme.ts                 NEW
│   │   └── utils.ts                     (bestaand)
│   ├── features/employees/
│   │   ├── list/
│   │   │   ├── list-view.tsx            NEW
│   │   │   ├── list-row.tsx             NEW
│   │   │   └── filter-pills.tsx         NEW
│   │   └── drawer/
│   │       ├── employee-drawer.tsx      NEW — create+edit shell
│   │       ├── form-basis.tsx           NEW
│   │       ├── form-dienstverband.tsx   NEW
│   │       ├── form-vergoedingen.tsx    NEW
│   │       ├── form-contact.tsx         NEW
│   │       ├── form-notities.tsx        NEW
│   │       └── tabs.tsx                 NEW — details/toewijzingen/audit
│   ├── tailwind.config.ts               (uitgebreid met tokens + density)
│   ├── postcss.config.mjs               (ongewijzigd)
│   └── package.json                     (nieuwe deps)
├── packages/
│   ├── db/
│   │   ├── drizzle/                     (nieuwe migratie(s))
│   │   ├── src/
│   │   │   ├── audit.ts                 NEW — auditMutation helper
│   │   │   └── schema/identity.ts       (uitgebreid met invite + termination)
│   ├── auth/
│   │   └── src/
│   │       ├── upsert.ts                (uitgebreid: invite-binding)
│   │       └── config.ts                (signIn uitbreiding)
│   ├── types/
│   │   └── src/
│   │       └── employees.ts             NEW
│   ├── maps/                            NEW (heel package)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── pdok.ts                  PDOK suggest + lookup
│   │   │   └── types.ts
│   │   └── tests/
│   │       └── pdok.test.ts
│   ├── email/                           NEW (heel package)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts                nodemailer SMTP transport
│   │   │   └── templates/
│   │   │       └── welcome.tsx          React Email template
│   │   └── tests/
│   │       └── client.test.ts
│   └── ui/                              NEW placeholder (init setup; nog weinig in 1.1a)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts                 Barrel voor in 1.1b te groeien
└── docs/superpowers/
    ├── specs/2026-04-23-casella-fase-1-1-admin-fundament-design.md
    └── plans/2026-04-23-casella-fase-1-1a-foundation-employees.md   (dit bestand)
```

---

## Task 1: Install new dependencies

**Files:**
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1.1: Install font + shell + form deps in apps/web**

Run from `apps/web/`:
```bash
pnpm add geist cmdk sonner react-hotkeys-hook @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-separator react-hook-form @hookform/resolvers zod
pnpm add -D @types/node
```

Expected: lockfile updated; `geist@^1.x`, `cmdk@^1.x`, `sonner@^1.x`, `react-hotkeys-hook@^4.x`, `@radix-ui/*@^1.x` present in `dependencies` (runtime, not devDeps — they're imported at runtime).

- [ ] **Step 1.2: Verify install**

Run: `pnpm install`
Run: `pnpm -F @casella/web typecheck`
Expected: typecheck passes with no errors.

- [ ] **Step 1.3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add shell + form dependencies (geist, cmdk, sonner, radix, RHF, zod)"
```

---

## Task 2: Configure Geist + Cormorant fonts via next/font

**Files:**
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 2.1: Replace layout.tsx to load fonts via next/font**

```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
  variable: "--font-cormorant",
  display: "swap",
});

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
    <html
      lang="nl"
      className={`${GeistSans.variable} ${GeistMono.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2.2: Verify dev server serves fonts**

Run: `pnpm -F @casella/web dev` (background)
Curl: `curl -s http://localhost:3000 | grep -E "font-sans|font-mono|font-cormorant"`
Expected: response contains `--font-geist-sans`, `--font-geist-mono`, and `--font-cormorant` as CSS variables on `<html>`.

Stop dev server.

- [ ] **Step 2.3: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "feat(web): load Geist Sans + Mono + Cormorant Garamond via next/font"
```

---

## Task 3: Write complete globals.css with Ascentra tokens

**Files:**
- Rewrite: `apps/web/app/globals.css`

- [ ] **Step 3.1: Replace globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* === RAW TOKENS === */
    /* Cream base palette */
    --cream-base: #f6f2ea;
    --cream-lift: #faf6ee;
    --cream-deep: #efe8d9;

    /* Ink (dark text) */
    --ink-deep: #0e1621;
    --ink-2: rgba(14, 22, 33, 0.68);
    --ink-3: rgba(14, 22, 33, 0.45);
    --ink-4: rgba(14, 22, 33, 0.22);
    --ink-5: rgba(14, 22, 33, 0.10);

    /* Structural accents */
    --navy: #1e3a5f;
    --brown: #6b4e3d;

    /* Aurora accent palette */
    --aurora-violet: #7b5cff;
    --aurora-blue: #4ba3ff;
    --aurora-coral: #ff8a4c;
    --aurora-amber: #f5c55c;
    --aurora-teal: #3dd8a8;
    --aurora-rose: #ff5a8a;

    /* Glows */
    --glow-violet: rgba(123, 92, 255, 0.35);
    --glow-blue: rgba(75, 163, 255, 0.35);
    --glow-coral: rgba(255, 138, 76, 0.35);
    --glow-amber: rgba(245, 197, 92, 0.40);
    --glow-teal: rgba(61, 216, 168, 0.35);
    --glow-rose: rgba(255, 90, 138, 0.35);

    /* === SEMANTIC TOKENS === */
    --surface-base: var(--cream-base);
    --surface-lift: var(--cream-lift);
    --surface-deep: var(--cream-deep);
    --surface-glass: rgba(251, 248, 241, 0.58);
    --surface-card: rgba(255, 255, 255, 0.65);

    --text-primary: var(--ink-deep);
    --text-secondary: var(--ink-2);
    --text-tertiary: var(--ink-3);
    --text-quaternary: var(--ink-4);

    --border-subtle: var(--ink-5);
    --border-muted: var(--ink-4);

    --action-primary: var(--aurora-violet);
    --action-primary-fg: #ffffff;
    --status-success: var(--aurora-teal);
    --status-warning: var(--aurora-amber);
    --status-danger: var(--aurora-rose);
    --status-info: var(--aurora-blue);
    --status-pending: var(--aurora-amber);
    --status-attention: var(--aurora-coral);

    /* === SHADCN-COMPATIBLE TOKENS (voor ingebouwde radix/shadcn components) === */
    --background: 40 30% 94%;               /* cream */
    --foreground: 213 40% 10%;               /* deep ink */
    --card: 40 48% 97%;
    --card-foreground: 213 40% 10%;
    --popover: 40 48% 97%;
    --popover-foreground: 213 40% 10%;
    --primary: 255 100% 68%;                  /* aurora-violet HSL */
    --primary-foreground: 0 0% 100%;
    --secondary: 40 30% 92%;
    --secondary-foreground: 213 40% 10%;
    --muted: 40 30% 92%;
    --muted-foreground: 213 10% 40%;
    --accent: 40 30% 90%;
    --accent-foreground: 213 40% 10%;
    --destructive: 342 100% 68%;
    --destructive-foreground: 0 0% 100%;
    --border: 213 10% 85%;
    --input: 213 10% 85%;
    --ring: 255 100% 68%;
    --radius: 0.75rem;

    /* === MOTION TOKENS === */
    --ease-standard: cubic-bezier(0.165, 0.84, 0.44, 1);
    --ease-draw: cubic-bezier(0.625, 0.05, 0, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

    --duration-quick: 80ms;
    --duration-standard: 200ms;
    --duration-emphasized: 400ms;

    /* === TYPE-SCALE (fluid via clamp) === */
    --text-hero: clamp(3rem, 2rem + 2vw, 4.25rem);
    --text-display: clamp(1.75rem, 1.5rem + 1vw, 2.5rem);
    --text-title: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);

    /* === DENSITY (comfortable default) === */
    --density-scale: 1;
    --space-1: calc(0.25rem * var(--density-scale));
    --space-2: calc(0.5rem * var(--density-scale));
    --space-3: calc(0.75rem * var(--density-scale));
    --space-4: calc(1rem * var(--density-scale));
    --space-6: calc(1.5rem * var(--density-scale));
    --space-8: calc(2rem * var(--density-scale));
  }

  html[data-density="compact"] {
    --density-scale: 0.8;
  }

  .dark {
    /* Semantic overrides for dark mode */
    --surface-base: #13100c;
    --surface-lift: #1a1612;
    --surface-deep: #0a0806;
    --surface-glass: rgba(26, 22, 18, 0.65);
    --surface-card: rgba(30, 25, 20, 0.55);

    --text-primary: #f5ecde;
    --text-secondary: rgba(245, 236, 222, 0.72);
    --text-tertiary: rgba(245, 236, 222, 0.50);
    --text-quaternary: rgba(245, 236, 222, 0.28);

    --border-subtle: rgba(245, 236, 222, 0.12);
    --border-muted: rgba(245, 236, 222, 0.22);

    /* Slightly stronger glows in dark */
    --glow-violet: rgba(123, 92, 255, 0.45);
    --glow-blue: rgba(75, 163, 255, 0.45);
    --glow-coral: rgba(255, 138, 76, 0.45);
    --glow-amber: rgba(245, 197, 92, 0.50);
    --glow-teal: rgba(61, 216, 168, 0.45);
    --glow-rose: rgba(255, 90, 138, 0.45);

    /* Shadcn tokens */
    --background: 30 16% 7%;
    --foreground: 40 50% 92%;
    --card: 30 16% 10%;
    --card-foreground: 40 50% 92%;
    --popover: 30 16% 10%;
    --popover-foreground: 40 50% 92%;
    --primary: 255 100% 72%;
    --primary-foreground: 30 16% 7%;
    --secondary: 30 8% 18%;
    --secondary-foreground: 40 50% 92%;
    --muted: 30 8% 18%;
    --muted-foreground: 40 20% 60%;
    --accent: 30 8% 20%;
    --accent-foreground: 40 50% 92%;
    --destructive: 342 80% 55%;
    --destructive-foreground: 40 50% 92%;
    --border: 30 8% 22%;
    --input: 30 8% 22%;
    --ring: 255 100% 72%;
  }

  * {
    @apply border-border;
  }

  html {
    font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background: var(--surface-base);
    color: var(--text-primary);
    font-size: 0.875rem;
    line-height: 1.5;
    min-height: 100vh;
    font-feature-settings: "tnum";
  }

  .font-display {
    font-family: var(--font-cormorant), Georgia, serif;
    font-style: italic;
  }

  .font-mono {
    font-family: var(--font-geist-mono), ui-monospace, monospace;
  }

  ::selection {
    background: var(--aurora-amber);
    color: var(--ink-deep);
  }

  *:focus-visible {
    outline: 2px solid var(--aurora-violet);
    outline-offset: 2px;
    border-radius: 4px;
  }
}

@layer utilities {
  .glass {
    background: var(--surface-glass);
    backdrop-filter: blur(28px) saturate(1.4);
    -webkit-backdrop-filter: blur(28px) saturate(1.4);
  }

  .glass-card {
    background: var(--surface-card);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }

    .ambient-aurora,
    .ambient-spotlight {
      display: none;
    }
  }
}
```

- [ ] **Step 3.2: Verify**

Run: `pnpm -F @casella/web typecheck`
Run: `pnpm -F @casella/web dev` (background) and curl `/`. Expected: HTML loads without CSS errors.
Stop dev server.

- [ ] **Step 3.3: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat(web): complete Ascentra token system in globals.css (light + dark)"
```

---

## Task 4: Extend tailwind.config.ts with Ascentra tokens

**Files:**
- Rewrite: `apps/web/tailwind.config.ts`

- [ ] **Step 4.1: Replace tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

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
        /* Ascentra raw */
        cream: {
          base: "var(--cream-base)",
          lift: "var(--cream-lift)",
          deep: "var(--cream-deep)",
        },
        ink: {
          DEFAULT: "var(--ink-deep)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
          4: "var(--ink-4)",
          5: "var(--ink-5)",
        },
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

        /* Semantic */
        surface: {
          base: "var(--surface-base)",
          lift: "var(--surface-lift)",
          deep: "var(--surface-deep)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          quaternary: "var(--text-quaternary)",
        },
        status: {
          success: "var(--status-success)",
          warning: "var(--status-warning)",
          danger: "var(--status-danger)",
          info: "var(--status-info)",
          pending: "var(--status-pending)",
          attention: "var(--status-attention)",
        },

        /* Shadcn compatibility */
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
      boxShadow: {
        "glow-violet": "0 4px 24px var(--glow-violet)",
        "glow-blue": "0 4px 24px var(--glow-blue)",
        "glow-coral": "0 4px 24px var(--glow-coral)",
        "glow-amber": "0 4px 24px var(--glow-amber)",
        "glow-teal": "0 4px 24px var(--glow-teal)",
        "glow-rose": "0 4px 24px var(--glow-rose)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        draw: "var(--ease-draw)",
        spring: "var(--ease-spring)",
        "out-expo": "var(--ease-out-expo)",
      },
      transitionDuration: {
        quick: "var(--duration-quick)",
        standard: "var(--duration-standard)",
        emphasized: "var(--duration-emphasized)",
      },
      keyframes: {
        "aurora-drift": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg) scale(1)" },
          "33%": { transform: "translate(-2%, 2%) rotate(1.5deg) scale(1.04)" },
          "66%": { transform: "translate(2%, -1%) rotate(-1deg) scale(1.02)" },
        },
        "char-rise": {
          from: { transform: "translateY(110%)" },
          to: { transform: "translateY(0)" },
        },
        "status-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(61, 216, 168, 0.6)" },
          "50%": { boxShadow: "0 0 0 6px rgba(61, 216, 168, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "aurora-drift": "aurora-drift 24s var(--ease-standard) infinite alternate",
        "char-rise": "char-rise 1200ms var(--ease-out-expo) forwards",
        "status-pulse": "status-pulse 2500ms var(--ease-standard) infinite",
        shimmer: "shimmer 1.5s var(--ease-standard) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 4.2: Verify**

Run: `pnpm -F @casella/web typecheck`
Run: `pnpm -F @casella/web dev` and curl `/`; HTML rendered without errors.
Stop dev server.

- [ ] **Step 4.3: Commit**

```bash
git add apps/web/tailwind.config.ts
git commit -m "feat(web): extend Tailwind with Ascentra tokens + motion utilities"
```

---

## Task 5: Schema migration — users.theme_preference + addresses extensions

**Files:**
- Modify: `packages/db/src/schema/identity.ts`
- Modify: `packages/db/src/schema/addresses.ts`
- Generate + apply: `packages/db/drizzle/0002_*.sql`

- [ ] **Step 5.1: Add `themePreference` to users schema**

In `packages/db/src/schema/identity.ts`, extend the `users` pgTable with a new enum column. Add at top of file:

```typescript
import { pgEnum } from "drizzle-orm/pg-core";
// ...existing imports
```

Create a new enum (at the top of the `users` definition file or in `enums.ts`). Since `enums.ts` is the central file, add there:

In `packages/db/src/schema/enums.ts`, append:
```typescript
export const themePreferenceEnum = pgEnum("theme_preference", [
  "light",
  "dark",
  "system",
]);
```

Then in `identity.ts`, import and use:
```typescript
import { userRoleEnum, employmentStatusEnum, compensationTypeEnum, themePreferenceEnum } from "./enums";
// ...

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  entraOid: text("entra_oid").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("employee"),
  themePreference: themePreferenceEnum("theme_preference")
    .notNull()
    .default("system"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
});
```

- [ ] **Step 5.2: Add PDOK + address metadata fields to addresses**

In `packages/db/src/schema/addresses.ts`, extend `addresses` pgTable:

```typescript
export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pdokId: text("pdok_id"),
    street: text("street").notNull(),
    houseNumber: text("house_number").notNull(),
    houseNumberAddition: text("house_number_addition"),
    postalCode: text("postal_code").notNull(),
    city: text("city").notNull(),
    municipality: text("municipality"),
    province: text("province"),
    country: text("country").notNull().default("NL"),
    fullAddressDisplay: text("full_address_display"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    rdX: doublePrecision("rd_x"),
    rdY: doublePrecision("rd_y"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    pdokIdUnique: unique().on(t.pdokId),
  })
);
```

Update import at top of file if needed (`unique` is already imported; `doublePrecision` likewise).

- [ ] **Step 5.3: Generate migration**

Run:
```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" pnpm db:generate
```

Expected: new migration SQL file generated in `packages/db/drizzle/0002_<name>.sql` containing ALTER statements for both tables + new enum.

Review the generated SQL briefly — should contain:
- `CREATE TYPE "theme_preference"`
- `ALTER TABLE "users" ADD COLUMN "theme_preference" "theme_preference" NOT NULL DEFAULT 'system'`
- `ALTER TABLE "addresses" ADD COLUMN pdok_id text`, plus municipality, province, full_address_display, rd_x, rd_y
- UNIQUE constraint on pdok_id

- [ ] **Step 5.4: Apply migration**

Run:
```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" pnpm db:migrate
```
Expected: migration applied successfully.

- [ ] **Step 5.5: Verify**

Run:
```bash
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "\d users" | grep theme
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "\d addresses" | grep -E "pdok_id|municipality|province|rd_x"
```
Expected: all new columns listed.

- [ ] **Step 5.6: Commit**

```bash
git add packages/db/src/schema/ packages/db/drizzle/
git commit -m "feat(db): add users.theme_preference + addresses PDOK/RD fields"
```

---

## Task 6: Server-side theme cookie helpers

**Files:**
- Create: `apps/web/lib/theme-cookie.ts`
- Create: `apps/web/app/head-theme-script.tsx`

- [ ] **Step 6.1: Create theme-cookie.ts**

```typescript
import { cookies } from "next/headers";

export const THEME_COOKIE = "casella.theme";
export type ThemePreference = "light" | "dark" | "system";

export async function getThemePreference(): Promise<ThemePreference> {
  const store = await cookies();
  const v = store.get(THEME_COOKIE)?.value;
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export async function setThemePreference(t: ThemePreference) {
  const store = await cookies();
  store.set(THEME_COOKIE, t, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
  });
}
```

- [ ] **Step 6.2: Create inline pre-hydration script component**

```typescript
// apps/web/app/head-theme-script.tsx
// NOTE: rendered server-side into <head>; body is an inline script that runs before React hydrates.
// It reads the theme cookie and applies `dark` class on <html> if needed. Prevents FOUT.

export function HeadThemeScript() {
  const code = `
    (function() {
      try {
        var c = document.cookie.split('; ').find(r => r.startsWith('casella.theme='));
        var t = c ? decodeURIComponent(c.split('=')[1]) : 'system';
        var resolved = t === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : t;
        if (resolved === 'dark') document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', resolved);
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
```

- [ ] **Step 6.3: Inject script into root layout**

Modify `apps/web/app/layout.tsx` to render the inline script inside `<head>`. Next 15 App Router allows custom head through the root layout component; use:

```typescript
import { HeadThemeScript } from "./head-theme-script";
// ...
return (
  <html lang="nl" className={...} suppressHydrationWarning>
    <head>
      <HeadThemeScript />
    </head>
    <body>{children}</body>
  </html>
);
```

- [ ] **Step 6.4: Verify**

Run: `pnpm -F @casella/web typecheck`
Expected: no errors.

- [ ] **Step 6.5: Commit**

```bash
git add apps/web/lib/theme-cookie.ts apps/web/app/head-theme-script.tsx apps/web/app/layout.tsx
git commit -m "feat(web): pre-hydration theme script + cookie helpers"
```

---

## Task 7: Client-side theme hook + ThemeSwitcher

**Files:**
- Create: `apps/web/lib/use-theme.ts`
- Create: `apps/web/components/theme/theme-toggle.tsx`
- Create: `apps/web/app/(authed)/actions.ts` (server action for theme persist)

- [ ] **Step 7.1: Create useTheme hook**

```typescript
// apps/web/lib/use-theme.ts
"use client";

import { useEffect, useState } from "react";
import { THEME_COOKIE, type ThemePreference } from "./theme-cookie";

function readCookie(): ThemePreference {
  const match = document.cookie.match(/casella\.theme=(light|dark|system)/);
  return (match?.[1] as ThemePreference) ?? "system";
}

function applyTheme(pref: ThemePreference) {
  const resolved =
    pref === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : pref;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.setAttribute("data-theme", resolved);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>("system");

  useEffect(() => {
    setThemeState(readCookie());
    // Re-apply on system preference change when in "system" mode
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (readCookie() === "system") applyTheme("system");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const setTheme = (next: ThemePreference) => {
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    applyTheme(next);
    setThemeState(next);
    // Fire off server persist (non-blocking)
    fetch("/api/user/theme", { method: "POST", body: JSON.stringify({ theme: next }) }).catch(() => {});
  };

  return { theme, setTheme };
}
```

- [ ] **Step 7.2: Create theme persist API route**

```typescript
// apps/web/app/api/user/theme/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@casella/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export async function POST(req: Request) {
  const session = await auth();
  const entraOid = session?.entraOid;
  if (!entraOid) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const db = getDb();
  await db
    .update(schema.users)
    .set({ themePreference: parsed.data.theme, updatedAt: new Date() })
    .where(eq(schema.users.entraOid, entraOid));

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 7.3: Create ThemeToggle component (will render inside user-menu later)**

```typescript
// apps/web/components/theme/theme-toggle.tsx
"use client";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/use-theme";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light" as const, label: "Licht", icon: Sun },
  { value: "dark" as const, label: "Donker", icon: Moon },
  { value: "system" as const, label: "Systeem", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex gap-1 rounded-lg bg-surface-deep p-1">
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-standard ease-standard",
              active
                ? "bg-surface-base text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
            aria-pressed={active}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7.4: Verify**

Run: `pnpm -F @casella/web typecheck`

- [ ] **Step 7.5: Commit**

```bash
git add apps/web/lib/use-theme.ts apps/web/app/api/user/theme apps/web/components/theme
git commit -m "feat(web): client theme hook + persist API + ThemeToggle component"
```

---

## Task 8: Install shadcn primitives needed (input, textarea, select, dialog, popover, etc.)

**Files:**
- Create via shadcn CLI: `apps/web/components/ui/{input,textarea,select,dialog,popover,separator,badge,skeleton,tabs,label,dropdown-menu,form}.tsx`

- [ ] **Step 8.1: Install shadcn components in bulk**

Run from `apps/web/`:
```bash
pnpm dlx shadcn@latest add input textarea select dialog popover separator badge skeleton tabs label dropdown-menu form --yes
```

Expected: creates the listed files under `components/ui/`.

- [ ] **Step 8.2: Verify typecheck**

Run: `pnpm -F @casella/web typecheck`
Expected: no errors (shadcn generates React 19 compatible components when the `components.json` is correctly configured, which it is from Fase 0).

- [ ] **Step 8.3: Commit**

```bash
git add apps/web/components/ui
git commit -m "feat(web): add shadcn primitives (input, textarea, select, dialog, popover, tabs, etc.)"
```

---

## Task 9: Audit helper in packages/db

**Files:**
- Create: `packages/db/src/audit.ts`
- Modify: `packages/db/src/index.ts` (export)

- [ ] **Step 9.1: Create audit.ts**

```typescript
// packages/db/src/audit.ts
import type { PgTransaction } from "drizzle-orm/pg-core";
import { auditLog } from "./schema/system";

export interface AuditInput {
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  changesJson?: Record<string, unknown> | null;
}

/**
 * Write an audit-log entry inside an open transaction.
 * Must be called from within a db.transaction() block so the audit-log write
 * is atomic with the business mutation.
 */
export async function auditMutation<T extends PgTransaction<any, any, any>>(
  tx: T,
  input: AuditInput
): Promise<void> {
  await tx.insert(auditLog).values({
    actorUserId: input.actorUserId ?? undefined,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    changesJson: input.changesJson ?? undefined,
  });
}
```

- [ ] **Step 9.2: Export from index**

Modify `packages/db/src/index.ts`:
```typescript
export { getDb, type Database } from "./client";
export * as schema from "./schema";
export * from "drizzle-orm";
export { auditMutation, type AuditInput } from "./audit";
```

- [ ] **Step 9.3: Typecheck**

```bash
pnpm -F @casella/db typecheck
```

- [ ] **Step 9.4: Commit**

```bash
git add packages/db/src
git commit -m "feat(db): add auditMutation helper for transactional audit-log writes"
```

---

## Task 10: Create packages/maps (PDOK client) — scaffold + suggest

**Files:**
- Create: `packages/maps/package.json`
- Create: `packages/maps/tsconfig.json`
- Create: `packages/maps/src/index.ts`
- Create: `packages/maps/src/pdok.ts`
- Create: `packages/maps/src/types.ts`

- [ ] **Step 10.1: Create package.json**

```json
{
  "name": "@casella/maps",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "echo 'no lint'",
    "typecheck": "tsc --noEmit",
    "test": "dotenv -e ../../.env -- vitest run"
  },
  "dependencies": {
    "@casella/types": "workspace:*",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "dotenv-cli": "^7.4.0"
  }
}
```

- [ ] **Step 10.2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 10.3: Create types.ts**

```typescript
// packages/maps/src/types.ts
import { z } from "zod";

export const pdokSuggestionSchema = z.object({
  id: z.string(),
  weergavenaam: z.string(),
  type: z.string(),
  score: z.number(),
});
export type PdokSuggestion = z.infer<typeof pdokSuggestionSchema>;

export const pdokAddressSchema = z.object({
  id: z.string(),
  street: z.string(),
  houseNumber: z.string(),
  houseNumberAddition: z.string().nullable(),
  postalCode: z.string(),
  city: z.string(),
  municipality: z.string().nullable(),
  province: z.string().nullable(),
  country: z.literal("NL"),
  lat: z.number(),
  lng: z.number(),
  rdX: z.number().nullable(),
  rdY: z.number().nullable(),
  fullDisplay: z.string(),
});
export type PdokAddress = z.infer<typeof pdokAddressSchema>;
```

- [ ] **Step 10.4: Create pdok.ts (suggest + lookup)**

```typescript
// packages/maps/src/pdok.ts
import { pdokSuggestionSchema, pdokAddressSchema, type PdokSuggestion, type PdokAddress } from "./types";

const BASE = "https://api.pdok.nl/bzk/locatieserver/search/v3_1";

interface SuggestResponse {
  response: { docs: Array<{ id: string; weergavenaam: string; type: string; score: number }> };
}

interface LookupResponse {
  response: {
    docs: Array<{
      id: string;
      straatnaam: string;
      huisnummer: number;
      huisnummertoevoeging?: string;
      postcode: string;
      woonplaatsnaam: string;
      gemeentenaam?: string;
      provincienaam?: string;
      centroide_ll: string;      // "POINT(lng lat)"
      centroide_rd?: string;     // "POINT(x y)"
      weergavenaam: string;
    }>;
  };
}

export async function suggestAddresses(q: string, limit = 8): Promise<PdokSuggestion[]> {
  if (q.trim().length < 2) return [];
  const url = `${BASE}/suggest?q=${encodeURIComponent(q)}&rows=${limit}&fq=type:adres`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`PDOK suggest failed: ${res.status}`);
  const json = (await res.json()) as SuggestResponse;
  return json.response.docs.map((d) =>
    pdokSuggestionSchema.parse({
      id: d.id,
      weergavenaam: d.weergavenaam,
      type: d.type,
      score: d.score,
    })
  );
}

function parsePoint(s: string): { x: number; y: number } {
  const m = s.match(/POINT\(([^\s]+)\s+([^)]+)\)/);
  if (!m) throw new Error(`Unparseable POINT: ${s}`);
  return { x: parseFloat(m[1]!), y: parseFloat(m[2]!) };
}

export async function lookupAddress(id: string): Promise<PdokAddress> {
  const url = `${BASE}/lookup?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`PDOK lookup failed: ${res.status}`);
  const json = (await res.json()) as LookupResponse;
  const d = json.response.docs[0];
  if (!d) throw new Error("PDOK lookup: no results");
  const ll = parsePoint(d.centroide_ll);
  const rd = d.centroide_rd ? parsePoint(d.centroide_rd) : null;
  return pdokAddressSchema.parse({
    id: d.id,
    street: d.straatnaam,
    houseNumber: String(d.huisnummer),
    houseNumberAddition: d.huisnummertoevoeging ?? null,
    postalCode: d.postcode,
    city: d.woonplaatsnaam,
    municipality: d.gemeentenaam ?? null,
    province: d.provincienaam ?? null,
    country: "NL",
    lat: ll.y,
    lng: ll.x,
    rdX: rd?.x ?? null,
    rdY: rd?.y ?? null,
    fullDisplay: d.weergavenaam,
  });
}
```

- [ ] **Step 10.5: Create index.ts barrel**

```typescript
// packages/maps/src/index.ts
export { suggestAddresses, lookupAddress } from "./pdok";
export { pdokSuggestionSchema, pdokAddressSchema } from "./types";
export type { PdokSuggestion, PdokAddress } from "./types";
```

- [ ] **Step 10.6: Install + typecheck**

Run:
```bash
pnpm install
pnpm -F @casella/maps typecheck
```

- [ ] **Step 10.7: Commit**

```bash
git add packages/maps pnpm-lock.yaml
git commit -m "feat(maps): scaffold @casella/maps with PDOK suggest + lookup"
```

---

## Task 11: PDOK integration tests

**Files:**
- Create: `packages/maps/vitest.config.ts`
- Create: `packages/maps/tests/pdok.test.ts`

- [ ] **Step 11.1: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
  },
});
```

- [ ] **Step 11.2: Create pdok.test.ts**

This is a live integration test (hits PDOK's public API — free, no auth). Light-touch to avoid hammering the endpoint.

```typescript
import { describe, it, expect } from "vitest";
import { suggestAddresses, lookupAddress } from "../src/pdok";

describe("PDOK suggest", () => {
  it("returns suggestions for a well-known address", async () => {
    const results = await suggestAddresses("Damrak 10 Amsterdam", 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      type: expect.stringMatching(/adres/),
      weergavenaam: expect.stringContaining("Damrak"),
    });
  });

  it("returns empty for empty query", async () => {
    const results = await suggestAddresses("", 5);
    expect(results).toEqual([]);
  });

  it("returns empty for single-char query", async () => {
    const results = await suggestAddresses("a", 5);
    expect(results).toEqual([]);
  });
});

describe("PDOK lookup", () => {
  it("lookups an address ID end-to-end via suggest → lookup", async () => {
    const suggestions = await suggestAddresses("Binnenhof 1 Den Haag", 1);
    expect(suggestions.length).toBeGreaterThan(0);
    const address = await lookupAddress(suggestions[0]!.id);
    expect(address).toMatchObject({
      street: expect.stringContaining("Binnenhof"),
      city: "'s-Gravenhage",
      country: "NL",
    });
    expect(address.lat).toBeGreaterThan(50);
    expect(address.lat).toBeLessThan(54);
    expect(address.lng).toBeGreaterThan(3);
    expect(address.lng).toBeLessThan(8);
  });
});
```

- [ ] **Step 11.3: Run tests**

```bash
pnpm -F @casella/maps test
```
Expected: 4 tests PASS (live network).

If PDOK is temporarily down, tests will fail — retry later. These are smoke-level integration tests; they confirm our parsers match real PDOK responses.

- [ ] **Step 11.4: Commit**

```bash
git add packages/maps/vitest.config.ts packages/maps/tests
git commit -m "test(maps): PDOK integration tests for suggest + lookup"
```

---

## Task 12: PDOK API routes in apps/web

**Files:**
- Create: `apps/web/app/api/pdok/suggest/route.ts`
- Create: `apps/web/app/api/pdok/lookup/[id]/route.ts`
- Modify: `apps/web/package.json` (add `@casella/maps`)

- [ ] **Step 12.1: Add @casella/maps dep**

In `apps/web/package.json`, add to dependencies:
```json
"@casella/maps": "workspace:*",
```

Run: `pnpm install`

- [ ] **Step 12.2: Create /api/pdok/suggest route**

```typescript
// apps/web/app/api/pdok/suggest/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { suggestAddresses } from "@casella/maps";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const results = await suggestAddresses(q, 8);
  return NextResponse.json({ results });
}
```

- [ ] **Step 12.3: Create /api/pdok/lookup/[id] route**

```typescript
// apps/web/app/api/pdok/lookup/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { lookupAddress } from "@casella/maps";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  try {
    const address = await lookupAddress(id);
    return NextResponse.json({ address });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "lookup failed" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 12.4: Verify**

```bash
pnpm -F @casella/web typecheck
```

- [ ] **Step 12.5: Commit**

```bash
git add apps/web/package.json apps/web/app/api/pdok pnpm-lock.yaml
git commit -m "feat(web): /api/pdok/suggest + /api/pdok/lookup proxy routes"
```

---

## Task 13: AddressInput component (client, debounced)

**Files:**
- Create: `apps/web/components/address-input/address-input.tsx`
- Create: `apps/web/components/address-input/use-debounce.ts`

- [ ] **Step 13.1: Create use-debounce helper**

```typescript
// apps/web/components/address-input/use-debounce.ts
"use client";
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(h);
  }, [value, delayMs]);
  return debounced;
}
```

- [ ] **Step 13.2: Create AddressInput component**

```typescript
// apps/web/components/address-input/address-input.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { useDebounce } from "./use-debounce";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import type { AddressInput as AddressValue } from "@casella/types";

interface Props {
  value: AddressValue | null;
  onChange: (v: AddressValue | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface Suggestion {
  id: string;
  weergavenaam: string;
}

export function AddressInput({ value, onChange, placeholder, disabled }: Props) {
  const [query, setQuery] = useState(value?.fullDisplay ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const debouncedQuery = useDebounce(query, 250);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setLoading(true);
    fetch(`/api/pdok/suggest?q=${encodeURIComponent(debouncedQuery)}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((json: { results?: Suggestion[] }) => {
        setSuggestions(json.results ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [debouncedQuery]);

  async function handleSelect(suggestion: Suggestion) {
    setLoading(true);
    try {
      const r = await fetch(`/api/pdok/lookup/${encodeURIComponent(suggestion.id)}`);
      const json = await r.json();
      if (json.address) {
        onChange(json.address as AddressValue);
        setQuery(json.address.fullDisplay);
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <Command shouldFilter={false} className="rounded-lg border border-border bg-surface-base">
        <div className="flex items-center gap-2 px-3 py-2">
          <MapPin className="h-4 w-4 text-text-tertiary" aria-hidden />
          <CommandInput
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              setOpen(true);
              if (v === "") handleClear();
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder ?? "Typ een adres of postcode..."}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary"
          />
        </div>
        {open && (
          <CommandList className="max-h-64 overflow-y-auto border-t border-border">
            {loading && (
              <div className="px-3 py-2 text-xs text-text-tertiary">Zoeken...</div>
            )}
            <CommandEmpty className="px-3 py-2 text-xs text-text-tertiary">
              {query.length < 2 ? "Typ minimaal 2 tekens" : "Geen resultaten"}
            </CommandEmpty>
            <CommandGroup>
              {suggestions.map((s) => (
                <CommandItem
                  key={s.id}
                  onSelect={() => handleSelect(s)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm",
                    "aria-selected:bg-surface-deep hover:bg-surface-deep"
                  )}
                >
                  {s.weergavenaam}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
      {value && (
        <div className="mt-1 flex items-center justify-between text-xs text-text-tertiary">
          <span>
            Geselecteerd: {value.street} {value.houseNumber}
            {value.houseNumberAddition ? `-${value.houseNumberAddition}` : ""},{" "}
            {value.postalCode} {value.city}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-aurora-rose hover:underline"
          >
            Wissen
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 13.3: Verify**

```bash
pnpm -F @casella/web typecheck
```

- [ ] **Step 13.4: Commit**

```bash
git add apps/web/components/address-input
git commit -m "feat(web): <AddressInput> PDOK-backed autocomplete component"
```

---

## Task 14: Schema migration — employees additions

**Files:**
- Modify: `packages/db/src/schema/identity.ts`
- Generate + apply migration

- [ ] **Step 14.1: Add employees columns**

Modify the `employees` pgTable in `packages/db/src/schema/identity.ts`:

```typescript
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  inviteEmail: text("invite_email"),
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
  contractedHoursPerWeek: integer("contracted_hours_per_week").notNull().default(40),
  managerId: uuid("manager_id").references(() => users.id),
  phone: text("phone"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  avatarUrl: text("avatar_url"),
  jobTitle: text("job_title"),
  notes: text("notes"),
  // Pending-termination critical-op state
  pendingTerminationAt: date("pending_termination_at"),
  pendingTerminationReason: text("pending_termination_reason"),
  terminationUndoUntil: timestamp("termination_undo_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

(Note: `userId` nullable now — remove `.notNull()` reference. `contractedHoursPerWeek` added. Several new columns.)

Add a unique index on lower-cased invite_email:

At end of identity.ts file, after the `employees` declaration, add:
```typescript
// Note: drizzle-kit doesn't support raw SQL unique index on function of column
// (LOWER(invite_email)). We'll create it via raw migration SQL below.
```

And plan to add a manual SQL statement into the migration — see Step 14.3.

- [ ] **Step 14.2: Generate migration**

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" pnpm db:generate
```

Expected: new migration file (`0003_*.sql`) containing ALTER statements.

- [ ] **Step 14.3: Append raw SQL for case-insensitive unique index**

Open the newest migration file and **append** at the end:
```sql
CREATE UNIQUE INDEX employees_invite_email_unique_ci
  ON employees (LOWER(invite_email)) WHERE invite_email IS NOT NULL;
```

- [ ] **Step 14.4: Apply migration**

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" pnpm db:migrate
```

Expected: migration applied successfully.

- [ ] **Step 14.5: Verify**

```bash
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "\d employees" | grep -E "invite_email|phone|job_title|contracted|pending_termination"
```

Expected: all new columns present.

- [ ] **Step 14.6: Commit**

```bash
git add packages/db/src/schema/identity.ts packages/db/drizzle/
git commit -m "feat(db): employees — invite flow, HR fields, critical-op termination state"
```

---

## Task 15: Zod schemas for employees in @casella/types

**Files:**
- Create: `packages/types/src/employees.ts`
- Modify: `packages/types/src/index.ts`

- [ ] **Step 15.1: Create employees schemas**

```typescript
// packages/types/src/employees.ts
import { z } from "zod";
import { emailSchema, nonEmptyStringSchema, uuidSchema, dateIsoSchema } from "./common";

export const employmentStatusSchema = z.enum([
  "active",
  "on_leave",
  "sick",
  "terminated",
]);
export type EmploymentStatus = z.infer<typeof employmentStatusSchema>;

export const compensationTypeSchema = z.enum(["auto", "ov", "none"]);
export type CompensationType = z.infer<typeof compensationTypeSchema>;

export const addressInputSchema = z.object({
  pdokId: z.string(),
  street: nonEmptyStringSchema,
  houseNumber: nonEmptyStringSchema,
  houseNumberAddition: z.string().nullable(),
  postalCode: nonEmptyStringSchema,
  city: nonEmptyStringSchema,
  municipality: z.string().nullable(),
  province: z.string().nullable(),
  country: z.literal("NL"),
  lat: z.number(),
  lng: z.number(),
  rdX: z.number().nullable(),
  rdY: z.number().nullable(),
  fullDisplay: z.string(),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

export const createEmployeeSchema = z.object({
  inviteEmail: emailSchema,
  nmbrsEmployeeId: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  startDate: dateIsoSchema.optional().nullable(),
  managerId: uuidSchema.optional().nullable(),
  contractedHoursPerWeek: z.number().int().min(1).max(60).default(40),
  defaultKmRateCents: z.number().int().min(0).default(23),
  compensationType: compensationTypeSchema.default("auto"),
  homeAddress: addressInputSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: uuidSchema,
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const initiateTerminateSchema = z.object({
  id: uuidSchema,
  pendingTerminationAt: dateIsoSchema,
  reason: z.string().max(1000).optional(),
  confirmText: nonEmptyStringSchema,
});
export type InitiateTerminateInput = z.infer<typeof initiateTerminateSchema>;
```

- [ ] **Step 15.2: Export from index**

Append to `packages/types/src/index.ts`:
```typescript
export * from "./employees";
```

- [ ] **Step 15.3: Typecheck**

```bash
pnpm -F @casella/types typecheck
```

- [ ] **Step 15.4: Commit**

```bash
git add packages/types/src
git commit -m "feat(types): Zod schemas for employees (create/update/terminate)"
```

---

## Task 16: Employees server actions — create + update + list query

**Files:**
- Create: `apps/web/app/(admin)/admin/medewerkers/actions.ts`
- Create: `apps/web/app/(admin)/admin/medewerkers/queries.ts`
- Modify: `apps/web/package.json` (add `@casella/maps` if not yet — already in Task 12)

- [ ] **Step 16.1: Create queries.ts**

```typescript
// apps/web/app/(admin)/admin/medewerkers/queries.ts
import { getDb, schema } from "@casella/db";
import { and, asc, desc, eq, isNull, or, ilike, sql } from "drizzle-orm";

export interface EmployeeListRow {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
  employmentStatus: string;
  startDate: string | null;
  endDate: string | null;
  userId: string | null;
  inviteEmail: string | null;
}

export interface EmployeeListParams {
  search?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}

export async function listEmployees(params: EmployeeListParams): Promise<{
  rows: EmployeeListRow[];
  nextCursor: string | null;
}> {
  const db = getDb();
  const limit = Math.min(params.limit ?? 50, 100);
  const where = [];
  if (params.search) {
    const q = `%${params.search}%`;
    where.push(
      or(
        ilike(schema.users.email, q),
        ilike(schema.users.displayName, q),
        ilike(schema.employees.inviteEmail, q),
        ilike(schema.employees.jobTitle, q)
      )
    );
  }
  if (params.status && params.status !== "all") {
    where.push(eq(schema.employees.employmentStatus, params.status as any));
  }
  if (params.cursor) {
    where.push(sql`${schema.employees.createdAt} < ${new Date(params.cursor)}`);
  }

  const rows = await db
    .select({
      id: schema.employees.id,
      displayName: schema.users.displayName,
      email: schema.users.email,
      inviteEmail: schema.employees.inviteEmail,
      jobTitle: schema.employees.jobTitle,
      employmentStatus: schema.employees.employmentStatus,
      startDate: schema.employees.startDate,
      endDate: schema.employees.endDate,
      userId: schema.employees.userId,
      createdAt: schema.employees.createdAt,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(schema.employees.createdAt))
    .limit(limit + 1);

  const has_more = rows.length > limit;
  const visible = rows.slice(0, limit);
  const nextCursor = has_more ? visible[visible.length - 1]!.createdAt.toISOString() : null;

  return {
    rows: visible.map((r) => ({
      id: r.id,
      displayName: r.displayName ?? "(nog niet ingelogd)",
      email: r.email ?? r.inviteEmail ?? "",
      jobTitle: r.jobTitle,
      employmentStatus: r.employmentStatus,
      startDate: r.startDate,
      endDate: r.endDate,
      userId: r.userId,
      inviteEmail: r.inviteEmail,
    })),
    nextCursor,
  };
}
```

- [ ] **Step 16.2: Create actions.ts with create + update**

```typescript
// apps/web/app/(admin)/admin/medewerkers/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getDb, schema, auditMutation } from "@casella/db";
import { createEmployeeSchema, updateEmployeeSchema, type CreateEmployeeInput, type UpdateEmployeeInput, type AddressInput } from "@casella/types";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") throw new Error("unauthorized");
  return u;
}

async function upsertAddress(tx: any, input: AddressInput): Promise<string> {
  // Dedupe by pdok_id
  const existing = await tx
    .select({ id: schema.addresses.id })
    .from(schema.addresses)
    .where(eq(schema.addresses.pdokId, input.pdokId))
    .limit(1);
  if (existing[0]) return existing[0].id;

  const [created] = await tx
    .insert(schema.addresses)
    .values({
      pdokId: input.pdokId,
      street: input.street,
      houseNumber: input.houseNumber,
      houseNumberAddition: input.houseNumberAddition,
      postalCode: input.postalCode,
      city: input.city,
      municipality: input.municipality,
      province: input.province,
      country: input.country,
      lat: input.lat,
      lng: input.lng,
      rdX: input.rdX,
      rdY: input.rdY,
      fullAddressDisplay: input.fullDisplay,
    })
    .returning({ id: schema.addresses.id });
  return created.id;
}

export async function createEmployee(raw: CreateEmployeeInput) {
  const admin = await requireAdmin();
  const input = createEmployeeSchema.parse(raw);

  const db = getDb();
  const employeeId = await db.transaction(async (tx) => {
    let homeAddressId: string | null = null;
    if (input.homeAddress) {
      homeAddressId = await upsertAddress(tx, input.homeAddress);
    }

    const [created] = await tx
      .insert(schema.employees)
      .values({
        inviteEmail: input.inviteEmail,
        nmbrsEmployeeId: input.nmbrsEmployeeId ?? null,
        jobTitle: input.jobTitle ?? null,
        startDate: input.startDate ?? null,
        managerId: input.managerId ?? null,
        contractedHoursPerWeek: input.contractedHoursPerWeek,
        defaultKmRateCents: input.defaultKmRateCents,
        compensationType: input.compensationType,
        homeAddressId,
        phone: input.phone ?? null,
        emergencyContactName: input.emergencyContactName ?? null,
        emergencyContactPhone: input.emergencyContactPhone ?? null,
        notes: input.notes ?? null,
      })
      .returning({ id: schema.employees.id });

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "employees.create",
      resourceType: "employees",
      resourceId: created.id,
      changesJson: { after: input },
    });

    return created.id;
  });

  revalidatePath("/admin/medewerkers");
  return { id: employeeId };
}

export async function updateEmployee(raw: UpdateEmployeeInput) {
  const admin = await requireAdmin();
  const input = updateEmployeeSchema.parse(raw);

  const db = getDb();
  await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, input.id));
    if (!before) throw new Error("employee not found");

    let homeAddressId = before.homeAddressId;
    if (input.homeAddress) {
      homeAddressId = await upsertAddress(tx, input.homeAddress);
    }

    await tx
      .update(schema.employees)
      .set({
        inviteEmail: input.inviteEmail ?? before.inviteEmail,
        nmbrsEmployeeId: input.nmbrsEmployeeId ?? before.nmbrsEmployeeId,
        jobTitle: input.jobTitle ?? before.jobTitle,
        startDate: input.startDate ?? before.startDate,
        managerId: input.managerId ?? before.managerId,
        contractedHoursPerWeek: input.contractedHoursPerWeek ?? before.contractedHoursPerWeek,
        defaultKmRateCents: input.defaultKmRateCents ?? before.defaultKmRateCents,
        compensationType: input.compensationType ?? before.compensationType,
        homeAddressId,
        phone: input.phone ?? before.phone,
        emergencyContactName: input.emergencyContactName ?? before.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone ?? before.emergencyContactPhone,
        notes: input.notes ?? before.notes,
        updatedAt: new Date(),
      })
      .where(eq(schema.employees.id, input.id));

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "employees.update",
      resourceType: "employees",
      resourceId: input.id,
      changesJson: { before, after: input },
    });
  });

  revalidatePath("/admin/medewerkers");
  return { ok: true };
}
```

- [ ] **Step 16.3: Verify**

```bash
pnpm -F @casella/web typecheck
```

- [ ] **Step 16.4: Commit**

```bash
git add apps/web/app/\(admin\)/admin/medewerkers
git commit -m "feat(web): employees create + update server actions + list query"
```

---

## Task 17: Minimal employees list page (skeleton UI, Claude Design polishes later)

**Files:**
- Create: `apps/web/app/(admin)/admin/medewerkers/page.tsx`

- [ ] **Step 17.1: Create list page**

```typescript
// apps/web/app/(admin)/admin/medewerkers/page.tsx
import { listEmployees } from "./queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MedewerkersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const { rows, nextCursor } = await listEmployees({
    search: params.q,
    status: params.status,
    cursor: params.cursor,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-display">
          <span>Mede</span>
          <em>werkers</em>
        </h1>
        <Button asChild>
          <Link href="/admin/medewerkers?new=1">+ Nieuwe medewerker</Link>
        </Button>
      </header>

      <div className="rounded-lg border border-border glass-card">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <p className="font-display text-title">
              Nog geen <em>medewerkers</em>
            </p>
            <p className="text-sm text-text-secondary">
              Begin door iemand uit te nodigen voor Casella — ze krijgen toegang
              zodra ze voor 't eerst inloggen.
            </p>
            <Button asChild>
              <Link href="/admin/medewerkers?new=1">+ Nieuwe medewerker</Link>
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="p-3 text-left">Naam</th>
                <th className="p-3 text-left">E-mail</th>
                <th className="p-3 text-left">Functie</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Startdatum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-surface-deep transition-colors duration-quick ease-standard"
                >
                  <td className="p-3">
                    <Link
                      href={`/admin/medewerkers?id=${r.id}` as any}
                      className="hover:underline"
                    >
                      {r.displayName}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs text-text-secondary">
                    {r.email}
                  </td>
                  <td className="p-3 text-text-secondary">{r.jobTitle ?? "—"}</td>
                  <td className="p-3">
                    <EmploymentBadge status={r.employmentStatus} />
                  </td>
                  <td className="p-3 font-mono text-xs tabular-nums">
                    {r.startDate ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href={`/admin/medewerkers?cursor=${nextCursor}` as any}>
              Laad meer
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function EmploymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Actief", cls: "bg-status-success/15 text-status-success" },
    on_leave: { label: "Afwezig", cls: "bg-status-pending/15 text-status-pending" },
    sick: { label: "Ziek", cls: "bg-status-attention/15 text-status-attention" },
    terminated: { label: "Uit dienst", cls: "bg-status-danger/15 text-status-danger" },
  };
  const m = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}
```

- [ ] **Step 17.2: Verify**

```bash
pnpm -F @casella/web typecheck
```

- [ ] **Step 17.3: Commit**

```bash
git add apps/web/app/\(admin\)/admin/medewerkers/page.tsx
git commit -m "feat(web): employees list page with empty-state + cursor pagination"
```

---

## Task 18: Admin shell — Brand, env-badge, sidebar rewrite

**Files:**
- Create: `apps/web/components/shell/brand.tsx`
- Create: `apps/web/components/shell/env-badge.tsx`
- Rewrite: `apps/web/components/nav-admin.tsx` → migrate to `apps/web/components/shell/sidebar.tsx`

This task has substantial UI — the files below are a functional skeleton; Claude Design will iterate on visual details.

- [ ] **Step 18.1: Create brand.tsx**

```typescript
// apps/web/components/shell/brand.tsx
export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-aurora-violet via-aurora-blue to-aurora-teal shadow-glow-violet" />
      <div>
        <div className="font-display text-sm italic">Casella</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 18.2: Create env-badge.tsx**

```typescript
// apps/web/components/shell/env-badge.tsx
export function EnvBadge() {
  const env = process.env.NEXT_PUBLIC_CASELLA_ENV ?? "local";
  const map: Record<string, string> = {
    local: "bg-aurora-amber/20 text-aurora-amber",
    preview: "bg-aurora-blue/20 text-aurora-blue",
    production: "bg-aurora-teal/20 text-aurora-teal",
  };
  const cls = map[env] ?? "bg-muted";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {env}
    </span>
  );
}
```

- [ ] **Step 18.3: Create sidebar.tsx (replaces nav-admin/nav-employee glue)**

```typescript
// apps/web/components/shell/sidebar.tsx
"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { EnvBadge } from "./env-badge";
import { cn } from "@/lib/utils";
import { Users, Briefcase, Folders, UserCheck, Home, FileText, Clock, Calendar, Wallet } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";

const EMPLOYEE_LINKS: { href: Route; label: string; icon: any }[] = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: Home },
  { href: "/uren" as Route, label: "Uren", icon: Clock },
  { href: "/verlof" as Route, label: "Verlof", icon: Calendar },
  { href: "/contract" as Route, label: "Contract", icon: FileText },
  { href: "/loonstroken" as Route, label: "Loonstroken", icon: Wallet },
];

const ADMIN_LINKS: { href: Route; label: string; icon: any }[] = [
  { href: "/admin/dashboard" as Route, label: "Dashboard", icon: Home },
  { href: "/admin/medewerkers" as Route, label: "Medewerkers", icon: Users },
  { href: "/admin/klanten" as Route, label: "Klanten", icon: Briefcase },
  { href: "/admin/projecten" as Route, label: "Projecten", icon: Folders },
  { href: "/admin/toewijzingen" as Route, label: "Toewijzingen", icon: UserCheck },
];

export function Sidebar({ user, mode }: { user: CurrentUser; mode: "employee" | "admin" }) {
  const pathname = usePathname();
  const links = mode === "admin" ? ADMIN_LINKS : EMPLOYEE_LINKS;

  return (
    <nav className="flex h-screen w-64 flex-col border-r border-border glass">
      <div className="flex items-center justify-between p-4">
        <Brand />
        <EnvBadge />
      </div>

      <ul className="flex-1 space-y-0.5 px-3 py-2">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-quick ease-standard",
                  active
                    ? "bg-surface-base shadow-sm text-text-primary"
                    : "text-text-secondary hover:bg-surface-lift hover:text-text-primary"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {user.role === "admin" && (
        <div className="border-t border-border px-3 py-3">
          <Link
            href={(mode === "admin" ? "/dashboard" : "/admin/dashboard") as Route}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-aurora-violet hover:bg-surface-lift"
          >
            {mode === "admin" ? "← Medewerker-view" : "→ Admin-view"}
          </Link>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 18.4: Wire sidebar into (authed) and (admin) layouts**

Modify `apps/web/app/(authed)/layout.tsx`:
```typescript
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Sidebar } from "@/components/shell/sidebar";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} mode="employee" />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

Modify `apps/web/app/(admin)/layout.tsx`:
```typescript
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Sidebar } from "@/components/shell/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/dashboard");
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} mode="admin" />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

Delete `apps/web/components/nav-admin.tsx` and `apps/web/components/nav-employee.tsx` (replaced by new sidebar).

- [ ] **Step 18.5: Verify + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/components apps/web/app
git rm -f apps/web/components/nav-admin.tsx apps/web/components/nav-employee.tsx || true
git commit -m "feat(web): new glass sidebar + brand + env-badge (replaces nav-admin/-employee)"
```

---

## Task 19: Toast provider (sonner) + top-level Toaster in layout

**Files:**
- Create: `apps/web/components/toast/toaster.tsx`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 19.1: Create Toaster wrapper**

```typescript
// apps/web/components/toast/toaster.tsx
"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "glass-card border border-border",
          title: "text-text-primary text-sm",
          description: "text-text-secondary",
        },
      }}
      closeButton
      richColors
    />
  );
}
```

- [ ] **Step 19.2: Add to root layout**

Modify `apps/web/app/layout.tsx`:
```typescript
import { Toaster } from "@/components/toast/toaster";
// ...
<body>
  {children}
  <Toaster />
</body>
```

- [ ] **Step 19.3: Verify + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/components/toast apps/web/app/layout.tsx
git commit -m "feat(web): sonner toast provider"
```

---

## Task 20: Employees drawer — create + edit (multi-section form)

**Files:**
- Create: `apps/web/features/employees/drawer/employee-drawer.tsx`

This is a substantial component. It's deliberately a single file so it can be opened and read end-to-end; Claude Design polishes visuals later.

- [ ] **Step 20.1: Create employee-drawer.tsx**

```typescript
// apps/web/features/employees/drawer/employee-drawer.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeSchema, type CreateEmployeeInput } from "@casella/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AddressInput } from "@/components/address-input/address-input";
import { createEmployee } from "@/app/(admin)/admin/medewerkers/actions";
import { toast } from "sonner";

export function EmployeeDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get("new") === "1";
  const editId = searchParams.get("id");
  const open = isCreateMode || !!editId;

  function handleClose() {
    const params = new URLSearchParams(searchParams);
    params.delete("new");
    params.delete("id");
    router.push(`?${params.toString()}`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="fixed right-0 top-0 h-screen w-[560px] max-w-[90vw] translate-x-0 translate-y-0 rounded-none border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
        <DialogTitle className="sr-only">
          {isCreateMode ? "Nieuwe medewerker" : "Medewerker bewerken"}
        </DialogTitle>
        {isCreateMode && <CreateForm onDone={handleClose} />}
        {editId && <p className="p-6">Edit-modus is WIP (volgt in volgende taak).</p>}
      </DialogContent>
    </Dialog>
  );
}

function CreateForm({ onDone }: { onDone: () => void }) {
  const [homeAddress, setHomeAddress] = useState<any>(null);
  const form = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      contractedHoursPerWeek: 40,
      defaultKmRateCents: 23,
      compensationType: "auto",
    },
  });

  async function onSubmit(values: CreateEmployeeInput) {
    try {
      await createEmployee({ ...values, homeAddress });
      toast.success("Medewerker aangemaakt");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aanmaken mislukt");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col overflow-y-auto p-6">
      <header className="mb-6">
        <h2 className="font-display text-title">
          Nieuwe <em>medewerker</em>
        </h2>
      </header>

      <section className="space-y-4 border-b border-border pb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Basis</h3>
        <Field label="E-mail (invite)" required error={form.formState.errors.inviteEmail?.message}>
          <Input {...form.register("inviteEmail")} placeholder="medewerker@ascentra.nl" />
        </Field>
        <Field label="Functietitel">
          <Input {...form.register("jobTitle")} placeholder="Senior Supply Chain Consultant" />
        </Field>
        <Field label="Telefoonnummer">
          <Input {...form.register("phone")} placeholder="+31 6 1234 5678" />
        </Field>
      </section>

      <section className="space-y-4 border-b border-border py-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Dienstverband</h3>
        <Field label="Startdatum">
          <Input type="date" {...form.register("startDate")} />
        </Field>
        <Field label="Contract-uren per week">
          <Input
            type="number"
            min={1}
            max={60}
            {...form.register("contractedHoursPerWeek", { valueAsNumber: true })}
          />
        </Field>
      </section>

      <section className="space-y-4 border-b border-border py-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Vergoedingen</h3>
        <Field label="Vergoedingstype">
          <Select onValueChange={(v) => form.setValue("compensationType", v as any)} defaultValue="auto">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="ov">Openbaar vervoer</SelectItem>
              <SelectItem value="none">Geen</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Km-tarief (in centen)">
          <Input type="number" min={0} {...form.register("defaultKmRateCents", { valueAsNumber: true })} />
        </Field>
        <Field label="Woonadres">
          <AddressInput value={homeAddress} onChange={setHomeAddress} />
        </Field>
      </section>

      <section className="space-y-4 border-b border-border py-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Noodcontact</h3>
        <Field label="Contactpersoon">
          <Input {...form.register("emergencyContactName")} />
        </Field>
        <Field label="Telefoon contactpersoon">
          <Input {...form.register("emergencyContactPhone")} />
        </Field>
      </section>

      <section className="space-y-4 py-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Admin-notities</h3>
        <Textarea {...form.register("notes")} rows={4} placeholder="Intern, alleen zichtbaar voor admins" />
      </section>

      <div className="sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-surface-base p-4">
        <Button type="button" variant="outline" onClick={onDone} className="flex-1">
          Annuleren
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
          {form.formState.isSubmitting ? "Bezig..." : "Aanmaken"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-xs font-medium">
        {label}
        {required && <span className="text-aurora-rose">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-aurora-rose">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 20.2: Wire drawer into page**

Modify `apps/web/app/(admin)/admin/medewerkers/page.tsx`. Add near top:
```typescript
import { EmployeeDrawer } from "@/features/employees/drawer/employee-drawer";
```
And add near end of returned JSX (after table):
```typescript
<EmployeeDrawer />
```

- [ ] **Step 20.3: Verify**

```bash
pnpm -F @casella/web typecheck
```

- [ ] **Step 20.4: Commit**

```bash
git add apps/web/features apps/web/app/\(admin\)
git commit -m "feat(web): employee drawer with create-mode form (basis/dienstverband/vergoedingen/contact/notes)"
```

---

## Task 21: Invite-flow — update Auth.js signIn to bind invite_email

**Files:**
- Modify: `packages/auth/src/upsert.ts`

- [ ] **Step 21.1: Extend upsertUserFromEntra with invite-binding**

```typescript
// packages/auth/src/upsert.ts
import { eq, and, isNull, sql } from "drizzle-orm";
import { getDb, schema, auditMutation } from "@casella/db";
import type { Role } from "@casella/types";

export interface EntraProfile {
  oid: string;
  email: string;
  displayName: string;
  role: Role;
}

export async function upsertUserFromEntra(profile: EntraProfile) {
  const db = getDb();

  return db.transaction(async (tx) => {
    // 1. Upsert users row
    const existing = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.entraOid, profile.oid))
      .limit(1);

    let user: typeof existing[number];
    if (existing.length > 0) {
      const [updated] = await tx
        .update(schema.users)
        .set({
          email: profile.email,
          displayName: profile.displayName,
          role: profile.role,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existing[0]!.id))
        .returning();
      if (!updated) throw new Error("Failed to update user from Entra profile");
      user = updated;
    } else {
      const [created] = await tx
        .insert(schema.users)
        .values({
          entraOid: profile.oid,
          email: profile.email,
          displayName: profile.displayName,
          role: profile.role,
        })
        .returning();
      if (!created) throw new Error("Failed to insert user from Entra profile");
      user = created;
    }

    // 2. If there's a matching invite, bind employees.user_id
    const invite = await tx
      .select()
      .from(schema.employees)
      .where(
        and(
          isNull(schema.employees.userId),
          sql`LOWER(${schema.employees.inviteEmail}) = LOWER(${profile.email})`
        )
      )
      .limit(1);

    if (invite.length > 0) {
      await tx
        .update(schema.employees)
        .set({
          userId: user.id,
          inviteEmail: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.employees.id, invite[0]!.id));

      await auditMutation(tx, {
        actorUserId: user.id,
        action: "employees.invite_bound",
        resourceType: "employees",
        resourceId: invite[0]!.id,
        changesJson: { boundTo: user.id, viaEmail: profile.email },
      });
    }

    return user;
  });
}
```

- [ ] **Step 21.2: Verify + run auth tests**

```bash
pnpm -F @casella/auth typecheck
pnpm -F @casella/auth test
```
Expected: existing 14 tests still pass (no signature change).

- [ ] **Step 21.3: Commit**

```bash
git add packages/auth/src/upsert.ts
git commit -m "feat(auth): bind invite_email to user_id on first SSO login"
```

---

## Task 22: Onboarding-pending page

**Files:**
- Create: `apps/web/app/(public)/onboarding-pending/page.tsx`
- Modify: `apps/web/middleware.ts` (allowlist new path)
- Create: `apps/web/lib/current-employee.ts` (helper)

- [ ] **Step 22.1: Add current-employee helper**

```typescript
// apps/web/lib/current-employee.ts
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@casella/db";
import { getCurrentUser } from "./current-user";

export const getCurrentEmployee = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.userId, user.id))
    .limit(1);
  return rows[0] ?? null;
});
```

- [ ] **Step 22.2: Create onboarding-pending page**

```typescript
// apps/web/app/(public)/onboarding-pending/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentEmployee } from "@/lib/current-employee";

export default async function OnboardingPending() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const employee = await getCurrentEmployee();
  if (employee) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-hero">
        Welkom, <em>{user.displayName.split(" ")[0]}</em>
      </h1>
      <p className="max-w-md text-text-secondary">
        Je account is aangemeld bij Ascentra HR. Zodra je wordt geactiveerd krijg
        je een bevestiging per e-mail. Deze pagina kun je gewoon laten openstaan
        — zodra je bent gekoppeld ga je automatisch door.
      </p>
      <meta httpEquiv="refresh" content="60" />
    </main>
  );
}
```

- [ ] **Step 22.3: Update middleware to allow /onboarding-pending through**

Modify `apps/web/middleware.ts`:
```typescript
const isPublic =
  nextUrl.pathname === "/" ||
  nextUrl.pathname === "/api/auth" ||
  nextUrl.pathname.startsWith("/api/auth/") ||
  nextUrl.pathname === "/onboarding-pending";
```

- [ ] **Step 22.4: Gate (authed) layout — redirect to onboarding-pending if no employee record**

Modify `apps/web/app/(authed)/layout.tsx`:
```typescript
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentEmployee } from "@/lib/current-employee";
import { Sidebar } from "@/components/shell/sidebar";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role === "employee") {
    const employee = await getCurrentEmployee();
    if (!employee) redirect("/onboarding-pending");
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} mode="employee" />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

(Admin users bypass this check — admins don't need an employees row to use admin views.)

- [ ] **Step 22.5: Verify + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web
git commit -m "feat(web): onboarding-pending page + route-gating for employees without record"
```

---

## Task 23: Pending-onboarding admin list page

**Files:**
- Create: `apps/web/app/(admin)/admin/medewerkers/pending/page.tsx`

- [ ] **Step 23.1: Create page**

```typescript
// apps/web/app/(admin)/admin/medewerkers/pending/page.tsx
import { getDb, schema } from "@casella/db";
import { eq, sql, isNull } from "drizzle-orm";

export default async function PendingOnboardingPage() {
  const db = getDb();
  // Users without an employees row (possibly never onboarded, typo, etc.)
  const rows = await db.execute(sql`
    SELECT u.id, u.email, u.display_name, u.created_at
    FROM users u
    LEFT JOIN employees e ON e.user_id = u.id
    WHERE e.id IS NULL AND u.role = 'employee'
    ORDER BY u.created_at DESC
    LIMIT 100
  `);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-display">
          <em>Pending</em> onboarding
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Users die zijn ingelogd maar nog geen employee-record hebben.
        </p>
      </header>

      <div className="rounded-lg border border-border glass-card">
        {rows.rows.length === 0 ? (
          <p className="p-6 text-sm text-text-secondary">Niemand wacht op onboarding.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="p-3 text-left">Naam</th>
                <th className="p-3 text-left">E-mail</th>
                <th className="p-3 text-left">Eerste login</th>
              </tr>
            </thead>
            <tbody>
              {rows.rows.map((r: any) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-3">{r.display_name}</td>
                  <td className="p-3 font-mono text-xs">{r.email}</td>
                  <td className="p-3 font-mono text-xs tabular-nums">
                    {new Date(r.created_at).toLocaleDateString("nl-NL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 23.2: Verify + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/app/\(admin\)/admin/medewerkers/pending
git commit -m "feat(web): pending-onboarding admin list"
```

---

## Task 24: CriticalConfirmDialog primitive

**Files:**
- Create: `apps/web/components/critical-confirm/critical-confirm-dialog.tsx`

- [ ] **Step 24.1: Create primitive**

```typescript
// apps/web/components/critical-confirm/critical-confirm-dialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

export interface CriticalConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  emphasisWord: string;
  impactSummary: React.ReactNode;
  confirmPhrase: string;
  confirmLabel: string;
  scheduledAtDefault?: string;
  reasonLabel?: string;
  onConfirm: (args: { scheduledAt: string; reason: string }) => Promise<void>;
  variant?: "danger" | "warning";
}

export function CriticalConfirmDialog({
  open,
  onOpenChange,
  title,
  emphasisWord,
  impactSummary,
  confirmPhrase,
  confirmLabel,
  scheduledAtDefault,
  reasonLabel,
  onConfirm,
  variant = "danger",
}: CriticalConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [scheduledAt, setScheduledAt] = useState(scheduledAtDefault ?? new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = typed.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm({ scheduledAt, reason });
      onOpenChange(false);
      setTyped("");
      setReason("");
    } finally {
      setSubmitting(false);
    }
  }

  const color = variant === "danger" ? "text-aurora-rose" : "text-aurora-amber";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-6 w-6 shrink-0 ${color}`} />
          <div className="flex-1 space-y-1">
            <DialogTitle className="font-display text-title">
              {title.split(emphasisWord).flatMap((part, i) => (
                i === 0 ? [part] : [<em key={i} className={color}>{emphasisWord}</em>, part]
              ))}
            </DialogTitle>
            <DialogDescription className="text-sm text-text-secondary">
              Dit is een kritieke actie. Lees de impact-samenvatting, kies een
              datum, en bevestig door <strong>{confirmPhrase}</strong> exact over
              te typen.
            </DialogDescription>
          </div>
        </div>

        <section className="mt-6 space-y-3 rounded-lg border border-border bg-surface-deep p-4 text-sm">
          {impactSummary}
        </section>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium">Uitvoeren op</span>
            <Input
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </label>
          {reasonLabel && (
            <label className="space-y-1.5 col-span-2">
              <span className="text-xs font-medium">{reasonLabel}</span>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
            </label>
          )}
        </div>

        <label className="mt-4 block space-y-1.5">
          <span className="text-xs font-medium">
            Typ <code className="font-mono text-aurora-rose">{confirmPhrase}</code> om te bevestigen
          </span>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmPhrase}
            autoComplete="off"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            disabled={!canSubmit || submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Bezig..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 24.2: Verify + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/components/critical-confirm
git commit -m "feat(web): <CriticalConfirmDialog> primitive for destructive operations"
```

---

## Task 25: Employee terminate flow — server actions + UI wiring

**Files:**
- Modify: `apps/web/app/(admin)/admin/medewerkers/actions.ts` (add terminate actions)
- Create: `apps/web/features/employees/terminate/terminate-button.tsx`

- [ ] **Step 25.1: Add initiateTerminate + cancelTermination + undoTermination server actions**

Append to `apps/web/app/(admin)/admin/medewerkers/actions.ts`:
```typescript
import { initiateTerminateSchema, type InitiateTerminateInput } from "@casella/types";

export async function initiateTerminate(raw: InitiateTerminateInput) {
  const admin = await requireAdmin();
  const input = initiateTerminateSchema.parse(raw);

  const db = getDb();
  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(schema.employees).where(eq(schema.employees.id, input.id));
    if (!before) throw new Error("employee not found");
    if (before.employmentStatus === "terminated") throw new Error("already terminated");
    // Verify confirmText matches something obvious: expect full name in display format
    // (Caller is responsible for computing the correct confirm phrase; we just persist.)

    await tx
      .update(schema.employees)
      .set({
        pendingTerminationAt: input.pendingTerminationAt,
        pendingTerminationReason: input.reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.employees.id, input.id));

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "employees.terminate.initiate",
      resourceType: "employees",
      resourceId: input.id,
      changesJson: { scheduledAt: input.pendingTerminationAt, reason: input.reason },
    });
  });

  revalidatePath("/admin/medewerkers");
  return { ok: true };
}

export async function cancelPendingTermination(employeeId: string) {
  const admin = await requireAdmin();
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.employees)
      .set({
        pendingTerminationAt: null,
        pendingTerminationReason: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.employees.id, employeeId));

    await auditMutation(tx, {
      actorUserId: admin.id,
      action: "employees.terminate.cancel_pending",
      resourceType: "employees",
      resourceId: employeeId,
      changesJson: null,
    });
  });

  revalidatePath("/admin/medewerkers");
  return { ok: true };
}
```

- [ ] **Step 25.2: Create TerminateButton component (opens critical-confirm)**

```typescript
// apps/web/features/employees/terminate/terminate-button.tsx
"use client";

import { useState } from "react";
import { CriticalConfirmDialog } from "@/components/critical-confirm/critical-confirm-dialog";
import { Button } from "@/components/ui/button";
import { initiateTerminate } from "@/app/(admin)/admin/medewerkers/actions";
import { toast } from "sonner";

interface Props {
  employeeId: string;
  displayName: string;
  openAssignmentsCount: number;
  pendingHoursCount: number;
}

export function TerminateButton({
  employeeId,
  displayName,
  openAssignmentsCount,
  pendingHoursCount,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Dienstverband beëindigen
      </Button>
      <CriticalConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Dienstverband beëindigen: ${displayName}`}
        emphasisWord="beëindigen"
        confirmPhrase={displayName}
        confirmLabel="Plan beëindiging"
        reasonLabel="Reden (optioneel — intern)"
        impactSummary={
          <ul className="space-y-1">
            <li><strong>{openAssignmentsCount}</strong> open toewijzingen worden op de beëindigingsdatum mee-afgesloten (met bevestiging)</li>
            <li><strong>{pendingHoursCount}</strong> niet-goedgekeurde uren blijven staan voor admin-afhandeling</li>
            <li>Historische data + audit trail blijft behouden</li>
            <li>User wordt NIET automatisch uit Entra group verwijderd (handmatige admin-actie)</li>
          </ul>
        }
        onConfirm={async ({ scheduledAt, reason }) => {
          try {
            await initiateTerminate({
              id: employeeId,
              pendingTerminationAt: scheduledAt,
              reason,
              confirmText: displayName,
            });
            toast.success(`Beëindiging ingepland voor ${scheduledAt}`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Mislukt");
            throw e;
          }
        }}
      />
    </>
  );
}
```

- [ ] **Step 25.3: Verify + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/app/\(admin\)/admin/medewerkers/actions.ts apps/web/features/employees/terminate
git commit -m "feat(web): employee terminate flow with scheduled execution + type-confirm"
```

---

## Task 26: pg_cron scheduler for pending-termination execution

**Files:**
- Create: `packages/db/sql/scheduler.sql`

- [ ] **Step 26.1: Create scheduler SQL (handmatige migratie, apart van drizzle journal)**

```sql
-- packages/db/sql/scheduler.sql
-- Casella pending-closures scheduler
-- Apply via: docker exec -i supabase_db_Casella psql -U postgres -d postgres < packages/db/sql/scheduler.sql

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: execute pending employee terminations
CREATE OR REPLACE FUNCTION execute_pending_employee_terminations()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id
    FROM employees
    WHERE pending_termination_at IS NOT NULL
      AND pending_termination_at <= CURRENT_DATE
      AND employment_status <> 'terminated'
  LOOP
    UPDATE employees
    SET employment_status = 'terminated',
        end_date = pending_termination_at,
        pending_termination_at = NULL,
        termination_undo_until = NOW() + INTERVAL '72 hours',
        updatedAt = NOW()
    WHERE id = rec.id;

    INSERT INTO audit_log (action, resource_type, resource_id, changes_json)
    VALUES (
      'employees.terminate.auto_executed',
      'employees',
      rec.id::text,
      '{"by":"scheduler"}'::jsonb
    );
  END LOOP;
END;
$$;

-- Schedule: every day at 00:05 UTC
SELECT cron.schedule(
  'casella-employee-terminations',
  '5 0 * * *',
  $$ SELECT execute_pending_employee_terminations(); $$
);
```

- [ ] **Step 26.2: Apply scheduler SQL**

```bash
docker exec -i supabase_db_Casella psql -U postgres -d postgres < packages/db/sql/scheduler.sql
```

Expected: `CREATE EXTENSION`, `CREATE FUNCTION`, `SELECT cron.schedule` succeed.

Verify job registered:
```bash
docker exec -i supabase_db_Casella psql -U postgres -d postgres -c "SELECT jobid, schedule, command FROM cron.job WHERE jobname = 'casella-employee-terminations';"
```

Expected: one row with schedule `5 0 * * *`.

- [ ] **Step 26.3: Commit**

```bash
git add packages/db/sql/scheduler.sql
git commit -m "feat(db): pg_cron scheduler for pending employee terminations"
```

---

## Task 27: Welcome-email scaffold — @casella/email package

**Files:**
- Create: `packages/email/package.json`
- Create: `packages/email/tsconfig.json`
- Create: `packages/email/src/index.ts`
- Create: `packages/email/src/client.ts`
- Create: `packages/email/src/templates/welcome.tsx`

- [ ] **Step 27.1: Create package.json**

```json
{
  "name": "@casella/email",
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
    "nodemailer": "^6.9.15"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.15",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 27.2: Create tsconfig.json**

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

- [ ] **Step 27.3: Create client.ts**

```typescript
// packages/email/src/client.ts
import nodemailer, { type Transporter } from "nodemailer";

let _transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host) throw new Error("SMTP_HOST is niet gezet");
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
  return _transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(input: SendEmailInput) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM ?? "noreply@ascentra.nl";
  await transporter.sendMail({ from, to: input.to, subject: input.subject, html: input.html, text: input.text });
}
```

- [ ] **Step 27.4: Create welcome template**

```typescript
// packages/email/src/templates/welcome.tsx
export function welcomeEmail(params: { displayName: string; portalUrl: string }) {
  const { displayName, portalUrl } = params;
  const text = `
Welkom bij Casella, ${displayName}!

Je bent uitgenodigd om het Ascentra-medewerkerportaal te gebruiken. 
Log in met je Microsoft-account via: ${portalUrl}

Zodra je bent ingelogd zie je automatisch je persoonlijke dashboard.

Met vriendelijke groet,
Ascentra HR
  `.trim();

  const html = `
<div style="font-family: system-ui, sans-serif; max-width: 520px; padding: 32px; color: #0e1621;">
  <h1 style="font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 32px; margin: 0 0 16px;">Welkom bij <em>Casella</em>, ${displayName}!</h1>
  <p style="line-height: 1.6; font-size: 15px;">
    Je bent uitgenodigd om het Ascentra-medewerkerportaal te gebruiken.
    Log in met je Microsoft-account en zie meteen je persoonlijke dashboard.
  </p>
  <p style="margin: 24px 0;">
    <a href="${portalUrl}" style="display: inline-block; background: #7b5cff; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      Ga naar Casella
    </a>
  </p>
  <p style="color: rgba(14,22,33,0.45); font-size: 13px;">
    — Ascentra HR
  </p>
</div>
  `.trim();

  return {
    subject: "Welkom bij Casella — Ascentra medewerkerportaal",
    text,
    html,
  };
}
```

- [ ] **Step 27.5: Create index.ts barrel**

```typescript
// packages/email/src/index.ts
export { sendEmail, type SendEmailInput } from "./client";
export { welcomeEmail } from "./templates/welcome";
```

- [ ] **Step 27.6: Install + typecheck**

```bash
pnpm install
pnpm -F @casella/email typecheck
```

- [ ] **Step 27.7: Commit**

```bash
git add packages/email pnpm-lock.yaml
git commit -m "feat(email): @casella/email package with nodemailer client + welcome template"
```

---

## Task 28: Fire welcome email on employee create

**Files:**
- Modify: `apps/web/app/(admin)/admin/medewerkers/actions.ts`
- Modify: `apps/web/package.json` (add @casella/email dep)

- [ ] **Step 28.1: Add @casella/email dep**

In `apps/web/package.json` dependencies:
```json
"@casella/email": "workspace:*",
```

Run `pnpm install`.

- [ ] **Step 28.2: Wire in createEmployee**

Modify `apps/web/app/(admin)/admin/medewerkers/actions.ts`, add import:
```typescript
import { sendEmail, welcomeEmail } from "@casella/email";
```

Inside `createEmployee`, after the transaction, before `revalidatePath`:
```typescript
try {
  const portalUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const email = welcomeEmail({
    displayName: input.inviteEmail.split("@")[0]!,
    portalUrl,
  });
  await sendEmail({ to: input.inviteEmail, ...email });
} catch (err) {
  console.error("Welcome email failed:", err);
  // Do not fail the create — admin can resend later
}
```

- [ ] **Step 28.3: Verify + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/app/\(admin\)/admin/medewerkers/actions.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): fire welcome email on employee create (best-effort)"
```

---

## Task 29: Command palette (cmdk) — minimal registration

**Files:**
- Create: `apps/web/components/command-palette/command-palette.tsx`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 29.1: Create command palette**

```typescript
// apps/web/components/command-palette/command-palette.tsx
"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Users, Briefcase, Folders, UserCheck, Plus, Settings } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function runCommand(cb: () => void) {
    setOpen(false);
    cb();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command className="rounded-xl bg-surface-base">
          <Command.Input
            placeholder="Zoek naar een pagina, actie of entity..."
            className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-text-tertiary"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="p-4 text-center text-sm text-text-tertiary">
              Geen resultaten
            </Command.Empty>

            <Command.Group heading="Navigatie">
              <CmdItem icon={Users} onSelect={() => runCommand(() => router.push("/admin/medewerkers"))}>
                Medewerkers
              </CmdItem>
              <CmdItem icon={Briefcase} onSelect={() => runCommand(() => router.push("/admin/klanten"))}>
                Klanten
              </CmdItem>
              <CmdItem icon={Folders} onSelect={() => runCommand(() => router.push("/admin/projecten"))}>
                Projecten
              </CmdItem>
              <CmdItem icon={UserCheck} onSelect={() => runCommand(() => router.push("/admin/toewijzingen"))}>
                Toewijzingen
              </CmdItem>
            </Command.Group>

            <Command.Group heading="Acties">
              <CmdItem icon={Plus} onSelect={() => runCommand(() => router.push("/admin/medewerkers?new=1"))}>
                Nieuwe medewerker
              </CmdItem>
              <CmdItem icon={Plus} onSelect={() => runCommand(() => router.push("/admin/klanten?new=1"))}>
                Nieuwe klant
              </CmdItem>
              <CmdItem icon={Plus} onSelect={() => runCommand(() => router.push("/admin/projecten?new=1"))}>
                Nieuw project
              </CmdItem>
            </Command.Group>

            <Command.Group heading="Instellingen">
              <CmdItem icon={Settings} onSelect={() => runCommand(() => router.push("/admin/settings" as any))}>
                Instellingen
              </CmdItem>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CmdItem({ icon: Icon, onSelect, children }: { icon: any; onSelect: () => void; children: React.ReactNode }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-surface-deep"
    >
      <Icon className="h-4 w-4 text-text-tertiary" aria-hidden />
      {children}
    </Command.Item>
  );
}
```

- [ ] **Step 29.2: Mount in root layout**

Modify `apps/web/app/layout.tsx`:
```typescript
import { CommandPalette } from "@/components/command-palette/command-palette";
// ...
<body>
  {children}
  <Toaster />
  <CommandPalette />
</body>
```

- [ ] **Step 29.3: Verify + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/components/command-palette apps/web/app/layout.tsx
git commit -m "feat(web): cmdk-based command palette with global Ctrl+K/Cmd+K"
```

---

## Task 30: Env indicator for CI/prod + public var wiring

**Files:**
- Modify: `apps/web/next.config.ts`

- [ ] **Step 30.1: Expose CASELLA_ENV to client**

```typescript
// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  env: {
    NEXT_PUBLIC_CASELLA_ENV: process.env.CASELLA_ENV ?? "local",
  },
};

export default nextConfig;
```

- [ ] **Step 30.2: Add CASELLA_ENV to env vars**

In `apps/web/.env.local` (user's local file):
Already picked up; add note to `.env.example`.

Modify `.env.example`, add:
```
# Runtime env label (local / preview / production) — shown in sidebar badge
CASELLA_ENV="local"
```

- [ ] **Step 30.3: Also add to turbo.json globalEnv**

Modify `turbo.json` globalEnv list, add: `"CASELLA_ENV"`, `"NEXT_PUBLIC_CASELLA_ENV"`.

- [ ] **Step 30.4: Verify + commit**

```bash
pnpm -F @casella/web typecheck
git add apps/web/next.config.ts turbo.json .env.example
git commit -m "feat(web): CASELLA_ENV runtime indicator + turbo passthrough"
```

---

## Task 31: End-to-end smoke test

Run the full suite manually and confirm Plan 1.1a goals are met.

- [ ] **Step 31.1: Run full test suite**

```bash
pnpm typecheck
pnpm test
```
Expected: all packages pass typecheck; existing auth + db tests + new maps tests green.

- [ ] **Step 31.2: Ensure build succeeds**

```bash
pnpm -F @casella/web build
```
Expected: no errors; routes list includes new `/admin/medewerkers`, `/admin/medewerkers/pending`, `/onboarding-pending`, `/api/pdok/*`, `/api/user/theme`.

- [ ] **Step 31.3: Start dev + manual smoke**

```bash
pnpm db:up      # ensure Supabase running
pnpm dev
```

In browser at `http://localhost:3000`:
- [ ] Log in as admin → sidebar has new glass look with env-badge
- [ ] `Ctrl+K` opens command palette; "Medewerkers" nav works
- [ ] `/admin/medewerkers` toont empty state initially
- [ ] Klik "+ Nieuwe medewerker" → drawer opent met alle secties
- [ ] Vul in: invite email, functietitel, woonadres (PDOK autocomplete werkt), contract-uren, km-tarief
- [ ] Submit → toast "Medewerker aangemaakt", lijst vernieuwt met de nieuwe rij
- [ ] Theme-toggle werkt (Light / Dark / System)
- [ ] Log uit, log in met een medewerker-account dat nog geen employees-record heeft → redirect naar `/onboarding-pending`
- [ ] Admin ziet die user op `/admin/medewerkers/pending`

- [ ] **Step 31.4: Final commit (if any stragglers)**

```bash
git status
# als clean: niks te commiten
```

- [ ] **Step 31.5: Stop dev server**

Ctrl+C in terminal where dev runs. Verify port 3000 free:
```bash
netstat -ano | grep ":3000" || echo "port 3000 free"
```

---

## Checkpoints after Plan 1.1a

- ✅ Volledig Ascentra design-system (tokens, fonts, motion, glass) in globals.css + Tailwind config
- ✅ Dark mode werkt met brand-authentic palette + pre-hydration script (geen FOUT)
- ✅ Theme preference persistent in DB + cookie
- ✅ Command palette (cmdk, Ctrl+K / Cmd+K) mounted globaal
- ✅ Toast systeem (sonner) in root layout
- ✅ `<AddressInput>` component met PDOK autocomplete + dedupe op pdok_id
- ✅ `@casella/maps` package met suggest + lookup + tests
- ✅ `@casella/email` package met nodemailer + welcome template
- ✅ Audit helper in `@casella/db`
- ✅ Employees CRUD: schema, Zod-schemas, server actions (create + update), list page + drawer
- ✅ Invite-first onboarding volledig werkend: admin create → SSO login → user_id gebonden → dashboard
- ✅ Pending-onboarding page voor non-matched users + admin list
- ✅ CriticalConfirmDialog primitive
- ✅ Employee terminate flow: impact-review + type-confirm + scheduled execution via pg_cron
- ✅ Welkomst-email via Ascentra SMTP bij employee create
- ✅ Alle tests groen; build succesvol

**Niet in 1.1a** (zit in 1.1b):
- Clients CRUD
- Projects CRUD (inclusief critical-op closure, color, auto-code)
- Project assignments CRUD (inclusief capacity-conflict detection, hours/week)
- Edit-mode voor employee drawer met inline auto-save (nu alleen create-mode; edit volgt in 1.1b samen met de andere entities)
- Top-bar met breadcrumb + cmd+K pill (nu alleen cmdk zelf; visual top-bar volgt)
- Shortcuts overlay (`?`)
- Density toggle UI (token infrastructure staat klaar)
- Final accessibility audit via axe

**Naar 1.1b:** volgende plan bouwt clients + projects + assignments op dezelfde patronen, voegt scheduler-jobs toe voor project closure en client archive, en levert de top-bar + breadcrumbs.
