import type { PaletteName } from "./assignments/palette";

export type AssignmentsAxis = "people" | "projects";
export type AssignmentsHorizon = "week" | "month" | "quarter";

export interface AssignmentsListPrefs {
  axis: AssignmentsAxis;
  horizon: AssignmentsHorizon;
  palette: PaletteName;
  showCapBar: boolean;
  showGhost: boolean;
  showRevenue: boolean;
  magnetic: boolean;
}

export const DEFAULT_ASSIGNMENTS_LIST_PREFS: AssignmentsListPrefs = {
  axis: "people",
  horizon: "month",
  palette: "pastel",
  showCapBar: true,
  showGhost: true,
  showRevenue: false,
  magnetic: true,
};

export const ASSIGNMENTS_LIST_PREFS_COOKIE = "casella.assignmentslistprefs";

/** Number of weeks rendered per horizon. */
export const HORIZON_WEEKS: Record<AssignmentsHorizon, number> = {
  week: 6,
  month: 16,
  quarter: 28,
};
