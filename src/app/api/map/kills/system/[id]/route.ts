/**
 * GET /api/map/kills/system/[id]
 * Renvoie les killmails récents (dernière heure, top 10) pour un système,
 * enrichis via ESI : nom du ship victime, alliance victime, alliance attaquante
 * principale, attacker count, ISK détruit, lien zkill.
 *
 * Cache mutualisé via esiFetch (zKill 5min, ESI killmails 24h car immuables).
 */

import { NextResponse } from "next/server";
import { SDE_BY_ID } from "@/lib/map/sde";
import { getRecentKillsForSystem } from "@/lib/map/zkill/kills";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const systemId = Number(id);
  if (!Number.isFinite(systemId) || !SDE_BY_ID.has(systemId)) {
    return NextResponse.json({ error: "Unknown system" }, { status: 404 });
  }

  // Fenêtre 3h : ESI /universe/system_kills/ a un lag d'~1h. Une fenêtre 1h
  // sur zKill râterait les kills déjà visibles dans le compteur ESI mais
  // antérieurs à 1h. 3h couvre largement.
  const result = await getRecentKillsForSystem(systemId, 10800, 10);

  return NextResponse.json(
    {
      systemId,
      ...result,
      fetchedAt: new Date().toISOString(),
    },
    {
      // Cache HTTP léger côté client/CDN (les killmails sont immuables une fois fetchés)
      headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=300" },
    },
  );
}
