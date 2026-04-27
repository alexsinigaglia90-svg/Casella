// packages/design-tokens/src/palette.ts
// Source-of-truth for raw colours. Hex/rgba strings — RN can consume directly.
// CSS-vars are generated from these by scripts/generate-css-vars.ts.

export const paletteHex = {
  cream: { base: '#f6f2ea', lift: '#faf6ee', deep: '#efe8d9' },
  ink: {
    deep: '#0e1621',
    a68: 'rgba(14, 22, 33, 0.68)',
    a45: 'rgba(14, 22, 33, 0.45)',
    a22: 'rgba(14, 22, 33, 0.22)',
    a10: 'rgba(14, 22, 33, 0.10)',
  },
  navy: '#1e3a5f',
  brown: '#6b4e3d',
  aurora: {
    violet: '#7b5cff',
    blue: '#4ba3ff',
    coral: '#ff8a4c',
    amber: '#f5c55c',
    teal: '#3dd8a8',
    rose: '#ff5a8a',
  },
} as const;

// Dark-mode raw values (mirrors existing `.dark` block in globals.css).
export const paletteHexDark = {
  surface: { base: '#13100c', lift: '#1a1612', deep: '#0a0806' },
  fg: {
    primary: '#f5ecde',
    a72: 'rgba(245, 236, 222, 0.72)',
    a50: 'rgba(245, 236, 222, 0.50)',
    a28: 'rgba(245, 236, 222, 0.28)',
    a22: 'rgba(245, 236, 222, 0.22)',
    a12: 'rgba(245, 236, 222, 0.12)',
  },
} as const;

// Semantic mapping — light theme.
export const semanticLight = {
  surface: {
    base: paletteHex.cream.base,
    lift: paletteHex.cream.lift,
    deep: paletteHex.cream.deep,
    glass: 'rgba(251, 248, 241, 0.58)',
    card: 'rgba(255, 255, 255, 0.65)',
  },
  fg: {
    primary: paletteHex.ink.deep,
    secondary: paletteHex.ink.a68,
    tertiary: paletteHex.ink.a45,
    quaternary: paletteHex.ink.a22,
  },
  border: { subtle: paletteHex.ink.a10, muted: paletteHex.ink.a22 },
  action: { primary: paletteHex.aurora.violet, primaryFg: '#ffffff' },
  status: {
    success: paletteHex.aurora.teal,
    warning: paletteHex.aurora.amber,
    danger: paletteHex.aurora.rose,
    info: paletteHex.aurora.blue,
    pending: paletteHex.aurora.amber,
    attention: paletteHex.aurora.coral,
  },
} as const;

// Semantic mapping — dark theme.
export const semanticDark = {
  surface: {
    base: paletteHexDark.surface.base,
    lift: paletteHexDark.surface.lift,
    deep: paletteHexDark.surface.deep,
    glass: 'rgba(26, 22, 18, 0.65)',
    card: 'rgba(30, 25, 20, 0.55)',
  },
  fg: {
    primary: paletteHexDark.fg.primary,
    secondary: paletteHexDark.fg.a72,
    tertiary: paletteHexDark.fg.a50,
    quaternary: paletteHexDark.fg.a28,
  },
  border: { subtle: paletteHexDark.fg.a12, muted: paletteHexDark.fg.a22 },
  // action + status keep brand hues across themes.
  action: { primary: paletteHex.aurora.violet, primaryFg: '#ffffff' },
  status: {
    success: paletteHex.aurora.teal,
    warning: paletteHex.aurora.amber,
    danger: paletteHex.aurora.rose,
    info: paletteHex.aurora.blue,
    pending: paletteHex.aurora.amber,
    attention: paletteHex.aurora.coral,
  },
} as const;

// Backwards-compatible alias for callers expecting the original `semantic` export.
export const semantic = semanticLight;
