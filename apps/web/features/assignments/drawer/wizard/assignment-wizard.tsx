"use client";

import type {
  AssignmentEnriched,
  CompensationType,
  UpdateAssignmentInput,
} from "@casella/types";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";

import { AssignmentDiffView } from "./assignment-diff-view";
import { AssignmentStepper } from "./components/assignment-stepper";
import {
  assignmentToForm,
  diffAssignmentForm,
} from "./helpers/assignment-mapping";
import { StepToewijzing } from "./steps/step-toewijzing";
import { StepVergoeding } from "./steps/step-vergoeding";
import type { CreateAssignmentFormValues } from "./types";
import { ASSIGNMENT_STEPS, emptyAssignmentForm } from "./types";
import {
  isAssignmentStepValid,
  validateAssignmentStep,
} from "./validation";

import type {
  EmployeePickerOption,
  ProjectPickerOption,
} from "@/app/(admin)/admin/toewijzingen/queries";
import { ConflictBanner } from "@/features/admin-shell/auto-save/conflict-banner";
import { SavedIndicator } from "@/features/admin-shell/auto-save/saved-indicator";
import { useAutoSave } from "@/features/admin-shell/auto-save/use-auto-save";
import { KbdHint } from "@/features/employees/drawer/wizard/components/kbd-hint";
import { PrimaryButton } from "@/features/employees/drawer/wizard/components/primary-button";
import { Spinner } from "@/features/employees/drawer/wizard/components/spinner";

type AssignmentPatch = Omit<Partial<UpdateAssignmentInput>, "id">;

type CreateModeProps = {
  mode: "create";
  onClose: () => void;
  form: CreateAssignmentFormValues;
  setForm: Dispatch<SetStateAction<CreateAssignmentFormValues>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  projects: ProjectPickerOption[];
  employees: EmployeePickerOption[];
};

type EditModeProps = {
  mode: "edit";
  assignment: AssignmentEnriched;
  projects: ProjectPickerOption[];
  employees: EmployeePickerOption[];
  onClose: () => void;
  onSaved?: () => void;
};

export type AssignmentWizardProps = CreateModeProps | EditModeProps;

const EDIT_STEPS = [
  ASSIGNMENT_STEPS[0],
  ASSIGNMENT_STEPS[1],
  {
    key: "wijzigingen",
    label: "Check",
    kicker: "Stap 3",
    title: "Wijzigingen",
    sub: "Controleer voor opslaan.",
  },
] as const;

export function AssignmentWizard(props: AssignmentWizardProps) {
  if (props.mode === "create") return <CreateAssignmentWizard {...props} />;
  return <EditAssignmentWizard {...props} />;
}

// ---------------------------------------------------------------------------
// Create-mode
// ---------------------------------------------------------------------------

