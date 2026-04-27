"use client";

import type { ClientWithAddress, UpdateClientInput } from "@casella/types";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";

import { ClientDiffView } from "./client-diff-view";
import { ClientStepper } from "./components/client-stepper";
import { LivePreview } from "./components/live-preview";
import {
  clientToForm,
  diffClientForm,
  pdokAddressToAddressInput,
} from "./helpers/client-mapping";
import { domainToCompanyName } from "./helpers/format";
import { StepAdres } from "./steps/step-adres";
import { StepBedrijf } from "./steps/step-bedrijf";
import { StepCheck } from "./steps/step-check";
import { StepContact } from "./steps/step-contact";
import type { CreateClientFormValues } from "./types";
import { CLIENT_STEPS, emptyClientForm } from "./types";
import { isClientStepValid, validateClientStep } from "./validation";

import { ConflictBanner } from "@/features/admin-shell/auto-save/conflict-banner";
import { SavedIndicator } from "@/features/admin-shell/auto-save/saved-indicator";
import { useAutoSave } from "@/features/admin-shell/auto-save/use-auto-save";
import { KbdHint } from "@/features/employees/drawer/wizard/components/kbd-hint";
import { Spinner } from "@/features/employees/drawer/wizard/components/spinner";

type ClientPatch = Omit<Partial<UpdateClientInput>, "id">;

type CreateModeProps = {
  mode: "create";
  onClose: () => void;
  form: CreateClientFormValues;
  setForm: Dispatch<SetStateAction<CreateClientFormValues>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  kvkStrict?: boolean;
};

type EditModeProps = {
  mode: "edit";
  client: ClientWithAddress;
  onClose: () => void;
  onSaved?: () => void;
};

export type ClientWizardProps = CreateModeProps | EditModeProps;

const EDIT_STEPS = [
  CLIENT_STEPS[0],
  CLIENT_STEPS[1],
  CLIENT_STEPS[2],
  {
    key: "wijzigingen",
    label: "Check",
    kicker: "Stap 4",
    title: "Wijzigingen",
    sub: "Controleer voor opslaan.",
  },
] as const;

export function ClientWizard(props: ClientWizardProps) {
  if (props.mode === "create") return <CreateClientWizard {...props} />;
  return <EditClientWizard {...props} />;
}

// ---------------------------------------------------------------------------
// Create-mode
// ---------------------------------------------------------------------------

