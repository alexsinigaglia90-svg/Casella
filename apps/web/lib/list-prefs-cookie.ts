import { cookies } from "next/headers";
import { LIST_PREFS_COOKIE, DEFAULT_LIST_PREFS, type ListPrefs } from "./list-prefs-cookie-shared";

export async function readListPrefs(): Promise<ListPrefs> {
  const c = (await cookies()).get(LIST_PREFS_COOKIE)?.value;
  if (!c) return DEFAULT_LIST_PREFS;
  try {
    const parsed = JSON.parse(c) as Partial<ListPrefs>;
    return {
      density:
        parsed.density === "compact" || parsed.density === "spacious" ? parsed.density : "cozy",
      showAvatars: parsed.showAvatars === false ? false : true,
    };
  } catch {
    return DEFAULT_LIST_PREFS;
  }
}
