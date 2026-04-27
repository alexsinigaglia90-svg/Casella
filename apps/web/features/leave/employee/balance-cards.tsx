import type { LeaveBalance } from "@/lib/leave/balance";
import { fallbackBalance } from "@/lib/leave/balance";
import {
  LEAVE_TYPES,
  type LeaveTypeKey,
} from "@/lib/leave/types";

const VISIBLE_TYPES: LeaveTypeKey[] = [
  "vacation_legal",
  "short_care",
  "long_care",
  "parental_paid",
];

function fmtHours(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

export interface LeaveBalanceCardsProps {
  balances: Partial<Record<LeaveTypeKey, LeaveBalance>>;
  weeklyHours: number;
}

export function LeaveBalanceCards({
  balances,
  weeklyHours,
}: LeaveBalanceCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {VISIBLE_TYPES.map((key) => {
        const config = LEAVE_TYPES[key];
        const real = balances[key];
        const fb = real ? null : fallbackBalance(key, weeklyHours);
        const total = real?.hoursTotal ?? fb?.hoursTotal ?? 0;
        const remaining = real?.hoursRemaining ?? fb?.hoursRemaining ?? 0;
        const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
        const synced = real?.syncedAt
          ? new Date(real.syncedAt).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "short",
            })
          : "fallback";

        return (
          <div
            key={key}
            className="rounded-xl border p-5 glass-card"
            style={{
              borderColor: "var(--border-subtle)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <div
              className="mb-1 font-mono text-[11px] uppercase tracking-wider"
              style={{ color: "var(--fg-tertiary)" }}
            >
              {config.label}
            </div>
            <div
              className="text-2xl font-semibold tabular-nums"
              style={{ color: "var(--fg-primary)" }}
            >
              {fmtHours(remaining)}{" "}
              <span
                className="text-sm font-normal"
                style={{ color: "var(--fg-tertiary)" }}
              >
                / {fmtHours(total)} u
              </span>
            </div>
            <div
              className="mt-3 h-1.5 w-full rounded-full"
              style={{ backgroundColor: "var(--border-subtle)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: "var(--aurora-violet, #7c3aed)",
                }}
              />
            </div>
            <div
              className="mt-2 text-[11px]"
              style={{ color: "var(--fg-tertiary)" }}
            >
              {pct}% over · {synced}
            </div>
          </div>
        );
      })}
    </div>
  );
}
