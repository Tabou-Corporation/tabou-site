"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { updateApplicationStatus } from "@/lib/actions/applications";
import { useToast } from "@/contexts/ToastContext";
import { AlertTriangle } from "lucide-react";

interface Props {
  applicationId: string;
  currentStatus: string;
}

export function CandidatureDecisionButtons({ applicationId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  function handleStatus(status: "PENDING" | "ACCEPTED" | "REJECTED") {
    startTransition(async () => {
      const result = await updateApplicationStatus(applicationId, status);
      if (!result.success) {
        addToast(result.error, "error");
      } else {
        if (status === "ACCEPTED" && result.info === "promotion_deferred") {
          addToast(
            "Candidature acceptée. L'ESI n'a pas encore confirmé sa corporation — la promotion sera automatique à sa prochaine connexion.",
            "warning"
          );
        } else {
          addToast(
            status === "ACCEPTED" ? "Candidature acceptée — membre promu." :
            status === "REJECTED" ? "Candidature refusée." :
            "Remise en attente.",
            "success"
          );
        }
        setShowAcceptConfirm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {currentStatus !== "ACCEPTED" && !showAcceptConfirm && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="w-full"
          disabled={isPending}
          onClick={() => setShowAcceptConfirm(true)}
        >
          Accepter → promouvoir membre
        </Button>
      )}

      {/* Confirmation d'acceptation avec avertissement corpo */}
      {showAcceptConfirm && (
        <div className="rounded border border-gold/30 bg-gold/5 p-3 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-text-primary text-sm font-semibold">
                Vérification requise
              </p>
              <p className="text-text-muted text-xs leading-relaxed">
                Avant d&apos;accepter, assurez-vous que le candidat a bien été
                <strong className="text-text-secondary"> recruté dans la corporation en jeu</strong> (Tabou
                ou Urban Zone). Sinon, son compte sera automatiquement suspendu
                lors de la prochaine synchronisation ESI.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex-1"
              disabled={isPending}
              onClick={() => handleStatus("ACCEPTED")}
            >
              {isPending ? <><Spinner />Traitement…</> : "Confirmer l'acceptation"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setShowAcceptConfirm(false)}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {currentStatus !== "REJECTED" && (
        <Button
          type="button"
          variant="danger"
          size="sm"
          className="w-full"
          disabled={isPending}
          onClick={() => handleStatus("REJECTED")}
        >
          {isPending ? <><Spinner />Traitement…</> : "Refuser"}
        </Button>
      )}
      {currentStatus !== "PENDING" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          disabled={isPending}
          onClick={() => handleStatus("PENDING")}
        >
          {isPending ? <><Spinner />Traitement…</> : "Remettre en attente"}
        </Button>
      )}
    </div>
  );
}
