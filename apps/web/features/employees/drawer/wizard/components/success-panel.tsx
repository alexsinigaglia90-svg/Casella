"use client";

import { Check } from "lucide-react";
import { PrimaryButton } from "./primary-button";
import type { CreateEmployeeFormValues } from "../types";

interface SuccessPanelProps {
  form: CreateEmployeeFormValues;
  onClose: () => void;
  onReset: () => void;
}

export function SuccessPanel({ form, onClose, onReset }: SuccessPanelProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-5 p-10 text-center"
      style={{ background: "var(--surface-lift)" }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(135deg, var(--aurora-teal), var(--aurora-blue))",
          boxShadow: "0 0 0 8px rgba(61, 216, 168, 0.18)",
        }}
      >
        <Check size={28} color="#fff" strokeWidth={3} />
      </div>
      <div>
        <h2
          className="font-display mb-1"
          style={{ fontSize: "2rem", fontStyle: "italic", fontWeight: 500 }}
        >
          Uitnodiging <em>onderweg</em>
        </h2>
        <p className="max-w-sm text-sm" style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>
            {form.firstName} {form.lastName}
          </strong>{" "}
          ontvangt op{" "}
          <span className="font-mono text-xs">{form.inviteEmail}</span> een link
          om het account te activeren.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-deep"
          style={{ color: "var(--text-secondary)" }}
        >
          Terug naar lijst
        </button>
        <PrimaryButton onClick={onReset}>Nog iemand toevoegen</PrimaryButton>
      </div>
    </div>
  );
}
