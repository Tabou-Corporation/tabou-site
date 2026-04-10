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
import { BUYBACK_STATUS_LABELS, BUYBACK_STATUS_BADGE } from "@/lib/constants/labels";
import { BuybackDecisionButtons } from "./BuybackDecisionButtons";
import { ArrowLeft, Clock } from "lucide-react";
import type { UserRole } from "@/types/roles";

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B ISK`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ISK`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ISK`;
  return `${Math.round(amount)} ISK`;
}

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

interface ParsedItem {
  typeId: number;
  name: string;
  quantity: number;
  jitaBuy: number;
  totalBuy: number;
}

export default async function StaffBuybackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const request = await prisma.buybackRequest.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true } },
      reviewer: { select: { name: true } },
    },
  });

  if (!request) notFound();

  let items: ParsedItem[] = [];
  try {
    items = JSON.parse(request.items) as ParsedItem[];
  } catch {
    // items invalides
  }

  const days = daysUntil(request.expiresAt);
  const isExpired = request.expiresAt < new Date();
  const isExpiringSoon = request.status === "PENDING" && days <= 3;

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        {/* Retour */}
        <div className="mb-6">
          <Link
            href="/staff/buyback"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux buybacks
          </Link>
        </div>

        {/* En-tete */}
        <div className="flex items-center gap-4 mb-8">
          <AvatarDisplay
            image={request.user.image}
            name={request.user.name}
            size={64}
            border="thick"
          />
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">
              Buyback — {formatISK(request.totalBuyback)}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={BUYBACK_STATUS_BADGE[request.status] ?? "muted"}>
                {BUYBACK_STATUS_LABELS[request.status] ?? request.status}
              </Badge>
              <span className="text-text-muted text-xs">
                {request.user.name ?? "Pilote inconnu"}
              </span>
              {request.status === "PENDING" && (
                <span className={`text-xs flex items-center gap-1 ${isExpiringSoon || isExpired ? "text-red-400" : "text-text-muted"}`}>
                  <Clock size={12} />
                  {isExpired ? "Expire" : `Expire dans ${days}j`}
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator gold className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detail des items */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-base text-text-primary">
                  Detail des items ({items.length})
                </h2>
              </CardHeader>
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                        <th className="text-left pb-2 font-semibold">Item</th>
                        <th className="text-right pb-2 font-semibold">Qte</th>
                        <th className="text-right pb-2 font-semibold">Jita Buy</th>
                        <th className="text-right pb-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i} className="border-b border-border-subtle">
                          <td className="py-2 text-text-primary">{item.name}</td>
                          <td className="py-2 text-text-secondary text-right font-mono">
                            {item.quantity.toLocaleString("fr-FR")}
                          </td>
                          <td className="py-2 text-text-secondary text-right font-mono text-xs">
                            {formatISK(item.jitaBuy)}
                          </td>
                          <td className="py-2 text-text-primary text-right font-mono">
                            {formatISK(item.totalBuy)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            {/* Resume financier */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-base text-text-primary">
                  Resume
                </h2>
              </CardHeader>
              <CardBody className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Total Jita buy</span>
                  <span className="text-text-secondary font-mono">{formatISK(request.totalJitaBuy)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Taux buyback</span>
                  <span className="text-text-secondary font-mono">{Math.round(request.buybackRate * 100)}%</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-text-primary font-semibold">A payer</span>
                  <span className="text-gold font-display font-bold text-lg">{formatISK(request.totalBuyback)}</span>
                </div>
              </CardBody>
            </Card>

            {/* Note existante */}
            {request.reviewNote && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-sm text-text-primary">
                    Note
                  </h2>
                </CardHeader>
                <CardBody>
                  <p className="text-text-secondary text-sm italic leading-relaxed border-l-2 border-gold/20 pl-3">
                    {request.reviewNote}
                  </p>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Colonne actions */}
          <div className="space-y-4">
            {/* Decision */}
            {(request.status === "PENDING" || request.status === "ACCEPTED") && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-sm text-text-primary">
                    Decision
                  </h2>
                </CardHeader>
                <CardBody>
                  <BuybackDecisionButtons
                    requestId={id}
                    currentStatus={request.status}
                  />
                </CardBody>
              </Card>
            )}

            {/* Meta */}
            <Card>
              <CardBody className="space-y-2 py-3">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Soumise le</span>
                  <span className="text-text-secondary">
                    {request.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Expire le</span>
                  <span className={isExpiringSoon || isExpired ? "text-red-400" : "text-text-secondary"}>
                    {request.expiresAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {request.reviewer?.name && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Traite par</span>
                    <span className="text-text-secondary">{request.reviewer.name}</span>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
