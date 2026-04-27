import { describe, expect, it } from "vitest";

import { listRecentAuditEvents } from "../src/audit/list-recent";

describe("listRecentAuditEvents", () => {
  it("is a function with the expected signature", () => {
    expect(typeof listRecentAuditEvents).toBe("function");
    expect(listRecentAuditEvents.length).toBeLessThanOrEqual(1);
  });
});
