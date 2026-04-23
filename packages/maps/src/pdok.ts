import {
  pdokSuggestionSchema,
  pdokAddressSchema,
  type PdokSuggestion,
  type PdokAddress,
} from "./types";

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
      throw new Error("PDOK suggest timed out");
    }
    throw err;
  }
  if (!res.ok) throw new Error(`PDOK suggest failed: ${res.status}`);
  const json = (await res.json()) as SuggestResponse;
  return json.response.docs.map((d) =>
    pdokSuggestionSchema.parse({
      id: d.id,
      weergavenaam: d.weergavenaam,
      type: d.type,
      score: d.score,
    })
  );
}

function parsePoint(s: string): { x: number; y: number } {
  const m = s.match(/^POINT\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/);
  if (!m) throw new Error(`Unparseable POINT: ${s}`);
  return { x: parseFloat(m[1]!), y: parseFloat(m[2]!) };
}

export async function lookupAddress(id: string): Promise<PdokAddress> {
  const url = `${BASE}/lookup?id=${encodeURIComponent(id)}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("PDOK lookup timed out");
    }
    throw err;
  }
  if (!res.ok) throw new Error(`PDOK lookup failed: ${res.status}`);
  const json = (await res.json()) as LookupResponse;
  const d = json.response.docs[0];
  if (!d) throw new Error("PDOK lookup: no results");
  const ll = parsePoint(d.centroide_ll);
  const rd = d.centroide_rd ? parsePoint(d.centroide_rd) : null;
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
}
