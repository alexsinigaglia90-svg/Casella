"use client";

import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { useBreadcrumbCtx } from "./breadcrumb-context";

export function BreadcrumbTrail() {
  const { crumbs } = useBreadcrumbCtx();
  const trail = [{ label: "Admin", href: "/admin/dashboard" }, ...crumbs];

  return (
    <nav
      aria-label="Breadcrumbs"
      className="flex min-w-0 items-center gap-1 overflow-hidden text-sm"
    >
      {trail.map((c, i) => {
        const isLast = i === trail.length - 1;
        return (
          <div key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
            {i > 0 && (
              <ChevronRight
                className="size-3 shrink-0"
                style={{ color: "var(--fg-quaternary)" }}
                aria-hidden
              />
            )}
            {c.href && !isLast ? (
              <Link
                href={c.href as Route}
                className="truncate hover:underline"
                style={{ color: "var(--fg-tertiary)" }}
              >
                {c.label}
              </Link>
            ) : (
              <span
                className="truncate font-medium"
                style={{ color: "var(--fg-primary)" }}
                aria-current={isLast ? "page" : undefined}
              >
                {c.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
