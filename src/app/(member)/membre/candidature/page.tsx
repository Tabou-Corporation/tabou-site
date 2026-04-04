import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { ApplicationForm } from "./ApplicationForm";
import type { UserRole } from "@/types/roles";

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  INTERVIEW: "Entretien en cours",
  ACCEPTED:  "Acceptée",
  REJECTED:  "Refusée",
};

const STATUS_BADGE: Record<string, "muted" | "gold" | "default" | "red"> = {
  PENDING:   "muted",
  INTERVIEW: "gold",
  ACCEPTED:  "gold",
  REJECTED:  "red",
};

export default async function CandidaturePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;

  // Les membres complets n'ont plus besoin de cette page
  if (role !== "candidate") redirect("/membre");

  const application = await prisma.application.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const canReapply = application?.status === "REJECTED";
  const hasActiveApplication = application && !canReapply;

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        {/* En-tête */}
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Recrutement
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Ma candidature
          </h1>
        </div>

        <Separator gold className="mb-8" />

        {/* Candidature existante */}
        {hasActiveApplication && application && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-base text-text-primary">
                    Statut de votre candidature
                  </h2>
                  <Badge variant={STATUS_BADGE[application.status] ?? "muted"}>
                    {STATUS_LABELS[application.status] ?? application.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="space-y-1">
                  <p className="text-text-muted text-xs uppercase tracking-wide font-semibold">
                    Soumise le
                  </p>
                  <p className="text-text-secondary text-sm">
                    {application.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {application.spCount && (
                  <div className="space-y-1">
                    <p className="text-text-muted text-xs uppercase tracking-wide font-semibold">
                      Skillpoints déclarés
                    </p>
                    <p className="text-text-secondary text-sm">
                      {application.spCount.toLocaleString("fr-FR")} SP
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-text-muted text-xs uppercase tracking-wide font-semibold">
                    Motivation
                  </p>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {application.motivation}
                  </p>
                </div>

                {application.status === "PENDING" && (
                  <p className="text-text-muted text-xs leading-relaxed border-t border-border pt-4">
                    Votre candidature est en attente de traitement. Un recruteur vous
                    contactera sur Discord.
                  </p>
                )}

                {application.status === "INTERVIEW" && (
                  <p className="text-gold/80 text-xs leading-relaxed border-t border-border pt-4">
                    Un recruteur souhaite vous rencontrer. Restez disponible sur Discord.
                  </p>
                )}

                {application.status === "ACCEPTED" && (
                  <p className="text-gold text-sm font-semibold border-t border-border pt-4">
                    Félicitations ! Votre candidature a été acceptée.
                    Bienvenue dans Tabou — rafraîchissez la page pour voir votre nouveau statut.
                  </p>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Formulaire (pas encore de candidature, ou refusé) */}
        {(!application || canReapply) && (
          <div className="space-y-6">
            {canReapply && (
              <Card className="border-red-400/20">
                <CardBody>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Votre précédente candidature a été refusée. Vous pouvez en soumettre
                    une nouvelle si vous estimez pouvoir mieux répondre aux attentes de
                    la corporation.
                  </p>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-base text-text-primary">
                  Formulaire de candidature
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 mb-6">
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Tabou est une corporation PvP nullsec sérieuse. Prenez le temps de
                    rédiger une candidature soignée — elle fait toute la différence.
                  </p>
                  <ul className="text-text-muted text-xs space-y-1 list-disc list-inside">
                    <li>Soyez présent et réactif sur Discord</li>
                    <li>Minimum recommandé : 30M SP en combat</li>
                    <li>Disponibilité pour les OPs de corp</li>
                  </ul>
                </div>
                <ApplicationForm />
              </CardBody>
            </Card>
          </div>
        )}
      </Container>
    </div>
  );
}
