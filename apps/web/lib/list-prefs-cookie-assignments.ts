import { cookies } from "next/headers";

import type { PaletteName } from "./assignments/palette";
import {
  ASSIGNMENTS_LIST_PREFS_COOKIE,
  DEFAULT_ASSIGNMENTS_LIST_PREFS,
  type AssignmentsAxis,
  type AssignmentsHorizon,
  type AssignmentsListPrefs,
} from "./list-prefs-cookie-shared-assignments";

const VALID_AXIS = new Set<AssignmentsAxis>(["people", "projects"]);
const VALID_HORIZON = new Set<AssignmentsHorizon>(["week", "month", "quarter"]);
const VALID_PALETTE = new Set<PaletteName>([
  "pastel",
  "pastel-warm",
  "pastel-cool",
  "role",
  "aurora",
]);

export async function readAssignmentsListPrefs(): Promise<AssignmentsListPrefs> {
  const c = (await cookies()).get(ASSIGNMENTS_LIST_PREFS_COOKIE)?.value;
  if (!c) return DEFAULT_ASSIGNMENTS_LIST_PREFS;
  try {
    const parsed = JSON.parse(decodeURIComponent(c)) as Partial<AssignmentsListPrefs>;
    return {
      axis: VALID_AXIS.has(parsed.axis as AssignmentsAxis)
        ? (parsed.axis as AssignmentsAxis)
        : DEFAULT_ASSIGNMENTS_LIST_PREFS.axis,
      horizon: VALID_HORIZON.has(parsed.horizon as AssignmentsHorizon)
        ? (parsed.horizon as AssignmentsHorizon)
        : DEFAULT_ASSIGNMENTS_LIST_PREFS.horizon,
      palette: VALID_PALETTE.has(parsed.palette as PaletteName)
        ? (parsed.palette as PaletteName)
        : DEFAULT_ASSIGNMENTS_LIST_PREFS.palette,
      showCapBar: parsed.showCapBar === false ? false : true,
      showGhost: parsed.showGhost === false ? false : true,
      showRevenue: parsed.showRevenue === true ? true : false,
      magnetic: parsed.magnetic === false ? false : true,
    };
  } catch {
    return DEFAULT_ASSIGNMENTS_LIST_PREFS;
  }
}
