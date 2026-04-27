"use client";

export interface ConflictAlternative {
  employeeId: string;
  employeeName: string;
  roleLabel: string | null;
  freeHours: number;
}

interface ConflictPopoverProps {
  /** When null, popover is hidden. */
  open: boolean;
  blockId: string | null;
  /** Top-3 alternative employees with most free hours in the overlapping window. */
  alternatives: ConflictAlternative[];
  /** Current overcapacity percentage (>100 means overbooked). */
  utilisationPct: number;
  onAssignAlternative: (employeeId: string) => void;
  onAcceptOverbook: () => void;
  onRevert: () => void;
}

const CSS = `
  @keyframes conflict-pop-in {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to { opacity: 1; transform: none; }
  }
`;

export function ConflictPopover({
  open,
  blockId,
  alternatives,
  utilisationPct,
  onAssignAlternative,
  onAcceptOverbook,
  onRevert,
}: ConflictPopoverProps) {
  if (!open || !blockId) return null;

  return (
    <>
      <style>{CSS}</style>
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="conflict-popover-title"
        style={{
          position: "fixed",
          right: 24,
          bottom: 80,
          zIndex: 50,
          width: 320,
          padding: 14,
          borderRadius: 12,
          background: "var(--surface-lift)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          animation: "conflict-pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <div
            id="conflict-popover-title"
            className="font-display text-[14px]"
            style={{ color: "var(--fg-primary)" }}
          >
            Over<em>capaciteit</em>
          </div>
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[10px]"
            style={{
              background: "var(--status-danger)",
              color: "var(--surface-base)",
            }}
          >
            {utilisationPct}%
          </span>
        </div>

        <p
          className="mb-3 text-[12px]"
          style={{ color: "var(--fg-secondary)" }}
        >
          Deze toewijzing duwt de planning over 100%. Verplaats naar een
          collega met vrije uren, accepteer toch, of zet hem terug.
        </p>

        {alternatives.length > 0 && (
          <div className="mb-3 space-y-1.5">
            <div
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: "var(--fg-tertiary)" }}
            >
              Alternatieven
            </div>
            {alternatives.map((alt) => (
              <button
                key={alt.employeeId}
                type="button"
                onClick={() => onAssignAlternative(alt.employeeId)}
                className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left transition-colors"
                style={{
                  background: "var(--surface-base)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="min-w-0">
                  <div
                    className="truncate text-[12px] font-medium"
                    style={{ color: "var(--fg-primary)" }}
                  >
                    {alt.employeeName}
                  </div>
                  <div
                    className="truncate text-[10px]"
                    style={{ color: "var(--fg-tertiary)" }}
                  >
                    {alt.roleLabel ?? "—"} · {alt.freeHours}u vrij
                  </div>
                </div>
                <span
                  className="font-mono text-[10px]"
                  style={{ color: "var(--aurora-violet)" }}
                >
                  Verplaats →
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAcceptOverbook}
            className="flex-1 rounded px-3 py-1.5 text-[11px] font-medium transition-colors"
            style={{
              background: "var(--surface-base)",
              border: "1px solid var(--border-subtle)",
              color: "var(--fg-primary)",
            }}
          >
            Toch toewijzen
          </button>
          <button
            type="button"
            onClick={onRevert}
            className="flex-1 rounded px-3 py-1.5 text-[11px] font-medium transition-colors"
            style={{
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              color: "var(--fg-secondary)",
            }}
          >
            Annuleer
          </button>
        </div>
      </div>
    </>
  );
}
