interface Assignment {
  id: string;
  projectName: string;
}

interface Props {
  firstName: string | null;
  assignments: Assignment[];
}

export function HeroCard({ firstName, assignments }: Props) {
  const greeting = firstName ? `Goedemorgen, ${firstName}!` : "Goedemorgen!";

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "var(--surface-base)", borderColor: "var(--border-subtle)" }}
    >
      <h1 className="text-2xl font-semibold" style={{ color: "var(--fg-primary)" }}>
        {greeting}
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
        {assignments.length === 0
          ? "Je hebt nog geen actieve opdrachten."
          : `${assignments.length} actieve opdracht${assignments.length === 1 ? "" : "en"}`}
      </p>

      {assignments.length > 0 && (
        <ul className="mt-4 space-y-1">
          {assignments.map((a) => (
            <li key={a.id} className="flex items-center gap-2">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: "var(--aurora-violet)" }}
                aria-hidden
              />
              <span className="text-sm" style={{ color: "var(--fg-primary)" }}>
                {a.projectName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
