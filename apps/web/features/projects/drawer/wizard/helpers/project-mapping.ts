import type { ProjectWithClient, UpdateProjectInput } from "@casella/types";

import type { CreateProjectFormValues } from "../types";

/**
 * Seed a CreateProjectFormValues from a fetched ProjectWithClient.
 * Used by the wizard in edit-mode as the initial form state.
 */
export function projectToForm(p: ProjectWithClient): CreateProjectFormValues {
  return {
    clientId: p.clientId,
    name: p.name,
    description: p.description ?? "",
    startDate: p.startDate ?? "",
    endDate: p.endDate ?? "",
    status: p.status,
  };
}

/**
 * Compute a sparse PATCH payload by deep-comparing initial vs. current form
 * values. Returns Omit<UpdateProjectInput, "id"> — the route handler injects
 * the id from the URL.
 */
export function diffProjectForm(
  initial: CreateProjectFormValues,
  current: CreateProjectFormValues,
): Omit<Partial<UpdateProjectInput>, "id"> {
  const dirty: Omit<Partial<UpdateProjectInput>, "id"> = {};

  if (initial.clientId !== current.clientId) dirty.clientId = current.clientId;
  if (initial.name !== current.name) dirty.name = current.name;
  if (initial.description !== current.description) {
    dirty.description = current.description || null;
  }
  if (initial.startDate !== current.startDate) {
    dirty.startDate = current.startDate || null;
  }
  if (initial.endDate !== current.endDate) {
    dirty.endDate = current.endDate || null;
  }
  if (initial.status !== current.status) dirty.status = current.status;

  return dirty;
}

/**
 * Map a project status to a human-readable Dutch label for UI surfaces.
 */
export const PROJECT_STATUS_LABELS: Record<
  ProjectWithClient["status"],
  string
> = {
  planned: "Gepland",
  active: "Actief",
  completed: "Voltooid",
  cancelled: "Geannuleerd",
};
