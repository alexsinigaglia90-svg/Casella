import { FileText, Download } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

interface Statement {
  id: string;
  purpose: string;
  createdAt: string;
}

interface Props {
  latestStatement: Statement | null;
}

const PURPOSE_LABELS: Record<string, string> = {
  mortgage: "Hypotheek",
  rent: "Huur",
  other: "Overig",
};

export function DocumentsSection({ latestStatement }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Loonstroken */}
      <div
        className="rounded-xl border p-4"
        style={{ background: "var(--surface-base)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4" style={{ color: "var(--fg-tertiary)" }} />
          <h3 className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Recente loonstroken
          </h3>
        </div>
        <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
          Loonstroken verschijnen hier zodra Nmbrs is gekoppeld in productie.
        </p>
        <Link
          href={"/loonstroken" as Route}
          className="mt-3 inline-block text-xs"
          style={{ color: "var(--aurora-violet)" }}
        >
          Alle loonstroken →
        </Link>
      </div>

      {/* Werkgeversverklaring */}
      <div
        className="rounded-xl border p-4"
        style={{ background: "var(--surface-base)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4" style={{ color: "var(--fg-tertiary)" }} />
          <h3 className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Werkgeversverklaring
          </h3>
        </div>
        {latestStatement ? (
          <div className="space-y-2">
            <p className="text-sm" style={{ color: "var(--fg-primary)" }}>
              {PURPOSE_LABELS[latestStatement.purpose] ?? latestStatement.purpose} ·{" "}
              {new Date(latestStatement.createdAt).toLocaleDateString("nl-NL")}
            </p>
            <Link
              href={`/api/werkgeversverklaring/${latestStatement.id}/download` as Route}
              className="inline-flex items-center gap-1 text-xs"
              style={{ color: "var(--aurora-violet)" }}
            >
              <Download className="h-3 w-3" />
              Downloaden
            </Link>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Nog geen werkgeversverklaring aangevraagd.
          </p>
        )}
        <Link
          href={"/werkgeversverklaring" as Route}
          className="mt-3 inline-block text-xs"
          style={{ color: "var(--aurora-violet)" }}
        >
          Naar werkgeversverklaringen →
        </Link>
      </div>
    </div>
  );
}
