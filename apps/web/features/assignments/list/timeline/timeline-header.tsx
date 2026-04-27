"use client";

import { useMemo } from "react";

import {
  PX_PER_WEEK,
  SIDEBAR_WIDTH_PX,
  addDays,
  asIso,
  dayToX,
  getISOWeek,
} from "@/lib/assignments/week-math";

interface TimelineHeaderProps {
  baseStart: Date;
  totalWeeks: number;
  /** ISO YYYY-MM-DD for "today" — used for the dotted vertical marker. */
  todayIso: string;
}

const MONTH_LABELS_NL = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

interface MonthMarker {
  x: number;
  label: string;
  showYear: boolean;
}

interface WeekMarker {
  x: number;
  label: string;
  isoStart: string;
}

function buildMarkers(
  baseStart: Date,
  totalWeeks: number,
): { months: MonthMarker[]; weeks: WeekMarker[] } {
  const months: MonthMarker[] = [];
  const weeks: WeekMarker[] = [];

  let lastMonth = -1;
  for (let i = 0; i < totalWeeks; i++) {
    const monday = addDays(baseStart, i * 7);
    const weekNum = getISOWeek(monday);
    const x = dayToX(monday, baseStart);
    weeks.push({ x, label: `w${weekNum}`, isoStart: asIso(monday) });

    // First Monday whose month differs from the previous: emit a month label.
    const m = monday.getUTCMonth();
    if (m !== lastMonth) {
      months.push({
        x,
        label: MONTH_LABELS_NL[m] ?? "",
        showYear: m === 0,
      });
      lastMonth = m;
    }
  }

  return { months, weeks };
}

export function TimelineHeader({ baseStart, totalWeeks, todayIso }: TimelineHeaderProps) {
  const { months, weeks } = useMemo(
    () => buildMarkers(baseStart, totalWeeks),
    [baseStart, totalWeeks],
  );
  const totalWidth = totalWeeks * PX_PER_WEEK;
  const today = useMemo(() => {
    const [y, m, d] = todayIso.split("-").map((p) => Number(p));
    return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  }, [todayIso]);
  const todayX = dayToX(today, baseStart);
  const todayInRange = todayX >= 0 && todayX <= totalWidth;

  const baseYear = baseStart.getUTCFullYear();

  return (
    <div
      className="sticky top-0 z-20 flex border-b"
      style={{
        background: "var(--surface-base)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Sidebar gutter (matches row sidebar width) */}
      <div
        className="flex shrink-0 items-end px-3 pb-2 pt-3"
        style={{
          width: SIDEBAR_WIDTH_PX,
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--fg-tertiary)" }}
        >
          {baseYear}
        </div>
      </div>

      {/* Week strip */}
      <div className="relative" style={{ width: totalWidth, height: 56 }}>
        {/* Months row */}
        <div className="absolute inset-x-0 top-0 h-7">
          {months.map((m, i) => (
            <div
              key={`${m.label}-${i}`}
              className="absolute flex items-end gap-1.5 pl-1.5 pt-2 font-display text-[13px]"
              style={{
                left: m.x,
                color: "var(--fg-primary)",
                lineHeight: 1,
              }}
            >
              <span>{m.label}</span>
              {m.showYear && (
                <span
                  className="font-mono text-[10px]"
                  style={{ color: "var(--fg-tertiary)" }}
                >
                  {addDays(baseStart, 0).getUTCFullYear() + (i === 0 ? 0 : 0)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Week numbers row */}
        <div className="absolute inset-x-0 bottom-0 h-7">
          {weeks.map((w) => (
            <div
              key={w.isoStart}
              className="absolute flex items-end pb-1.5 pl-1.5 font-mono text-[10px]"
              style={{
                left: w.x,
                width: PX_PER_WEEK,
                color: "var(--fg-tertiary)",
                borderLeft: "1px solid var(--border-subtle)",
                height: "100%",
              }}
            >
              {w.label}
            </div>
          ))}
        </div>

        {/* Today indicator */}
        {todayInRange && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0"
            style={{
              left: todayX,
              width: 1,
              borderLeft: "1.5px dashed var(--status-danger)",
            }}
          />
        )}
      </div>
    </div>
  );
}
