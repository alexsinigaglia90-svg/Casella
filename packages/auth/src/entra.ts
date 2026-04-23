import type { Role } from "@casella/types";

export interface EntraGroupMapping {
  adminGroupId: string;
  employeeGroupId: string;
}

export function resolveRoleFromGroups(
  groupIds: string[],
  mapping: EntraGroupMapping
): Role | null {
  if (groupIds.includes(mapping.adminGroupId)) return "admin";
  if (groupIds.includes(mapping.employeeGroupId)) return "employee";
  return null;
}
