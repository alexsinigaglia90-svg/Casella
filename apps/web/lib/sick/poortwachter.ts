/**
 * Wet Poortwachter milestones — Dutch sickness law re-integration timeline.
 * Used by /admin/verzuim case-files and the employee /verzuim recovery view.
 *
 * Milestones are anchored to the first day of sickness (week 1). Status is
 * computed from days elapsed: passed (deadline date is in the past), active
 * (deadline within next 14 days), upcoming (further away).
 */

export interface PoortwachterMilestone {
  weekNum: number;
  id: string;
  label: string;
  shortLabel: string;
}

export const POORTWACHTER_MILESTONES: readonly PoortwachterMilestone[] = [
  { weekNum: 1, id: "ziekmelding", label: "1ste ziektedag", shortLabel: "Ziekmelding" },
  { weekNum: 6, id: "probleemanalyse", label: "Probleemanalyse bedrijfsarts", shortLabel: "Probleemanalyse" },
  { weekNum: 8, id: "plan-van-aanpak", label: "Plan van aanpak opstellen", shortLabel: "Plan van aanpak" },
  { weekNum: 13, id: "uwv-melding", label: "13-wekenmelding aan UWV", shortLabel: "UWV-melding" },
  { weekNum: 26, id: "evaluatie-1", label: "Eerste evaluatie", shortLabel: "1ste evaluatie" },
  { weekNum: 42, id: "uwv-42", label: "42-wekenmelding aan UWV", shortLabel: "Ziekmelding UWV" },
  { weekNum: 52, id: "jaars-evaluatie", label: "1e jaars-evaluatie", shortLabel: "1e jaars-eval" },
  { weekNum: 87, id: "wia", label: "WIA-aanvraag voorbereiden", shortLabel: "WIA-aanvraag" },
] as const;

export type MilestoneStatus = "passed" | "active" | "upcoming";

export interface MilestoneWithStatus extends PoortwachterMilestone {
  status: MilestoneStatus;
  /** Day this milestone falls on, computed from sickness start. */
  dueDateIso: string;
}

/**
 * Compute days elapsed between sick-start and a reference day (today by
 * default). If the case has been closed, use the endDate as reference.
 */
export function daysSick(
  startDateIso: string,
  endDateIso: string | null,
  today: Date = new Date(),
): number {
  const start = new Date(startDateIso);
  const ref = endDateIso ? new Date(endDateIso) : today;
  const diff = ref.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/** Return the milestones decorated with passed / active / upcoming + due-date. */
export function getMilestoneStatus(
  startDateIso: string,
  today: Date = new Date(),
  milestones: readonly PoortwachterMilestone[] = POORTWACHTER_MILESTONES,
): MilestoneWithStatus[] {
  const start = new Date(startDateIso);
  const todayMs = today.getTime();

  return milestones.map((m) => {
    const due = new Date(start);
    due.setDate(due.getDate() + (m.weekNum - 1) * 7);
    const dueMs = due.getTime();
    const diffDays = (dueMs - todayMs) / (1000 * 60 * 60 * 24);
    let status: MilestoneStatus;
    if (diffDays < 0) status = "passed";
    else if (diffDays <= 14) status = "active";
    else status = "upcoming";
    return {
      ...m,
      status,
      dueDateIso: due.toISOString().slice(0, 10),
    };
  });
}
