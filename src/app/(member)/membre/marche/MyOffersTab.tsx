import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { OFFER_STATUS_LABELS, OFFER_STATUS_BADGE } from "@/lib/constants/labels";
import { MessageSquare } from "lucide-react";

interface Offer {
  id: string;
  price: number | null;
  message: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  listing: {
    id: string;
    title: string;
    type: string;
    status: string;
    user: { name: string | null; image: string | null };
  };
}

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return `${Math.round(amount)}`;
}

export function MyOffersTab({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <MessageSquare size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">Tu n&apos;as fait aucune offre pour le moment.</p>
        </CardBody>
      </Card>
    );
  }

  // Grouper : pending en haut, puis acceptees, puis refusees/retirees
  const statusOrder: Record<string, number> = { PENDING: 0, ACCEPTED: 1, REJECTED: 2, WITHDRAWN: 3 };
  const sorted = [...offers].sort((a, b) =>
    (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) ||
    b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((o) => (
        <Link key={o.id} href={`/membre/marche/${o.listing.id}`} className="block">
          <Card interactive>
            <CardBody className="flex items-center gap-4 py-4">
              <AvatarDisplay image={o.listing.user.image} name={o.listing.user.name} size={36} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-text-primary font-display font-semibold text-sm truncate">
                    {o.listing.title}
                  </p>
                  <Badge variant={OFFER_STATUS_BADGE[o.status] ?? "muted"}>
                    {OFFER_STATUS_LABELS[o.status] ?? o.status}
                  </Badge>
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  Vendu par {o.listing.user.name ?? "Membre"}
                  {" · "}
                  {o.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  {o.status === "ACCEPTED" && (
                    <span className="text-green-400 font-semibold ml-1">Contacte le vendeur en jeu !</span>
                  )}
                </p>
              </div>

              {o.price && (
                <p className="text-gold font-display font-bold text-sm flex-shrink-0">
                  {formatISK(o.price)} ISK
                </p>
              )}

              {o.message && !o.price && (
                <p className="text-text-muted text-xs italic flex-shrink-0 max-w-[120px] truncate">
                  {o.message}
                </p>
              )}
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}
