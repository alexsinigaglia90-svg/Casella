export const DOMAIN_HUES = {
  cloud: 165,
  sun: 50,
  warm: 25,
  harvest: 145,
  cool: 240,
  spark: 280,
} as const;

export type DomainHue = keyof typeof DOMAIN_HUES;

export function oklch(
  l: number,
  c: number,
  h: number,
  alpha?: number,
): string {
  return alpha != null
    ? `oklch(${l} ${c} ${h} / ${alpha})`
    : `oklch(${l} ${c} ${h})`;
}

export const oklchPrimary = (hue: number) => oklch(0.55, 0.18, hue);
export const oklchTinted = (hue: number) => oklch(0.95, 0.06, hue);
export const oklchEmphasis = (hue: number) => oklch(0.35, 0.18, hue);
export const oklchSubtleBg = (hue: number) => oklch(0.92, 0.06, hue);

export function hueForDomain(domain: DomainHue): number {
  return DOMAIN_HUES[domain];
}
