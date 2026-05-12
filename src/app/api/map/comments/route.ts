/**
 * POST   /api/map/comments  — officer+ : crée un commentaire éditorial.
 * GET    /api/map/comments?systemId=&limit=  — public.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasMinRole, type UserRole } from "@/types/roles";
import { SDE_BY_ID } from "@/lib/map/sde";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const systemIdStr = url.searchParams.get("systemId");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const where: Record<string, unknown> = {};
  if (systemIdStr) {
    const sid = Number(systemIdStr);
    if (Number.isFinite(sid)) where.systemId = sid;
  }

  const comments = await prisma.mapComment.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return NextResponse.json({ comments });
}

const createSchema = z.object({
  systemId: z.number().int().nullable().optional(),
  body: z.string().min(2).max(4000),
  pinned: z.boolean().optional().default(false),
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

  const comment = await prisma.mapComment.create({
    data: {
      systemId: parsed.data.systemId ?? null,
      authorId: session.user.id,
      body: parsed.data.body,
      pinned: parsed.data.pinned,
    },
  });
  return NextResponse.json({ comment }, { status: 201 });
}
