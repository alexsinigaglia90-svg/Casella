import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

interface CacheViewer {
  userId: string;
  name: string;
  avatarHue: number;
  lastSeenAt: number;
}

interface CacheEntry {
  viewers: CacheViewer[];
}

const TTL_MS = 30_000;
const VALID_ENTITY_TYPES = new Set(["employee"]);

const cache = new Map<string, CacheEntry>();

function cleanup(key: string) {
  const entry = cache.get(key);
  if (!entry) return;
  const now = Date.now();
  entry.viewers = entry.viewers.filter((v) => now - v.lastSeenAt < TTL_MS);
  if (entry.viewers.length === 0) {
    cache.delete(key);
  }
}

function hueFromUserId(userId: string): number {
  const code = userId.charCodeAt(0);
  return (code * 37) % 360;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> },
) {
  const admin = await getCurrentUser();
  if (!admin)
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), {
      status: 401,
    });
  if (admin.role !== "admin")
    return NextResponse.json(apiError("forbidden", "Geen toegang"), {
      status: 403,
    });

  const { entityType, entityId } = await params;
  if (!VALID_ENTITY_TYPES.has(entityType)) {
    return NextResponse.json(apiError("not_found", "Onbekend entity-type"), {
      status: 404,
    });
  }

  const key = `${entityType}:${entityId}`;
  cleanup(key);

  const entry = cache.get(key) ?? { viewers: [] };
  const viewer: CacheViewer = {
    userId: admin.id,
    name: admin.displayName,
    avatarHue: hueFromUserId(admin.id),
    lastSeenAt: Date.now(),
  };
  const idx = entry.viewers.findIndex((v) => v.userId === admin.id);
  if (idx >= 0) {
    entry.viewers[idx] = viewer;
  } else {
    entry.viewers.push(viewer);
  }
  cache.set(key, entry);

  return NextResponse.json({
    viewers: entry.viewers.map(({ lastSeenAt: _lastSeenAt, ...rest }) => rest),
  });
}
