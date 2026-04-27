import { notFound } from "next/navigation";

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
      <EmployeeDetailCrumbs firstName={employee.firstName} lastName={employee.lastName} />
      <EmployeeDetailFallback employee={employee} />
    </>
  );
}
