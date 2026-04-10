import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { LISTING_TYPE_LABELS, LISTING_TYPE_BADGE } from "@/lib/constants/labels";
import { ArrowRight, Archive, History } from "lucide-react";
import type { UserRole } from "@/types/roles";
import { TransactionActions } from "./TransactionActions";

export const dynamic = "force-dynamic";

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return `${Math.round(amount)}`;
}

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "director")) redirect("/membre");

  const isAdmin = hasMinRole(role, "admin");
  const { show } = await searchParams;
  const showArchived = show === "archived";

  const transactions = await prisma.marketTransaction.findMany({
    where: showArchived ? { archivedAt: { not: null } } : { archivedAt: null },
    include: {
      seller: { select: { name: true, image: true } },
      buyer:  { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const archivedCount = await prisma.marketTransaction.count({
    where: { archivedAt: { not: null } },
  });
  const activeCount = await prisma.marketTransaction.count({
    where: { archivedAt: null },
  });

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="mb-8">
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Administration
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Transactions marche
          </h1>
          <p className="text-text-muted text-sm mt-2">
            Historique complet des echanges entre membres. Archiver masque la transaction des vues membres.
            {isAdmin && " Supprimer est irreversible."}
          </p>
        </div>

        <Separator gold className="mb-6" />

        {/* Onglets actif / archive */}
        <div className="flex items-center gap-2 mb-6">
          <a
            href="/staff/admin/transactions"
            className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
              !showArchived
                ? "bg-gold text-text-inverted"
                : "bg-bg-elevated text-text-secondary border border-border hover:border-border-accent"
            }`}
          >
            <History size={12} className="inline mr-1.5 -mt-0.5" />
            Actives ({activeCount})
          </a>
          <a
            href="/staff/admin/transactions?show=archived"
            className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
              showArchived
                ? "bg-gold text-text-inverted"
                : "bg-bg-elevated text-text-secondary border border-border hover:border-border-accent"
            }`}
          >
            <Archive size={12} className="inline mr-1.5 -mt-0.5" />
            Archivees ({archivedCount})
          </a>
        </div>

        {transactions.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <History size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">
                {showArchived
                  ? "Aucune transaction archivee."
                  : "Aucune transaction enregistree."}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <CardBody className="flex items-center gap-4 py-4">
                  {/* Vendeur → Acheteur */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <AvatarDisplay image={tx.seller.image} name={tx.seller.name} size={28} />
                    <ArrowRight size={12} className="text-text-muted" />
                    <AvatarDisplay image={tx.buyer.image} name={tx.buyer.name} size={28} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-text-primary font-display font-semibold text-sm truncate">
                        {tx.listingTitle}
                      </p>
                      <Badge variant={LISTING_TYPE_BADGE[tx.listingType] ?? "muted"}>
                        {LISTING_TYPE_LABELS[tx.listingType] ?? tx.listingType}
                      </Badge>
                      {tx.archivedAt && (
                        <Badge variant="muted">Archivee</Badge>
                      )}
                    </div>
                    <p className="text-text-muted text-xs mt-0.5">
                      {tx.seller.name ?? "?"} → {tx.buyer.name ?? "?"}
                      {tx.itemCount > 0 && ` · ${tx.itemCount} items`}
                      {tx.location && ` · ${tx.location}`}
                      {" · "}
                      {tx.createdAt.toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  {tx.finalPrice && (
                    <p className="text-gold font-display font-bold text-sm flex-shrink-0">
                      {formatISK(tx.finalPrice)} ISK
                    </p>
                  )}

                  {/* Actions admin */}
                  <TransactionActions
                    transactionId={tx.id}
                    isArchived={!!tx.archivedAt}
                    isAdmin={isAdmin}
                    title={tx.listingTitle}
                  />
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
