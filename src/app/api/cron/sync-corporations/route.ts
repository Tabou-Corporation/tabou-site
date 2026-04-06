/**
 * GET /api/cron/sync-corporations
 *
 * Endpoint appelé par Vercel Cron toutes les 6h.
 * Synchronise les corporations EVE de tous les membres actifs via ESI.
 *
 * Sécurité :
 *  - Authentifié par CRON_SECRET (envoyé automatiquement par Vercel)
 *  - Peut aussi être déclenché manuellement par un admin via le header Authorization
 */

import { NextResponse } from "next/server";
import { syncAllCorporations } from "@/lib/sync/corporation-sync";

export const maxDuration = 60; // secondes (Vercel Pro : jusqu'à 300)
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vérification du secret CRON
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron] CRON_SECRET non configuré");
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await syncAllCorporations();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error("[cron] sync-corporations failed:", err);
    return NextResponse.json(
      { error: "Sync failed", message: String(err) },
      { status: 500 },
    );
  }
}
