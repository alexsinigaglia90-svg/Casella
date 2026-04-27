// NL holidays (national, observable) used to compute werkbare uren.
// Hardcoded for Fase 1.6; CRON-driven dynamic source deferred to Fase 2.

const NL_HOLIDAYS_2026 = [
  "2026-01-01",
  "2026-04-06",
  "2026-04-27",
  "2026-05-05",
  "2026-05-14",
  "2026-05-25",
  "2026-12-25",
  "2026-12-26",
];
const NL_HOLIDAYS_2027 = [
  "2027-01-01",
  "2027-03-29",
  "2027-04-27",
  "2027-05-05",
  "2027-05-06",
  "2027-05-16",
  "2027-12-25",
  "2027-12-26",
];

const HOLIDAY_MAP: Record<number, string[]> = {
  2026: NL_HOLIDAYS_2026,
  2027: NL_HOLIDAYS_2027,
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function workingDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`workingDaysInMonth: month must be 1..12, got ${month}`);
  }
  const holidays = new Set(HOLIDAY_MAP[year] ?? []);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let count = 0;
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    const dow = d.getUTCDay(); // 0 = Sun, 6 = Sat
    if (dow === 0 || dow === 6) continue;
    const iso = `${year}-${pad2(month)}-${pad2(day)}`;
    if (holidays.has(iso)) continue;
    count++;
  }
  return count;
}

export function workingHoursInMonth(
  year: number,
  month: number,
  weeklyHours = 40,
): number {
  return workingDaysInMonth(year, month) * (weeklyHours / 5);
}
