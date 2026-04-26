import type { Config } from "tailwindcss";
// Tokens are imported as TS source-of-truth. CSS-vars in :root/.dark are
// generated from the same package by scripts/generate-css-vars.ts (run via
// `pnpm prebuild` and asserted by CI via `pnpm tokens:check`).
import { motion, glowLight } from "@casella/design-tokens";

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
        /* Ascentra raw — values consumed via CSS-vars at runtime; literal
           hexes are present in the TS package for type-safety + RN reuse. */
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
        fg: {
          primary: "var(--fg-primary)",
          secondary: "var(--fg-secondary)",
          tertiary: "var(--fg-tertiary)",
          quaternary: "var(--fg-quaternary)",
        },
        status: {
          success: "var(--status-success)",
          warning: "var(--status-warning)",
          danger: "var(--status-danger)",
          info: "var(--status-info)",
          pending: "var(--status-pending)",
          attention: "var(--status-attention)",
        },

        /* Shadcn compatibility — separate HSL system */
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
          "0%, 100%": { boxShadow: `0 0 0 0 ${glowLight.teal}` },
          "50%": { boxShadow: "0 0 0 6px rgba(61, 216, 168, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "aurora-drift": "aurora-drift 24s var(--ease-standard) infinite alternate",
        "char-rise": `char-rise 1200ms ${motion.easing.outExpo} forwards`,
        "status-pulse": "status-pulse 2500ms var(--ease-standard) infinite",
        shimmer: "shimmer 1.5s var(--ease-standard) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
