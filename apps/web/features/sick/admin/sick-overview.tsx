export interface SickOverviewItem {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string | null;
  expectedDurationDays: number | null;
  availabilityStatus: string | null;
}

const AVAILABILITY_LABEL: Record<string, string> = {
  home: "Werkt eventueel thuis",
  unavailable: "Niet beschikbaar",
  unknown: "Onbekend",
};

export function SickOverview({ items }: { items: SickOverviewItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Geen ziekmeldingen.
      </div>
    );
  }
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-xs uppercase tracking-wider"
            style={{
              backgroundColor: "var(--surface-card)",
              color: "var(--fg-tertiary)",
            }}
          >
            <th className="px-4 py-3 font-medium">Medewerker</th>
            <th className="px-4 py-3 font-medium">Start</th>
            <th className="px-4 py-3 font-medium">Eind</th>
            <th className="px-4 py-3 font-medium">Verwachte duur</th>
            <th className="px-4 py-3 font-medium">Beschikbaarheid</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const isActive = !it.endDate;
            return (
              <tr
                key={it.id}
                className="border-t"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <td
                  className="px-4 py-3 font-medium"
                  style={{ color: "var(--fg-primary)" }}
                >
                  {it.employeeName}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--fg-secondary)" }}>
                  {it.startDate}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--fg-secondary)" }}>
                  {isActive ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        color: "rgb(239, 68, 68)",
                      }}
                    >
                      Nog ziek
                    </span>
                  ) : (
                    it.endDate
                  )}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--fg-secondary)" }}>
                  {it.expectedDurationDays
                    ? `${it.expectedDurationDays} dag(en)`
                    : "—"}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--fg-secondary)" }}>
                  {it.availabilityStatus
                    ? (AVAILABILITY_LABEL[it.availabilityStatus] ??
                      it.availabilityStatus)
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
