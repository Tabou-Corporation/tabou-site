/**
 * DELETE /api/map/pins/[id] — officer+ : retire une épingle.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hasMinRole, type UserRole } from "@/types/roles";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.mapPin.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.mapPin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
