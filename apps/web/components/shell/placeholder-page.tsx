interface PlaceholderPageProps {
  feature: string;
  description?: string;
}

export function PlaceholderPage({ feature, description }: PlaceholderPageProps) {
  return (
    <div
      className="rounded-xl p-12 text-center"
      style={{
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-lift)",
      }}
    >
      <h1
        className="font-display mb-2"
        style={{ fontSize: "1.6rem", color: "var(--fg-primary)" }}
      >
        {feature}
      </h1>
      <p style={{ color: "var(--fg-tertiary)" }}>
        {description ??
          "Deze pagina wordt opgebouwd in Fase 1.6 — kom binnenkort terug."}
      </p>
    </div>
  );
}
