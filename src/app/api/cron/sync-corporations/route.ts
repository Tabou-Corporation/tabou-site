/**
 * /api/cron/sync-corporations
 *
 * GET  — Appelé par Vercel Cron (auth: CRON_SECRET)
 * POST — Déclenchement manuel par un admin (auth: session director+)
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncAllCorporations } from "@/lib/sync/corporation-sync";
import { notifyCronSyncResult } from "@/lib/discord-notify";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Vercel Cron — auth par CRON_SECRET */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron] CRON_SECRET non configuré");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllCorporations();
    notifyCronSyncResult(result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] sync-corporations failed:", err);
    return NextResponse.json({ error: "Sync failed", message: String(err) }, { status: 500 });
  }
}

/** Déclenchement manuel — auth par session (director+) */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "director")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await syncAllCorporations();
    notifyCronSyncResult(result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] manual sync failed:", err);
    return NextResponse.json({ error: "Sync failed", message: String(err) }, { status: 500 });
  }
}
