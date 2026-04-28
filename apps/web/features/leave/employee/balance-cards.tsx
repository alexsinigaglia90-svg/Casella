import type { LeaveBalance } from "@/lib/leave/balance";
import { fallbackBalance } from "@/lib/leave/balance";
import { LEAVE_TYPE_HUES } from "@/lib/leave/type-hues";
import { LEAVE_TYPES, type LeaveTypeKey } from "@/lib/leave/types";

const VISIBLE_TYPES: LeaveTypeKey[] = [
  "vacation_legal",
  "vacation_extra",
  "short_care",
  "long_care",
  "parental_paid",
];

function fmtHours(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

interface BalanceBarProps {
  type: LeaveTypeKey;
  total: number;
  used: number;
  planned: number;
  carryOver: number;
  syncedLabel: string;
}

function BalanceBar({
  type,
  total,
  used,
  planned,
  carryOver,
  syncedLabel,
}: BalanceBarProps) {
  const config = LEAVE_TYPES[type];
  const hue = LEAVE_TYPE_HUES[type];
  const remaining = Math.max(0, total - used - planned);
  const usedPct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const plannedPct = total > 0 ? Math.min(100, (planned / total) * 100) : 0;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface-card)",
      }}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="grid size-6 place-items-center rounded-md"
            style={{
              background: `oklch(0.92 0.06 ${hue})`,
              color: `oklch(0.35 0.18 ${hue})`,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            ◇
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--fg-primary)" }}
          >
            {config.label}
          </span>
          {carryOver > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 font-mono uppercase"
              style={{
                fontSize: 9,
                letterSpacing: "0.08em",
                background: "var(--surface-lift)",
                color: "var(--fg-tertiary)",
              }}
              title={`${fmtHours(carryOver)}u meegenomen uit vorig jaar`}
            >
              +{fmtHours(carryOver)}u carry
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="font-display tabular-nums leading-none"
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "var(--fg-primary)",
            }}
          >
            {fmtHours(remaining)}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--fg-tertiary)" }}
          >
            / {fmtHours(total)}u over
          </span>
        </div>
      </div>

      <div
        className="relative h-2 overflow-hidden rounded-full"
        style={{ background: "var(--surface-lift)" }}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${usedPct}%`,
            background: `linear-gradient(90deg, oklch(0.7 0.16 ${hue}), oklch(0.55 0.20 ${hue}))`,
          }}
        />
        <div
          className="absolute inset-y-0"
          style={{
            left: `${usedPct}%`,
            width: `${plannedPct}%`,
            background: `repeating-linear-gradient(45deg, oklch(0.78 0.12 ${hue} / 0.7) 0 4px, oklch(0.78 0.12 ${hue} / 0.4) 4px 8px)`,
          }}
        />
      </div>

      <div
        className="mt-2 flex flex-wrap gap-x-3 font-mono"
        style={{ fontSize: 10, color: "var(--fg-tertiary)" }}
      >
        {used > 0 && (
          <span>
            <span className="tabular-nums">{fmtHours(used)}u</span> opgenomen
          </span>
        )}
        {planned > 0 && (
          <span>
            <span className="tabular-nums">{fmtHours(planned)}u</span> ingepland
          </span>
        )}
        <span className="ml-auto">{syncedLabel}</span>
      </div>
    </div>
  );
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {VISIBLE_TYPES.map((key) => {
        const real = balances[key];
        const fb = real ? null : fallbackBalance(key, weeklyHours);
        const total = real?.hoursTotal ?? fb?.hoursTotal ?? 0;
        const remaining = real?.hoursRemaining ?? fb?.hoursRemaining ?? 0;
        const used = Math.max(0, total - remaining);
        const synced = real?.syncedAt
          ? `gesync ${new Date(real.syncedAt).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "short",
            })}`
          : "fallback";

        return (
          <BalanceBar
            key={key}
            type={key}
            total={total}
            used={used}
            planned={0}
            carryOver={0}
            syncedLabel={synced}
          />
        );
      })}
    </div>
  );
}
