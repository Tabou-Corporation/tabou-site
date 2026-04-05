"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { assignApplication } from "@/lib/actions/applications";
import { useToast } from "@/contexts/ToastContext";
import { UserCheck, X } from "lucide-react";

interface Recruiter {
  id: string;
  name: string | null;
}

interface Props {
  applicationId:   string;
  currentUserId:   string;
  assignedToId:    string | null;
  assignedToName:  string | null;
  /** Disponible uniquement pour director+ */
  recruiters?:     Recruiter[];
  /** Rôle de l'utilisateur courant (pour afficher le dropdown si director+) */
  canReassign:     boolean;
}

export function AssignRecruiterForm({
  applicationId,
  currentUserId,
  assignedToId,
  assignedToName,
  recruiters = [],
  canReassign,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const router = useRouter();

  const isSelf = assignedToId === currentUserId;

  function handleAssign(toId: string | null) {
    startTransition(async () => {
      const result = await assignApplication(applicationId, toId);
      if (!result.success) {
        addToast(result.error ?? "Erreur.", "error");
      } else {
        addToast(toId ? "Recruteur assigné." : "Assignation retirée.", "success");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Recruteur actuellement assigné */}
      {assignedToId ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <UserCheck size={13} className="text-gold flex-shrink-0" />
            <span className="text-text-secondary text-xs truncate">
              {assignedToName ?? "Recruteur inconnu"}
            </span>
          </div>
          {(isSelf || canReassign) && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleAssign(null)}
              className="text-text-muted hover:text-red-400 transition-colors flex-shrink-0"
              title="Retirer l'assignation"
            >
              <X size={13} />
            </button>
          )}
        </div>
      ) : (
        <p className="text-text-muted text-xs italic">Non assigné</p>
      )}

      {/* Bouton "M'assigner" si pas encore assigné ou si director+ */}
      {!isSelf && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={isPending}
          onClick={() => handleAssign(currentUserId)}
        >
          {isPending ? <><Spinner />…</> : "M'assigner"}
        </Button>
      )}

      {/* Dropdown réassignation — director+ uniquement */}
      {canReassign && recruiters.length > 0 && (
        <select
          disabled={isPending}
          onChange={(e) => {
            const val = e.target.value;
            if (val) handleAssign(val);
            e.target.value = "";
          }}
          defaultValue=""
          className="w-full bg-bg-elevated border border-border rounded px-2 py-1.5 text-text-secondary text-xs focus:border-gold/60 focus:outline-none transition-colors"
        >
          <option value="" disabled>Réassigner à…</option>
          {recruiters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name ?? r.id}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
