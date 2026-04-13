import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";

/**
 * GET /api/members/search?q=vov
 * Returns members matching the query (for @mention autocomplete in editor).
 * Requires member_uz+ role.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 });
  }
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) {
    return NextResponse.json([], { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const members = await prisma.user.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
      role: { notIn: ["suspended", "candidate"] },
    },
    select: {
      id: true,
      name: true,
      eveCharacterId: true,
      role: true,
    },
    take: 8,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      name: m.name ?? "Inconnu",
      characterId: m.eveCharacterId,
      role: m.role,
      portrait: m.eveCharacterId
        ? `https://images.evetech.net/characters/${m.eveCharacterId}/portrait?size=32`
        : null,
    }))
  );
}
