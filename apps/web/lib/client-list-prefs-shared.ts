export const CLIENT_LIST_PREFS_COOKIE = "casella.clientlistprefs";

export type Density = "compact" | "comfortable" | "spacious";
export type StatusVariant = "pill" | "dot" | "text";

export interface ClientColumnPrefs {
  kvk: boolean;
  contactName: boolean;
  contactEmail: boolean;
  city: boolean;
  projectCount: boolean;
  status: boolean;
}

export interface ClientListPrefs {
  density: Density;
  statusVariant: StatusVariant;
  columns: ClientColumnPrefs;
}

export const DEFAULT_CLIENT_LIST_PREFS: ClientListPrefs = {
  density: "comfortable",
  statusVariant: "pill",
  columns: {
    kvk: true,
    contactName: true,
    contactEmail: true,
    city: true,
    projectCount: true,
    status: true,
  },
};
