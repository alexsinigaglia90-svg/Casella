"use client";

import type { EmployeeWithAddress, UpdateEmployeeInput } from "@casella/types";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";

import { KbdHint } from "./components/kbd-hint";
import { PrimaryButton } from "./components/primary-button";
import { Spinner } from "./components/spinner";
import { Stepper } from "./components/stepper";
import { SuccessPanel } from "./components/success-panel";
import { deriveFirstFromEmail, deriveLastFromEmail } from "./helpers/derive-name";
import {
  diffForm,
  employeeToForm,
  pdokAddressToAddressInput,
} from "./helpers/employee-mapping";
import { StepDienstverband } from "./steps/step-dienstverband";
import { StepUitnodigen } from "./steps/step-uitnodigen";
import { StepVergoeding } from "./steps/step-vergoeding";
import { StepWie } from "./steps/step-wie";
import type { CreateEmployeeFormValues } from "./types";
import { STEPS, emptyForm } from "./types";
import { validateStep, isStepValid } from "./validation";
import { WizardDiffView } from "./wizard-diff-view";

import { ConflictBanner } from "@/features/admin-shell/auto-save/conflict-banner";
import { SavedIndicator } from "@/features/admin-shell/auto-save/saved-indicator";
import { useAutoSave } from "@/features/admin-shell/auto-save/use-auto-save";

type EmployeePatch = Omit<Partial<UpdateEmployeeInput>, "id">;

type CreateModeProps = {
  mode: "create";
  onClose: () => void;
  form: CreateEmployeeFormValues;
  setForm: Dispatch<SetStateAction<CreateEmployeeFormValues>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
};

type EditModeProps = {
  mode: "edit";
  employee: EmployeeWithAddress;
  onClose: () => void;
  onSaved?: () => void;
};

export type EmployeeWizardProps = CreateModeProps | EditModeProps;

const EDIT_STEPS = [
  STEPS[0],
  STEPS[1],
  STEPS[2],
  {
    key: "wijzigingen",
    label: "Check",
    kicker: "Stap 4",
    title: "Wijzigingen",
    sub: "Controleer voor opslaan.",
  },
] as const;

export function EmployeeWizard(props: EmployeeWizardProps) {
  if (props.mode === "create") {
    return <CreateWizard {...props} />;
  }
  return <EditWizard {...props} />;
}

// ---------------------------------------------------------------------------
// Create-mode: state is lifted to the drawer (so LivePreviewCard can read it)
// ---------------------------------------------------------------------------

function CreateWizard({
  onClose,
  form,
  setForm,
  step,
  setStep,
}: CreateModeProps) {
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
          homeAddress: pdokAddressToAddressInput(form.address),
          emergencyContactName: form.emergencyName,
          emergencyContactPhone: form.emergencyPhone || undefined,
          notes: form.notes || undefined,
          nmbrsEmployeeId: undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
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
            STAP {step + 1} / {STEPS.length} · {(STEPS as readonly (typeof STEPS)[number][])[step]!.label}
          </div>
          <h2
            className="font-display whitespace-nowrap"
            style={{ fontSize: "1.6rem", lineHeight: 1.1 }}
          >
            <span style={{ fontStyle: "normal", fontWeight: 500 }}>Nieuwe </span>
            <em style={{ fontWeight: 400 }}>medewerker</em>
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

// ---------------------------------------------------------------------------
// Edit-mode: owns its own form state, seeded from the fetched employee.
// Submit sends a sparse PATCH (only-dirty fields).
// ---------------------------------------------------------------------------

function EditWizard({ employee, onClose, onSaved }: EditModeProps) {
  const router = useRouter();
  const initialForm = useMemo(() => employeeToForm(employee), [employee]);
  const [form, setForm] = useState<CreateEmployeeFormValues>(initialForm);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => validateStep(step, form), [step, form]);
  const stepValid = Object.keys(errors).length === 0;

  const dirtyPatch = useMemo(() => diffForm(initialForm, form), [initialForm, form]);
  const hasChanges = Object.keys(dirtyPatch).length > 0;

  // Auto-save: debounce 2s, dirty-only PATCH against the lastSaved snapshot
  // owned by the hook (NOT against `initialForm`), so each round-trip resets
  // the baseline and we never re-send the same diff.
  const computePatch = useCallback(
    (current: CreateEmployeeFormValues, lastSaved: CreateEmployeeFormValues): EmployeePatch | null => {
      const dirty = diffForm(lastSaved, current);
      return Object.keys(dirty).length > 0 ? dirty : null;
    },
    [],
  );

  const { state: saveState, markSaved } = useAutoSave<CreateEmployeeFormValues, EmployeePatch>({
    data: form,
    enabled: true,
    ifMatch: employee.updatedAt,
    delay: 2000,
    endpoint: `/api/admin/employees/${employee.id}`,
    computePatch,
  });

  const headerName = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const headerTitle = headerName || "Medewerker";

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

  function goNext() {
    if (step < EDIT_STEPS.length - 1) {
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
    // In edit mode every step is reachable — fields are pre-filled and the
    // saved record is already valid, so admins can jump freely.
    setStep(i);
    setTouched({});
  }

  async function submit() {
    if (!hasChanges) {
      toast.info("Geen wijzigingen om op te slaan.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "If-Match": employee.updatedAt,
        },
        body: JSON.stringify(dirtyPatch),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      // Sync the auto-save baseline so the indicator reflects the manual save
      // and the hook does not re-send the same diff on the next tick.
      markSaved(form);
      router.refresh();
      onSaved?.();
      toast.success("Wijzigingen opgeslagen.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setSubmitting(false);
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (step === EDIT_STEPS.length - 1) void submit();
        else goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form, hasChanges]);

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
            STAP {step + 1} / {EDIT_STEPS.length} · {EDIT_STEPS[step]!.label}
          </div>
          <h2
            className="font-display whitespace-nowrap"
            style={{ fontSize: "1.6rem", lineHeight: 1.1 }}
          >
            <span style={{ fontStyle: "normal", fontWeight: 500 }}>{headerTitle} </span>
            <em style={{ fontWeight: 400 }}>bewerken</em>
          </h2>
          <div className="mt-1.5">
            <SavedIndicator state={saveState} />
          </div>
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

      {/* Scrollable step content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-6" key={`edit-step-${step}`}>
        {saveState.status === "conflict" && (
          <div className="mb-4">
            <ConflictBanner onReload={() => router.refresh()} />
          </div>
        )}
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
            {EDIT_STEPS[step]!.title}
          </h3>
          <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
            {EDIT_STEPS[step]!.sub}
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
              onEmailBlur={() => {}}
              autoFillHint={null}
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
          {step === 3 && <WizardDiffView initial={initialForm} current={form} />}
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
            label={step === EDIT_STEPS.length - 1 ? "Opslaan" : "Volgende"}
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
          {step < EDIT_STEPS.length - 1 ? (
            <PrimaryButton onClick={goNext} disabled={!stepValid}>
              Volgende →
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={() => void submit()}
              disabled={!hasChanges || submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Opslaan…
                </span>
              ) : (
                <>Opslaan</>
              )}
            </PrimaryButton>
          )}
        </div>
      </footer>
    </div>
  );
}
