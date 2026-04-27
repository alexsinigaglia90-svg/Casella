import { notFound } from "next/navigation";

import {
  listActiveEmployeesForPicker,
  listActiveProjectsForPicker,
} from "../queries";

import { AssignmentDetailCrumbs } from "@/features/assignments/drawer/assignment-detail-crumbs";
import { AssignmentDetailFallback } from "@/features/assignments/drawer/assignment-detail-fallback";
import { getAssignmentById } from "@/lib/assignments/get-by-id";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [assignment, projects, employees] = await Promise.all([
    getAssignmentById(id),
    listActiveProjectsForPicker(),
    listActiveEmployeesForPicker(),
  ]);
  if (!assignment) notFound();
  return (
    <>
      <AssignmentDetailCrumbs
        employeeName={assignment.employeeName}
        projectName={assignment.projectName}
      />
      <AssignmentDetailFallback
        assignment={assignment}
        projects={projects}
        employees={employees}
      />
    </>
  );
}
