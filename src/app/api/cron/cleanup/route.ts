/**
 * /api/cron/cleanup
 *
 * Nettoyage periodique de la base de donnees.
 * Appelé par Vercel Cron (auth: CRON_SECRET).
 *
 * Actions :
 * 1. Notifications lues > 30 jours  → supprimees
 * 2. Audit logs > 90 jours          → supprimes
 * 3. Sessions expirees              → supprimees
 * 4. Annonces EXPIRED/CLOSED > 60 j → supprimees (cascade offres)
 * 5. Annonces OPEN expirees         → passees en EXPIRED + notifs
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expireListings } from "@/lib/actions/buyback";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron/cleanup] CRON_SECRET non configure");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: Record<string, number> = {};

  try {
    // 1. Notifications lues > 30 jours
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const notifs = await prisma.notification.deleteMany({
      where: { read: true, createdAt: { lt: thirtyDaysAgo } },
    });
    results.readNotifications = notifs.count;

    // 2. Audit logs > 90 jours
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const audits = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });
    results.auditLogs = audits.count;

    // 3. Sessions expirees
    const sessions = await prisma.session.deleteMany({
      where: { expires: { lt: now } },
    });
    results.expiredSessions = sessions.count;

    // 4. Annonces EXPIRED/CLOSED > 60 jours (cascade → offres supprimees aussi)
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const listings = await prisma.marketListing.deleteMany({
      where: {
        status: { in: ["EXPIRED", "CLOSED"] },
        updatedAt: { lt: sixtyDaysAgo },
      },
    });
    results.oldListings = listings.count;

    // 5. Expirer les annonces OPEN depassees (+ notifications)
    const expired = await expireListings();
    results.newlyExpired = expired;

    console.log("[cron/cleanup] Resultat :", results);
    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("[cron/cleanup] Erreur :", err);
    return NextResponse.json({ error: "Cleanup failed", message: String(err) }, { status: 500 });
  }
}
