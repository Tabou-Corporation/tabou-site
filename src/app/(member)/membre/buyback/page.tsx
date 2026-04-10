import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { BuybackForm } from "./BuybackForm";
import { BUYBACK_STATUS_LABELS, BUYBACK_STATUS_BADGE } from "@/lib/constants/labels";
import { getSettingsContent } from "@/lib/site-content/loader";
import { expireBuybackRequests } from "@/lib/actions/buyback";
import {
  Package, Clock, CheckCircle, Banknote, XCircle, Timer,
} from "lucide-react";
import type { UserRole } from "@/types/roles";

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:  <Clock size={14} className="text-text-muted" />,
  ACCEPTED: <CheckCircle size={14} className="text-gold/80" />,
  PAID:     <Banknote size={14} className="text-gold/80" />,
  REJECTED: <XCircle size={14} className="text-red-400" />,
  EXPIRED:  <Timer size={14} className="text-text-muted" />,
};

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B ISK`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ISK`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ISK`;
  return `${Math.round(amount)} ISK`;
}

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default async function BuybackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member")) redirect("/membre");

  const settings = await getSettingsContent();
  if (!settings.buybackEnabled) {
    return (
      <div className="py-10 sm:py-14">
        <Container size="md">
          <Card>
            <CardBody className="py-12 text-center">
              <Package size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">
                Le programme de buyback est actuellement desactive.
              </p>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  // Expirer les demandes depassees (check leger a chaque chargement)
  await expireBuybackRequests();

  const requests = await prisma.buybackRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        {/* En-tete */}
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Espace membre
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Buyback
          </h1>
          <p className="text-text-muted text-sm mt-2">
            Vends tes items a la corporation au taux de{" "}
            <span className="text-gold font-semibold">{settings.buybackRate}% du Jita buy</span>.
          </p>
        </div>

        <Separator gold className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne formulaire */}
          <div className="lg:col-span-2">
            <BuybackForm />
          </div>

          {/* Colonne info */}
          <div className="space-y-4">
            {/* Etapes */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-text-primary">
                  Comment ca marche
                </h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-gold font-bold text-xs mt-0.5">1.</span>
                  <div>
                    <p className="text-text-secondary text-xs font-medium">Copie tes items</p>
                    <p className="text-text-muted text-[11px]">Inventaire, cargo ou hangar en jeu</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-gold font-bold text-xs mt-0.5">2.</span>
                  <div>
                    <p className="text-text-secondary text-xs font-medium">Colle et estime</p>
                    <p className="text-text-muted text-[11px]">Les prix Jita sont calcules en temps reel</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-gold font-bold text-xs mt-0.5">3.</span>
                  <div>
                    <p className="text-text-secondary text-xs font-medium">Soumets ta demande</p>
                    <p className="text-text-muted text-[11px]">Verifie le montant puis valide</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-gold font-bold text-xs mt-0.5">4.</span>
                  <div>
                    <p className="text-text-secondary text-xs font-medium">Paiement en jeu</p>
                    <p className="text-text-muted text-[11px]">Un officier accepte et te transfere les ISK</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Parametres */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-text-primary">
                  Parametres actuels
                </h2>
              </CardHeader>
              <CardBody className="space-y-2 py-3">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Taux de rachat</span>
                  <span className="text-gold font-semibold">{settings.buybackRate}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Reference</span>
                  <span className="text-text-secondary">Jita buy (temps reel)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Expiration</span>
                  <span className="text-text-secondary">14 jours</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Max en attente</span>
                  <span className="text-text-secondary">3 demandes</span>
                </div>
              </CardBody>
            </Card>

            {/* Bon a savoir */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-text-primary">
                  Bon a savoir
                </h2>
              </CardHeader>
              <CardBody className="space-y-2 py-3">
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Les items doivent etre en <strong className="text-text-secondary">anglais</strong> (noms EVE par defaut).
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Tu peux copier directement depuis ton <strong className="text-text-secondary">inventaire</strong>,
                  {" "}<strong className="text-text-secondary">cargo</strong> ou
                  {" "}<strong className="text-text-secondary">hangar</strong> avec Ctrl+A puis Ctrl+C.
                </p>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Une demande non traitee expire automatiquement apres 14 jours.
                  Tu peux en avoir <strong className="text-text-secondary">3 en parallele</strong>.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Historique */}
        {requests.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display font-semibold text-lg text-text-primary mb-4">
              Mes demandes
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-gold/20 text-gold text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount} en attente
                </span>
              )}
            </h2>

            <div className="space-y-2">
              {requests.map((r) => {
                const days = daysUntil(r.expiresAt);
                const isExpiringSoon = r.status === "PENDING" && days <= 3;

                return (
                  <Card key={r.id}>
                    <CardBody className="flex items-center gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-text-primary font-display font-semibold text-sm">
                            {formatISK(r.totalBuyback)}
                          </p>
                          <span className="text-text-muted text-xs">
                            ({r.itemCount} items)
                          </span>
                        </div>
                        <p className="text-text-muted text-xs mt-0.5">
                          {r.createdAt.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {r.status === "PENDING" && (
                            <span className={isExpiringSoon ? "text-red-400 ml-2" : "text-text-muted ml-2"}>
                              · Expire dans {days}j
                            </span>
                          )}
                        </p>
                        {r.reviewNote && (
                          <p className="text-text-muted text-xs mt-1 italic border-l-2 border-gold/20 pl-2">
                            {r.reviewNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {STATUS_ICON[r.status]}
                        <Badge variant={BUYBACK_STATUS_BADGE[r.status] ?? "muted"}>
                          {BUYBACK_STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
