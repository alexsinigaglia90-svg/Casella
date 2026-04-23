import { describe, it, expect } from "vitest";
import { resolveRoleFromGroups, type EntraGroupMapping } from "../src/entra";

const mapping: EntraGroupMapping = {
  adminGroupId: "admin-group-uuid",
  employeeGroupId: "employee-group-uuid",
};

describe("resolveRoleFromGroups", () => {
  it("returns 'admin' when user is in the admin group", () => {
    expect(resolveRoleFromGroups(["admin-group-uuid"], mapping)).toBe("admin");
  });

  it("returns 'employee' when user is only in the employee group", () => {
    expect(resolveRoleFromGroups(["employee-group-uuid"], mapping)).toBe(
      "employee"
    );
  });

  it("returns 'admin' when user is in both groups (admin wins)", () => {
    expect(
      resolveRoleFromGroups(
        ["employee-group-uuid", "admin-group-uuid"],
        mapping
      )
    ).toBe("admin");
  });

  it("returns null when user is in neither mapped group", () => {
    expect(
      resolveRoleFromGroups(["some-other-group", "random-group"], mapping)
    ).toBeNull();
  });

  it("returns null when the group list is empty", () => {
    expect(resolveRoleFromGroups([], mapping)).toBeNull();
  });
});
