import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { User, MessageSquare, Shield, Calendar, BookOpen, Users } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";

const ROLE_LABELS: Record<UserRole, string> = {
  public: "Public",
  candidate: "Candidat",
  member: "Membre",
  recruiter: "Recruteur",
  officer: "Officier",
  admin: "Administrateur",
};

const ROLE_BADGE_VARIANT: Record<UserRole, "muted" | "gold" | "default"> = {
  public: "muted",
  candidate: "muted",
  member: "gold",
  recruiter: "gold",
  officer: "gold",
  admin: "gold",
};

export default async function MemberDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { name, image, role } = {
    name: session.user.name ?? "Pilote",
    image: session.user.image ?? null,
    role: (session.user.role ?? "candidate") as UserRole,
  };

  const isMember = hasMinRole(role, "member");

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
              <Badge variant={ROLE_BADGE_VARIANT[role]}>
                {ROLE_LABELS[role]}
              </Badge>
            </div>
          </div>
        </div>

        <Separator gold className="mb-10" />

        {/* Candidat — message de statut */}
        {!isMember && (
          <Card className="mb-8 border-gold/20">
            <CardBody className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-gold/70" />
                <h2 className="font-display font-semibold text-base text-text-primary">
                  Candidature en cours
                </h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Votre profil est enregistré. Un officier de recrutement va vous contacter sur Discord.
                En attendant, assurez-vous d&apos;être bien présent sur le serveur Discord Tabou.
              </p>
              <Link
                href={SITE_CONFIG.links.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-gold text-xs hover:text-gold-light transition-colors mt-1"
              >
                <MessageSquare size={13} />
                Rejoindre le Discord
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
                  <h3 className="font-display font-semibold text-base text-text-primary mb-1">
                    Mon profil
                  </h3>
                  <p className="text-text-muted text-xs leading-relaxed">
                    Informations de votre personnage EVE
                  </p>
                </div>
              </CardBody>
            </Card>
          </Link>

          <a
            href={SITE_CONFIG.links.discord}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card interactive className="h-full">
              <CardBody className="flex items-start gap-4">
                <MessageSquare size={20} className="text-gold/70 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-display font-semibold text-base text-text-primary mb-1">
                    Discord
                  </h3>
                  <p className="text-text-muted text-xs leading-relaxed">
                    Communication principale de la corporation
                  </p>
                </div>
              </CardBody>
            </Card>
          </a>

          {/* Placeholders V4 */}
          <Card className="h-full opacity-40">
            <CardBody className="flex items-start gap-4">
              <Calendar size={20} className="text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-base text-text-muted mb-1">
                  Calendrier
                </h3>
                <p className="text-text-muted text-xs leading-relaxed">
                  Opérations à venir — disponible en V4
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="h-full opacity-40">
            <CardBody className="flex items-start gap-4">
              <BookOpen size={20} className="text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-base text-text-muted mb-1">
                  Guides
                </h3>
                <p className="text-text-muted text-xs leading-relaxed">
                  Documentation interne — disponible en V4
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="h-full opacity-40">
            <CardBody className="flex items-start gap-4">
              <Users size={20} className="text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-base text-text-muted mb-1">
                  Annuaire
                </h3>
                <p className="text-text-muted text-xs leading-relaxed">
                  Membres de la corporation — disponible en V4
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </Container>
    </div>
  );
}
