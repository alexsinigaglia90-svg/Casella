import { notFound } from "next/navigation";

import {
  listActiveEmployeesForPicker,
  listActiveProjectsForPicker,
} from "../../queries";

import { AssignmentDetailCrumbs } from "@/features/assignments/drawer/assignment-detail-crumbs";
import { InterceptedAssignmentEditDrawer } from "@/features/assignments/drawer/intercepted-edit-drawer";
import { getAssignmentById } from "@/lib/assignments/get-by-id";

export default async function InterceptedAssignmentPage({
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
      <InterceptedAssignmentEditDrawer
        assignment={assignment}
        projects={projects}
        employees={employees}
      />
    </>
  );
}
