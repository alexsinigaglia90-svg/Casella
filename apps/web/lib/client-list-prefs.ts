import { cookies } from "next/headers";

import {
  CLIENT_LIST_PREFS_COOKIE,
  DEFAULT_CLIENT_LIST_PREFS,
  type ClientColumnPrefs,
  type ClientListPrefs,
  type Density,
  type StatusVariant,
} from "./client-list-prefs-shared";

const VALID_DENSITY = new Set<Density>(["compact", "comfortable", "spacious"]);
const VALID_STATUS = new Set<StatusVariant>(["pill", "dot", "text"]);

export async function readClientListPrefs(): Promise<ClientListPrefs> {
  const c = (await cookies()).get(CLIENT_LIST_PREFS_COOKIE)?.value;
  if (!c) return DEFAULT_CLIENT_LIST_PREFS;
  try {
    const parsed = JSON.parse(decodeURIComponent(c)) as Partial<ClientListPrefs>;
    const cols: Partial<ClientColumnPrefs> = parsed.columns ?? {};
    return {
      density: VALID_DENSITY.has(parsed.density as Density)
        ? (parsed.density as Density)
        : "comfortable",
      statusVariant: VALID_STATUS.has(parsed.statusVariant as StatusVariant)
        ? (parsed.statusVariant as StatusVariant)
        : "pill",
      columns: {
        kvk: cols.kvk === false ? false : true,
        contactName: cols.contactName === false ? false : true,
        contactEmail: cols.contactEmail === false ? false : true,
        city: cols.city === false ? false : true,
        projectCount: cols.projectCount === false ? false : true,
        status: cols.status === false ? false : true,
      },
    };
  } catch {
    return DEFAULT_CLIENT_LIST_PREFS;
  }
}
