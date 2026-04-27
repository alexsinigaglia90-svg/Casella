import { z } from "zod";

const MAPBOX_BASE = "https://api.mapbox.com/directions/v5/mapbox/driving";

export class MapboxError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "MapboxError";
  }
}

const directionsResponseSchema = z.object({
  routes: z.array(
    z.object({
      distance: z.number(), // meters
      duration: z.number(), // seconds
    }),
  ),
  code: z.string(),
});

export interface RouteResult {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
}

export async function getDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  opts: { token?: string } = {},
): Promise<RouteResult> {
  const token = opts.token ?? process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new MapboxError(
      "missing_token",
      "MAPBOX_ACCESS_TOKEN niet geconfigureerd",
    );
  }

  const url = `${MAPBOX_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?access_token=${token}&geometries=geojson&overview=false`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch (e) {
    throw new MapboxError("network_error", "Mapbox onbereikbaar", e);
  }

  if (!res.ok) {
    throw new MapboxError(`http_${res.status}`, `Mapbox HTTP ${res.status}`);
  }

  const json = await res.json().catch(() => null);
  const parsed = directionsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new MapboxError(
      "invalid_response",
      "Onverwacht antwoord van Mapbox",
      parsed.error,
    );
  }

  if (parsed.data.code !== "Ok" || parsed.data.routes.length === 0) {
    throw new MapboxError("no_route", "Geen route gevonden");
  }

  const route = parsed.data.routes[0]!;
  return {
    distanceMeters: route.distance,
    distanceKm: Math.round((route.distance / 1000) * 100) / 100,
    durationSeconds: route.duration,
  };
}
