"use client";

import { useEffect, useState } from "react";

interface PinResponseRow {
  entityType: string;
  entityId: string;
}

export function usePinToggle(entityType: "employee", entityId: string) {
  const [isPinned, setIsPinned] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/pins?entityType=${entityType}`)
      .then(async (r) => {
        if (cancelled) return;
        if (!r.ok) {
          setIsPinned(false);
          return;
        }
        const list = (await r.json()) as PinResponseRow[];
        if (!cancelled) {
          setIsPinned(
            Array.isArray(list) && list.some((p) => p.entityId === entityId),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setIsPinned(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  async function toggle(): Promise<void> {
    if (isPinned === null) return;
    if (isPinned) {
      const res = await fetch(`/api/admin/pins/${entityType}/${entityId}`, {
        method: "DELETE",
      });
      if (res.ok) setIsPinned(false);
    } else {
      const res = await fetch("/api/admin/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      });
      if (res.ok || res.status === 201) setIsPinned(true);
    }
  }

  return { isPinned, toggle };
}
