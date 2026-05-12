/**
 * GET /api/map/health — état des sources externes (cache ESI + dernier cron).
 */

import { NextResponse } from "next/server";
import { esiHealth } from "@/lib/map/esi/cache";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [esi, cacheEntries] = await Promise.all([
    esiHealth(),
    prisma.mapEsiCache.findMany({
      select: { url: true, fetchedAt: true, expiresAt: true, lastStatus: true },
    }),
  ]);

  const now = Date.now();
  const sources = cacheEntries.map((c) => {
    const ageMin = (now - c.fetchedAt.getTime()) / 60_000;
    let status: "ok" | "stale" | "down";
    if (c.lastStatus >= 200 && c.lastStatus < 400 && c.expiresAt.getTime() > now) status = "ok";
    else if (c.lastStatus >= 200 && c.lastStatus < 400) status = "stale";
    else status = "down";
    return {
      url: c.url,
      label: c.url.split("/").slice(-3, -1).join("/"),
      fetchedAt: c.fetchedAt.toISOString(),
      ageMinutes: Math.round(ageMin),
      expiresAt: c.expiresAt.toISOString(),
      lastStatus: c.lastStatus,
      status,
    };
  });

  return NextResponse.json({
    summary: {
      entries: esi.entries,
      oldestExpiresAt: esi.oldestExpiresAt?.toISOString() ?? null,
      newestFetchedAt: esi.newestFetchedAt?.toISOString() ?? null,
    },
    sources,
  });
}
