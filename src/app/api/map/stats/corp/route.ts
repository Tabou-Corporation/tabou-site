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
// L'enrichissement carrière (≈20 fetchs zKill) peut être lent sur cache froid.
export const maxDuration = 60;

const CORP_IDS = [98809880, 98215397]; // Tabou + Urban Zone

export async function GET() {
  try {
    const result = await getHallOfFame(CORP_IDS, 50);
    return NextResponse.json(
      {
        ...result,
        corpIds: CORP_IDS,
        fetchedAt: new Date().toISOString(),
      },
      {
        // Cache CDN agressif : les stats all-time bougent lentement.
        // s-maxage = cache edge Vercel (15min), SWR = sert le périmé pendant
        // qu'on revalide en arrière-plan (1h). Le client ne tape donc presque
        // jamais la fonction serverless → quasi zéro charge DB Neon.
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("[api/map/stats/corp] failed:", err);
    // Fallback complet : même forme que le payload normal pour que le client
    // ne crashe jamais, même s'il décide de rendre malgré l'erreur.
    return NextResponse.json(
      {
        error: "Stats indisponibles pour le moment.",
        entries: [],
        totals: [],
        biggestKill: null,
        heatmap: { matrix: [], byHour: [], max: 0, peakHour: { hour: 0, count: 0 } },
        shipClasses: [],
        topShips: [],
        soloStats: {
          soloKills: 0, iskDestroyedSolo: 0, soloRatio: 0, dangerRatio: 0, avgGangSize: 0,
        },
        corpIds: CORP_IDS,
        fetchedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
