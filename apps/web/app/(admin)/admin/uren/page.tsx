import { AnomalyBanner } from "@/features/hours/admin/anomaly-banner";
import { ApprovalList, type PendingItem } from "@/features/hours/admin/approval-list";
import { UrenCrumbs } from "@/features/hours/admin/uren-crumbs";
import { UrenPageActions } from "@/features/hours/admin/uren-page-actions";
import { computeAnomaliesForWeek } from "@/lib/hours/anomalies";
import { listPendingApprovals } from "@/lib/hours/queries";

export const dynamic = "force-dynamic";

function currentMondayIso(): string {
  const d = new Date();
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

export default async function AdminUrenPage() {
  const monday = currentMondayIso();
  const [rows, anomalies] = await Promise.all([
    listPendingApprovals(),
    computeAnomaliesForWeek(monday),
  ]);

  const items: PendingItem[] = rows.map((r) => ({
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    weekStart: r.weekStart,
    totalHours: r.totalHours,
    entryCount: r.entryCount,
    submittedAt: r.submittedAt,
  }));

  return (
    <>
      <UrenCrumbs />
      <UrenPageActions />
      <div className="space-y-6">
        <header className="space-y-2">
          <div
            className="mb-1 font-mono text-[11px] uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Admin
          </div>
          <h1 className="font-display text-display leading-none">
            <span>Uren </span>
            <em>goedkeuren</em>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--fg-secondary)" }}>
            {items.length === 0
              ? "Geen openstaande inzendingen."
              : `${items.length} openstaande ${items.length === 1 ? "week" : "weken"}.`}
          </p>
        </header>

        <AnomalyBanner anomalies={anomalies} />
        <ApprovalList rows={items} />
      </div>
    </>
  );
}
