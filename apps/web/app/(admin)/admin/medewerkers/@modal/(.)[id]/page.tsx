import { notFound } from "next/navigation";

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
  return <InterceptedEditDrawer employee={employee} />;
}
