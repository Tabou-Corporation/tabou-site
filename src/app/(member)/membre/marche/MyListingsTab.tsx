import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  LISTING_TYPE_LABELS, LISTING_TYPE_BADGE,
  LISTING_STATUS_LABELS, LISTING_STATUS_BADGE,
} from "@/lib/constants/labels";
import { Package, ShoppingCart, ArrowLeftRight, Store } from "lucide-react";

interface Listing {
  id: string;
  type: string;
  title: string;
  status: string;
  askingPrice: number | null;
  askingRate: number | null;
  itemCount: number;
  expiresAt: Date;
  createdAt: Date;
  user: { name: string | null; image: string | null };
  _count: { offers: number };
}

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

export function MyListingsTab({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <Store size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">Tu n&apos;as encore publie aucune annonce.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {listings.map((l) => (
        <Link key={l.id} href={`/membre/marche/${l.id}`} className="block">
          <Card interactive>
            <CardBody className="flex items-center gap-4 py-4">
              {TYPE_ICON[l.type]}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-text-primary font-display font-semibold text-sm truncate">
                    {l.title}
                  </p>
                  <Badge variant={LISTING_STATUS_BADGE[l.status] ?? "muted"}>
                    {LISTING_STATUS_LABELS[l.status] ?? l.status}
                  </Badge>
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  {l.itemCount > 0 && `${l.itemCount} items · `}
                  {l.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  {l.status === "OPEN" && l._count.offers > 0 && (
                    <span className="text-gold ml-1 font-semibold">
                      · {l._count.offers} offre{l._count.offers > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
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
                  <p className="text-text-muted text-xs italic">Offres libres</p>
                )}
              </div>

              <Badge variant={LISTING_TYPE_BADGE[l.type] ?? "muted"}>
                {LISTING_TYPE_LABELS[l.type] ?? l.type}
              </Badge>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}
