"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import { closeListing } from "@/lib/actions/buyback";

export function CloseListingButton({ listingId }: { listingId: string }) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const router = useRouter();

  function handleClose() {
    if (!confirm("Fermer cette annonce ? Les offres en attente seront refusees.")) return;
    startTransition(async () => {
      const result = await closeListing(listingId);
      if (result.success) {
        addToast("Annonce fermee.", "success");
        router.refresh();
      } else {
        addToast(result.error, "error");
      }
    });
  }

  return (
    <Button type="button" variant="danger" size="sm" className="w-full" disabled={isPending} onClick={handleClose}>
      {isPending ? <><Spinner /> Fermeture...</> : "Fermer l'annonce"}
    </Button>
  );
}
