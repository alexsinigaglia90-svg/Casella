import { notFound } from "next/navigation";

import { listActiveClientsForPicker } from "../../queries";

import { InterceptedProjectEditDrawer } from "@/features/projects/drawer/intercepted-edit-drawer";
import { ProjectDetailCrumbs } from "@/features/projects/drawer/project-detail-crumbs";
import { getProjectById } from "@/lib/projects/get-by-id";

export default async function InterceptedProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, clients] = await Promise.all([
    getProjectById(id),
    listActiveClientsForPicker(),
  ]);
  if (!project) notFound();
  return (
    <>
      <ProjectDetailCrumbs name={project.name} />
      <InterceptedProjectEditDrawer project={project} clients={clients} />
    </>
  );
}
