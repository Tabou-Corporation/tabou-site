"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import {
  archiveTransaction,
  restoreTransaction,
  deleteTransaction,
} from "@/lib/actions/admin-transactions";
import { Archive, RotateCcw, Trash2, AlertTriangle } from "lucide-react";

interface Props {
  transactionId: string;
  isArchived: boolean;
  isAdmin: boolean;
  title: string;
}

export function TransactionActions({ transactionId, isArchived, isAdmin, title }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveTransaction(transactionId);
      if (result.success) {
        addToast("Transaction archivee.", "success");
        router.refresh();
      } else {
        addToast(result.error ?? "Erreur", "error");
      }
    });
  }

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreTransaction(transactionId);
      if (result.success) {
        addToast("Transaction restauree.", "success");
        router.refresh();
      } else {
        addToast(result.error ?? "Erreur", "error");
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    startTransition(async () => {
      const result = await deleteTransaction(transactionId);
      if (result.success) {
        addToast("Transaction supprimee definitivement.", "success");
        setConfirmDelete(false);
        router.refresh();
      } else {
        addToast(result.error ?? "Erreur", "error");
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {/* Archiver / Restaurer */}
      {isArchived ? (
        <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleRestore} title="Restaurer">
          <RotateCcw size={13} />
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleArchive} title="Archiver">
          <Archive size={13} />
        </Button>
      )}

      {/* Hard delete — admin only, double confirmation */}
      {isAdmin && (
        <>
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
              <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-[10px] font-semibold whitespace-nowrap">
                Supprimer &quot;{title.length > 20 ? title.slice(0, 20) + "..." : title}&quot; ?
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={handleDelete}
                className="!text-red-400 !text-[10px] !px-1.5"
              >
                Confirmer
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                className="!text-text-muted !text-[10px] !px-1.5"
              >
                Annuler
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
              title="Supprimer definitivement"
              className="!text-red-400/60 hover:!text-red-400"
            >
              <Trash2 size={13} />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
