"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { addDays, formatDateIso, getMondayIso } from "./date-utils";

interface WeekPickerProps {
  weekStart: string;
  rangeLabel: string;
}

export function WeekPicker({ weekStart, rangeLabel }: WeekPickerProps) {
  const router = useRouter();

  function navigate(targetIso: string) {
    router.push(`/uren?week=${targetIso}` as Route);
  }

  function onPrev() {
    navigate(formatDateIso(addDays(new Date(weekStart), -7)));
  }
  function onNext() {
    navigate(formatDateIso(addDays(new Date(weekStart), 7)));
  }
  function onToday() {
    navigate(getMondayIso(new Date()));
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-md border p-1"
      style={{ borderColor: "var(--border-subtle)", background: "var(--surface-lift)" }}
    >
      <button
        onClick={onPrev}
        aria-label="Vorige week"
        className="rounded p-1.5 transition-colors hover:bg-surface-base"
        style={{ color: "var(--fg-secondary)" }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={onToday}
        className="rounded px-3 py-1 text-xs font-medium transition-colors hover:bg-surface-base"
        style={{ color: "var(--fg-secondary)" }}
      >
        Vandaag
      </button>
      <button
        onClick={onNext}
        aria-label="Volgende week"
        className="rounded p-1.5 transition-colors hover:bg-surface-base"
        style={{ color: "var(--fg-secondary)" }}
      >
        <ChevronRight size={16} />
      </button>
      <span
        className="ml-2 mr-1 text-sm font-medium tabular-nums"
        style={{ color: "var(--fg-primary)" }}
      >
        {rangeLabel}
      </span>
    </div>
  );
}
