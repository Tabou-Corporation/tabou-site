import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) return NextResponse.json(null, { status: 403 });

  const { id } = await params;
  const assembly = await prisma.assembly.findUnique({ where: { id } });
  if (!assembly) return NextResponse.json(null, { status: 404 });

  return NextResponse.json({
    id: assembly.id,
    title: assembly.title,
    content: assembly.content,
    discordSummary: assembly.discordSummary,
    videoUrl: assembly.videoUrl,
    type: assembly.type,
    heldAt: assembly.heldAt.toISOString(),
  });
}
