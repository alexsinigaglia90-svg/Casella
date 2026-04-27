"use client";

import { Check } from "lucide-react";

import { CLIENT_STEPS } from "../types";
import type { CreateClientFormValues } from "../types";
import { isClientStepValid } from "../validation";

interface StepperProps {
  step: number;
  form: CreateClientFormValues;
  onJump: (i: number) => void;
}

export function ClientStepper({ step, form, onJump }: StepperProps) {
  return (
    <div className="flex items-center gap-1.5">
      {CLIENT_STEPS.map((s, i) => {
        const isActive = i === step;
        const isDone = i < step && isClientStepValid(i, form);
        const isReachable =
          i <= step ||
          Array.from({ length: i }, (_, n) => n).every((n) =>
            isClientStepValid(n, form),
          );

        return (
          <button
            key={s.key}
            type="button"
            disabled={!isReachable}
            onClick={() => onJump(i)}
            className="group flex flex-1 flex-col items-start gap-1.5 text-left transition-opacity"
            style={{
              opacity: isReachable ? 1 : 0.45,
              cursor: isReachable ? "pointer" : "not-allowed",
            }}
          >
            <div className="flex w-full items-center gap-2">
              <StepDot active={isActive} done={isDone} index={i} />
              <span
                className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wider"
                style={{
                  color: isActive ? "var(--fg-primary)" : "var(--fg-tertiary)",
                }}
              >
                {s.label}
              </span>
            </div>
            <div
              className="h-[3px] w-full overflow-hidden rounded-full"
              style={{ background: "var(--ink-5)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: isDone ? "100%" : isActive ? "40%" : "0%",
                  background: isActive
                    ? "linear-gradient(90deg, var(--aurora-violet), var(--aurora-blue))"
                    : isDone
                      ? "var(--aurora-teal)"
                      : "transparent",
                  transitionDuration: "500ms",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StepDot({
  active,
  done,
  index,
}: {
  active: boolean;
  done: boolean;
  index: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-mono text-[10px] transition-all"
      style={{
        width: 20,
        height: 20,
        background: done
          ? "var(--aurora-teal)"
          : active
            ? "var(--aurora-violet)"
            : "transparent",
        border: !done && !active ? "1.5px solid var(--ink-4)" : "none",
        color: done || active ? "#fff" : "var(--fg-tertiary)",
        boxShadow: active ? "0 0 0 4px rgba(123, 92, 255, 0.18)" : "none",
      }}
    >
      {done ? <Check size={11} strokeWidth={3} /> : index + 1}
    </div>
  );
}
