export const LIST_PREFS_COOKIE = "casella.listprefs";

export type Density = "compact" | "comfortable" | "spacious";
export type StatusVariant = "pill" | "dot" | "text";

export interface ColumnPrefs {
  email: boolean;
  function: boolean;
  project: boolean;
  status: boolean;
  startDate: boolean;
}

export interface ListPrefs {
  density: Density;
  showAvatars: boolean;
  statusVariant: StatusVariant;
  columns: ColumnPrefs;
}

export const DEFAULT_LIST_PREFS: ListPrefs = {
  density: "comfortable",
  showAvatars: true,
  statusVariant: "pill",
  columns: { email: true, function: true, project: true, status: true, startDate: true },
};
