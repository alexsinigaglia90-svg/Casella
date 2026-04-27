import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  LEAVE_TYPES,
  LEAVE_TYPE_KEYS,
  SELF_APPROVE_TYPES,
  ADMIN_APPROVE_TYPES,
} from "../types";
import { leaveSubmitSchema } from "../validation";

describe("leave types config", () => {
  it("has 14 leave-type keys", () => {
    expect(LEAVE_TYPE_KEYS).toHaveLength(14);
    expect(Object.keys(LEAVE_TYPES)).toHaveLength(14);
  });

  it("self-approve list contains the 6 expected types", () => {
    expect(new Set(SELF_APPROVE_TYPES)).toEqual(
      new Set([
        "pregnancy",
        "maternity",
        "birth_partner",
        "adoption",
        "short_care",
        "calamity",
      ]),
    );
  });

  it("admin-approve list contains the 8 remaining types", () => {
    expect(new Set(ADMIN_APPROVE_TYPES)).toEqual(
      new Set([
        "vacation_legal",
        "vacation_extra",
        "additional_birth",
        "parental_paid",
        "parental_unpaid",
        "long_care",
        "special",
        "unpaid",
      ]),
    );
  });
});

describe("leaveSubmitSchema", () => {
  it("rejects unknown type", () => {
    const result = leaveSubmitSchema.safeParse({
      type: "made_up_type",
      startDate: "2026-05-01",
      hours: 8,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid vacation submit", () => {
    const result = leaveSubmitSchema.safeParse({
      type: "vacation_legal",
      startDate: "2026-05-01",
      endDate: "2026-05-05",
      hours: 40,
      notes: "Meivakantie",
    });
    expect(result.success).toBe(true);
  });
});
