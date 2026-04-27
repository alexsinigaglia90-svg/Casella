import { notFound } from "next/navigation";

import { EmployeeDetailActions } from "@/features/employees/detail/employee-detail-actions";
import { EmployeeDetailCrumbs } from "@/features/employees/drawer/employee-detail-crumbs";
import { EmployeeDetailFallback } from "@/features/employees/drawer/employee-detail-fallback";
import { getEmployeeById } from "@/lib/employees/get-by-id";

export default async function EmployeeDetailPage({
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
      <EmployeeDetailActions />
      <EmployeeDetailFallback employee={employee} />
    </>
  );
}
