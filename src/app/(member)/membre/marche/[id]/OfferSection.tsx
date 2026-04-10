"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { useToast } from "@/contexts/ToastContext";
import { makeOffer, respondToOffer, withdrawOffer } from "@/lib/actions/buyback";
import { OFFER_STATUS_LABELS, OFFER_STATUS_BADGE } from "@/lib/constants/labels";
import { cn } from "@/lib/utils/cn";
import { Check, X, MessageSquare } from "lucide-react";

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B ISK`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ISK`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ISK`;
  return `${Math.round(amount)} ISK`;
}

interface Offer {
  id: string;
  userId: string;
  price: number | null;
  message: string | null;
  status: string;
  createdAt: Date;
  user: { name: string | null; image: string | null };
}

interface Props {
  listingId: string;
  isOwner: boolean;
  isOpen: boolean;
  currentUserId: string;
  offers: Offer[];
}

export function OfferSection({ listingId, isOwner, isOpen, currentUserId, offers }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // New offer form
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const hasUserOffer = offers.some((o) => o.userId === currentUserId && o.status === "PENDING");

  function handleMakeOffer() {
    startTransition(async () => {
      const price = offerPrice ? parseFloat(offerPrice) : null;
      const result = await makeOffer(listingId, price, offerMessage || null);
      if (result.success) {
        addToast("Offre envoyee !", "success");
        setOfferPrice("");
        setOfferMessage("");
        router.refresh();
      } else {
        addToast(result.error, "error");
      }
    });
  }

  function handleRespond(offerId: string, action: "ACCEPTED" | "REJECTED") {
    startTransition(async () => {
      const result = await respondToOffer(offerId, action);
      if (result.success) {
        addToast(action === "ACCEPTED" ? "Offre acceptee ! Finalisez l'echange en jeu." : "Offre refusee.", "success");
        router.refresh();
      } else {
        addToast(result.error, "error");
      }
    });
  }

  function handleWithdraw(offerId: string) {
    startTransition(async () => {
      const result = await withdrawOffer(offerId);
      if (result.success) {
        addToast("Offre retiree.", "success");
        router.refresh();
      } else {
        addToast(result.error, "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Formulaire nouvelle offre */}
      {isOpen && !isOwner && !hasUserOffer && (
        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-sm text-text-primary">
              Faire une offre
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-text-muted text-xs font-medium">
                Prix propose (ISK) <span className="text-text-muted font-normal">— optionnel</span>
              </label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Ex: 100000000"
                min={0}
                className={cn(
                  "w-full bg-bg-elevated border rounded px-3 py-2",
                  "text-text-primary text-sm",
                  "border-border focus:border-gold/60 focus:outline-none"
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-text-muted text-xs font-medium">
                Message
              </label>
              <textarea
                rows={2}
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Ex: Je suis interesse, dispo ce soir. / Je propose un echange contre..."
                maxLength={500}
                className={cn(
                  "w-full bg-bg-elevated border rounded px-3 py-2",
                  "text-text-primary text-xs resize-y",
                  "border-border focus:border-gold/60 focus:outline-none"
                )}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full"
              disabled={isPending || (!offerPrice && !offerMessage)}
              onClick={handleMakeOffer}
            >
              {isPending ? <><Spinner /> Envoi...</> : <><MessageSquare size={14} /> Envoyer l&apos;offre</>}
            </Button>
          </CardBody>
        </Card>
      )}

      {hasUserOffer && !isOwner && (
        <Card>
          <CardBody className="py-3 text-center">
            <p className="text-text-muted text-xs">Tu as deja une offre en attente sur cette annonce.</p>
          </CardBody>
        </Card>
      )}

      {/* Liste des offres */}
      {offers.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-display font-semibold text-sm text-text-primary">
              Offres ({offers.length})
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {offers.map((offer) => (
              <div key={offer.id} className="flex items-start gap-3 p-3 bg-bg-elevated rounded border border-border-subtle">
                <AvatarDisplay image={offer.user.image} name={offer.user.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-primary text-sm font-semibold">
                      {offer.user.name ?? "Membre"}
                    </span>
                    {offer.price && (
                      <span className="text-gold font-mono text-sm font-bold">
                        {formatISK(offer.price)}
                      </span>
                    )}
                    <Badge variant={OFFER_STATUS_BADGE[offer.status] ?? "muted"}>
                      {OFFER_STATUS_LABELS[offer.status] ?? offer.status}
                    </Badge>
                  </div>
                  {offer.message && (
                    <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                      {offer.message}
                    </p>
                  )}
                  <p className="text-text-muted text-[11px] mt-1">
                    {offer.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>

                  {/* Actions */}
                  {offer.status === "PENDING" && (
                    <div className="flex gap-2 mt-2">
                      {isOwner && (
                        <>
                          <Button type="button" variant="primary" size="sm" disabled={isPending} onClick={() => handleRespond(offer.id, "ACCEPTED")}>
                            <Check size={12} /> Accepter
                          </Button>
                          <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => handleRespond(offer.id, "REJECTED")}>
                            <X size={12} /> Refuser
                          </Button>
                        </>
                      )}
                      {offer.userId === currentUserId && (
                        <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => handleWithdraw(offer.id)}>
                          Retirer mon offre
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {offers.length === 0 && isOpen && (
        <Card>
          <CardBody className="py-6 text-center">
            <MessageSquare size={20} className="text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">Aucune offre pour le moment.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