function CreateAssignmentWizard({
  onClose,
  form,
  setForm,
  step,
  setStep,
  projects,
  employees,
}: CreateModeProps) {
  const router = useRouter();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(
    () => validateAssignmentStep(step, form),
    [step, form],
  );
  const stepValid = Object.keys(errors).length === 0;
  const canSubmit = [0, 1].every((s) => isAssignmentStepValid(s, form));

  function update(patch: Partial<CreateAssignmentFormValues>) {
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
    if (step < ASSIGNMENT_STEPS.length - 1) {
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
      isAssignmentStepValid(n, form),
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
      const compensationType: CompensationType | null =
        form.compensationType === ""
          ? null
          : (form.compensationType as CompensationType);
      const kmRateCents =
        form.kmRateCents === "" ? null : Number(form.kmRateCents);

      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.projectId,
          employeeId: form.employeeId,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          kmRateCents,
          compensationType,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      toast.success("Toewijzing aangemaakt.");
      setForm(emptyAssignmentForm());
      setStep(0);
      router.refresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aanmaken mislukt");
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
        if (step === ASSIGNMENT_STEPS.length - 1) void submit();
        else goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form]);

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
            {ASSIGNMENT_STEPS[step]!.kicker} / {ASSIGNMENT_STEPS.length}
          </div>
          <h2
            className="font-display whitespace-nowrap"
            style={{ fontSize: "1.6rem", lineHeight: 1.1 }}
          >
            <span style={{ fontStyle: "normal", fontWeight: 500 }}>Nieuwe </span>
            <em style={{ fontWeight: 400 }}>toewijzing</em>
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
        <AssignmentStepper step={step} form={form} onJump={goToStep} />
      </div>

      {/* Step content */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-8 pb-6"
        key={`step-${step}`}
      >
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
            {ASSIGNMENT_STEPS[step]!.title}
          </h3>
          <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
            {ASSIGNMENT_STEPS[step]!.sub}
          </p>
        </div>

        <div className="step-enter" style={{ animationDelay: "60ms" }}>
          {step === 0 && (
            <StepToewijzing
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
              projects={projects}
              employees={employees}
            />
          )}
          {step === 1 && (
            <StepVergoeding
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
              projects={projects}
              employees={employees}
              onJump={goToStep}
            />
          )}
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
            label={
              step === ASSIGNMENT_STEPS.length - 1 ? "Opslaan" : "Volgende"
            }
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
          {step < ASSIGNMENT_STEPS.length - 1 ? (
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
                  <Spinner /> Opslaan…
                </span>
              ) : (
                <>Toewijzing opslaan ✦</>
              )}
            </PrimaryButton>
          )}
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit-mode
// ---------------------------------------------------------------------------

function EditAssignmentWizard({
  assignment,
  projects,
  employees,
  onClose,
  onSaved,
}: EditModeProps) {
  const router = useRouter();
  const initialForm = useMemo(
    () => assignmentToForm(assignment),
    [assignment],
  );
  const [form, setForm] = useState<CreateAssignmentFormValues>(initialForm);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(
    () => validateAssignmentStep(step, form),
    [step, form],
  );
  const stepValid = Object.keys(errors).length === 0;

  const dirtyPatch = useMemo(
    () => diffAssignmentForm(initialForm, form),
    [initialForm, form],
  );
  const hasChanges = Object.keys(dirtyPatch).length > 0;

  const computePatch = useCallback(
    (
      current: CreateAssignmentFormValues,
      lastSaved: CreateAssignmentFormValues,
    ): AssignmentPatch | null => {
      const dirty = diffAssignmentForm(lastSaved, current);
      return Object.keys(dirty).length > 0 ? dirty : null;
    },
    [],
  );

  const { state: saveState, markSaved } = useAutoSave<
    CreateAssignmentFormValues,
    AssignmentPatch
  >({
    data: form,
    enabled: true,
    ifMatch: assignment.updatedAt,
    delay: 2000,
    endpoint: `/api/admin/assignments/${assignment.id}`,
    computePatch,
  });

  const headerTitle = `${assignment.employeeName} → ${assignment.projectName}`;

  function update(patch: Partial<CreateAssignmentFormValues>) {
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
      const res = await fetch(`/api/admin/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "If-Match": assignment.updatedAt,
        },
        body: JSON.stringify(dirtyPatch),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
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
            {EDIT_STEPS[step]!.kicker} / {EDIT_STEPS.length}
          </div>
          <h2
            className="font-display"
            style={{ fontSize: "1.6rem", lineHeight: 1.1 }}
          >
            <span style={{ fontStyle: "normal", fontWeight: 500 }}>
              {headerTitle}{" "}
            </span>
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
        <AssignmentStepper step={step} form={form} onJump={goToStep} />
      </div>

      {/* Step content */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-8 pb-6"
        key={`edit-step-${step}`}
      >
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
            <StepToewijzing
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
              projects={projects}
              employees={employees}
            />
          )}
          {step === 1 && (
            <StepVergoeding
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
              projects={projects}
              employees={employees}
              onJump={goToStep}
            />
          )}
          {step === 2 && (
            <AssignmentDiffView
              initial={initialForm}
              current={form}
              projects={projects}
              employees={employees}
            />
          )}
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
