/**
 * GET /api/map/state
 *
 * Public. Renvoie l'agrégat carte complet (systèmes + tension + health).
 * Cache HTTP : 30s public, stale-while-revalidate 60s.
 */

import { NextResponse } from "next/server";
import { getMapState } from "@/lib/map/state";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getMapState();
    return NextResponse.json(state, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[api/map/state]", err);
    return NextResponse.json({ error: "Failed to build map state" }, { status: 500 });
  }
}
