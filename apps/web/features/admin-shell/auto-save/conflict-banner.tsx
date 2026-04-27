"use client";

interface Props {
  onReload: () => void;
}

/**
 * Inline banner shown above the wizard step content when the server returns
 * 409 from the auto-save PATCH. The reload CTA hands control back to the
 * caller (typically `router.refresh()`), so server data is re-fetched while
 * the user's pending local edits stay in place — they can re-apply manually
 * once they have seen the latest server version.
 */
export function ConflictBanner({ onReload }: Props) {
  return (
    <div
      className="rounded-md p-3 text-sm"
      style={{
        border: "1px solid var(--status-attention, var(--accent-coral))",
        background:
          "color-mix(in oklch, var(--status-attention, var(--accent-coral)) 8%, transparent)",
      }}
    >
      <p
        className="font-medium"
        style={{ color: "var(--status-attention, var(--accent-coral))" }}
      >
        Een andere sessie heeft deze medewerker aangepast.
      </p>
      <p className="mt-1" style={{ color: "var(--fg-secondary)" }}>
        Herlaad om verder te bewerken — je lokale invoer blijft staan, maar je
        ziet de meest recente versie.
      </p>
      <button
        type="button"
        onClick={onReload}
        className="mt-2 inline-flex h-7 items-center rounded-md px-3 text-xs font-medium transition-colors hover:bg-surface-lift"
        style={{
          border: "1px solid var(--border-subtle)",
          color: "var(--fg-secondary)",
        }}
      >
        Herlaad
      </button>
    </div>
  );
}
