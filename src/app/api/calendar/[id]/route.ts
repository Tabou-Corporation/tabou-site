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
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json(null, { status: 404 });

  return NextResponse.json({
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type,
    domain: event.domain,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    recurrence: event.recurrence,
    recurrenceEndAt: event.recurrenceEndAt?.toISOString() ?? null,
  });
}
