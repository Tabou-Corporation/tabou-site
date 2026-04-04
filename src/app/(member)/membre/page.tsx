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
  User, MessageSquare, Shield, Calendar,
  BookOpen, Users, FileText, CheckCircle,
  Clock, XCircle, Pin,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";

const ROLE_LABELS: Record<UserRole, string> = {
  public: "Public", candidate: "Candidat", member: "Membre",
  recruiter: "Recruteur", officer: "Officier", admin: "Administrateur",
};

const ROLE_BADGE_VARIANT: Record<UserRole, "muted" | "gold" | "default"> = {
  public: "muted", candidate: "muted", member: "gold",
  recruiter: "gold", officer: "gold", admin: "gold",
};

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de traitement",
  INTERVIEW: "Entretien en cours",
  ACCEPTED: "Candidature acceptée",
  REJECTED: "Candidature refusée",
};

const APPLICATION_STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:   <Clock size={14} className="text-text-muted" />,
  INTERVIEW: <MessageSquare size={14} className="text-gold/80" />,
  ACCEPTED:  <CheckCircle size={14} className="text-gold/80" />,
  REJECTED:  <XCircle size={14} className="text-red-400" />,
};

export default async function MemberDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { name, image, role } = {
    name:  session.user.name ?? "Pilote",
    image: session.user.image ?? null,
    role:  (session.user.role ?? "candidate") as UserRole,
  };

  const isMember    = hasMinRole(role, "member");
  const isRecruiter = hasMinRole(role, "recruiter");

  const [application, pinnedAnnouncements] = await Promise.all([
    role === "candidate"
      ? prisma.application.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
    isMember
      ? prisma.announcement.findMany({
          where: { pinned: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        })
      : Promise.resolve([]),
  ]);

  const hasApplication    = !!application;
  const applicationActive = application && application.status !== "REJECTED";

  return (
    <div className="py-10 sm:py-14">
      <Container>
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
          {image && (
            <Image
              src={image}
              alt={name}
              width={80}
              height={80}
              className="rounded-full border-2 border-gold/20"
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
              <Badge variant={ROLE_BADGE_VARIANT[role]}>{ROLE_LABELS[role]}</Badge>
            </div>
          </div>
        </div>

        <Separator gold className="mb-10" />

        {/* Annonces épinglées */}
        {pinnedAnnouncements.length > 0 && (
          <div className="mb-8 space-y-3">
            {pinnedAnnouncements.map((a) => (
              <Card key={a.id} accent>
                <CardBody className="py-3">
                  <div className="flex items-start gap-2">
                    <Pin size={12} className="text-gold/70 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-text-primary text-sm font-display font-semibold">
                        {a.title}
                      </p>
                      <p className="text-text-secondary text-xs leading-relaxed mt-0.5 line-clamp-2">
                        {a.content}
                      </p>
                    </div>
                    <Link
                      href="/membre/annonces"
                      className="text-gold text-xs hover:text-gold-light transition-colors ml-auto flex-shrink-0"
                    >
                      Lire →
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Candidat — statut candidature */}
        {!isMember && (
          <Card className="mb-8 border-gold/20">
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-gold/70" />
                <h2 className="font-display font-semibold text-base text-text-primary">
                  Candidature en cours
                </h2>
              </div>

              {hasApplication && application && (
                <div className="flex items-center gap-2 py-2 px-3 bg-bg-elevated rounded border border-border">
                  {APPLICATION_STATUS_ICON[application.status]}
                  <span className="text-text-secondary text-sm">
                    {APPLICATION_STATUS_LABELS[application.status] ?? application.status}
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
                  Candidature acceptée ! Rechargez la page.
                </p>
              )}

              {(!hasApplication || !applicationActive) && (
                <Link href="/membre/candidature" className="inline-flex items-center gap-1.5 text-gold text-xs hover:text-gold-light transition-colors">
                  <FileText size={13} />
                  {hasApplication ? "Soumettre une nouvelle candidature" : "Soumettre ma candidature"}
                </Link>
              )}
              {hasApplication && applicationActive && application.status !== "ACCEPTED" && (
                <Link href="/membre/candidature" className="inline-flex items-center gap-1.5 text-text-muted text-xs hover:text-text-secondary transition-colors">
                  <FileText size={13} />
                  Voir le détail de ma candidature
                </Link>
              )}
              {application?.status !== "INTERVIEW" && application?.status !== "ACCEPTED" && (
                <Link href={SITE_CONFIG.links.discord} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-text-muted text-xs hover:text-text-secondary transition-colors">
                  <MessageSquare size={13} />
                  Rejoindre le Discord
                </Link>
              )}
            </CardBody>
          </Card>
        )}

        {/* Raccourci recruteur */}
        {isRecruiter && (
          <Card className="mb-8 border-gold/20" accent>
            <CardBody className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gold/70" />
                <span className="text-text-primary text-sm font-display font-semibold">Zone staff</span>
              </div>
              <Link href="/staff/candidatures" className="text-gold text-xs hover:text-gold-light transition-colors">
                Gérer les candidatures →
              </Link>
            </CardBody>
          </Card>
        )}

        {/* Raccourcis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          <Link href="/membre/profil">
            <Card interactive className="h-full">
              <CardBody className="flex items-start gap-4">
                <User size={20} className="text-gold/70 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-display font-semibold text-base text-text-primary mb-1">Mon profil</h3>
                  <p className="text-text-muted text-xs leading-relaxed">Informations de votre personnage EVE</p>
                </div>
              </CardBody>
            </Card>
          </Link>

          {role === "candidate" && (
            <Link href="/membre/candidature">
              <Card interactive className="h-full">
                <CardBody className="flex items-start gap-4">
                  <FileText size={20} className="text-gold/70 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-display font-semibold text-base text-text-primary mb-1">Ma candidature</h3>
                    <p className="text-text-muted text-xs leading-relaxed">
                      {hasApplication ? "Suivre le statut de ma candidature" : "Soumettre une candidature"}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          )}

          <a href={SITE_CONFIG.links.discord} target="_blank" rel="noopener noreferrer">
            <Card interactive className="h-full">
              <CardBody className="flex items-start gap-4">
                <MessageSquare size={20} className="text-gold/70 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-display font-semibold text-base text-text-primary mb-1">Discord</h3>
                  <p className="text-text-muted text-xs leading-relaxed">Communication principale de la corporation</p>
                </div>
              </CardBody>
            </Card>
          </a>

          {isMember && (
            <>
              <Link href="/membre/annonces">
                <Card interactive className="h-full">
                  <CardBody className="flex items-start gap-4">
                    <Pin size={20} className="text-gold/70 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-display font-semibold text-base text-text-primary mb-1">Annonces</h3>
                      <p className="text-text-muted text-xs leading-relaxed">Communications de la direction</p>
                    </div>
                  </CardBody>
                </Card>
              </Link>

              <Link href="/membre/calendrier">
                <Card interactive className="h-full">
                  <CardBody className="flex items-start gap-4">
                    <Calendar size={20} className="text-gold/70 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-display font-semibold text-base text-text-primary mb-1">Calendrier</h3>
                      <p className="text-text-muted text-xs leading-relaxed">Opérations et événements à venir</p>
                    </div>
                  </CardBody>
                </Card>
              </Link>

              <Link href="/membre/guides">
                <Card interactive className="h-full">
                  <CardBody className="flex items-start gap-4">
                    <BookOpen size={20} className="text-gold/70 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-display font-semibold text-base text-text-primary mb-1">Guides</h3>
                      <p className="text-text-muted text-xs leading-relaxed">Documentation interne de la corp</p>
                    </div>
                  </CardBody>
                </Card>
              </Link>

              <Link href="/membre/annuaire">
                <Card interactive className="h-full">
                  <CardBody className="flex items-start gap-4">
                    <Users size={20} className="text-gold/70 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-display font-semibold text-base text-text-primary mb-1">Annuaire</h3>
                      <p className="text-text-muted text-xs leading-relaxed">Membres de la corporation</p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
