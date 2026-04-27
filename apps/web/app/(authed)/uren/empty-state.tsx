/**
 * Friendly empty-state for the employee week-grid when no project assignments
 * intersect the requested week. Rendered alongside the header so the user can
 * still navigate weeks (an assignment may exist in a neighbouring week).
 */
export function NoAssignmentsEmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl border p-12 text-center glass-card"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <p className="font-display" style={{ fontSize: "var(--text-title)" }}>
        Geen <em>toegewezen projecten</em>
      </p>
      <p className="max-w-md text-sm" style={{ color: "var(--fg-secondary)" }}>
        Je hebt nog geen toegewezen projecten voor deze week. Neem contact op
        met je administrator om een project gekoppeld te krijgen.
      </p>
    </div>
  );
}
