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
import { verifyCronSecret } from "@/lib/cron-auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Vercel Cron — auth par CRON_SECRET (timing-safe) */
export async function GET(request: Request) {
  const check = verifyCronSecret(request.headers.get("authorization"));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
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