function CreateClientWizard({
  onClose,
  form,
  setForm,
  step,
  setStep,
  kvkStrict = false,
}: CreateModeProps) {
  const router = useRouter();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [kvkValidated, setKvkValidated] = useState(false);
  const [autoFillHint, setAutoFillHint] = useState<string[] | null>(null);
  const autoFillTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const errors = useMemo(() => validateClientStep(step, form), [step, form]);
  const stepValid = Object.keys(errors).length === 0;
  const canSubmit = [0, 1, 2].every((s) => isClientStepValid(s, form));

  function update(patch: Partial<CreateClientFormValues>) {
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

  function handleEmailBlurAutoFill(email: string) {
    const suggestion = domainToCompanyName(email);
    if (suggestion && !form.name.trim()) {
      update({ name: suggestion });
      setAutoFillHint(["name"]);
      clearTimeout(autoFillTimerRef.current);
      autoFillTimerRef.current = setTimeout(() => setAutoFillHint(null), 3000);
    }
  }

  function goNext() {
    if (step < CLIENT_STEPS.length - 1) {
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
      isClientStepValid(n, form),
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
    const address = pdokAddressToAddressInput(form.address);
    if (!address) {
      setAllTouched();
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          kvk: form.kvk || undefined,
          contactName: form.contactName || undefined,
          contactEmail: form.contactEmail || undefined,
          contactPhone: form.contactPhone || undefined,
          address,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      toast.success("Klant aangemaakt.");
      setForm(emptyClientForm());
      setStep(0);
      router.refresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aanmaken mislukt");
    } finally {
      setSubmitting(false);
    }
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
        if (step === CLIENT_STEPS.length - 1) void submit();
        else goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form]);

  return (
    <div className="flex h-full w-full flex-row">
      {/* Left pane: live preview — hidden on small screens */}
      <div
        className="hidden md:flex shrink-0 flex-col overflow-y-auto"
        style={{
          width: 400,
          borderRight: "1px solid var(--border-subtle)",
          background: "var(--surface-base)",
        }}
      >
        <LivePreview form={form} step={step} kvkValidated={kvkValidated} />
      </div>

      {/* Right pane: wizard */}
      <div
        className="flex min-w-0 flex-1 flex-col"
        style={{ background: "var(--surface-lift)" }}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 px-8 pt-7 pb-5">
          <div className="min-w-0 flex-1">
            <div
              className="mb-1 text-[10px] font-mono uppercase tracking-[0.15em]"
              style={{ color: "var(--fg-tertiary)" }}
            >
              {CLIENT_STEPS[step]!.kicker} / {CLIENT_STEPS.length}
            </div>
            <h2
              className="font-display whitespace-nowrap"
              style={{ fontSize: "1.6rem", lineHeight: 1.1 }}
            >
              <span style={{ fontStyle: "normal", fontWeight: 500 }}>Welke nieuwe </span>
              <em style={{ fontWeight: 400 }}>relatie voeg je toe?</em>
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
          <ClientStepper step={step} form={form} onJump={goToStep} />
        </div>

        {/* Scrollable step content */}
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
              {CLIENT_STEPS[step]!.title}
            </h3>
            <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
              {CLIENT_STEPS[step]!.sub}
            </p>
          </div>

          <div className="step-enter" style={{ animationDelay: "60ms" }}>
            {step === 0 && (
              <StepBedrijf
                form={form}
                update={update}
                errors={errors}
                touched={touched}
                setTouch={setTouch}
                onKvkValidated={setKvkValidated}
                kvkStrict={kvkStrict}
              />
            )}
            {step === 1 && (
              <StepContact
                form={form}
                update={update}
                errors={errors}
                touched={touched}
                setTouch={setTouch}
                autoFillHint={autoFillHint}
                onEmailBlur={() => handleEmailBlurAutoFill(form.contactEmail)}
              />
            )}
            {step === 2 && (
              <StepAdres
                form={form}
                update={update}
                errors={errors}
                touched={touched}
                setTouch={setTouch}
              />
            )}
            {step === 3 && <StepCheck form={form} onJump={goToStep} />}
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
              label={step === CLIENT_STEPS.length - 1 ? "Opslaan" : "Volgende"}
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
            {step < CLIENT_STEPS.length - 1 ? (
              <AuroraButton onClick={goNext} disabled={!stepValid}>
                Volgende →
              </AuroraButton>
            ) : (
              <AuroraButton
                onClick={() => void submit()}
                disabled={!canSubmit || submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Opslaan…
                  </span>
                ) : (
                  <>Klant opslaan ✦</>
                )}
              </AuroraButton>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit-mode
// ---------------------------------------------------------------------------

function EditClientWizard({ client, onClose, onSaved }: EditModeProps) {
  const router = useRouter();
  const initialForm = useMemo(() => clientToForm(client), [client]);
  const [form, setForm] = useState<CreateClientFormValues>(initialForm);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => validateClientStep(step, form), [step, form]);
  const stepValid = Object.keys(errors).length === 0;

  const dirtyPatch = useMemo(
    () => diffClientForm(initialForm, form),
    [initialForm, form],
  );
  const hasChanges = Object.keys(dirtyPatch).length > 0;

  const computePatch = useCallback(
    (
      current: CreateClientFormValues,
      lastSaved: CreateClientFormValues,
    ): ClientPatch | null => {
      const dirty = diffClientForm(lastSaved, current);
      return Object.keys(dirty).length > 0 ? dirty : null;
    },
    [],
  );

  const { state: saveState, markSaved } = useAutoSave<
    CreateClientFormValues,
    ClientPatch
  >({
    data: form,
    enabled: true,
    ifMatch: client.updatedAt,
    delay: 2000,
    endpoint: `/api/admin/clients/${client.id}`,
    computePatch,
  });

  const headerTitle = client.name || "Klant";

  function update(patch: Partial<CreateClientFormValues>) {
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
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "If-Match": client.updatedAt,
        },
        body: JSON.stringify(dirtyPatch),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
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
        <ClientStepper step={step} form={form} onJump={goToStep} />
      </div>

      {/* Step content */}
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
            <StepBedrijf
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
            />
          )}
          {step === 1 && (
            <StepContact
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
              autoFillHint={null}
            />
          )}
          {step === 2 && (
            <StepAdres
              form={form}
              update={update}
              errors={errors}
              touched={touched}
              setTouch={setTouch}
            />
          )}
          {step === 3 && <ClientDiffView initial={initialForm} current={form} />}
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
            <AuroraButton onClick={goNext} disabled={!stepValid}>
              Volgende →
            </AuroraButton>
          ) : (
            <AuroraButton
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
            </AuroraButton>
          )}
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aurora-gradient submit button with pulse-glow on hover
// ---------------------------------------------------------------------------

function AuroraButton({
  onClick,
  disabled = false,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-lg px-5 py-2 text-sm font-medium text-white transition-all disabled:opacity-40"
      style={{
        background: "linear-gradient(135deg, var(--aurora-violet), var(--aurora-blue))",
        boxShadow: hovered && !disabled
          ? "0 0 0 4px rgba(123, 92, 255, 0.22), 0 0 16px rgba(75, 163, 255, 0.28)"
          : "0 1px 3px rgba(0,0,0,0.14)",
        transition: "box-shadow 200ms ease, opacity 150ms ease",
      }}
    >
      {children}
    </button>
  );
}
