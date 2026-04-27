/**
 * Shared date helpers for the employee week-grid.
 *
 * Weeks are Monday-anchored (ISO 8601). All exported helpers operate on
 * `YYYY-MM-DD` strings and treat them as date-only (UTC-safe slice) to avoid
 * timezone drift when the user's locale crosses the date line.
 */

const NL_DAY_SHORT = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const NL_MONTH_SHORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

export function formatDateIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** Return the Monday-anchored week-start for the given date as ISO YYYY-MM-DD. */
export function getMondayIso(d: Date): string {
  const day = d.getDay(); // 0=Sun ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  return formatDateIso(addDays(d, diff));
}

export function isValidWeekStart(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  // Must be a Monday.
  return d.getUTCDay() === 1;
}

/** Format "ma 27 apr — vr 1 mei 2026" for the given Monday ISO week-start. */
export function formatWeekRangeLabel(weekStartIso: string): string {
  const start = new Date(weekStartIso);
  const end = addDays(start, 4); // Friday
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const startDay = NL_DAY_SHORT[start.getUTCDay()];
  const endDay = NL_DAY_SHORT[end.getUTCDay()];
  const startMonth = NL_MONTH_SHORT[start.getUTCMonth()];
  const endMonth = NL_MONTH_SHORT[end.getUTCMonth()];
  const startPart = sameMonth && sameYear
    ? `${startDay} ${start.getUTCDate()}`
    : `${startDay} ${start.getUTCDate()} ${startMonth}`;
  const endPart = `${endDay} ${end.getUTCDate()} ${endMonth} ${end.getUTCFullYear()}`;
  return `${startPart} — ${endPart}`;
}

/** Generate ma..vr (5 entries) starting from the Monday ISO. */
export function getWeekDays(weekStartIso: string): {
  iso: string;
  short: string;
  dayNumber: number;
  month: string;
}[] {
  const start = new Date(weekStartIso);
  return Array.from({ length: 5 }).map((_, i) => {
    const d = addDays(start, i);
    return {
      iso: formatDateIso(d),
      short: NL_DAY_SHORT[d.getUTCDay()] ?? "",
      dayNumber: d.getUTCDate(),
      month: NL_MONTH_SHORT[d.getUTCMonth()] ?? "",
    };
  });
}

/** Format hours number → Dutch comma decimal, e.g. 8 → "8,00", 8.5 → "8,50". */
export function formatHoursNl(n: number): string {
  return n.toFixed(2).replace(".", ",");
}
