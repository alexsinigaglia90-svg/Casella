"use client";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/use-theme";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

const OPTIONS = [
  { value: "light" as const, label: "Licht", icon: Sun },
  { value: "dark" as const, label: "Donker", icon: Moon },
  { value: "system" as const, label: "Systeem", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIdx = OPTIONS.findIndex((opt) => opt.value === theme);
      let nextIdx: number | null = null;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIdx = (currentIdx + 1) % OPTIONS.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIdx = (currentIdx - 1 + OPTIONS.length) % OPTIONS.length;
          break;
        case "Home":
          nextIdx = 0;
          break;
        case "End":
          nextIdx = OPTIONS.length - 1;
          break;
        default:
          return;
      }

      if (nextIdx !== null) {
        e.preventDefault();
        const nextTheme = OPTIONS[nextIdx]?.value;
        if (nextTheme) {
          setTheme(nextTheme);
          // Focus the button after state updates
          setTimeout(() => {
            const btn = e.currentTarget?.querySelector<HTMLButtonElement>(
              `[data-theme-value="${nextTheme}"]`
            );
            btn?.focus();
          }, 0);
        }
      }
    },
    [theme, setTheme]
  );

  return (
    <div
      role="radiogroup"
      aria-label="Thema"
      className="flex gap-1 rounded-lg bg-surface-deep p-1"
      onKeyDown={handleKeyDown}
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            onClick={() => setTheme(opt.value)}
            data-theme-value={opt.value}
            tabIndex={active ? 0 : -1}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-standard ease-standard",
              active
                ? "bg-surface-base text-fg-primary shadow-sm"
                : "text-fg-tertiary hover:text-fg-secondary"
            )}
            aria-checked={active}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
