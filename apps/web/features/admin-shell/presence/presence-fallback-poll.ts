import type { PresenceUser } from "./types";

interface ApiPresenceResponse {
  viewers: PresenceUser[];
}

export function startFallbackPoll(
  entityType: string,
  entityId: string,
  setViewers: (v: PresenceUser[]) => void,
  intervalMs = 5_000,
): () => void {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick() {
    if (!active) return;
    try {
      const res = await fetch(`/api/admin/presence/${entityType}/${entityId}`, {
        method: "GET",
        cache: "no-store",
      });
      if (active && res.ok) {
        const json = (await res.json()) as ApiPresenceResponse;
        setViewers(json.viewers ?? []);
      }
    } catch {
      // silent — poll keeps going
    }
    if (active) {
      timer = setTimeout(tick, intervalMs);
    }
  }

  void tick();

  return () => {
    active = false;
    if (timer) clearTimeout(timer);
  };
}
