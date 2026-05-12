/**
 * GET  /api/map/events?since=ISO&systemId=&limit=
 * POST /api/map/events  — officer+ : crée un événement manuel.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasMinRole, type UserRole } from "@/types/roles";
import { createManualEvent } from "@/lib/map/events";
import { SDE_BY_ID } from "@/lib/map/sde";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const systemIdStr = url.searchParams.get("systemId");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

  const where: Record<string, unknown> = {};
  if (since) {
    const d = new Date(since);
    if (!isNaN(d.getTime())) where.occurredAt = { gte: d };
  }
  if (systemIdStr) {
    const sid = Number(systemIdStr);
    if (Number.isFinite(sid)) where.systemId = sid;
  }

  const events = await prisma.mapEvent.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    events: events.map((e) => ({ ...e, meta: e.meta ? safeJson(e.meta) : null })),
  });
}

const createSchema = z.object({
  systemId: z.number().int().nullable().optional(),
  severity: z.enum(["info", "warn", "alert"]).default("info"),
  title: z.string().min(3).max(200),
  body: z.string().max(4000).optional(),
  occurredAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.systemId != null && !SDE_BY_ID.has(parsed.data.systemId)) {
    return NextResponse.json({ error: "Unknown systemId" }, { status: 400 });
  }

  const event = await createManualEvent({
    authorId: session.user.id,
    systemId: parsed.data.systemId ?? null,
    severity: parsed.data.severity,
    title: parsed.data.title,
    ...(parsed.data.body !== undefined ? { body: parsed.data.body } : {}),
    ...(parsed.data.occurredAt ? { occurredAt: new Date(parsed.data.occurredAt) } : {}),
  });

  return NextResponse.json({ event }, { status: 201 });
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}
