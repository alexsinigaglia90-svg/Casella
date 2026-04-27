/**
 * Deterministic string → hue (0–360) mapping for the assignments timeline.
 *
 * Same input always produces the same hue, so client/employee blocks keep a
 * stable color across renders without a server-persisted "color" field.
 * Implementation: 32-bit FNV-1a hash, mod 360.
 */
export function stringHue(input: string): number {
  if (!input) return 215; // sane default (cool blue)
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // FNV prime multiply, kept inside 32 bits via Math.imul.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 360;
}
