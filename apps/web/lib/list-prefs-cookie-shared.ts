export const LIST_PREFS_COOKIE = "casella.listprefs";
export type Density = "compact" | "cozy" | "spacious";
export interface ListPrefs {
  density: Density;
  showAvatars: boolean;
}
export const DEFAULT_LIST_PREFS: ListPrefs = { density: "cozy", showAvatars: true };
