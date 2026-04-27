/**
 * Client wizard formatting helpers.
 */

/** Strip non-digits and cap at 8 characters for KvK-nummer. */
export function formatKvk(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

/**
 * Format a Dutch postal code: "1234ab" → "1234 AB".
 * Preserves a trailing space if the user just typed the digits part.
 */
export function formatPostcode(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 4);
  const letters = value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
  if (!digits) return "";
  if (!letters) {
    // If user is still typing — keep space if they have a trailing space or 4+ digits with space
    const hasSpace = value.includes(" ");
    return digits.length === 4 && (hasSpace || value.length > 4)
      ? `${digits} `
      : digits;
  }
  return `${digits} ${letters}`;
}

const MASS_DOMAINS = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "yahoo.com",
  "live.com",
  "ziggo.nl",
  "kpnmail.nl",
  "xs4all.nl",
  "planet.nl",
  "home.nl",
  "upcmail.nl",
]);

/**
 * Extract domain from email and return a capitalised suggestion if it's not
 * a mass-consumer domain.  Returns null for invalid emails or mass domains.
 */
export function domainToCompanyName(email: string): string | null {
  const atIdx = email.indexOf("@");
  if (atIdx === -1) return null;
  const domain = email.slice(atIdx + 1).toLowerCase().trim();
  if (!domain || MASS_DOMAINS.has(domain)) return null;
  // Strip TLD(s) — take only the registrable part
  const parts = domain.split(".");
  const name = parts[0];
  if (!name || name.length < 2) return null;
  // Capitalise first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Deterministic hash of a string → hue 0–360 for the monogram gradient.
 */
export function stringHueHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}
