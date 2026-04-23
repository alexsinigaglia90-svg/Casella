import type { Role } from "@casella/types";

export type Action =
  | "hours:view_own"
  | "hours:view_all"
  | "hours:submit"
  | "hours:approve"
  | "leave:request"
  | "leave:approve"
  | "sick:report"
  | "sick:view_all"
  | "employer_statement:request"
  | "employer_statement:generate"
  | "employer_statement:upload_signed"
  | "bonus:view_own"
  | "bonus:view_all"
  | "bonus:mutate"
  | "project:create"
  | "project:assign"
  | "client:create"
  | "employee:edit"
  | "audit:view";

const ROLE_PERMISSIONS: Record<Role, Action[]> = {
  employee: [
    "hours:view_own",
    "hours:submit",
    "leave:request",
    "sick:report",
    "employer_statement:request",
    "bonus:view_own",
  ],
  admin: [
    "hours:view_own",
    "hours:view_all",
    "hours:submit",
    "hours:approve",
    "leave:request",
    "leave:approve",
    "sick:report",
    "sick:view_all",
    "employer_statement:request",
    "employer_statement:generate",
    "employer_statement:upload_signed",
    "bonus:view_own",
    "bonus:view_all",
    "bonus:mutate",
    "project:create",
    "project:assign",
    "client:create",
    "employee:edit",
    "audit:view",
  ],
};

export function can(role: Role, action: Action): boolean {
  return ROLE_PERMISSIONS[role].includes(action);
}
