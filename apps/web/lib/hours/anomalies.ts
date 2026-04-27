import "server-only";

import { getDb, sql } from "@casella/db";

export interface AnomalyRow {
  employeeId: string;
  employeeName: string;
  currentHours: number;
  avgHours: number;
  severity: "high" | "low";
  reason: string;
}

interface AnomalyDbRow {
  employee_id: string;
  employee_name: string;
  current_hours: string | number;
  avg_hours: string | number;
}

function asIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function computeAnomaliesForWeek(
  weekStartIso: string,
): Promise<AnomalyRow[]> {
  const db = getDb();
  const start = new Date(weekStartIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fourWeeksAgo = new Date(start);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const oneDayBeforeWeek = new Date(start);
  oneDayBeforeWeek.setDate(oneDayBeforeWeek.getDate() - 1);

  const rows = await db.execute(sql`
    WITH cur AS (
      SELECT employee_id, COALESCE(SUM(hours), 0) AS hrs
      FROM hour_entries
      WHERE work_date BETWEEN ${weekStartIso} AND ${asIso(end)}
      GROUP BY employee_id
    ),
    prev AS (
      SELECT employee_id, COALESCE(SUM(hours), 0) AS hrs
      FROM hour_entries
      WHERE work_date BETWEEN ${asIso(fourWeeksAgo)} AND ${asIso(oneDayBeforeWeek)}
      GROUP BY employee_id
    ),
    joined AS (
      SELECT
        e.id AS employee_id,
        COALESCE(NULLIF(TRIM(CONCAT_WS(' ', e.first_name, e.last_name)), ''), u.display_name, 'Onbekend') AS employee_name,
        COALESCE(cur.hrs, 0) AS current_hours,
        COALESCE(prev.hrs / 4, 0) AS avg_hours
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN cur ON cur.employee_id = e.id
      LEFT JOIN prev ON prev.employee_id = e.id
      WHERE e.employment_status = 'active'
    )
    SELECT * FROM joined
    WHERE (current_hours > 1.5 * avg_hours AND current_hours > 50)
       OR (current_hours < 0.5 * avg_hours AND avg_hours > 30)
  `);

  const dbRows = rows as unknown as AnomalyDbRow[];

  return dbRows.map((r) => {
    const cur = Number(r.current_hours);
    const avg = Number(r.avg_hours);
    const severity: "high" | "low" = cur > avg ? "high" : "low";
    const safeAvg = Math.max(avg, 0.01);
    const reason =
      severity === "high"
        ? `Deze week ${cur.toFixed(1)} uur, gemiddeld ${avg.toFixed(1)} uur (${(cur / safeAvg).toFixed(1)}× hoger)`
        : `Deze week ${cur.toFixed(1)} uur, gemiddeld ${avg.toFixed(1)} uur (${((cur / safeAvg) * 100).toFixed(0)}%)`;
    return {
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      currentHours: cur,
      avgHours: avg,
      severity,
      reason,
    };
  });
}
