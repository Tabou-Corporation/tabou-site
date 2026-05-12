/**
 * GET /api/map/system/[id]
 * Détail d'un système : tension décomposée, structures, campagnes, derniers events,
 * commentaires éditoriaux Tabou, épingles.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SDE_BY_ID } from "@/lib/map/sde";
import { getMapState } from "@/lib/map/state";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const systemId = Number(id);
  if (!Number.isFinite(systemId) || !SDE_BY_ID.has(systemId)) {
    return NextResponse.json({ error: "Unknown system" }, { status: 404 });
  }

  const state = await getMapState();
  const sys = state.systems.find((s) => s.system.systemId === systemId);
  if (!sys) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [structures, campaigns, events, comments, pins] = await Promise.all([
    prisma.mapStructureSnapshot.findMany({ where: { systemId } }),
    prisma.mapCampaignSnapshot.findMany({ where: { systemId } }),
    prisma.mapEvent.findMany({
      where: { systemId },
      orderBy: { occurredAt: "desc" },
      take: 20,
    }),
    prisma.mapComment.findMany({
      where: { OR: [{ systemId }, { systemId: null }] },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
    prisma.mapPin.findMany({ where: { systemId } }),
  ]);

  return NextResponse.json({
    system: sys,
    structures: structures.map((s) => ({
      ...s,
      structureId: s.structureId.toString(), // BigInt → string pour JSON
    })),
    campaigns,
    events: events.map((e) => ({
      ...e,
      meta: e.meta ? safeJson(e.meta) : null,
    })),
    comments,
    pins,
  });
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}
