import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { BUYBACK_STATUS_LABELS, BUYBACK_STATUS_BADGE } from "@/lib/constants/labels";
import { expireBuybackRequests } from "@/lib/actions/buyback";
import { cn } from "@/lib/utils/cn";
import {
  Clock, CheckCircle, Banknote, XCircle, Timer, Package, TrendingUp,
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

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0, ACCEPTED: 1, PAID: 2, REJECTED: 3, EXPIRED: 4,
};

export default async function StaffBuybackPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const { filter } = await searchParams;

  // Expirer les demandes depassees
  await expireBuybackRequests();

  const VALID_FILTERS = ["PENDING", "ACCEPTED", "PAID", "REJECTED", "EXPIRED"] as const;
  type BuybackFilter = (typeof VALID_FILTERS)[number];
  const isValidFilter = (v: string): v is BuybackFilter => VALID_FILTERS.includes(v as BuybackFilter);

  const statusFilter = filter && isValidFilter(filter)
    ? { status: filter as BuybackFilter }
    : {};

  const requests = await prisma.buybackRequest.findMany({
    where: statusFilter,
    include: {
      user: { select: { name: true, image: true } },
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const sorted = [...requests].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  );

  const counts = {
    total:    requests.length,
    pending:  requests.filter((r) => r.status === "PENDING").length,
    accepted: requests.filter((r) => r.status === "ACCEPTED").length,
    paid:     requests.filter((r) => r.status === "PAID").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };

  // Stats du mois
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthPaid = requests.filter(
    (r) => r.status === "PAID" && r.updatedAt >= monthStart
  );
  const monthVolume = monthPaid.reduce((sum, r) => sum + r.totalBuyback, 0);

  return (
    <div className="py-10 sm:py-14">
      <Container>
        {/* En-tete */}
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Zone logistique
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Buyback — Gestion
          </h1>
        </div>

        <Separator gold className="mb-6" />

        {/* Filtres */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { key: undefined, label: "Toutes", count: counts.total },
            { key: "PENDING", label: "En attente", count: counts.pending },
            { key: "ACCEPTED", label: "Acceptees", count: counts.accepted },
            { key: "PAID", label: "Payees", count: counts.paid },
          ].map(({ key, label, count }) => {
            const isActive = filter === key || (!filter && !key);
            return (
              <Link
                key={label}
                href={key ? `/staff/buyback?filter=${key}` : "/staff/buyback"}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  isActive
                    ? "bg-gold text-text-inverted"
                    : "bg-bg-elevated text-text-secondary border border-border hover:border-border-accent"
                )}
              >
                {label}
                <span className={isActive ? "opacity-70" : "text-text-muted"}>
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "En attente",  value: counts.pending,  icon: <Clock size={16} /> },
            { label: "A payer",     value: counts.accepted, icon: <CheckCircle size={16} /> },
            { label: "Payees",      value: counts.paid,     icon: <Banknote size={16} /> },
            { label: "Ce mois",     value: formatISK(monthVolume), icon: <TrendingUp size={16} /> },
          ].map(({ label, value, icon }) => (
            <Card key={label}>
              <CardBody className="flex items-center gap-3 py-4">
                <span className="text-gold/60">{icon}</span>
                <div>
                  <p className="text-text-primary font-display font-bold text-xl leading-none">
                    {value}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">{label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Liste */}
        {sorted.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Package size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Aucune demande de buyback.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {sorted.map((r) => {
              const days = daysUntil(r.expiresAt);
              const isExpiringSoon = r.status === "PENDING" && days <= 3;

              return (
                <Link
                  key={r.id}
                  href={`/staff/buyback/${r.id}`}
                  className="block"
                >
                  <Card interactive>
                    <CardBody className="flex items-center gap-4 py-4">
                      <AvatarDisplay
                        image={r.user.image}
                        name={r.user.name}
                        size={40}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary font-display font-semibold text-sm truncate">
                          {r.user.name ?? "Pilote inconnu"}
                        </p>
                        <p className="text-text-muted text-xs">
                          {formatISK(r.totalBuyback)} · {r.itemCount} items ·{" "}
                          {r.createdAt.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                          {r.status === "PENDING" && (
                            <span className={isExpiringSoon ? "text-red-400 ml-1" : "text-text-muted ml-1"}>
                              · Expire {days}j
                            </span>
                          )}
                        </p>
                      </div>

                      {r.reviewer?.name && (
                        <div className="hidden sm:block text-text-muted text-xs flex-shrink-0 truncate max-w-[100px]">
                          {r.reviewer.name}
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {STATUS_ICON[r.status]}
                        <Badge variant={BUYBACK_STATUS_BADGE[r.status] ?? "muted"}>
                          {BUYBACK_STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
