"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

import { getEventCopy } from "./event-copy";
import type { ApiAuditEvent } from "./notification-bell";

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMin = (Date.now() - date.getTime()) / 60_000;
  if (diffMin < 1) return "zojuist";
  if (diffMin < 60) return `${Math.floor(diffMin)}m geleden`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}u geleden`;
  return `${Math.floor(diffMin / (60 * 24))}d geleden`;
}

interface Props {
  events: ApiAuditEvent[];
  loading: boolean;
}

export function NotificationsDropdown({ events, loading }: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="p-4 text-sm" style={{ color: "var(--fg-tertiary)" }}>
        Laden…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-4 text-sm" style={{ color: "var(--fg-tertiary)" }}>
        Geen recente activiteit.
      </div>
    );
  }

  return (
    <ul style={{ borderColor: "var(--border-subtle)" }}>
      {events.map((e, i) => {
        const conf = getEventCopy(e.action);
        const Icon = conf.icon;
        const eventForCopy = {
          ...e,
          changesJson: e.changesJson,
          createdAt: new Date(e.createdAt),
        };
        return (
          <li
            key={e.id}
            style={
              i < events.length - 1
                ? { borderBottom: "1px solid var(--border-subtle)" }
                : undefined
            }
          >
            <button
              type="button"
              className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-surface-lift"
              onClick={() => {
                if (e.resourceType === "employees" && e.resourceId) {
                  router.push(
                    `/admin/medewerkers/${e.resourceId}` as Route,
                  );
                }
              }}
            >
              <Icon
                className="mt-0.5 size-4 shrink-0"
                style={{ color: "var(--fg-tertiary)" }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm"
                  style={{ color: "var(--fg-primary)" }}
                >
                  {conf.copy(eventForCopy)}
                </p>
                <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
                  {e.actorName ? `${e.actorName} · ` : ""}
                  {timeAgo(e.createdAt)}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
