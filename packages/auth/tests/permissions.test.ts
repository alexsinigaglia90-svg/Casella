import { describe, it, expect } from "vitest";
import { can } from "../src/permissions";

describe("RBAC permissions", () => {
  describe("employee role", () => {
    it("can view their own hours", () => {
      expect(can("employee", "hours:view_own")).toBe(true);
    });

    it("can submit hours", () => {
      expect(can("employee", "hours:submit")).toBe(true);
    });

    it("cannot view all hours", () => {
      expect(can("employee", "hours:view_all")).toBe(false);
    });

    it("cannot approve leave", () => {
      expect(can("employee", "leave:approve")).toBe(false);
    });

    it("cannot create projects", () => {
      expect(can("employee", "project:create")).toBe(false);
    });
  });

  describe("admin role", () => {
    it("can approve hours", () => {
      expect(can("admin", "hours:approve")).toBe(true);
    });

    it("can approve leave", () => {
      expect(can("admin", "leave:approve")).toBe(true);
    });

    it("can view audit log", () => {
      expect(can("admin", "audit:view")).toBe(true);
    });

    it("has all employee permissions", () => {
      const employeeActions = [
        "hours:view_own",
        "hours:submit",
        "leave:request",
        "sick:report",
        "employer_statement:request",
        "bonus:view_own",
      ] as const;
      for (const action of employeeActions) {
        expect(can("admin", action)).toBe(true);
      }
    });
  });
});
