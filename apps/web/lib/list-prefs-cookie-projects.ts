import { cookies } from "next/headers";

import {
  PROJECT_LIST_PREFS_COOKIE,
  DEFAULT_PROJECT_LIST_PREFS,
  type ProjectListPrefs,
  type ProjectColumnPrefs,
  type Density,
} from "./list-prefs-cookie-shared-projects";

const VALID_DENSITY = new Set<Density>(["compact", "comfortable", "spacious"]);

export async function readProjectListPrefs(): Promise<ProjectListPrefs> {
  const c = (await cookies()).get(PROJECT_LIST_PREFS_COOKIE)?.value;
  if (!c) return DEFAULT_PROJECT_LIST_PREFS;
  try {
    const parsed = JSON.parse(decodeURIComponent(c)) as Partial<ProjectListPrefs>;
    const cols: Partial<ProjectColumnPrefs> = parsed.columns ?? {};
    return {
      density: VALID_DENSITY.has(parsed.density as Density)
        ? (parsed.density as Density)
        : "comfortable",
      columns: {
        bureau: cols.bureau === true ? true : false,
        status: cols.status === false ? false : true,
        looptijd: cols.looptijd === true ? true : false,
        uren: cols.uren === true ? true : false,
        omzet: cols.omzet === false ? false : true,
      },
      showCharts: parsed.showCharts === false ? false : true,
      showForecast: parsed.showForecast === false ? false : true,
      showTopMedewerkers: parsed.showTopMedewerkers === false ? false : true,
      showAvatars: parsed.showAvatars === false ? false : true,
    };
  } catch {
    return DEFAULT_PROJECT_LIST_PREFS;
  }
}
