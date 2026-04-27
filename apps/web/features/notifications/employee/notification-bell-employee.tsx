"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  type: string;
  payloadJson: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  "leave.approved": "Verlof goedgekeurd",
  "leave.rejected": "Verlof afgewezen",
  "expense.approved": "Declaratie goedgekeurd",
  "expense.rejected": "Declaratie afgewezen",
  "hours.rejected": "Uren afgewezen",
  "hours.approved": "Uren goedgekeurd",
  "statement.ready": "Werkgeversverklaring klaar",
  "payslip.available": "Loonstrook beschikbaar",
  "contract.uploaded": "Contract geüpload",
  "bonus.paid": "Bonus uitbetaald",
  "address.change.approved": "Adreswijziging goedgekeurd",
  "iban.change.approved": "IBAN-wijziging goedgekeurd",
  "vacation.balance.low": "Vakantiesaldo laag",
  "hours.missing.reminder": "Uren-herinnering",
  "vacation.unused.year-end": "Ongebruikt verlof",
  "broadcast.general": "Bericht van Ascentra",
};

function timeAgo(iso: string): string {
  const diffMin = (Date.now() - new Date(iso).getTime()) / 60_000;
  if (diffMin < 1) return "zojuist";
  if (diffMin < 60) return `${Math.floor(diffMin)}m geleden`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}u geleden`;
  return `${Math.floor(diffMin / (60 * 24))}d geleden`;
}

export function NotificationBellEmployee() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: Notification[] };
      setNotifications(data.notifications);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const unread = notifications.some((n) => !n.readAt);
  const displayed = notifications.slice(0, 10);

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id);
    for (const id of unreadIds) {
      await fetch(`/api/notifications/${id}/mark-read`, { method: "POST" }).catch(() => undefined);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  function handleOpen(open: boolean) {
    if (open && unread) {
      void markAllRead();
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpen}>
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
        className="max-h-96 w-80 overflow-y-auto p-0"
        style={{ background: "var(--surface-base)" }}
      >
        {loading ? (
          <div className="p-4 text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Laden…
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-4 text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Geen meldingen.
          </div>
        ) : (
          <ul style={{ borderColor: "var(--border-subtle)" }}>
            {displayed.map((n, i) => (
              <li
                key={n.id}
                style={
                  i < displayed.length - 1
                    ? { borderBottom: "1px solid var(--border-subtle)" }
                    : undefined
                }
              >
                <div
                  className="flex items-start gap-3 p-3"
                  style={{
                    background: n.readAt ? undefined : "var(--surface-lift)",
                  }}
                >
                  {!n.readAt && (
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--aurora-violet)" }}
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm" style={{ color: "var(--fg-primary)" }}>
                      {TYPE_LABELS[n.type] ?? n.type}
                      {n.type === "broadcast.general" && n.payloadJson.message
                        ? `: ${String(n.payloadJson.message).slice(0, 60)}${String(n.payloadJson.message).length > 60 ? "…" : ""}`
                        : ""}
                    </p>
                    <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
