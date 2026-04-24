"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { ListPrefs, Density } from "@/lib/list-prefs-cookie-shared";

interface ListTweaksDockProps {
  prefs: ListPrefs;
  onChange: (next: ListPrefs) => void;
}

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "cozy", label: "Cozy" },
  { value: "spacious", label: "Ruim" },
];

export function ListTweaksDock({ prefs, onChange }: ListTweaksDockProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-6 right-6 z-30"
      style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}
    >
      {open && (
        <div
          className="mb-2 rounded-xl border p-3"
          style={{
            background: "var(--surface-lift)",
            borderColor: "var(--border-subtle)",
            backdropFilter: "blur(20px) saturate(150%)",
            WebkitBackdropFilter: "blur(20px) saturate(150%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            minWidth: 200,
          }}
        >
          {/* Density control */}
          <p
            className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            Dichtheid
          </p>
          <div
            className="flex rounded-lg p-0.5"
            style={{ background: "var(--ink-5, rgba(0,0,0,0.06))" }}
            role="radiogroup"
            aria-label="Dichtheid"
          >
            {DENSITY_OPTIONS.map((opt) => {
              const active = prefs.density === opt.value;
              return (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange({ ...prefs, density: opt.value })}
                  className="flex-1 rounded-md py-1 text-xs font-medium transition-colors"
                  style={{
                    background: active ? "var(--surface-base)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Avatars toggle */}
          <div className="mt-3 flex items-center justify-between">
            <p
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Avatars
            </p>
            <button
              onClick={() => onChange({ ...prefs, showAvatars: !prefs.showAvatars })}
              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors"
              style={{
                background: prefs.showAvatars ? "var(--aurora-teal, #3dd8a8)20" : "var(--ink-5, rgba(0,0,0,0.06))",
                color: prefs.showAvatars ? "var(--aurora-teal, #3dd8a8)" : "var(--text-tertiary)",
              }}
              aria-pressed={prefs.showAvatars}
            >
              {prefs.showAvatars ? <Eye size={12} /> : <EyeOff size={12} />}
              {prefs.showAvatars ? "Aan" : "Uit"}
            </button>
          </div>
        </div>
      )}

      {/* Pill trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium shadow-lg transition-colors"
        style={{
          background: "var(--surface-lift)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-secondary)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}
        aria-expanded={open}
        aria-label="Weergave-opties"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          width={14}
          height={14}
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Weergave
        {open && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={10} height={10}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
      </button>
    </div>
  );
}
