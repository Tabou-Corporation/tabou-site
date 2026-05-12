/**
 * /api/cron/map-sync
 *
 * GET  — Vercel Cron (CRON_SECRET).
 * POST — Déclenchement manuel (officer+).
 *
 * Lance les workers ESI dans l'ordre :
 *  1. sovereignty/map       (Expires 1h)
 *  2. sovereignty/structures (Expires 30min)
 *  3. sovereignty/campaigns  (Expires 5min)
 *  4. system_kills + system_jumps (Expires 1h)
 *
 * Le cache respecte ses TTL — appeler ce cron plus souvent que les Expires ne
 * provoque pas de requêtes ESI supplémentaires (304 ou hit cache).
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasMinRole, type UserRole } from "@/types/roles";
import { verifyCronSecret } from "@/lib/cron-auth";
import { ingestSovMap } from "@/lib/map/esi/sovereignty";
import { ingestSovStructures } from "@/lib/map/esi/structures";
import { ingestSovCampaigns } from "@/lib/map/esi/campaigns";
import { ingestSystemActivity } from "@/lib/map/esi/activity";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function runAll() {
  const [sov, structures, campaigns, activity] = await Promise.all([
    ingestSovMap().catch((e) => ({ ok: false, error: String(e) })),
    ingestSovStructures().catch((e) => ({ ok: false, error: String(e) })),
    ingestSovCampaigns().catch((e) => ({ ok: false, error: String(e) })),
    ingestSystemActivity().catch((e) => ({ ok: false, error: String(e) })),
  ]);
  return { sov, structures, campaigns, activity, ranAt: new Date().toISOString() };
}

export async function GET(request: Request) {
  const check = verifyCronSecret(request.headers.get("authorization"));
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  try {
    const result = await runAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] map-sync failed:", err);
    return NextResponse.json({ error: "Sync failed", message: String(err) }, { status: 500 });
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const result = await runAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] map-sync manual failed:", err);
    return NextResponse.json({ error: "Sync failed", message: String(err) }, { status: 500 });
  }
}
