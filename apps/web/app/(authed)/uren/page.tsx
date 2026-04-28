import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  formatDateIso,
  getMondayIso,
  isValidWeekStart,
} from "@/features/hours/employee/date-utils";
import { UrenHero } from "@/features/hours/employee/uren-hero";
import { WeekGrid, type WeekGridProject } from "@/features/hours/employee/week-grid";
import { getCurrentEmployee } from "@/lib/current-employee";
import {
  getEmployeeHourStats,
  getEmployeeProjectsForWeek,
  getEmployeeWeek,
} from "@/lib/hours/queries";

export const dynamic = "force-dynamic";

export default async function UrenPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/onboarding-pending" as Route);

  const params = await searchParams;
  const requested = params.week;
  const weekStart =
    requested && isValidWeekStart(requested)
      ? requested
      : getMondayIso(new Date());

  // Always use today's Monday for "default" (no ?week=) — keeps URLs clean.
  // We tolerate any valid Monday for explicit ?week=YYYY-MM-DD.
  if (!isValidWeekStart(weekStart)) {
    redirect(`/uren?week=${formatDateIso(new Date())}` as Route);
  }

  const [weekData, rawProjects, stats] = await Promise.all([
    getEmployeeWeek(employee.id, weekStart),
    getEmployeeProjectsForWeek(employee.id, weekStart),
    getEmployeeHourStats(employee.id, weekStart),
  ]);

  const projects: WeekGridProject[] = rawProjects
    .filter((p): p is typeof p & { id: string; name: string } =>
      p.id !== null && p.name !== null,
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      clientName: p.clientName,
    }));

  // Pull rejection reason from the first rejected entry (admin rejects whole
  // week, so all rejected entries share the same reason).
  const rejectionReason =
    weekData.entries.find((e) => e.status === "rejected")?.rejectionReason ?? null;

  return (
    <div className="space-y-6">
      <UrenHero
        weekStart={weekStart}
        weekTotal={stats.weekTotal}
        toApprove={stats.toApprove}
        approved={stats.approved}
        status={weekData.status}
      />
      <WeekGrid
        weekStart={weekStart}
        initialEntries={weekData.entries}
        projects={projects}
        status={weekData.status}
        rejectionReason={rejectionReason}
      />
    </div>
  );
}
