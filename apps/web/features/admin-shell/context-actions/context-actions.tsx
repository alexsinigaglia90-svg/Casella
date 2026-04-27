"use client";

import { MoreHorizontal } from "lucide-react";

import { useTopBarActionsCtx } from "./context-actions-context";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ContextActions() {
  const { actions } = useTopBarActionsCtx();
  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {actions.map((action, i) => {
        if (action.kind === "primary") {
          const Icon = action.icon;
          return (
            <button
              key={`primary-${i}`}
              type="button"
              onClick={action.onClick}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{
                background: "var(--aurora-violet, #7b5cff)",
                boxShadow: "0 2px 12px var(--glow-violet, rgba(123,92,255,0.35))",
              }}
            >
              {Icon ? <Icon size={13} /> : null}
              {action.label}
              {action.shortcut ? (
                <kbd
                  className="ml-1 rounded px-1 py-0.5 font-mono text-[10px]"
                  style={{ background: "rgba(255,255,255,0.18)" }}
                >
                  {action.shortcut}
                </kbd>
              ) : null}
            </button>
          );
        }
        if (action.kind === "secondary") {
          const Icon = action.icon;
          return (
            <button
              key={`secondary-${i}`}
              type="button"
              onClick={action.onClick}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors hover:bg-surface-lift"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--fg-secondary)",
              }}
            >
              {Icon ? <Icon size={13} /> : null}
              {action.label}
            </button>
          );
        }
        return (
          <DropdownMenu key={`kebab-${i}`}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-surface-lift"
                style={{ color: "var(--fg-secondary)" }}
                aria-label="Meer acties"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {action.items.map((item, j) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={`kebab-${i}-${j}`}
                    onSelect={item.onClick}
                    style={item.destructive ? { color: "var(--status-danger)" } : undefined}
                  >
                    {Icon ? <Icon size={14} className="mr-2" /> : null}
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}
