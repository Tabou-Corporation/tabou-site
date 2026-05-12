/**
 * GET /api/map/kills/corp
 * Renvoie kills + losses (chronologique) pour Tabou + Urban Zone, sur les 30
 * derniers jours (≈ mois en cours). Enrichi via ESI (ship name + victim alliance).
 *
 * Cache mutualisé via esiFetch (zKill 10min, ESI killmails 24h).
 */

import { NextResponse } from "next/server";
import { getCorpKillsAndLosses } from "@/lib/map/zkill/corp";

export const dynamic = "force-dynamic";

// Tabou Corporation : 98809880 ; Urban Zone : 98215397 (cf. CLAUDE.md)
const CORP_IDS = [98809880, 98215397];

export async function GET() {
  const result = await getCorpKillsAndLosses(CORP_IDS, 30 * 24 * 3600, 30);
  return NextResponse.json(
    {
      ...result,
      corpIds: CORP_IDS,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "public, max-age=180, stale-while-revalidate=600" },
    },
  );
}
