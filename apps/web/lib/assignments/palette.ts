/**
 * Palette system for assignment timeline blocks.
 *
 * A `BlockTone` describes every CSS surface a block needs (bg, fg, border,
 * accent-bar, badges, drag handle, ghost-preview, shadow). The `palette`
 * variant controls how `baseHue` is shifted before being plugged into
 * `oklch()` color expressions.
 *
 * Concept-state assignments (open begin/end) render as cream surface cards
 * with a pastel hairline border and a colored accent-bar on the left edge.
 * Confirmed assignments use a vertical pastel gradient with darker text.
 *
 * No hex colors — all surfaces use design tokens (`oklch()` mostly), and the
 * color-shift math is contained here so views stay declarative.
 */

export type PaletteName =
  | "pastel"
  | "pastel-warm"
  | "pastel-cool"
  | "role"
  | "aurora";

export interface BlockTone {
  bg: string;
  fg: string;
  border: string;
  borderActive: string;
  accentBar: string;
  badgeBg: string;
  badgeFg: string;
  handle: string;
  ghostBg: string;
  ghostBorder: string;
  shadow: string;
  shadowDrag: string;
}

/** Hue map for the `role` palette. */
export const ROLE_HUE: Record<string, number> = {
  PM: 265,
  Lead: 340,
  Designer: 25,
  Developer: 200,
  Strategy: 145,
  Research: 290,
};

export interface BlockToneInput {
  palette: PaletteName;
  /** Base hue (0–360) — typically derived from clientId or employeeId hash. */
  baseHue: number;
  /** Optional role hue (used by `role` palette; falls back to baseHue). */
  roleHue?: number;
  isConcept: boolean;
}

/** Normalize a hue into [0, 360). */
function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/** Shift a hue toward an anchor by 55%, used by warm/cool palettes. */
function shiftToward(hue: number, anchor: number): number {
  return normalizeHue(hue + (anchor - hue) * 0.55);
}

function resolveHue(input: BlockToneInput): number {
  switch (input.palette) {
    case "pastel":
      return normalizeHue(input.baseHue);
    case "pastel-warm":
      return shiftToward(input.baseHue, 35); // warm anchor (orange)
    case "pastel-cool":
      return shiftToward(input.baseHue, 215); // cool anchor (blue)
    case "role":
      return normalizeHue(input.roleHue ?? input.baseHue);
    case "aurora":
      // Aurora uses a hardcoded violet/amber pair; hue is unused for fills,
      // but we still return something sensible for accent-bar in concept mode.
      return input.isConcept ? 75 : 285;
  }
}

/**
 * Aurora palette — hardcoded gradient pair with no hue input.
 * Concept = amber gradient, confirmed = violet gradient.
 */
function auroraTone(isConcept: boolean): BlockTone {
  if (isConcept) {
    return {
      bg: "oklch(0.97 0.02 75)",
      fg: "oklch(0.40 0.10 75)",
      border: "oklch(0.78 0.10 75 / 0.55)",
      borderActive: "oklch(0.68 0.14 75 / 0.85)",
      accentBar: "linear-gradient(180deg, oklch(0.82 0.16 75), oklch(0.72 0.18 35))",
      badgeBg: "oklch(0.90 0.06 75 / 0.75)",
      badgeFg: "oklch(0.35 0.12 75)",
      handle: "oklch(0.65 0.12 75 / 0.55)",
      ghostBg: "oklch(0.97 0.02 75 / 0.55)",
      ghostBorder: "oklch(0.78 0.10 75 / 0.45)",
      shadow: "0 1px 2px oklch(0.55 0.10 75 / 0.10)",
      shadowDrag: "0 8px 24px oklch(0.55 0.10 75 / 0.22), 0 2px 4px oklch(0.55 0.10 75 / 0.14)",
    };
  }
  return {
    bg: "linear-gradient(180deg, oklch(0.78 0.14 285), oklch(0.62 0.18 285))",
    fg: "oklch(0.98 0.02 285)",
    border: "oklch(0.55 0.16 285 / 0.55)",
    borderActive: "oklch(0.48 0.20 285 / 0.85)",
    accentBar: "linear-gradient(180deg, oklch(0.85 0.15 75), oklch(0.78 0.18 285))",
    badgeBg: "oklch(0.32 0.10 285 / 0.55)",
    badgeFg: "oklch(0.97 0.02 285)",
    handle: "oklch(0.95 0.02 285 / 0.65)",
    ghostBg: "oklch(0.78 0.14 285 / 0.30)",
    ghostBorder: "oklch(0.55 0.16 285 / 0.45)",
    shadow: "0 1px 2px oklch(0.30 0.14 285 / 0.18)",
    shadowDrag: "0 10px 28px oklch(0.30 0.14 285 / 0.32), 0 3px 6px oklch(0.30 0.14 285 / 0.20)",
  };
}

/**
 * Compute the `BlockTone` for a single assignment block. See the file-level
 * comment for the conventions and the per-palette behavior.
 */
export function blockTone(input: BlockToneInput): BlockTone {
  if (input.palette === "aurora") return auroraTone(input.isConcept);

  const hue = resolveHue(input);

  if (input.isConcept) {
    return {
      bg: "var(--surface-lift)",
      fg: `oklch(0.40 0.08 ${hue})`,
      border: `oklch(0.72 0.06 ${hue} / 0.65)`,
      borderActive: `oklch(0.62 0.10 ${hue} / 0.85)`,
      accentBar: `oklch(0.72 0.10 ${hue})`,
      badgeBg: `oklch(0.92 0.05 ${hue} / 0.75)`,
      badgeFg: `oklch(0.35 0.10 ${hue})`,
      handle: `oklch(0.62 0.08 ${hue} / 0.55)`,
      ghostBg: "var(--surface-lift)",
      ghostBorder: `oklch(0.72 0.06 ${hue} / 0.45)`,
      shadow: `0 1px 2px oklch(0.50 0.05 ${hue} / 0.08)`,
      shadowDrag: `0 8px 24px oklch(0.50 0.05 ${hue} / 0.18), 0 2px 4px oklch(0.50 0.05 ${hue} / 0.12)`,
    };
  }

  // Confirmed: vertical pastel gradient + dark same-hue text.
  return {
    bg: `linear-gradient(180deg, oklch(0.92 0.06 ${hue}), oklch(0.86 0.08 ${hue}))`,
    fg: `oklch(0.30 0.09 ${hue})`,
    border: `oklch(0.78 0.06 ${hue} / 0.55)`,
    borderActive: `oklch(0.62 0.12 ${hue} / 0.85)`,
    accentBar: `oklch(0.65 0.12 ${hue})`,
    badgeBg: `oklch(0.78 0.05 ${hue} / 0.55)`,
    badgeFg: `oklch(0.25 0.10 ${hue})`,
    handle: `oklch(0.45 0.10 ${hue} / 0.45)`,
    ghostBg: `oklch(0.92 0.06 ${hue} / 0.30)`,
    ghostBorder: `oklch(0.78 0.06 ${hue} / 0.45)`,
    shadow: `0 1px 2px oklch(0.40 0.08 ${hue} / 0.14)`,
    shadowDrag: `0 10px 28px oklch(0.40 0.08 ${hue} / 0.28), 0 3px 6px oklch(0.40 0.08 ${hue} / 0.18)`,
  };
}
