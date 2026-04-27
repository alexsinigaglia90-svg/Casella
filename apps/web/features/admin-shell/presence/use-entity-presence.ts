"use client";

import { useEffect, useState } from "react";

import { startFallbackPoll } from "./presence-fallback-poll";
import type { PresenceUser } from "./types";

export type { PresenceUser };

export function useEntityPresence(
  entityType: "employee",
  entityId: string,
): PresenceUser[] {
  const [viewers, setViewers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    // T32-REALTIME: future Supabase Realtime channel hookup goes here.
    // Falls back to polling for now (solo-admin context, no @supabase/supabase-js installed).
    const cleanup = startFallbackPoll(entityType, entityId, setViewers);
    return cleanup;
  }, [entityType, entityId]);

  return viewers;
}
