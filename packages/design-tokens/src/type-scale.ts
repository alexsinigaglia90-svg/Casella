// packages/design-tokens/src/type-scale.ts
// Numeric pixel scale for RN. Web uses fluid clamp() from typeScaleClampCss.

export const typeScale = {
  hero: { size: 64, lineHeight: 70, weight: 600 },
  display: { size: 36, lineHeight: 42, weight: 600 },
  title: { size: 22, lineHeight: 28, weight: 600 },
  body: { size: 14, lineHeight: 20, weight: 400 },
  small: { size: 12, lineHeight: 16, weight: 400 },
  xs: { size: 11, lineHeight: 14, weight: 500 },
} as const;

// Web-only fluid scale; mirrors the existing globals.css clamp() trio plus
// non-fluid sub-scale entries needed only on web.
export const typeScaleClampCss = {
  hero: 'clamp(3rem, 2rem + 2vw, 4.25rem)',
  display: 'clamp(1.75rem, 1.5rem + 1vw, 2.5rem)',
  title: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
} as const;
