import { notFound } from "next/navigation";

import { listActiveClientsForPicker } from "../queries";

import { ProjectDetailCrumbs } from "@/features/projects/drawer/project-detail-crumbs";
import { ProjectDetailFallback } from "@/features/projects/drawer/project-detail-fallback";
import { getProjectById } from "@/lib/projects/get-by-id";

export default async function ProjectDetailPage({
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
      <ProjectDetailFallback project={project} clients={clients} />
    </>
  );
}
