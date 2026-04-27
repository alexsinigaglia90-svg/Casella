"use client";

import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { NmbrsSyncRunRow, NmbrsSyncType } from "@/lib/nmbrs/queries";

interface SyncCardProps {
  type: NmbrsSyncType;
  title: string;
  description: string;
  icon: LucideIcon;
  lastRun: NmbrsSyncRunRow | null;
  /** When false, sync button is disabled and an explanation is shown. */
  enabled: boolean;
  disabledReason?: string;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
}

function fmtDuration(startIso: string, endIso: string | null): string | null {
  if (!endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

function statusBadge(
  status: NmbrsSyncRunRow["status"],
): { label: string; color: string; bg: string; Icon: LucideIcon } {
  switch (status) {
    case "running":
      return {
        label: "Bezig",
        color: "var(--aurora-violet)",
        bg: "color-mix(in oklab, var(--aurora-violet) 14%, transparent)",
        Icon: Loader2,
      };
    case "success":
      return {
        label: "Succesvol",
        color: "var(--success-fg, #16a34a)",
        bg: "color-mix(in oklab, var(--success-fg, #16a34a) 14%, transparent)",
        Icon: CheckCircle2,
      };
    case "failure":
      return {
        label: "Mislukt",
        color: "var(--danger-fg, #dc2626)",
        bg: "color-mix(in oklab, var(--danger-fg, #dc2626) 14%, transparent)",
        Icon: XCircle,
      };
  }
}

export function SyncCard({
  type,
  title,
  description,
  icon: Icon,
  lastRun,
  enabled,
  disabledReason,
}: SyncCardProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function trigger() {
    setRunning(true);
    try {
      const res = await fetch(`/api/admin/nmbrs/sync/${type}`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        errorMessage?: string;
        status?: string;
        recordsProcessed?: number;
        recordsSucceeded?: number;
        recordsFailed?: number;
      };
      if (!res.ok) {
        toast.error(body.message ?? `Sync ${title} mislukt`);
        return;
      }
      if (body.status === "success") {
        const proc = body.recordsProcessed ?? 0;
        toast.success(
          proc === 0
            ? `${title}: niets te synchroniseren`
            : `${title}: ${body.recordsSucceeded ?? 0}/${proc} verwerkt`,
        );
      } else {
        toast.error(
          body.errorMessage ?? `${title} sync gefaald — bekijk historie`,
        );
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setRunning(false);
    }
  }

  const badge = lastRun ? statusBadge(lastRun.status) : null;

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border p-5 glass-card"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              backgroundColor:
                "color-mix(in oklab, var(--aurora-violet) 12%, transparent)",
              color: "var(--aurora-violet)",
            }}
          >
            <Icon className="h-4.5 w-4.5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--fg-primary)" }}
            >
              {title}
            </h3>
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--fg-secondary)" }}
            >
              {description}
            </p>
          </div>
        </div>
        {badge && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ color: badge.color, backgroundColor: badge.bg }}
          >
            <badge.Icon
              className={`h-3 w-3 ${
                lastRun?.status === "running" ? "animate-spin" : ""
              }`}
              aria-hidden
            />
            {badge.label}
          </span>
        )}
      </div>

      <div
        className="rounded-md border px-3 py-2 text-xs"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-secondary)",
        }}
      >
        {lastRun ? (
          <div className="space-y-1 tabular-nums">
            <div>
              <span style={{ color: "var(--fg-tertiary)" }}>Laatst: </span>
              {fmtDateTime(lastRun.startedAt)}
              {fmtDuration(lastRun.startedAt, lastRun.finishedAt) && (
                <>
                  <span style={{ color: "var(--fg-tertiary)" }}> · </span>
                  {fmtDuration(lastRun.startedAt, lastRun.finishedAt)}
                </>
              )}
            </div>
            <div>
              <span style={{ color: "var(--fg-tertiary)" }}>Records: </span>
              {lastRun.recordsSucceeded}/{lastRun.recordsProcessed} ok
              {lastRun.recordsFailed > 0 && (
                <span style={{ color: "var(--danger-fg, #dc2626)" }}>
                  {" "}
                  · {lastRun.recordsFailed} mislukt
                </span>
              )}
            </div>
            {lastRun.errorMessage && (
              <div
                className="break-words"
                style={{ color: "var(--danger-fg, #dc2626)" }}
              >
                {lastRun.errorMessage}
              </div>
            )}
          </div>
        ) : (
          <span style={{ color: "var(--fg-tertiary)" }}>
            Nog geen runs uitgevoerd
          </span>
        )}
      </div>

      <Button
        size="sm"
        onClick={() => void trigger()}
        disabled={running || !enabled}
        title={!enabled ? disabledReason : undefined}
      >
        <RefreshCw
          className={`size-3.5 ${running ? "animate-spin" : ""}`}
          aria-hidden
        />
        {running ? "Synchroniseren…" : "Synchroniseren"}
      </Button>
    </div>
  );
}
