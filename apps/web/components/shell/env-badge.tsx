export function EnvBadge() {
  const env = process.env.NEXT_PUBLIC_CASELLA_ENV ?? "local";
  const map: Record<string, string> = {
    local: "bg-aurora-amber/20 text-aurora-amber",
    preview: "bg-aurora-blue/20 text-aurora-blue",
    production: "bg-aurora-teal/20 text-aurora-teal",
  };
  const cls = map[env] ?? "bg-muted";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {env}
    </span>
  );
}
