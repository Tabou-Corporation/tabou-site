"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { updateApplicationStatus } from "@/lib/actions/applications";
import { useToast } from "@/contexts/ToastContext";

interface Props {
  applicationId: string;
  currentStatus: string;
}

export function CandidatureDecisionButtons({ applicationId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const router = useRouter();

  function handleStatus(status: "PENDING" | "ACCEPTED" | "REJECTED") {
    startTransition(async () => {
      const result = await updateApplicationStatus(applicationId, status);
      if (!result.success) {
        addToast(result.error, "error");
      } else {
        addToast(
          status === "ACCEPTED" ? "Candidature acceptée — membre promu." :
          status === "REJECTED" ? "Candidature refusée." :
          "Remise en attente.",
          "success"
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {currentStatus !== "ACCEPTED" && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="w-full"
          disabled={isPending}
          onClick={() => handleStatus("ACCEPTED")}
        >
          {isPending ? <><Spinner />Traitement…</> : "Accepter → promouvoir membre"}
        </Button>
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
