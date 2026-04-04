import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const bio = typeof (body as Record<string, unknown>).bio === "string"
    ? (body as Record<string, unknown>).bio as string
    : null;

  if (bio !== null && bio.length > 160) {
    return NextResponse.json({ error: "Bio trop longue (max 160 caractères)" }, { status: 422 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { bio: bio?.trim() || null },
    select: { id: true, bio: true },
  });

  return NextResponse.json(user);
}
