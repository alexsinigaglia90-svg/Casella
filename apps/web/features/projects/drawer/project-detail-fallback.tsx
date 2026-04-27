"use client";

import type { ProjectWithClient } from "@casella/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProjectWizard } from "./wizard/project-wizard";

interface ClientOption {
  id: string;
  name: string;
}

/**
 * Full-page fallback for direct-link / share / refresh of
 * `/admin/projecten/[id]` when the intercepting `@modal/(.)[id]` slot did
 * not catch the navigation (i.e. there is no list mounted underneath).
 *
 * Renders the same `<ProjectWizard mode="edit">` as the drawer overlay so
 * functional parity is preserved — only the chrome differs.
 */
export function ProjectDetailFallback({
  project,
  clients,
}: {
  project: ProjectWithClient;
  clients: ClientOption[];
}) {
  const router = useRouter();
  return (
    <div className="container mx-auto max-w-[820px] py-12 px-6">
      <Link
        href="/admin/projecten"
        className="text-sm hover:underline"
        style={{ color: "var(--fg-tertiary)" }}
      >
        ← Terug naar overzicht
      </Link>
      <h1 className="font-display mt-4 mb-8" style={{ fontSize: "1.6rem" }}>
        {project.name}
      </h1>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-lift)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <ProjectWizard
          mode="edit"
          project={project}
          clients={clients}
          onClose={() => router.push("/admin/projecten")}
          onSaved={() => router.refresh()}
        />
      </div>
    </div>
  );
}
