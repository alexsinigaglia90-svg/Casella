import type { AnomalyRow } from "@/lib/hours/anomalies";

export function AnomalyBanner({ anomalies }: { anomalies: AnomalyRow[] }) {
  if (anomalies.length === 0) return null;
  return (
    <div
      className="mb-6 rounded-lg p-4"
      style={{
        background:
          "color-mix(in oklch, var(--status-attention) 10%, transparent)",
        border:
          "1px solid color-mix(in oklch, var(--status-attention) 35%, transparent)",
      }}
    >
      <h3
        className="mb-2 text-sm font-semibold"
        style={{ color: "var(--status-attention)" }}
      >
        ⚠ {anomalies.length}{" "}
        {anomalies.length === 1
          ? "afwijkend patroon"
          : "afwijkende patronen"}{" "}
        gedetecteerd
      </h3>
      <ul
        className="space-y-1 text-sm"
        style={{ color: "var(--fg-secondary)" }}
      >
        {anomalies.map((a) => (
          <li key={a.employeeId}>
            <strong style={{ color: "var(--fg-primary)" }}>
              {a.employeeName}
            </strong>{" "}
            — {a.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
