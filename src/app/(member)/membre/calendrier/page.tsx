import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Calendar, Plus, Clock } from "lucide-react";
import { deleteCalendarEvent } from "@/lib/actions/content";
import type { UserRole } from "@/types/roles";

const TYPE_LABELS: Record<string, string> = {
  op:       "Opération",
  training: "Formation",
  social:   "Event social",
  other:    "Autre",
};

const TYPE_BADGE: Record<string, "gold" | "muted" | "default"> = {
  op:       "gold",
  training: "default",
  social:   "muted",
  other:    "muted",
};

function formatEventDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " EVE";
}

export default async function CalendrierPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member")) redirect("/membre");

  const isOfficer = hasMinRole(role, "officer");

  const now = new Date();
  const [upcoming, past] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { startAt: { gte: now } },
      include: { author: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.calendarEvent.findMany({
      where: { startAt: { lt: now } },
      include: { author: true },
      orderBy: { startAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
              Espace membre
            </p>
            <h1 className="font-display font-bold text-3xl text-text-primary">
              Calendrier
            </h1>
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

        <Separator gold className="mb-8" />

        {/* Événements à venir */}
        <div className="mb-10">
          <h2 className="text-text-muted text-xs font-semibold uppercase tracking-extra-wide mb-4">
            À venir
          </h2>

          {upcoming.length === 0 ? (
            <Card>
              <CardBody className="py-10 text-center">
                <Calendar size={28} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-muted text-sm">Aucun événement planifié.</p>
                {isOfficer && (
                  <Link
                    href="/staff/calendrier/new"
                    className="inline-flex items-center gap-1.5 text-gold text-xs mt-3 hover:text-gold-light transition-colors"
                  >
                    <Plus size={13} />
                    Créer un événement
                  </Link>
                )}
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((event) => (
                <Card key={event.id} accent>
                  <CardBody className="flex items-start gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-display font-semibold text-base text-text-primary leading-snug">
                          {event.title}
                        </h3>
                        <Badge variant={TYPE_BADGE[event.type] ?? "muted"} className="flex-shrink-0">
                          {TYPE_LABELS[event.type] ?? event.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted text-xs mb-2">
                        <Clock size={12} />
                        <span className="capitalize">{formatEventDate(event.startAt)}</span>
                        <span>·</span>
                        <span>{formatEventTime(event.startAt)}</span>
                        {event.endAt && (
                          <>
                            <span>→</span>
                            <span>{formatEventTime(event.endAt)}</span>
                          </>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-text-secondary text-sm leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      <p className="text-text-muted text-xs mt-1">
                        Organisé par {event.author.name ?? "Officier"}
                      </p>
                    </div>
                    {isOfficer && (
                      <form action={deleteCalendarEvent.bind(null, event.id)}>
                        <button
                          type="submit"
                          className="text-text-muted text-xs hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          Supprimer
                        </button>
                      </form>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Événements passés */}
        {past.length > 0 && (
          <div>
            <h2 className="text-text-muted text-xs font-semibold uppercase tracking-extra-wide mb-4">
              Historique récent
            </h2>
            <div className="space-y-2 opacity-50">
              {past.map((event) => (
                <Card key={event.id}>
                  <CardBody className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-text-secondary text-sm font-display font-semibold">
                        {event.title}
                      </p>
                      <p className="text-text-muted text-xs">
                        {formatEventDate(event.startAt)}
                      </p>
                    </div>
                    <Badge variant={TYPE_BADGE[event.type] ?? "muted"}>
                      {TYPE_LABELS[event.type] ?? event.type}
                    </Badge>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
