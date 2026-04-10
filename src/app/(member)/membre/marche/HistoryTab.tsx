import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { LISTING_TYPE_LABELS, LISTING_TYPE_BADGE } from "@/lib/constants/labels";
import { History, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Transaction {
  id: string;
  listingId: string;
  listingTitle: string;
  listingType: string;
  finalPrice: number | null;
  itemCount: number;
  location: string | null;
  createdAt: Date;
  sellerId: string;
  seller: { name: string | null; image: string | null };
  buyer: { name: string | null; image: string | null };
}

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return `${Math.round(amount)}`;
}

export function HistoryTab({
  transactions,
  currentUserId,
}: {
  transactions: Transaction[];
  currentUserId: string;
}) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <History size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">Aucune transaction finalisee pour le moment.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isSeller = tx.sellerId === currentUserId;

        return (
          <Link key={tx.id} href={`/membre/marche/${tx.listingId}`} className="block">
            <Card interactive>
              <CardBody className="flex items-center gap-4 py-4">
                {/* Avatars vendeur → acheteur */}
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
                    <Badge variant={isSeller ? "gold" : "default"}>
                      {isSeller ? "Vendeur" : "Acheteur"}
                    </Badge>
                  </div>
                  <p className="text-text-muted text-xs mt-0.5">
                    {isSeller
                      ? `Vendu a ${tx.buyer.name ?? "Membre"}`
                      : `Achete a ${tx.seller.name ?? "Membre"}`}
                    {tx.itemCount > 0 && ` · ${tx.itemCount} items`}
                    {tx.location && ` · ${tx.location}`}
                    {" · "}
                    {tx.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {tx.finalPrice && (
                  <p className="text-gold font-display font-bold text-sm flex-shrink-0">
                    {formatISK(tx.finalPrice)} ISK
                  </p>
                )}
              </CardBody>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
