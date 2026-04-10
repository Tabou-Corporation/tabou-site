"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { updateBuybackStatus } from "@/lib/actions/buyback";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils/cn";

interface Props {
  requestId: string;
  currentStatus: string;
}

export function BuybackDecisionButtons({ requestId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [reviewNote, setReviewNote] = useState("");
  const { addToast } = useToast();
  const router = useRouter();

  function handleAction(status: "ACCEPTED" | "PAID" | "REJECTED") {
    startTransition(async () => {
      const result = await updateBuybackStatus(requestId, status, reviewNote);
      if (!result.success) {
        addToast(result.error, "error");
      } else {
        const msg =
          status === "ACCEPTED" ? "Demande acceptee — paiement en attente." :
          status === "PAID"     ? "Marque comme paye." :
                                  "Demande refusee.";
        addToast(msg, "success");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Note optionnelle */}
      <div className="space-y-1.5">
        <label className="block text-text-muted text-xs font-medium">
          Note <span className="font-normal">(optionnel)</span>
        </label>
        <textarea
          rows={2}
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder="Raison du refus, instructions logistique..."
          className={cn(
            "w-full bg-bg-elevated border rounded px-3 py-2",
            "text-text-primary text-xs",
            "border-border focus:border-gold/60 focus:outline-none",
            "transition-colors duration-150 resize-y"
          )}
        />
      </div>

      {/* Boutons selon statut */}
      {currentStatus === "PENDING" && (
        <>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full"
            disabled={isPending}
            onClick={() => handleAction("ACCEPTED")}
          >
            {isPending ? <><Spinner /> Traitement...</> : "Accepter"}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="w-full"
            disabled={isPending}
            onClick={() => handleAction("REJECTED")}
          >
            {isPending ? <><Spinner /> Traitement...</> : "Refuser"}
          </Button>
        </>
      )}

      {currentStatus === "ACCEPTED" && (
        <>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full"
            disabled={isPending}
            onClick={() => handleAction("PAID")}
          >
            {isPending ? <><Spinner /> Traitement...</> : "Marquer comme paye"}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="w-full"
            disabled={isPending}
            onClick={() => handleAction("REJECTED")}
          >
            {isPending ? <><Spinner /> Traitement...</> : "Refuser"}
          </Button>
        </>
      )}
    </div>
  );
}
