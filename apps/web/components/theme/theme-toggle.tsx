"use client";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/use-theme";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light" as const, label: "Licht", icon: Sun },
  { value: "dark" as const, label: "Donker", icon: Moon },
  { value: "system" as const, label: "Systeem", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Thema"
      className="flex gap-1 rounded-lg bg-surface-deep p-1"
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
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-standard ease-standard",
              active
                ? "bg-surface-base text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
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
