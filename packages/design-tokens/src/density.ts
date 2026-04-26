// packages/design-tokens/src/density.ts
// Density modes + spacing scale. Web uses calc() with --density-scale; RN
// consumers can multiply numeric `space` values by `densityScale`.

export const density = {
  default: { rowHeight: 56, padding: 16, gap: 12, scale: 1 },
  compact: { rowHeight: 40, padding: 12, gap: 8, scale: 0.8 },
} as const;

// Base spacing scale in rem (multiplied by density scale on web).
export const space = {
  1: 0.25,
  2: 0.5,
  3: 0.75,
  4: 1,
  6: 1.5,
  8: 2,
} as const;
