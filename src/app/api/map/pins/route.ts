/**
 * GET  /api/map/pins  — public, toutes les épingles actives.
 * POST /api/map/pins  — officer+ : ajoute une épingle.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasMinRole, type UserRole } from "@/types/roles";
import { SDE_BY_ID } from "@/lib/map/sde";

export const dynamic = "force-dynamic";

export async function GET() {
  const pins = await prisma.mapPin.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ pins });
}

const createSchema = z.object({
  systemId: z.number().int(),
  label: z.string().min(1).max(60),
  kind: z.enum(["info", "hostile", "friendly", "objective"]).default("info"),
  note: z.string().max(280).optional(),
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
  if (!SDE_BY_ID.has(parsed.data.systemId)) {
    return NextResponse.json({ error: "Unknown systemId" }, { status: 400 });
  }

  const pin = await prisma.mapPin.create({
    data: {
      systemId: parsed.data.systemId,
      label: parsed.data.label,
      kind: parsed.data.kind,
      note: parsed.data.note ?? null,
      authorId: session.user.id,
    },
  });
  return NextResponse.json({ pin }, { status: 201 });
}
