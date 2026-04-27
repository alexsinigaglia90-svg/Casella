export type Density = "compact" | "comfortable" | "spacious";

export interface ProjectColumnPrefs {
  bureau: boolean;
  status: boolean;
  looptijd: boolean;
  uren: boolean;
  omzet: boolean;
}

export interface ProjectListPrefs {
  density: Density;
  columns: ProjectColumnPrefs;
  showCharts: boolean;
  showForecast: boolean;
  showTopMedewerkers: boolean;
  showAvatars: boolean;
}

export const DEFAULT_PROJECT_LIST_PREFS: ProjectListPrefs = {
  density: "comfortable",
  columns: { bureau: false, status: true, looptijd: false, uren: false, omzet: true },
  showCharts: true,
  showForecast: true,
  showTopMedewerkers: true,
  showAvatars: true,
};

export const PROJECT_LIST_PREFS_COOKIE = "casella.projectlistprefs";
