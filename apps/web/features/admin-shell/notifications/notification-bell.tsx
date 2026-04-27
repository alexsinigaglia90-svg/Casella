"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { NotificationsDropdown } from "./notifications-dropdown";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ApiAuditEvent {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string | null;
  actorUserId: string | null;
  actorName: string | null;
  changesJson: Record<string, unknown> | null;
  createdAt: string; // ISO
}

interface NotificationsApiResponse {
  events: ApiAuditEvent[];
  lastSeenAt: string | null;
}

export function NotificationBell() {
  const [events, setEvents] = useState<ApiAuditEvent[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit/recent");
      if (!res.ok) return;
      const json = (await res.json()) as NotificationsApiResponse;
      setEvents(json.events);
      setLastSeenAt(json.lastSeenAt);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unread =
    events.length > 0 &&
    (!lastSeenAt ||
      new Date(events[0]!.createdAt).getTime() >
        new Date(lastSeenAt).getTime());

  async function markSeen() {
    if (!unread) return;
    await fetch("/api/admin/audit/mark-seen", { method: "POST" });
    setLastSeenAt(new Date().toISOString());
  }

  return (
    <DropdownMenu
      onOpenChange={(o) => {
        if (o) void markSeen();
      }}
    >
      <DropdownMenuTrigger
        className="relative grid size-8 place-items-center rounded-full transition-colors hover:bg-surface-lift focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Meldingen"
      >
        <Bell className="size-4" style={{ color: "var(--fg-secondary)" }} />
        {unread && (
          <span
            className="absolute right-1.5 top-1.5 size-2 rounded-full"
            style={{ background: "var(--status-danger)" }}
            aria-hidden
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-96 w-96 overflow-y-auto p-0"
        style={{ background: "var(--surface-base)" }}
      >
        <NotificationsDropdown events={events} loading={loading} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
