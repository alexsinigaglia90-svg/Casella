import {
  pdokSuggestionSchema,
  pdokAddressSchema,
  type PdokSuggestion,
  type PdokAddress,
} from "./types";
import { PdokError } from "./errors";

const BASE = "https://api.pdok.nl/bzk/locatieserver/search/v3_1";
const TIMEOUT_MS = 5000;

interface SuggestResponse {
  response: {
    docs: Array<{
      id: string;
      weergavenaam: string;
      type: string;
      score: number;
    }>;
  };
}

interface LookupResponse {
  response: {
    docs: Array<{
      id: string;
      straatnaam: string;
      huisnummer: number;
      huisnummertoevoeging?: string;
      postcode: string;
      woonplaatsnaam: string;
      gemeentenaam?: string;
      provincienaam?: string;
      centroide_ll: string;
      centroide_rd?: string;
      weergavenaam: string;
    }>;
  };
}

/**
 * Query PDOK Locatieserver for street-address suggestions matching `q`.
 * Returns an empty array for queries shorter than 2 trimmed characters.
 *
 * @param q     User-entered query (street + city + postcode in any order).
 * @param limit Maximum suggestions to return (default 8, PDOK max ~20).
 * @returns Array of {@link PdokSuggestion} ranked by PDOK score, newest first.
 * @throws {PdokError} code: `"timeout"` — 5 s fetch deadline exceeded.
 * @throws {PdokError} code: `"http"` — non-2xx response from PDOK.
 * @throws {PdokError} code: `"schema"` — response shape did not match expected schema.
 */
export async function suggestAddresses(
  q: string,
  limit = 8
): Promise<PdokSuggestion[]> {
  if (q.trim().length < 2) return [];
  const url = `${BASE}/suggest?q=${encodeURIComponent(q)}&rows=${limit}&fq=type:adres`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new PdokError("timeout", "PDOK suggest timed out", { cause: err });
    }
    throw err;
  }
  if (!res.ok) {
    throw new PdokError("http", `PDOK suggest failed: ${res.status}`, {
      status: res.status,
    });
  }
  const json = (await res.json()) as SuggestResponse;
  try {
    return json.response.docs.map((d) =>
      pdokSuggestionSchema.parse({
        id: d.id,
        weergavenaam: d.weergavenaam,
        type: d.type,
        score: d.score,
      })
    );
  } catch (err) {
    throw new PdokError(
      "schema",
      "PDOK suggest response did not match expected schema",
      { cause: err }
    );
  }
}

function parsePoint(s: string): { x: number; y: number } {
  const m = s.match(/^POINT\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/);
  if (!m) throw new Error(`Unparseable POINT: ${s}`);
  return { x: parseFloat(m[1]!), y: parseFloat(m[2]!) };
}

/**
 * Fetch the full address record for a PDOK Locatieserver document id.
 *
 * @param id  PDOK document id as returned by {@link suggestAddresses}.
 * @returns   Fully hydrated {@link PdokAddress} with coordinates.
 * @throws {PdokError} code: `"timeout"` — 5 s fetch deadline exceeded.
 * @throws {PdokError} code: `"http"` — non-2xx response from PDOK.
 * @throws {PdokError} code: `"no_results"` — PDOK returned an empty result set.
 * @throws {PdokError} code: `"schema"` — response shape did not match expected schema.
 */
export async function lookupAddress(id: string): Promise<PdokAddress> {
  const url = `${BASE}/lookup?id=${encodeURIComponent(id)}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new PdokError("timeout", "PDOK lookup timed out", { cause: err });
    }
    throw err;
  }
  if (!res.ok) {
    throw new PdokError("http", `PDOK lookup failed: ${res.status}`, {
      status: res.status,
    });
  }
  const json = (await res.json()) as LookupResponse;
  const d = json.response.docs[0];
  if (!d) throw new PdokError("no_results", "PDOK lookup: no results");
  const ll = parsePoint(d.centroide_ll);
  const rd = d.centroide_rd ? parsePoint(d.centroide_rd) : null;
  try {
    return pdokAddressSchema.parse({
      id: d.id,
      street: d.straatnaam,
      houseNumber: String(d.huisnummer),
      houseNumberAddition: d.huisnummertoevoeging ?? null,
      postalCode: d.postcode,
      city: d.woonplaatsnaam,
      municipality: d.gemeentenaam ?? null,
      province: d.provincienaam ?? null,
      country: "NL",
      lat: ll.y,
      lng: ll.x,
      rdX: rd?.x ?? null,
      rdY: rd?.y ?? null,
      fullDisplay: d.weergavenaam,
    });
  } catch (err) {
    throw new PdokError(
      "schema",
      "PDOK lookup response did not match expected schema",
      { cause: err }
    );
  }
}
