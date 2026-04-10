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
import {
  LISTING_TYPE_LABELS, LISTING_TYPE_BADGE,
  LISTING_STATUS_LABELS, LISTING_STATUS_BADGE,
} from "@/lib/constants/labels";
import { OfferSection } from "./OfferSection";
import { CloseListingButton } from "./CloseListingButton";
import { ArrowLeft, Package, ShoppingCart, ArrowLeftRight, Clock } from "lucide-react";
import type { UserRole } from "@/types/roles";

const TYPE_ICON: Record<string, React.ReactNode> = {
  SELL:     <Package size={16} className="text-gold/70" />,
  BUY:      <ShoppingCart size={16} className="text-blue-400/70" />,
  EXCHANGE: <ArrowLeftRight size={16} className="text-text-muted" />,
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

interface ParsedItem {
  typeId: number;
  name: string;
  quantity: number;
  jitaBuy: number;
  totalBuy: number;
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member")) redirect("/membre");

  const listing = await prisma.marketListing.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true } },
      offers: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!listing) notFound();

  const isOwner = listing.userId === session.user.id;
  const isOpen = listing.status === "OPEN";
  const days = daysUntil(listing.expiresAt);
  const isOfficer = hasMinRole(role, "officer");

  let items: ParsedItem[] = [];
  try {
    if (listing.items) items = JSON.parse(listing.items) as ParsedItem[];
  } catch { /* items invalides */ }

  // Serialiser les dates pour le client component
  const serializedOffers = listing.offers.map((o) => ({
    ...o,
    createdAt: o.createdAt,
  }));

  return (
    <div className="py-10 sm:py-14">
      <Container size="md">
        {/* Retour */}
        <div className="mb-6">
          <Link
            href="/membre/marche"
            className="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour au marche
          </Link>
        </div>

        {/* En-tete */}
        <div className="flex items-center gap-4 mb-8">
          <AvatarDisplay
            image={listing.user.image}
            name={listing.user.name}
            size={56}
            border="thick"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {TYPE_ICON[listing.type]}
              <h1 className="font-display font-bold text-2xl text-text-primary">
                {listing.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={LISTING_TYPE_BADGE[listing.type] ?? "muted"}>
                {LISTING_TYPE_LABELS[listing.type] ?? listing.type}
              </Badge>
              <Badge variant={LISTING_STATUS_BADGE[listing.status] ?? "muted"}>
                {LISTING_STATUS_LABELS[listing.status] ?? listing.status}
              </Badge>
              <span className="text-text-muted text-xs">
                par {listing.user.name ?? "Membre"}
              </span>
              {isOpen && (
                <span className="text-text-muted text-xs flex items-center gap-1">
                  <Clock size={12} /> {days}j restants
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator gold className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {listing.description && (
              <Card>
                <CardBody>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Items */}
            {items.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="font-display font-semibold text-base text-text-primary">
                    Items ({items.length})
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
                  {listing.totalJitaBuy && (
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                      <span className="text-text-muted text-xs">Valeur Jita buy totale</span>
                      <span className="text-text-secondary font-mono font-semibold">
                        {formatISK(listing.totalJitaBuy)}
                      </span>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Offres */}
            <OfferSection
              listingId={id}
              isOwner={isOwner}
              isOpen={isOpen}
              currentUserId={session.user.id}
              offers={serializedOffers}
            />
          </div>

          {/* Colonne laterale */}
          <div className="space-y-4">
            {/* Prix */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-text-primary">
                  Prix
                </h2>
              </CardHeader>
              <CardBody className="space-y-2">
                {listing.askingPrice ? (
                  <div>
                    <p className="text-gold font-display font-bold text-xl">
                      {formatISK(listing.askingPrice)}
                    </p>
                    {listing.askingRate && (
                      <p className="text-text-muted text-xs mt-1">{listing.askingRate}% du Jita buy</p>
                    )}
                  </div>
                ) : (
                  <p className="text-text-muted text-sm italic">
                    Ouvert aux offres — propose ton prix !
                  </p>
                )}
              </CardBody>
            </Card>

            {/* Meta */}
            <Card>
              <CardBody className="space-y-2 py-3">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Publiee le</span>
                  <span className="text-text-secondary">
                    {listing.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Expire le</span>
                  <span className="text-text-secondary">
                    {listing.expiresAt.toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Offres</span>
                  <span className="text-text-secondary">{listing.offers.length}</span>
                </div>
              </CardBody>
            </Card>

            {/* Actions proprietaire */}
            {isOpen && (isOwner || isOfficer) && (
              <CloseListingButton listingId={id} />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
