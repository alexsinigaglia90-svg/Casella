"use client";

import { Command } from "cmdk";
import { ChevronDown, Plus } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useEmployeeListCache } from "./employee-list-cache-context";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SwitcherScope } from "@/features/admin-shell/breadcrumbs/breadcrumb-context";

interface BreadcrumbTriggerProps {
  label: string;
  scope: SwitcherScope;
  currentId?: string;
}

export function BreadcrumbTrigger({ label, scope, currentId }: BreadcrumbTriggerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { employees } = useEmployeeListCache();

  function go(path: Route) {
    setOpen(false);
    router.push(path);
  }

  const filtered = employees.filter((e) => e.id !== currentId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex max-w-full items-center gap-1 truncate font-medium"
          style={{ color: scope === "current-employee" ? "var(--fg-primary)" : "var(--fg-tertiary)" }}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="size-3 shrink-0" aria-hidden style={{ color: "var(--fg-quaternary)" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        style={{
          background: "var(--surface-base)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <Command className="rounded-md">
          <Command.Input
            placeholder="Zoek medewerker…"
            className="w-full border-b bg-transparent px-3 py-2.5 text-sm outline-none placeholder:opacity-60"
            style={{ borderColor: "var(--border-subtle)", color: "var(--fg-primary)" }}
          />
          <Command.List className="max-h-72 overflow-y-auto p-1">
            <Command.Empty
              className="px-3 py-4 text-center text-sm"
              style={{ color: "var(--fg-tertiary)" }}
            >
              Geen resultaten
            </Command.Empty>
            {scope === "current-employee" && (
              <Command.Group heading="Acties">
                <Command.Item
                  onSelect={() => go("/admin/medewerkers?new=1" as Route)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm aria-selected:bg-surface-deep"
                >
                  <Plus className="size-3.5" />
                  Nieuwe aanmaken
                </Command.Item>
              </Command.Group>
            )}
            {filtered.length > 0 && (
              <Command.Group heading="Medewerkers">
                {filtered.map((e) => (
                  <Command.Item
                    key={e.id}
                    onSelect={() => go(`/admin/medewerkers/${e.id}` as Route)}
                    value={`${e.displayName} ${e.jobTitle ?? ""}`}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm aria-selected:bg-surface-deep"
                  >
                    <span className="truncate">{e.displayName}</span>
                    {e.jobTitle && (
                      <span
                        className="truncate text-xs"
                        style={{ color: "var(--fg-tertiary)" }}
                      >
                        {e.jobTitle}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
