import { describe, expect, it } from "vitest";

import { searchEmployees } from "../src/search/employees";

describe("searchEmployees", () => {
  it("is a function with the expected signature", () => {
    expect(typeof searchEmployees).toBe("function");
  });

  it("returns empty for empty query", async () => {
    const r = await searchEmployees({ query: "" });
    expect(r).toEqual([]);
    const r2 = await searchEmployees({ query: "   " });
    expect(r2).toEqual([]);
  });
});
