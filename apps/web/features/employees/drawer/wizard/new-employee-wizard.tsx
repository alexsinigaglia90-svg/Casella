"use client";

import { useState, useMemo, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { AddressInput as AddressInputValue } from "@casella/types";
import type { PdokAddress } from "@casella/maps";

import { STEPS, emptyForm } from "./types";
import type { CreateEmployeeFormValues } from "./types";
import { validateStep, isStepValid } from "./validation";
import { deriveFirstFromEmail, deriveLastFromEmail } from "./helpers/derive-name";

import { Stepper } from "./components/stepper";
import { KbdHint } from "./components/kbd-hint";
import { PrimaryButton } from "./components/primary-button";
import { Spinner } from "./components/spinner";
import { SuccessPanel } from "./components/success-panel";
import { StepWie } from "./steps/step-wie";
import { StepDienstverband } from "./steps/step-dienstverband";
import { StepVergoeding } from "./steps/step-vergoeding";
import { StepUitnodigen } from "./steps/step-uitnodigen";

function toAddressInput(addr: PdokAddress | null): AddressInputValue | null {
  if (!addr) return null;
  return {
    pdokId: addr.id,
    street: addr.street,
    houseNumber: addr.houseNumber,
    houseNumberAddition: addr.houseNumberAddition,
    postalCode: addr.postalCode,
    city: addr.city,
    municipality: addr.municipality,
    province: addr.province,
    country: addr.country,
    lat: addr.lat,
    lng: addr.lng,
    rdX: addr.rdX,
    rdY: addr.rdY,
    fullDisplay: addr.fullDisplay,
  };
}

interface NewEmployeeWizardProps {
  onClose: () => void;
  form: CreateEmployeeFormValues;
  setForm: Dispatch<SetStateAction<CreateEmployeeFormValues>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
}

export function NewEmployeeWizard({
  onClose,
  form,
  setForm,
  step,
  setStep,
}: NewEmployeeWizardProps) {
  const router = useRouter();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoFillHint, setAutoFillHint] = useState<string[] | null>(null);
  const autoFillTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const errors = useMemo(() => validateStep(step, form), [step, form]);
  const stepValid = Object.keys(errors).length === 0;
  const canSubmit = [0, 1, 2].every((s) => isStepValid(s, form));

  function update(patch: Partial<CreateEmployeeFormValues>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function setTouch(key: string) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function setAllTouched() {
    const all: Record<string, boolean> = {};
    Object.keys(errors).forEach((k) => (all[k] = true));
    setTouched((t) => ({ ...t, ...all }));
  }

  function onEmailBlur() {
    if (!form.inviteEmail) return;
    const patch: Partial<CreateEmployeeFormValues> = {};
    if (!form.firstName.trim()) {
      const f = deriveFirstFromEmail(form.inviteEmail);
      if (f) patch.firstName = f;
    }
    if (!form.lastName.trim()) {
      const l = deriveLastFromEmail(form.inviteEmail);
      if (l) patch.lastName = l;
    }
    if (Object.keys(patch).length) {
      update(patch);
      setAutoFillHint(Object.keys(patch));
      clearTimeout(autoFillTimerRef.current);
      autoFillTimerRef.current = setTimeout(() => setAutoFillHint(null), 3200);
    }
  }

  function goNext() {
    if (step < STEPS.length - 1) {
      if (stepValid) {
        setStep((s) => s + 1);
        setTouched({});
      } else {
        setAllTouched();
      }
    }
  }

  function goPrev() {
    if (step > 0) {
      setStep((s) => s - 1);
      setTouched({});
    }
  }

  function goToStep(i: number) {
    if (i <= step) {
      setStep(i);
      setTouched({});
      return;
    }
    const allPriorValid = Array.from({ length: i }, (_, n) => n).every((n) =>
      isStepValid(n, form),
    );
    if (allPriorValid) {
      setStep(i);
      setTouched({});
    }
  }

  async function submit() {
    if (!canSubmit) {
      setAllTouched();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          inviteEmail: form.inviteEmail,
          phone: form.phone,
          jobTitle: form.jobTitle,
          startDate: form.startDate,
          contractedHoursPerWeek: form.contractedHours,
          defaultKmRateCents: form.kmRateCents,
          compensationType: form.compensationType,
          homeAddress: toAddressInput(form.address),
          emergencyContactName: form.emergencyName,
          emergencyContactPhone: form.emergencyPhone || undefined,
          notes: form.notes || undefined,
          nmbrsEmployeeId: undefined,
          managerId: undefined, // TODO 1.1b: replace dummy manager with real UUID
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
      setSubmitted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aanmaken mislukt");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(emptyForm());
    setStep(0);
    setSubmitted(false);
    setTouched({});
  }

  // Cleanup autofill timer on unmount
  useEffect(() => () => clearTimeout(autoFillTimerRef.current), []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (step === STEPS.length - 1) void submit();
        else goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form]);

  if (submitted) {
    return <SuccessPanel form={form} onClose={onClose} onReset={handleReset} />;
  }

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: "var(--surface-lift)" }}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-4 px-8 pt-7 pb-5">
        <div className="min-w-0 flex-1">
          <div
            className="mb-1 text-[10px] font-mono uppercase tracking-[0.15em]"
            style={{ color: "var(--fg-tertiary)" }}
          >
            {(STEPS as readonly (typeof STEPS)[number][])[step]!.kicker} / {STEPS.length}
          </div>
          <h2
            className="font-display whitespace-nowrap"
            style={{ fontSize: "1.6rem", lineHeight: 1.1 }}
          >
            <span style={{ fontStyle: "normal", fontWeight: 500 }}>Nieuwe </span>
            <em style={{ fontWeight: 400 }}>collega</em>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-full p-2 transition-colors hover:bg-surface-deep"
          style={{ color: "var(--fg-secondary)" }}
          aria-label="Sluiten"
        >
          <X size={18} />
        </button>
      </header>

      {/* Stepper */}
      <div className="px-8 pb-6">
        <Stepper step={step} form={form} onJump={goToStep} />
      </div>

      {/* Scrollable step content — key forces remount on step change.
          min-h-0 is critical: flex children default to min-height:auto which
          breaks overflow-y-auto inside flex-col parents. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-6" key={`step-${step}`}>
        <div className="mb-6 step-enter">
          <h3
            className="font-display mb-1"
            style={{
              fontSize: "1.35rem",
              lineHeight: 1.2,
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            {(STEPS as readonly (typeof STEPS)[number][])[step]!.title}
          </h3>
          <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
            {(STEPS as readonly (typeof STEPS)[number][])[step]!.sub}
          </p>
        </div>

        <div className="step-enter" style={{ animationDelay: "60ms" }}>
          {step === 0 && (
            <StepWie
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
              onEmailBlur={onEmailBlur}
              autoFillHint={autoFillHint}
            />
          )}
          {step === 1 && (
            <StepDienstverband
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
            />
          )}
          {step === 2 && (
            <StepVergoeding
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
            />
          )}
          {step === 3 && <StepUitnodigen form={form} onJump={goToStep} />}
        </div>
      </div>

      {/* Footer */}
      <footer
        className="flex items-center justify-between gap-3 border-t px-8 py-4"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-lift)",
        }}
      >
        <div
          className="flex items-center gap-3 text-xs"
          style={{ color: "var(--fg-tertiary)" }}
        >
          <KbdHint k="Esc" label="Sluit" />
          <KbdHint
            k="⌘ ↵"
            label={step === STEPS.length - 1 ? "Versturen" : "Volgende"}
          />
        </div>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-deep"
              style={{ color: "var(--fg-secondary)" }}
            >
              ← Terug
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <PrimaryButton onClick={goNext} disabled={!stepValid}>
              Volgende →
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={() => void submit()}
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Uitnodigen…
                </span>
              ) : (
                <>Stuur uitnodiging ✦</>
              )}
            </PrimaryButton>
          )}
        </div>
      </footer>
    </div>
  );
}
