/**
 * GET /api/map/stats/corp
 * Renvoie le classement all-time fusionné Tabou + Urban Zone.
 *
 * Données :
 *   - entries : top pilotes (fusion par characterID, tri desc par kills)
 *   - totals  : par corp (ships détruits/perdus, ISK détruits/perdus)
 *
 * Cache zKill : 6h. Cache HTTP : 5min (revalidate 30min).
 */

import { NextResponse } from "next/server";
import { getHallOfFame } from "@/lib/map/zkill/stats";

export const dynamic = "force-dynamic";

const CORP_IDS = [98809880, 98215397]; // Tabou + Urban Zone

export async function GET() {
  const result = await getHallOfFame(CORP_IDS, 50);
  return NextResponse.json(
    {
      ...result,
      corpIds: CORP_IDS,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=1800" },
    },
  );
}
