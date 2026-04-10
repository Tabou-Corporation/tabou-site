import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import {
  MessageSquare, Shield, Calendar, Megaphone, Scroll,
  CheckCircle, Clock, XCircle, Pin,
  HelpCircle, ArrowRight, RefreshCw, Video, Store,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { ROLE_LABELS, ROLE_BADGE_VARIANT } from "@/lib/constants/labels";

// ── Labels ──────────────────────────────────────────────────────────────

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

const EVENT_TYPE_COLOR: Record<string, string> = {
  op:       "text-gold",
  training: "text-blue-400",
  social:   "text-purple-400",
  other:    "text-text-muted",
};

// ── Helpers ─────────────────────────────────────────────────────────────

function relativeDate(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (days < 0) return `${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} ${time}`;
  if (days === 0) return `Aujourd'hui ${time}`;
  if (days === 1) return `Demain ${time}`;
  if (days < 7) {
    const weekday = date.toLocaleDateString("fr-FR", { weekday: "long" });
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${time}`;
  }
  return `${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} ${time}`;
}

// ── Page ────────────────────────────────────────────────────────────────

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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [application, recentAnnouncements, upcomingEvents, lastAssembly, recentAnnouncementCount, pendingCount, myOpenListings, pendingOffersReceived, myPendingOffers, lastTransaction] = await Promise.all([
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
          take: 5,
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
          take: 5,
          include: {
            participations: {
              where:  { userId: session.user.id },
              select: { status: true },
            },
          },
        })
      : Promise.resolve([]),

    // Dernière assemblée
    isMember
      ? prisma.assembly.findFirst({
          orderBy: { heldAt: "desc" },
          select: { id: true, title: true, type: true, heldAt: true, videoUrl: true },
        })
      : Promise.resolve(null),

    // Nombre d'annonces de la semaine
    isMember
      ? prisma.announcement.count({ where: { createdAt: { gte: sevenDaysAgo } } })
      : Promise.resolve(0),

    // Candidatures en attente — officers+
    isOfficer
      ? prisma.application.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),

    // Marche — mes annonces ouvertes
    isMember
      ? prisma.marketListing.count({ where: { userId: session.user.id, status: "OPEN" } })
      : Promise.resolve(0),

    // Marche — offres recues en attente sur mes annonces
    isMember
      ? prisma.marketOffer.count({
          where: { status: "PENDING", listing: { userId: session.user.id, status: "OPEN" } },
        })
      : Promise.resolve(0),

    // Marche — mes offres en attente
    isMember
      ? prisma.marketOffer.count({ where: { userId: session.user.id, status: "PENDING" } })
      : Promise.resolve(0),

    // Marche — derniere transaction
    isMember
      ? prisma.marketTransaction.findFirst({
          where: { OR: [{ sellerId: session.user.id }, { buyerId: session.user.id }] },
          orderBy: { createdAt: "desc" },
          select: { listingTitle: true, finalPrice: true, createdAt: true, sellerId: true },
        })
      : Promise.resolve(null),
  ]);

  const hasApplication    = !!application;
  const applicationActive = application && application.status !== "REJECTED";

  // Prochain événement personnel (avec RSVP GOING)
  const nextPersonalEvent = upcomingEvents.find(
    (ev) => ev.participations[0]?.status === "GOING"
  ) ?? upcomingEvents[0] ?? null;

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
                  <div className="space-y-1">
                    <p className="text-gold text-sm font-semibold">
                      Candidature acceptée !
                    </p>
                    <p className="text-text-muted text-xs leading-relaxed">
                      Rejoignez la corporation en jeu (Tabou ou Urban Zone) puis reconnectez-vous.
                      L&apos;ESI peut prendre ~1h pour propager le changement.
                    </p>
                  </div>
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
                  {hasApplication && applicationActive && (
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
            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {/* Prochain événement */}
              <Link href="/membre/calendrier">
                <Card interactive className="h-full">
                  <CardBody className="py-4 px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={14} className="text-gold/60" />
                      <span className="text-[10px] font-semibold uppercase tracking-extra-wide text-text-muted">
                        Prochain événement
                      </span>
                    </div>
                    {nextPersonalEvent ? (
                      <>
                        <p className="text-text-primary text-sm font-display font-semibold truncate">
                          {nextPersonalEvent.title}
                        </p>
                        <p className="text-text-muted text-xs mt-0.5">
                          {relativeDate(new Date(nextPersonalEvent.startAt))} EVE
                        </p>
                      </>
                    ) : (
                      <p className="text-text-muted text-sm italic">Aucun événement à venir</p>
                    )}
                  </CardBody>
                </Card>
              </Link>

              {/* Annonces récentes */}
              <Link href="/membre/annonces">
                <Card interactive className="h-full">
                  <CardBody className="py-4 px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Megaphone size={14} className="text-gold/60" />
                      <span className="text-[10px] font-semibold uppercase tracking-extra-wide text-text-muted">
                        Annonces
                      </span>
                    </div>
                    {recentAnnouncementCount > 0 ? (
                      <>
                        <p className="text-text-primary text-sm font-display font-semibold">
                          {recentAnnouncementCount} nouvelle{recentAnnouncementCount > 1 ? "s" : ""}
                        </p>
                        <p className="text-text-muted text-xs mt-0.5">cette semaine</p>
                      </>
                    ) : (
                      <p className="text-text-muted text-sm italic">Rien de nouveau</p>
                    )}
                  </CardBody>
                </Card>
              </Link>

              {/* Dernière assemblée */}
              <Link href={lastAssembly ? `/membre/assemblees/${lastAssembly.id}` : "/membre/assemblees"}>
                <Card interactive className="h-full">
                  <CardBody className="py-4 px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Scroll size={14} className="text-gold/60" />
                      <span className="text-[10px] font-semibold uppercase tracking-extra-wide text-text-muted">
                        Dernière assemblée
                      </span>
                    </div>
                    {lastAssembly ? (
                      <>
                        <p className="text-text-primary text-sm font-display font-semibold truncate">
                          {lastAssembly.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-text-muted text-xs">
                            {new Date(lastAssembly.heldAt).toLocaleDateString("fr-FR", {
                              day: "numeric", month: "long",
                            })}
                          </span>
                          {lastAssembly.videoUrl && (
                            <span className="inline-flex items-center gap-0.5 text-text-muted text-xs">
                              <Video size={10} />
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-text-muted text-sm italic">Aucune assemblée</p>
                    )}
                  </CardBody>
                </Card>
              </Link>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ── Colonne gauche (2/3) ── */}
              <div className="lg:col-span-2 space-y-8">

                {/* Prochains événements */}
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
                    <Card>
                      <CardBody className="py-8 text-center">
                        <Calendar size={24} className="text-text-muted/40 mx-auto mb-2" />
                        <p className="text-text-muted text-sm">
                          Aucun événement dans les 14 prochains jours.
                        </p>
                      </CardBody>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {upcomingEvents.map((ev) => {
                        const rsvp     = ev.participations[0]?.status ?? null;
                        const rsvpInfo = rsvp ? RSVP_BADGE[rsvp] : null;
                        const isRecurring = ev.recurrence !== "none";
                        const typeColor = EVENT_TYPE_COLOR[ev.type] ?? "text-text-muted";

                        return (
                          <Card key={ev.id}>
                            <CardBody className="py-3 px-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {/* Type dot */}
                                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-14">
                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${typeColor}`}>
                                      {EVENT_TYPE_LABEL[ev.type] ?? ev.type}
                                    </span>
                                    {isRecurring && <RefreshCw size={9} className="text-text-muted/50" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-text-primary text-sm font-display font-semibold truncate">
                                      {ev.title}
                                    </p>
                                    <p className="text-text-muted text-xs mt-0.5">
                                      {relativeDate(new Date(ev.startAt))} EVE
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

                {/* Zone Staff */}
                {isOfficer && (
                  <Card className="border-gold/20" accent>
                    <CardBody className="py-3 px-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-gold/70" />
                          <span className="text-text-primary text-sm font-display font-semibold">
                            Zone Staff
                          </span>
                          {pendingCount > 0 && (
                            <span className="bg-gold text-bg-deep text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                              {pendingCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          {pendingCount > 0 && (
                            <Link href="/staff/candidatures" className="text-gold hover:text-gold-light transition-colors">
                              {pendingCount} candidature{pendingCount > 1 ? "s" : ""} en attente
                            </Link>
                          )}
                          <Link href="/staff/annonces" className="text-text-muted hover:text-text-secondary transition-colors">
                            Annonces
                          </Link>
                          <Link href="/staff/guides" className="text-text-muted hover:text-text-secondary transition-colors">
                            Guides
                          </Link>
                          <Link href="/staff/calendrier" className="text-text-muted hover:text-text-secondary transition-colors">
                            Événements
                          </Link>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>

              {/* ── Colonne droite (1/3) ── */}
              <div className="space-y-8">

                {/* Annonces */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold text-lg text-text-primary">
                      Annonces
                    </h2>
                    <Link
                      href="/membre/annonces"
                      className="text-xs text-text-muted hover:text-gold transition-colors inline-flex items-center gap-1"
                    >
                      Tout voir <ArrowRight size={11} />
                    </Link>
                  </div>

                  {recentAnnouncements.length === 0 ? (
                    <p className="text-text-muted text-sm italic">Aucune annonce.</p>
                  ) : (
                    <div className="space-y-2">
                      {recentAnnouncements.map((a) => (
                        <Link key={a.id} href="/membre/annonces">
                          <Card interactive className={a.pinned ? "border-gold/20" : ""}>
                            <CardBody className="py-2.5 px-3.5">
                              <div className="flex items-start gap-2">
                                {a.pinned && (
                                  <Pin size={10} className="text-gold/60 mt-1 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-text-primary text-sm font-medium truncate">
                                    {a.title}
                                  </p>
                                  <p className="text-text-muted text-[11px] mt-0.5">
                                    {timeAgo(a.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                {/* Activite marche */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-semibold text-lg text-text-primary">
                      Marche
                    </h2>
                    <Link
                      href="/membre/marche"
                      className="text-xs text-text-muted hover:text-gold transition-colors inline-flex items-center gap-1"
                    >
                      Voir tout <ArrowRight size={11} />
                    </Link>
                  </div>
                  <Card>
                    <CardBody className="py-3 px-4 space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted text-xs">Mes annonces actives</span>
                        <span className="text-text-primary font-mono font-semibold">{myOpenListings}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted text-xs">Offres a traiter</span>
                        <span className={pendingOffersReceived > 0 ? "text-gold font-mono font-bold" : "text-text-primary font-mono font-semibold"}>
                          {pendingOffersReceived}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted text-xs">Mes offres en cours</span>
                        <span className="text-text-primary font-mono font-semibold">{myPendingOffers}</span>
                      </div>
                      {lastTransaction && (
                        <div className="border-t border-border-subtle pt-2 mt-1">
                          <p className="text-text-muted text-[10px] uppercase tracking-wide font-semibold mb-1">
                            Derniere transaction
                          </p>
                          <p className="text-text-primary text-xs font-medium truncate">
                            {lastTransaction.listingTitle}
                          </p>
                          <p className="text-text-muted text-[11px] mt-0.5">
                            {lastTransaction.finalPrice && (
                              <span className="text-gold font-mono">{formatISK(lastTransaction.finalPrice)} ISK</span>
                            )}
                            {" · "}
                            {lastTransaction.sellerId === session.user.id ? "Vendu" : "Achete"}
                            {" · "}
                            {timeAgo(lastTransaction.createdAt)}
                          </p>
                        </div>
                      )}
                      {myOpenListings === 0 && pendingOffersReceived === 0 && myPendingOffers === 0 && !lastTransaction && (
                        <div className="text-center py-2">
                          <Store size={18} className="text-text-muted/40 mx-auto mb-1" />
                          <p className="text-text-muted text-xs">Aucune activite marche</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </section>

                {/* Top Pilotes du mois */}
                <section>
                  <h2 className="font-display font-semibold text-lg text-text-primary mb-4">
                    Top pilotes du mois
                  </h2>
                  <Card>
                    <CardBody className="py-1 px-0">
                      <Suspense fallback={
                        <p className="text-text-muted text-xs italic px-4 py-3">Chargement…</p>
                      }>
                        <DashboardTopPilots />
                      </Suspense>
                    </CardBody>
                  </Card>
                </section>
              </div>
            </div>
          </>
        )}

      </Container>
    </div>
  );
}

// ── ISK helper ──────────────────────────────────────────────────────────

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return `${Math.round(amount)}`;
}

// ── Time ago helper ─────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return "il y a quelques minutes";
  if (hours < 24) return `il y a ${hours}h`;
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── Top Pilots wrapper (server component, no width constraint) ──────────

import { fetchTopPilotsPodium } from "@/lib/zkillboard/top-pilot";
import { TopPilotPodium } from "@/components/blocks/TopPilotPodium";

async function DashboardTopPilots() {
  const pilots = await fetchTopPilotsPodium();
  if (!pilots.length) {
    return <p className="text-text-muted text-xs italic px-4 py-3">Pas de données ce mois-ci.</p>;
  }
  return <TopPilotPodium pilots={pilots} />;
}
