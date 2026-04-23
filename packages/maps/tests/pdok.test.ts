import { describe, it, expect } from "vitest";
import { suggestAddresses, lookupAddress } from "../src/pdok";

describe("PDOK suggest", () => {
  it("returns suggestions for a well-known address", async () => {
    const results = await suggestAddresses("Damrak 10 Amsterdam", 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      type: expect.stringMatching(/adres/),
      weergavenaam: expect.stringContaining("Damrak"),
    });
  });

  it("returns empty for empty query", async () => {
    const results = await suggestAddresses("", 5);
    expect(results).toEqual([]);
  });

  it("returns empty for single-char query", async () => {
    const results = await suggestAddresses("a", 5);
    expect(results).toEqual([]);
  });
});

describe("PDOK lookup", () => {
  it("lookups an address ID end-to-end via suggest → lookup", async () => {
    const suggestions = await suggestAddresses("Binnenhof 1 Den Haag", 1);
    expect(suggestions.length).toBeGreaterThan(0);
    const address = await lookupAddress(suggestions[0]!.id);
    expect(address).toMatchObject({
      street: expect.stringContaining("Binnenhof"),
      city: "'s-Gravenhage",
      country: "NL",
    });
    expect(address.lat).toBeGreaterThan(50);
    expect(address.lat).toBeLessThan(54);
    expect(address.lng).toBeGreaterThan(3);
    expect(address.lng).toBeLessThan(8);
  });

  it("throws PdokError with code 'no_results' for an unknown id", async () => {
    const { PdokError } = await import("../src/errors");
    await expect(
      lookupAddress("adr-deadbeef-not-a-real-id")
    ).rejects.toMatchObject({
      name: "PdokError",
      code: "no_results",
    });
    await expect(
      lookupAddress("adr-deadbeef-not-a-real-id")
    ).rejects.toBeInstanceOf(PdokError);
  });
});
