// packages/design-tokens/src/motion.ts
// Existing CSS-var names (--ease-standard / --duration-quick etc) are kept verbatim;
// renaming them would be a breaking codemod across components and tailwind config.
// Numeric values double as RN-compatible (Animated.timing duration in ms).

export const motion = {
  duration: {
    quick: 80,
    standard: 200,
    emphasized: 400,
  },
  easing: {
    standard: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    draw: 'cubic-bezier(0.625, 0.05, 0, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;
