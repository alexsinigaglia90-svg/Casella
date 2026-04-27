import { notFound } from "next/navigation";

import { EmployeeDetailActions } from "@/features/employees/detail/employee-detail-actions";
import { EmployeeDetailCrumbs } from "@/features/employees/drawer/employee-detail-crumbs";
import { InterceptedEditDrawer } from "@/features/employees/drawer/intercepted-edit-drawer";
import { getEmployeeById } from "@/lib/employees/get-by-id";

export default async function InterceptedEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployeeById(id);
  if (!employee) notFound();
  return (
    <>
      <EmployeeDetailCrumbs id={employee.id} firstName={employee.firstName} lastName={employee.lastName} />
      <EmployeeDetailActions employeeId={employee.id} />
      <InterceptedEditDrawer employee={employee} />
    </>
  );
}
