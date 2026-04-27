interface BonusSummaryProps {
  year: number;
  ytdAccrualCents: number;
  ytdPaidCents: number;
  outstandingCents: number;
}

function formatEur(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  return `${sign}€ ${(abs / 100).toFixed(2).replace(".", ",")}`;
}

export function BonusSummary({
  year,
  ytdAccrualCents,
  ytdPaidCents,
  outstandingCents,
}: BonusSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SummaryCard
        label={`YTD opgebouwd (${year})`}
        value={formatEur(ytdAccrualCents)}
        accent="violet"
      />
      <SummaryCard
        label="YTD uitbetaald"
        value={formatEur(ytdPaidCents)}
        accent="muted"
      />
      <SummaryCard
        label="Openstaand"
        value={formatEur(outstandingCents)}
        accent="violet"
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "violet" | "muted";
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor:
          accent === "violet"
            ? "var(--aurora-violet)"
            : "var(--border-subtle)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <p
        className="text-xs uppercase tracking-wide"
        style={{ color: "var(--fg-tertiary)" }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-semibold tabular-nums"
        style={{
          color:
            accent === "violet"
              ? "var(--aurora-violet)"
              : "var(--fg-primary)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
