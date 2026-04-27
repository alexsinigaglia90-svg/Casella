"use client";

import { Star } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PinRow {
  entityType: string;
  entityId: string;
  createdAt: string;
  employeeFirstName: string | null;
  employeeLastName: string | null;
}

export function FavoritesSection() {
  const [pins, setPins] = useState<PinRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/pins?entityType=employee")
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) setLoaded(true);
          return;
        }
        const data = (await r.json()) as PinRow[];
        if (!cancelled) {
          setPins(Array.isArray(data) ? data : []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || pins.length === 0) return null;

  const visible = pins.slice(0, 5);
  const overflow = pins.length - visible.length;

  return (
    <section className="mt-2">
      <h3
        className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider"
        style={{ color: "var(--fg-quaternary)" }}
      >
        <Star className="size-3" /> Favorieten
      </h3>
      <ul className="space-y-0.5">
        {visible.map((p) => {
          const name =
            [p.employeeFirstName, p.employeeLastName].filter(Boolean).join(" ") ||
            "Medewerker";
          return (
            <li key={p.entityId}>
              <Link
                href={`/admin/medewerkers/${p.entityId}` as Route}
                className="flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors hover:bg-surface-lift"
                style={{ color: "var(--fg-secondary)" }}
              >
                {name}
              </Link>
            </li>
          );
        })}
        {overflow > 0 && (
          <li
            className="px-3 py-1.5 text-xs"
            style={{ color: "var(--fg-tertiary)" }}
          >
            +{overflow} meer
          </li>
        )}
      </ul>
    </section>
  );
}
