"use client";

import Link from "next/link";
import type { Route } from "next";
import { AlertCircle } from "lucide-react";

interface ActionItem {
  label: string;
  href: string;
}

interface Props {
  items: ActionItem[];
}

export function ActionStrip({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--surface-base)", borderColor: "var(--border-subtle)" }}
    >
      <p className="text-xs font-medium mb-3" style={{ color: "var(--fg-secondary)" }}>
        Vereist aandacht
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href as Route}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors hover:bg-surface-lift"
            style={{
              borderColor: "var(--status-danger)",
              color: "var(--fg-primary)",
            }}
          >
            <AlertCircle className="h-3.5 w-3.5" style={{ color: "var(--status-danger)" }} />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
