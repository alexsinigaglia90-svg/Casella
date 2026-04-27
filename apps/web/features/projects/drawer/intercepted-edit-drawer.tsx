"use client";

import type { ProjectWithClient } from "@casella/types";
import { useRouter } from "next/navigation";

import { ProjectWizard } from "./wizard/project-wizard";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ClientOption {
  id: string;
  name: string;
}

/**
 * Intercepted-route overlay rendered by `@modal/(.)[id]/page.tsx`.
 *
 * Mirrors `<ProjectDrawer>` chrome (right-aligned full-height dialog) so the
 * visual transition between create-drawer and edit-drawer is seamless. Closing
 * routes via `router.back()` so the URL drops the `[id]` segment and the list
 * stays mounted underneath.
 */
export function InterceptedProjectEditDrawer({
  project,
  clients,
}: {
  project: ProjectWithClient;
  clients: ClientOption[];
}) {
  const router = useRouter();

  function handleClose() {
    router.back();
  }

  function handleOpenChange(open: boolean) {
    if (!open) handleClose();
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed right-0 top-0 left-auto translate-x-0 translate-y-0 h-screen rounded-none p-0 gap-0 max-w-none flex flex-col data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        style={{
          width: "min(820px, 92vw)",
          boxShadow: "-40px 0 80px -20px rgba(14, 22, 33, 0.28)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        <DialogTitle className="sr-only">{project.name} bewerken</DialogTitle>
        <div className="flex-1 min-w-0 overflow-hidden h-full">
          <ProjectWizard
            mode="edit"
            project={project}
            clients={clients}
            onClose={handleClose}
            onSaved={() => router.refresh()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
