import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import {
  MessageSquare, Shield, Calendar,
  CheckCircle, Clock, XCircle, Pin,
  HelpCircle, ArrowRight, RefreshCw,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { ROLE_LABELS, ROLE_BADGE_VARIANT } from "@/lib/constants/labels";

const APP_STATUS_LABEL: Record<string, string> = {
  PENDING:   "En attente de traitement",
  INTERVIEW: "En cours de traitement",
  ACCEPTED:  "Candidature acceptée",
  REJECTED:  "Candidature refusée",
};

const APP_STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:   <Clock         size={14} className="text-text-muted" />,
  INTERVIEW: <MessageSquare size={14} className="text-gold/80" />,
  ACCEPTED:  <CheckCircle   size={14} className="text-gold/80" />,
  REJECTED:  <XCircle       size={14} className="text-red-400" />,
};

const RSVP_BADGE: Record<string, { label: string; cls: string }> = {
  GOING:     { label: "Je participe", cls: "text-green-400  border-green-400/30  bg-green-400/5"  },
  MAYBE:     { label: "Peut-être",    cls: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5" },
  NOT_GOING: { label: "Absent",       cls: "text-red-400    border-red-400/30    bg-red-400/5"    },
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  op: "Op", training: "Formation", social: "Social", other: "Autre",
};

const RECURRENCE_LABEL: Record<string, string> = {
  weekly:   "Chaque semaine",
  biweekly: "Toutes les 2 semaines",
  monthly:  "Chaque mois",
};

// ── Page ──────────────────────────────────────────────────────────────────

export default async function MemberDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { name, image, role } = {
    name:  session.user.name ?? "Pilote",
    image: session.user.image ?? null,
    role:  (session.user.role ?? "candidate") as UserRole,
  };

  const isMember  = hasMinRole(role, "member_uz");
  const isOfficer = hasMinRole(role, "officer");

  const now      = new Date();
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const [application, recentAnnouncements, upcomingEvents] = await Promise.all([
    // Candidature — candidats seulement
    role === "candidate"
      ? prisma.application.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),

    // Dernières annonces — membres+
    isMember
      ? prisma.announcement.findMany({
          orderBy: { createdAt: "desc" },
          take: 4,
          select: { id: true, title: true, content: true, pinned: true, createdAt: true },
        })
      : Promise.resolve([]),

    // Prochains événements — membres+
    isMember
      ? prisma.calendarEvent.findMany({
          where: {
            OR: [
              { startAt: { gte: now, lte: in14Days } },
              { recurrence: { not: "none" }, recurrenceEndAt: { gte: now } },
            ],
          },
          orderBy: { startAt: "asc" },
          take: 4,
          include: {
            participations: {
              where:  { userId: session.user.id },
              select: { status: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const hasApplication    = !!application;
  const applicationActive = application && application.status !== "REJECTED";

  return (
    <div className="py-10 sm:py-14">
      <Container>

        {/* ── En-tête ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
          {image && (
            <Image
              src={image}
              alt={name}
              width={64}
              height={64}
              className="rounded-full border-2 border-gold/20 flex-shrink-0"
              unoptimized
            />
          )}
          <div>
            <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-1">
              Espace membre
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-primary">
              {name}
            </h1>
            <div className="mt-2">
              <Badge variant={ROLE_BADGE_VARIANT[role] ?? "default"}>{ROLE_LABELS[role] ?? role}</Badge>
            </div>
          </div>
        </div>

        <Separator gold className="mb-8" />

        {/* ─────────────────────────────────────────────────────── CANDIDAT ── */}
        {!isMember && (
          <div className="max-w-xl space-y-6">
            <Card className="border-gold/20">
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gold/70" />
                  <h2 className="font-display font-semibold text-base text-text-primary">
                    Candidature en cours
                  </h2>
                </div>

                {application && (
                  <div className="flex items-center gap-2 py-2 px-3 bg-bg-elevated rounded border border-border">
                    {APP_STATUS_ICON[application.status]}
                    <span className="text-text-secondary text-sm">
                      {APP_STATUS_LABEL[application.status] ?? application.status}
                    </span>
                  </div>
                )}

                {!hasApplication && (
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Vous n&apos;avez pas encore soumis de candidature.
                  </p>
                )}

                {application?.status === "ACCEPTED" && (
                  <p className="text-gold text-sm font-semibold">
                    Candidature acceptée — rechargez la page pour accéder à l&apos;espace membre.
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  {(!hasApplication || !applicationActive) && (
                    <Link
                      href="/membre/candidature"
                      className="inline-flex items-center gap-1.5 text-gold text-xs hover:text-gold-light transition-colors"
                    >
                      {hasApplication
                        ? "Soumettre une nouvelle candidature"
                        : "Soumettre ma candidature"}
                      <ArrowRight size={12} />
                    </Link>
                  )}
                  {hasApplication && applicationActive && application.status !== "ACCEPTED" && (
                    <Link
                      href="/membre/candidature"
                      className="inline-flex items-center gap-1.5 text-text-muted text-xs hover:text-text-secondary transition-colors"
                    >
                      Voir le détail de ma candidature <ArrowRight size={12} />
                    </Link>
                  )}
                  <a
                    href={SITE_CONFIG.links.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-text-muted text-xs hover:text-text-secondary transition-colors"
                  >
                    <MessageSquare size={13} />
                    Rejoindre le Discord
                  </a>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── MEMBRE+ ── */}
        {isMember && (
          <>
            {/* Raccourci staff */}
            {isOfficer && (
              <Card className="mb-8 border-gold/20" accent>
                <CardBody className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield size={15} className="text-gold/70" />
                    <span className="text-text-primary text-sm font-display font-semibold">
                      Zone Staff
                    </span>
                  </div>
                  <Link
                    href="/staff/candidatures"
                    className="inline-flex items-center gap-1 text-gold text-xs hover:text-gold-light transition-colors"
                  >
                    Gérer les candidatures <ArrowRight size={12} />
                  </Link>
                </CardBody>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

              {/* ── Annonces récentes ── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-lg text-text-primary">
                    Dernières annonces
                  </h2>
                  <Link
                    href="/membre/annonces"
                    className="text-xs text-text-muted hover:text-gold transition-colors inline-flex items-center gap-1"
                  >
                    Tout voir <ArrowRight size={11} />
                  </Link>
                </div>

                {recentAnnouncements.length === 0 ? (
                  <p className="text-text-muted text-sm italic">Aucune annonce pour le moment.</p>
                ) : (
                  <div className="space-y-3">
                    {recentAnnouncements.map((a) => (
                      <Card key={a.id} className={a.pinned ? "border-gold/20" : ""}>
                        <CardBody className="py-3 px-4">
                          <div className="flex items-start gap-2">
                            {a.pinned && (
                              <Pin size={11} className="text-gold/60 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-text-primary text-sm font-display font-semibold truncate">
                                {a.title}
                              </p>
                              <p className="text-text-muted text-xs leading-relaxed mt-0.5 line-clamp-2">
                                {a.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-text-muted mt-2">
                            {new Date(a.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric", month: "long",
                            })}
                          </p>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Prochains événements ── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-lg text-text-primary">
                    Prochains événements
                  </h2>
                  <Link
                    href="/membre/calendrier"
                    className="text-xs text-text-muted hover:text-gold transition-colors inline-flex items-center gap-1"
                  >
                    Calendrier <ArrowRight size={11} />
                  </Link>
                </div>

                {upcomingEvents.length === 0 ? (
                  <p className="text-text-muted text-sm italic">
                    Aucun événement prévu dans les 14 prochains jours.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((ev) => {
                      const rsvp     = ev.participations[0]?.status ?? null;
                      const rsvpInfo = rsvp ? RSVP_BADGE[rsvp] : null;
                      const isRecurring = ev.recurrence !== "none";

                      return (
                        <Card key={ev.id}>
                          <CardBody className="py-3 px-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-semibold tracking-widest uppercase text-gold/70">
                                    {EVENT_TYPE_LABEL[ev.type] ?? ev.type}
                                  </span>
                                  {isRecurring && (
                                    <RefreshCw size={10} className="text-text-muted" />
                                  )}
                                </div>
                                <p className="text-text-primary text-sm font-display font-semibold truncate">
                                  {ev.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Calendar size={11} className="text-text-muted flex-shrink-0" />
                                  <p className="text-text-muted text-[11px]">
                                    {isRecurring
                                      ? (RECURRENCE_LABEL[ev.recurrence] ?? "Récurrent")
                                      : `${new Date(ev.startAt).toLocaleDateString("fr-FR", {
                                          weekday: "short", day: "numeric", month: "short",
                                        })} — ${new Date(ev.startAt).toLocaleTimeString("fr-FR", {
                                          hour: "2-digit", minute: "2-digit",
                                        })} EVE`
                                    }
                                  </p>
                                </div>
                              </div>

                              {rsvpInfo ? (
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex-shrink-0 ${rsvpInfo.cls}`}
                                >
                                  {rsvpInfo.label}
                                </span>
                              ) : (
                                <Link
                                  href="/membre/calendrier"
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border text-text-muted hover:border-gold/40 hover:text-gold transition-colors flex-shrink-0 flex items-center gap-1"
                                >
                                  <HelpCircle size={10} />
                                  Répondre
                                </Link>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>

            </div>
          </>
        )}

      </Container>
    </div>
  );
}
