"use client";

import { ApproveCard, type LeaveQueueItem } from "./approve-card";

export function LeaveQueue({ items }: { items: LeaveQueueItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Geen openstaande verlofaanvragen.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <ApproveCard key={it.id} item={it} />
      ))}
    </div>
  );
}
