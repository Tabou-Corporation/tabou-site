import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { ArrowLeft } from "lucide-react";
import { RoleForm } from "./RoleForm";
import { SecurityStatusBadge } from "@/components/ui/SecurityStatusBadge";
import { CorpHistoryTimeline } from "@/components/ui/CorpHistoryTimeline";
import { ROLE_LABELS, ROLE_BADGE, SPECIALTY_LABELS, STATUS_LABELS, STATUS_BADGE } from "@/lib/constants/labels";
import { parseProfileExtra, ACTIVITY_LABEL, LANGUAGE_LABEL } from "@/lib/profile-extra";
import type { Language } from "@/lib/profile-extra";
import type { UserRole } from "@/types/roles";

export default async function MembreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const actorRole = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(actorRole, "director")) redirect("/membre");

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id:             true,
      name:           true,
      image:          true,
      role:           true,
      specialty:      true,
      bio:            true,
      securityStatus: true,
      profileExtra:   true,
      createdAt:      true,
      // Uniquement le compte EVE Online — pas les autres providers OAuth
      accounts: {
        where: { provider: "eveonline" },
        select: { providerAccountId: true },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, status: true, spCount: true, createdAt: true },
      },
    },
  });
  if (!user) notFound();

  // accounts est déjà filtré sur "eveonline"
  const characterId  = user.accounts[0]?.providerAccountId;
  const profileExtra = parseProfileExtra(user.profileExtra);
  const isSelf       = user.id === session.user.id;
  const canEdit      = !isSelf && hasMinRole(actorRole, "director");

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        <div className="mb-6">
          <Link
            href="/staff/membres"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour à la liste
          </Link>
        </div>

        {/* En-tête */}
        <div className="flex items-center gap-4 mb-8">
          <AvatarDisplay
            image={user.image}
            name={user.name}
            size={64}
            border="thick"
          />
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">
              {user.name ?? "Pilote inconnu"}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={ROLE_BADGE[user.role] ?? "muted"}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
              <SecurityStatusBadge value={user.securityStatus} showLabel />
              {characterId && characterId !== "undefined" && (
                <span className="text-text-muted text-xs font-mono">ID: {characterId}</span>
              )}
            </div>
          </div>
        </div>

        <Separator gold className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Infos + role */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-base text-text-primary">
                  Informations
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <InfoRow label="Nom" value={user.name ?? "—"} />
                <InfoRow label="Rôle" value={ROLE_LABELS[user.role] ?? user.role} />
                {user.specialty && (
                  <InfoRow label="Spécialité" value={SPECIALTY_LABELS[user.specialty] ?? user.specialty} />
                )}
                <InfoRow label="Membre depuis" value={user.createdAt.toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })} />
                {characterId && characterId !== "undefined" && (
                  <InfoRow label="Character ID" value={characterId} mono />
                )}
                {user.securityStatus !== null && user.securityStatus !== undefined && (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-text-muted text-sm flex-shrink-0">Statut de sécu.</span>
                    <SecurityStatusBadge value={user.securityStatus} />
                  </div>
                )}
                {user.bio && (
                  <div>
                    <p className="text-text-muted text-xs font-medium mb-1">Présentation</p>
                    <p className="text-text-secondary text-sm italic leading-relaxed">{user.bio}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Profil étendu */}
            {(profileExtra.timezone || profileExtra.mainActivity || profileExtra.secondaryActivity || (profileExtra.languages?.length ?? 0) > 0) && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-base text-text-primary">
                    Profil étendu
                  </h2>
                </CardHeader>
                <CardBody className="space-y-3">
                  {profileExtra.timezone && (
                    <InfoRow label="Fuseau horaire" value={profileExtra.timezone} />
                  )}
                  {profileExtra.mainActivity && (
                    <InfoRow label="Activité principale" value={ACTIVITY_LABEL[profileExtra.mainActivity] ?? profileExtra.mainActivity} />
                  )}
                  {profileExtra.secondaryActivity && (
                    <InfoRow label="Activité secondaire" value={ACTIVITY_LABEL[profileExtra.secondaryActivity] ?? profileExtra.secondaryActivity} />
                  )}
                  {(profileExtra.languages?.length ?? 0) > 0 && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-text-muted text-sm flex-shrink-0">Langues</span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {profileExtra.languages!.map((l) => (
                          <span key={l} className="px-1.5 py-0.5 rounded bg-gold/5 border border-gold/15 text-text-secondary text-xs font-semibold uppercase">
                            {LANGUAGE_LABEL[l as Language] ?? l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Historique candidatures */}
            {user.applications.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-base text-text-primary">
                    Historique candidatures
                  </h2>
                </CardHeader>
                <CardBody className="space-y-3">
                  {user.applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-text-secondary text-xs">
                          {app.createdAt.toLocaleDateString("fr-FR", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                        {app.spCount && (
                          <p className="text-text-muted text-xs">
                            {app.spCount.toLocaleString("fr-FR")} SP
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_BADGE[app.status] ?? "muted"}>
                          {STATUS_LABELS[app.status] ?? app.status}
                        </Badge>
                        <Link
                          href={`/staff/candidatures/${app.id}`}
                          className="text-text-muted text-xs hover:text-gold transition-colors"
                        >
                          Voir →
                        </Link>
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-4">
            {/* Historique de corporation */}
            {characterId && characterId !== "undefined" && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-sm text-text-primary">
                    Historique corpo
                  </h2>
                </CardHeader>
                <CardBody>
                  <CorpHistoryTimeline characterId={characterId} />
                </CardBody>
              </Card>
            )}

            {/* Liens EVE */}
            {characterId && characterId !== "undefined" && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-sm text-text-primary">
                    Liens externes
                  </h2>
                </CardHeader>
                <CardBody className="space-y-2">
                  <a
                    href={`https://zkillboard.com/character/${characterId}/`}
                    target="_blank" rel="noopener noreferrer"
                    className="block text-text-secondary text-sm hover:text-gold transition-colors"
                  >
                    zKillboard →
                  </a>
                  <a
                    href={`https://evewho.com/character/${characterId}`}
                    target="_blank" rel="noopener noreferrer"
                    className="block text-text-secondary text-sm hover:text-gold transition-colors"
                  >
                    EVEWho →
                  </a>
                </CardBody>
              </Card>
            )}

            {/* Gestion rôle */}
            {canEdit ? (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-sm text-text-primary">
                    Rôle
                  </h2>
                </CardHeader>
                <CardBody>
                  <RoleForm
                    userId={user.id}
                    currentRole={user.role}
                    actorRole={actorRole}
                  />
                </CardBody>
              </Card>
            ) : isSelf ? (
              <Card>
                <CardBody>
                  <p className="text-text-muted text-xs">
                    Vous ne pouvez pas modifier votre propre rôle.
                  </p>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-text-muted text-sm flex-shrink-0">{label}</span>
      <span className={`text-text-secondary text-sm text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
