import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Separator } from "@/components/ui/Separator";
import { CorpCalendar } from "@/components/blocks/CorpCalendar";
import { expandRecurringEvents } from "@/lib/utils/recurrence";
import { Plus } from "lucide-react";
import type { UserRole } from "@/types/roles";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");

  const isOfficer = hasMinRole(role, "officer");

  const events = await prisma.calendarEvent.findMany({
    include: {
      author: { select: { name: true } },
      participations: {
        select: {
          userId: true,
          status: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { startAt: "asc" },
  });

  // Expand recurring events into individual occurrences
  const expanded = expandRecurringEvents(
    events.map((e) => ({
      ...e,
      recurrenceEndAt: e.recurrenceEndAt ?? null,
    }))
  );

  const serialized = expanded.map(({ occurrenceId, startAt, endAt, base: e }) => ({
    id: occurrenceId,
    eventId: e.id,
    title: e.title,
    type: e.type,
    description: e.description,
    recurrence: e.recurrence,
    startAt,
    endAt,
    authorName: e.author.name,
    participations: e.participations.map((p) => ({
      userId: p.userId,
      status: p.status as "GOING" | "MAYBE" | "NOT_GOING",
      userName: p.user.name,
    })),
  }));

  const now = new Date();
  const upcomingCount = serialized.filter(e => e.startAt >= now).length;
  const myRsvpCount   = events.filter(e =>
    e.participations.some(p => p.userId === session.user.id && p.status === "GOING")
  ).length;

  return (
    <div className="py-10 sm:py-14">
      <Container size="lg">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
              Espace membre
            </p>
            <h1 className="font-display font-bold text-3xl text-text-primary">
              Calendrier
            </h1>
            <p className="text-text-muted text-sm mt-1.5">
              <span className="text-text-secondary font-semibold">{upcomingCount}</span> événement{upcomingCount !== 1 ? "s" : ""} à venir
              {myRsvpCount > 0 && (
                <> · <span className="text-gold font-semibold">{myRsvpCount}</span> confirmé{myRsvpCount !== 1 ? "s" : ""}</>
              )}
            </p>
          </div>
          {isOfficer && (
            <Link
              href="/staff/calendrier/new"
              className="inline-flex items-center gap-1.5 text-gold text-sm hover:text-gold-light transition-colors mt-1"
            >
              <Plus size={16} />
              Nouvel événement
            </Link>
          )}
        </div>

        <Separator gold className="my-6" />

        {/* ── Légende ── */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {[
            { type: "op",       label: "Opération",    bg: "bg-[rgba(240,176,48,0.85)]" },
            { type: "training", label: "Formation",    bg: "bg-[rgba(59,130,246,0.75)]" },
            { type: "social",   label: "Event social", bg: "bg-[rgba(139,92,246,0.75)]" },
            { type: "other",    label: "Autre",        bg: "bg-[rgba(107,114,128,0.75)]" },
          ].map(({ type, label, bg }) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${bg}`} />
              <span className="text-xs text-text-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Calendrier ── */}
        <CorpCalendar
          events={serialized}
          currentUserId={session.user.id}
          isOfficer={isOfficer}
        />
      </Container>
    </div>
  );
}
