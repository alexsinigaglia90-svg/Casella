/**
 * Pure week-math helpers for the assignments timeline.
 *
 * Convention: ISO date strings are `YYYY-MM-DD` (no time/zone). Internally we
 * normalize Date objects to UTC midnight to avoid DST drift when computing
 * day deltas, then format back to a YYYY-MM-DD string when persisting.
 */

export const PX_PER_WEEK = 56;
export const SIDEBAR_WIDTH_PX = 220;
const MS_PER_DAY = 86_400_000;

function toUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Format a Date as YYYY-MM-DD (UTC). */
export function asIso(d: Date): string {
  const utc = toUtcMidnight(d);
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string into a UTC-midnight Date. */
export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map((p) => Number(p));
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

/** Returns the Monday (ISO week start) for the given date, normalized to UTC midnight. */
export function mondayOf(date: Date): Date {
  const d = toUtcMidnight(date);
  const dow = d.getUTCDay(); // 0 = Sunday, 1 = Monday, …
  const diff = dow === 0 ? -6 : 1 - dow; // Sunday → previous Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** Add `days` (signed integer) to a Date, returning a new UTC-midnight Date. */
export function addDays(d: Date, days: number): Date {
  const next = toUtcMidnight(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Difference in calendar days (end − start), rounded toward zero. */
export function daysBetween(start: Date, end: Date): number {
  const a = toUtcMidnight(start).getTime();
  const b = toUtcMidnight(end).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

/** Number of whole weeks between start and end (end − start) / 7, ceil for positive. */
export function weeksBetween(start: Date, end: Date): number {
  const days = daysBetween(start, end);
  return Math.ceil(days / 7);
}

/**
 * ISO 8601 week number for a date. Week 1 contains the first Thursday of the
 * year. Mirrors `date-fns`'s `getISOWeek` without the dependency.
 */
export function getISOWeek(date: Date): number {
  const d = toUtcMidnight(date);
  // Shift to nearest Thursday (ISO weeks are anchored on Thursday).
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstThursdayDow = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDow + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * MS_PER_DAY));
}

/** Pixel offset from the timeline's `baseStart` Monday for the given date. */
export function dayToX(
  date: Date,
  baseStart: Date,
  pxPerWeek: number = PX_PER_WEEK,
): number {
  const days = daysBetween(baseStart, date);
  return (days / 7) * pxPerWeek;
}

/**
 * Snap a pixel-delta to the nearest whole-week (7-day) increment and return
 * that delta in days. Used by drag/resize: a 56px-wide week means a 28px drag
 * snaps to +1 week (+7 days).
 */
export function snapToWeek(deltaPx: number, pxPerWeek: number = PX_PER_WEEK): number {
  const weeks = Math.round(deltaPx / pxPerWeek);
  return weeks * 7;
}

/** Snap a pixel-delta to the nearest whole-day increment (no weekly grid). */
export function snapToDay(deltaPx: number, pxPerWeek: number = PX_PER_WEEK): number {
  const dayPx = pxPerWeek / 7;
  return Math.round(deltaPx / dayPx);
}
