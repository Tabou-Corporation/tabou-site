import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { Container } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { expireListings } from "@/lib/actions/buyback";
import { MarketTabs } from "./MarketTabs";
import { MyListingsTab } from "./MyListingsTab";
import { MyOffersTab } from "./MyOffersTab";
import { HistoryTab } from "./HistoryTab";
import {
  LISTING_TYPE_LABELS, LISTING_TYPE_BADGE,
} from "@/lib/constants/labels";
import { cn } from "@/lib/utils/cn";
import { Plus, Package, ShoppingCart, ArrowLeftRight, Store, MapPin } from "lucide-react";
import type { UserRole } from "@/types/roles";

const TYPE_ICON: Record<string, React.ReactNode> = {
  SELL:     <Package size={14} className="text-gold/70" />,
  BUY:      <ShoppingCart size={14} className="text-blue-400/70" />,
  EXCHANGE: <ArrowLeftRight size={14} className="text-text-muted" />,
};

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return `${Math.round(amount)}`;
}

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");

  const { type: typeFilter, tab } = await searchParams;
  const userId = session.user.id;

  // Expirer les annonces depassees
  await expireListings();

  // Marquer les notifications marche comme lues quand on visite la page
  await prisma.notification.updateMany({
    where: { userId, read: false, type: { startsWith: "offer_" } },
    data: { read: true },
  });
  await prisma.notification.updateMany({
    where: { userId, read: false, type: { startsWith: "listing_" } },
    data: { read: true },
  });

  // ─── Tab: Mes annonces ────────────────────────────────────────────────────
  if (tab === "mes-annonces") {
    const listings = await prisma.marketListing.findMany({
      where: { userId },
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { offers: { where: { status: "PENDING" } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const myOpenCount = listings.filter((l) => l.status === "OPEN").length;
    const myPendingOffers = await prisma.marketOffer.count({
      where: { userId, status: "PENDING" },
    });

    return (
      <div className="py-10 sm:py-14">
        <Container>
          <MarketHeader />
          <Suspense>
            <MarketTabs myListingsCount={myOpenCount} myPendingOffersCount={myPendingOffers} />
          </Suspense>
          <MyListingsTab listings={listings} />
        </Container>
      </div>
    );
  }

  // ─── Tab: Mes offres ──────────────────────────────────────────────────────
  if (tab === "mes-offres") {
    const offers = await prisma.marketOffer.findMany({
      where: { userId },
      include: {
        listing: {
          select: {
            id: true, title: true, type: true, status: true,
            user: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const myOpenCount = await prisma.marketListing.count({
      where: { userId, status: "OPEN" },
    });
    const myPendingOffers = offers.filter((o) => o.status === "PENDING").length;

    return (
      <div className="py-10 sm:py-14">
        <Container>
          <MarketHeader />
          <Suspense>
            <MarketTabs myListingsCount={myOpenCount} myPendingOffersCount={myPendingOffers} />
          </Suspense>
          <MyOffersTab offers={offers} />
        </Container>
      </div>
    );
  }

  // ─── Tab: Historique ──────────────────────────────────────────────────────
  if (tab === "historique") {
    const transactions = await prisma.marketTransaction.findMany({
      where: { archivedAt: null, OR: [{ sellerId: userId }, { buyerId: userId }] },
      include: {
        seller: { select: { name: true, image: true } },
        buyer:  { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const myOpenCount = await prisma.marketListing.count({
      where: { userId, status: "OPEN" },
    });
    const myPendingOffers = await prisma.marketOffer.count({
      where: { userId, status: "PENDING" },
    });

    return (
      <div className="py-10 sm:py-14">
        <Container>
          <MarketHeader />
          <Suspense>
            <MarketTabs myListingsCount={myOpenCount} myPendingOffersCount={myPendingOffers} />
          </Suspense>
          <HistoryTab transactions={transactions} currentUserId={userId} />
        </Container>
      </div>
    );
  }

  // ─── Tab par defaut: Parcourir ────────────────────────────────────────────

  const VALID_TYPES = ["SELL", "BUY", "EXCHANGE"] as const;
  type LT = (typeof VALID_TYPES)[number];
  const isValidType = (v: string): v is LT => VALID_TYPES.includes(v as LT);

  const where = typeFilter && isValidType(typeFilter)
    ? { status: "OPEN" as const, type: typeFilter }
    : { status: "OPEN" as const };

  const [listings, myOpenCount, myPendingOffers] = await Promise.all([
    prisma.marketListing.findMany({
      where,
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.marketListing.count({ where: { userId, status: "OPEN" } }),
    prisma.marketOffer.count({ where: { userId, status: "PENDING" } }),
  ]);

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <MarketHeader />
        <Suspense>
          <MarketTabs myListingsCount={myOpenCount} myPendingOffersCount={myPendingOffers} />
        </Suspense>

        {/* Filtres type (seulement sur Parcourir) */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { key: undefined, label: "Toutes", icon: null },
            { key: "SELL", label: "Ventes", icon: <Package size={12} /> },
            { key: "BUY", label: "Achats", icon: <ShoppingCart size={12} /> },
            { key: "EXCHANGE", label: "Echanges", icon: <ArrowLeftRight size={12} /> },
          ].map(({ key, label, icon }) => {
            const isActive = typeFilter === key || (!typeFilter && !key);
            return (
              <Link
                key={label}
                href={key ? `/membre/marche?type=${key}` : "/membre/marche"}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  isActive
                    ? "bg-gold text-text-inverted"
                    : "bg-bg-elevated text-text-secondary border border-border hover:border-border-accent"
                )}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </div>

        {/* Liste */}
        {listings.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <Store size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">
                Aucune annonce pour le moment.
              </p>
              <p className="text-text-muted text-xs mt-1">
                Sois le premier a poster !
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {listings.map((l) => {
              const days = daysUntil(l.expiresAt);

              return (
                <Link key={l.id} href={`/membre/marche/${l.id}`} className="block">
                  <Card interactive>
                    <CardBody className="flex items-center gap-4 py-4">
                      <AvatarDisplay
                        image={l.user.image}
                        name={l.user.name}
                        size={40}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {TYPE_ICON[l.type]}
                          <p className="text-text-primary font-display font-semibold text-sm truncate">
                            {l.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-text-muted text-xs">
                            {l.user.name ?? "Membre"} · {l.itemCount > 0 ? `${l.itemCount} items · ` : ""}
                            {days}j restants
                            {l._count.offers > 0 && (
                              <span className="text-gold ml-1">
                                · {l._count.offers} offre{l._count.offers > 1 ? "s" : ""}
                              </span>
                            )}
                          </span>
                          {l.location && (
                            <span className="inline-flex items-center gap-1 text-text-muted text-xs">
                              <MapPin size={10} className="flex-shrink-0" />
                              {l.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prix */}
                      <div className="text-right flex-shrink-0">
                        {l.askingPrice ? (
                          <p className="text-gold font-display font-bold text-sm">
                            {formatISK(l.askingPrice)} ISK
                          </p>
                        ) : l.askingRate ? (
                          <p className="text-gold font-display font-bold text-sm">
                            {l.askingRate}% Jita
                          </p>
                        ) : (
                          <p className="text-text-muted text-xs italic">
                            Offres libres
                          </p>
                        )}
                      </div>

                      <Badge variant={LISTING_TYPE_BADGE[l.type] ?? "muted"}>
                        {LISTING_TYPE_LABELS[l.type] ?? l.type}
                      </Badge>
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

// ── Composant header reutilise ────────────────────────────────────────────

function MarketHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-gold text-xs font-semibold tracking-extra-wide uppercase mb-2">
            Espace membre
          </p>
          <h1 className="font-display font-bold text-3xl text-text-primary">
            Marche
          </h1>
          <p className="text-text-muted text-sm mt-2">
            Achetez, vendez et echangez entre membres de la corporation.
          </p>
        </div>
        <Button as="a" href="/membre/marche/new" size="sm">
          <Plus size={14} />
          Nouvelle annonce
        </Button>
      </div>
      <Separator gold className="mb-6" />
    </>
  );
}
