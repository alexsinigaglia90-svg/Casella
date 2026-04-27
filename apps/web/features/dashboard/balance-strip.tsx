interface Props {
  vacationHoursRemaining: number | null;
  bonusYtdCents: number;
}

function formatEur(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function Card({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl border p-4 flex-1"
      style={{ background: "var(--surface-base)", borderColor: "var(--border-subtle)" }}
    >
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--fg-tertiary)" }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: "var(--fg-primary)" }}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs" style={{ color: "var(--fg-tertiary)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function BalanceStrip({ vacationHoursRemaining, bonusYtdCents }: Props) {
  const vacationDisplay =
    vacationHoursRemaining !== null ? `${vacationHoursRemaining}u` : "—";

  return (
    <div className="flex gap-4">
      <Card
        label="Vakantiesaldo"
        value={vacationDisplay}
        sub={vacationHoursRemaining === null ? "Nmbrs koppeling in productie" : "resterend"}
      />
      <Card
        label="Bonus YTD"
        value={formatEur(bonusYtdCents)}
        sub="opgebouwd dit jaar"
      />
    </div>
  );
}
