// packages/design-tokens/src/glow.ts
// Tinted shadow colours derived from aurora palette. Light + dark variants
// matched to existing globals.css (.dark uses higher alpha).

export const glowLight = {
  violet: 'rgba(123, 92, 255, 0.35)',
  blue: 'rgba(75, 163, 255, 0.35)',
  coral: 'rgba(255, 138, 76, 0.35)',
  amber: 'rgba(245, 197, 92, 0.40)',
  teal: 'rgba(61, 216, 168, 0.35)',
  rose: 'rgba(255, 90, 138, 0.35)',
} as const;

export const glowDark = {
  violet: 'rgba(123, 92, 255, 0.45)',
  blue: 'rgba(75, 163, 255, 0.45)',
  coral: 'rgba(255, 138, 76, 0.45)',
  amber: 'rgba(245, 197, 92, 0.50)',
  teal: 'rgba(61, 216, 168, 0.45)',
  rose: 'rgba(255, 90, 138, 0.45)',
} as const;

// Backwards-compatible default export (matches plan's `glow` symbol).
export const glow = glowLight;
