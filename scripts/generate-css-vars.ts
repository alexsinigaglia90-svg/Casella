// scripts/generate-css-vars.ts
// Regenerates the @tokens:start..@tokens:end section of apps/web/app/globals.css
// from the @casella/design-tokens TS source-of-truth. Run as `pnpm tokens:gen`
// (or via `prebuild`). CI runs `pnpm tokens:check` to assert no drift.

import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  paletteHex,
  semanticLight,
  semanticDark,
  motion,
  typeScaleClampCss,
  glowLight,
  glowDark,
  density,
  space,
} from '../packages/design-tokens/src';

const lightBlock = `:root {
    /* === RAW TOKENS === */
    /* Cream base palette */
    --cream-base: ${paletteHex.cream.base};
    --cream-lift: ${paletteHex.cream.lift};
    --cream-deep: ${paletteHex.cream.deep};

    /* Ink (dark text) */
    --ink-deep: ${paletteHex.ink.deep};
    --ink-2: ${paletteHex.ink.a68};
    --ink-3: ${paletteHex.ink.a45};
    --ink-4: ${paletteHex.ink.a22};
    --ink-5: ${paletteHex.ink.a10};

    /* Structural accents */
    --navy: ${paletteHex.navy};
    --brown: ${paletteHex.brown};

    /* Aurora accent palette */
    --aurora-violet: ${paletteHex.aurora.violet};
    --aurora-blue: ${paletteHex.aurora.blue};
    --aurora-coral: ${paletteHex.aurora.coral};
    --aurora-amber: ${paletteHex.aurora.amber};
    --aurora-teal: ${paletteHex.aurora.teal};
    --aurora-rose: ${paletteHex.aurora.rose};

    /* Glows */
    --glow-violet: ${glowLight.violet};
    --glow-blue: ${glowLight.blue};
    --glow-coral: ${glowLight.coral};
    --glow-amber: ${glowLight.amber};
    --glow-teal: ${glowLight.teal};
    --glow-rose: ${glowLight.rose};

    /* === SEMANTIC TOKENS === */
    --surface-base: ${semanticLight.surface.base};
    --surface-lift: ${semanticLight.surface.lift};
    --surface-deep: ${semanticLight.surface.deep};
    --surface-glass: ${semanticLight.surface.glass};
    --surface-card: ${semanticLight.surface.card};

    --fg-primary: ${semanticLight.fg.primary};
    --fg-secondary: ${semanticLight.fg.secondary};
    --fg-tertiary: ${semanticLight.fg.tertiary};
    --fg-quaternary: ${semanticLight.fg.quaternary};

    --border-subtle: ${semanticLight.border.subtle};
    --border-muted: ${semanticLight.border.muted};

    --action-primary: ${semanticLight.action.primary};
    --action-primary-fg: ${semanticLight.action.primaryFg};
    --status-success: ${semanticLight.status.success};
    --status-warning: ${semanticLight.status.warning};
    --status-danger: ${semanticLight.status.danger};
    --status-info: ${semanticLight.status.info};
    --status-pending: ${semanticLight.status.pending};
    --status-attention: ${semanticLight.status.attention};

    /* === MOTION TOKENS === */
    --ease-standard: ${motion.easing.standard};
    --ease-draw: ${motion.easing.draw};
    --ease-spring: ${motion.easing.spring};
    --ease-out-expo: ${motion.easing.outExpo};

    --duration-quick: ${motion.duration.quick}ms;
    --duration-standard: ${motion.duration.standard}ms;
    --duration-emphasized: ${motion.duration.emphasized}ms;

    /* === TYPE-SCALE (fluid via clamp) === */
    --text-hero: ${typeScaleClampCss.hero};
    --text-display: ${typeScaleClampCss.display};
    --text-title: ${typeScaleClampCss.title};

    /* === DENSITY (comfortable default) === */
    --density-scale: ${density.default.scale};
    --space-1: calc(${space[1]}rem * var(--density-scale));
    --space-2: calc(${space[2]}rem * var(--density-scale));
    --space-3: calc(${space[3]}rem * var(--density-scale));
    --space-4: calc(${space[4]}rem * var(--density-scale));
    --space-6: calc(${space[6]}rem * var(--density-scale));
    --space-8: calc(${space[8]}rem * var(--density-scale));
  }

  html[data-density="compact"] {
    --density-scale: ${density.compact.scale};
  }`;

const darkBlock = `.dark {
    /* Semantic overrides for dark mode */
    --surface-base: ${semanticDark.surface.base};
    --surface-lift: ${semanticDark.surface.lift};
    --surface-deep: ${semanticDark.surface.deep};
    --surface-glass: ${semanticDark.surface.glass};
    --surface-card: ${semanticDark.surface.card};

    --fg-primary: ${semanticDark.fg.primary};
    --fg-secondary: ${semanticDark.fg.secondary};
    --fg-tertiary: ${semanticDark.fg.tertiary};
    --fg-quaternary: ${semanticDark.fg.quaternary};

    --border-subtle: ${semanticDark.border.subtle};
    --border-muted: ${semanticDark.border.muted};

    /* Slightly stronger glows in dark */
    --glow-violet: ${glowDark.violet};
    --glow-blue: ${glowDark.blue};
    --glow-coral: ${glowDark.coral};
    --glow-amber: ${glowDark.amber};
    --glow-teal: ${glowDark.teal};
    --glow-rose: ${glowDark.rose};
  }`;

const cssBlock = `\n  ${lightBlock}\n\n  ${darkBlock}\n  `;

const cssPath = resolve(__dirname, '../apps/web/app/globals.css');
const current = readFileSync(cssPath, 'utf-8');

const startMarker = '/* @tokens:start */';
const endMarker = '/* @tokens:end */';
const startIdx = current.indexOf(startMarker);
const endIdx = current.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('globals.css missing @tokens:start / @tokens:end markers');
  process.exit(1);
}

const before = current.slice(0, startIdx + startMarker.length);
const after = current.slice(endIdx);
const next = `${before}${cssBlock}${after}`;

if (next !== current) {
  writeFileSync(cssPath, next);
}
console.log('OK globals.css tokens regenerated');
