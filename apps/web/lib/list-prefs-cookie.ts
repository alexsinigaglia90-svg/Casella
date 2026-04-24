import { cookies } from "next/headers";
import { LIST_PREFS_COOKIE, DEFAULT_LIST_PREFS, type ListPrefs, type ColumnPrefs, type Density, type StatusVariant } from "./list-prefs-cookie-shared";

const VALID_DENSITY = new Set<Density>(["compact", "comfortable", "spacious"]);
const VALID_STATUS = new Set<StatusVariant>(["pill", "dot", "text"]);

export async function readListPrefs(): Promise<ListPrefs> {
  const c = (await cookies()).get(LIST_PREFS_COOKIE)?.value;
  if (!c) return DEFAULT_LIST_PREFS;
  try {
    const parsed = JSON.parse(decodeURIComponent(c)) as Partial<ListPrefs>;
    const cols: Partial<ColumnPrefs> = parsed.columns ?? {};
    return {
      density: VALID_DENSITY.has(parsed.density as Density) ? parsed.density as Density : "comfortable",
      showAvatars: parsed.showAvatars === false ? false : true,
      statusVariant: VALID_STATUS.has(parsed.statusVariant as StatusVariant) ? parsed.statusVariant as StatusVariant : "pill",
      columns: {
        email:     cols.email     === false ? false : true,
        function:  cols.function  === false ? false : true,
        project:   cols.project   === false ? false : true,
        status:    cols.status    === false ? false : true,
        startDate: cols.startDate === false ? false : true,
      },
    };
  } catch {
    return DEFAULT_LIST_PREFS;
  }
}
