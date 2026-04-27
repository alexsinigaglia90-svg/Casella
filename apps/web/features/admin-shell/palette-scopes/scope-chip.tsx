import type { CommandScope } from "./use-command-scope";

const SCOPE_LABELS: Record<NonNullable<CommandScope>, string> = {
  commands: "Commands",
  employees: "Medewerkers",
  projects: "Projecten",
  help: "Hulp",
};

export function ScopeChip({ scope }: { scope: NonNullable<CommandScope> }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{
        background: "color-mix(in oklch, var(--aurora-violet, #7b5cff) 15%, transparent)",
        color: "var(--aurora-violet, #7b5cff)",
      }}
    >
      {SCOPE_LABELS[scope]}
    </span>
  );
}
