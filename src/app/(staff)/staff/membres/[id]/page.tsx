import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { ArrowLeft } from "lucide-react";
import { RoleForm } from "./RoleForm";
import type { UserRole } from "@/types/roles";

const ROLE_LABELS: Record<string, string> = {
  candidate: "Candidat", member: "Membre", recruiter: "Recruteur",
  officer: "Officier", admin: "Administrateur",
};
const ROLE_BADGE: Record<string, "muted" | "gold"> = {
  candidate: "muted", member: "muted", recruiter: "gold",
  officer: "gold", admin: "gold",
};
const APP_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente", INTERVIEW: "Entretien", ACCEPTED: "Acceptée", REJECTED: "Refusée",
};
const APP_STATUS_BADGE: Record<string, "muted" | "gold" | "red"> = {
  PENDING: "muted", INTERVIEW: "gold", ACCEPTED: "gold", REJECTED: "red",
};

export default async function MembreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const actorRole = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(actorRole, "officer")) redirect("/membre");

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: true,
      applications: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!user) notFound();

  const characterId = user.accounts.find((a) => a.provider === "eveonline")?.providerAccountId;
  const isSelf = user.id === session.user.id;
  const canEdit = !isSelf && hasMinRole(actorRole, "officer");

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
          {user.image ? (
            <Image
              src={user.image} alt={user.name ?? "Pilote"}
              width={64} height={64}
              className="rounded-full border-2 border-gold/20 flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-bg-elevated border-2 border-border flex items-center justify-center flex-shrink-0">
              <span className="text-text-muted text-xl font-display font-bold">
                {(user.name ?? "?")[0]}
              </span>
            </div>
          )}
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">
              {user.name ?? "Pilote inconnu"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={ROLE_BADGE[user.role] ?? "muted"}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
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
                <InfoRow label="Membre depuis" value={user.createdAt.toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })} />
                {characterId && characterId !== "undefined" && (
                  <InfoRow label="Character ID" value={characterId} mono />
                )}
              </CardBody>
            </Card>

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
                        <Badge variant={APP_STATUS_BADGE[app.status] ?? "muted"}>
                          {APP_STATUS_LABELS[app.status] ?? app.status}
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

          {/* Actions */}
          <div className="space-y-4">
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
