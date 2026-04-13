"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { setAbsenceForMember, clearAbsenceForMember } from "@/lib/actions/absence";
import type { AbsenceState } from "@/lib/actions/absence";

interface StaffAbsenceEditorProps {
  userId: string;
  absenceStart: string | null;
  absenceEnd: string | null;
  absenceReason: string | null;
}

function toInputDate(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function isActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const now = Date.now();
  return new Date(start).getTime() <= now && now <= new Date(end).getTime();
}

export function StaffAbsenceEditor({ userId, absenceStart, absenceEnd, absenceReason }: StaffAbsenceEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const active = isActive(absenceStart, absenceEnd);
  const hasAbsence = !!(absenceStart && absenceEnd) && (new Date(absenceEnd).getTime() >= Date.now());

  const [state, formAction, isPending] = useActionState<AbsenceState, FormData>(
    async (prev, formData) => {
      formData.set("userId", userId);
      const result = await setAbsenceForMember(prev, formData);
      if (result.success) {
        setEditing(false);
        router.refresh();
      }
      return result;
    },
    {},
  );

  async function handleClear() {
    setClearing(true);
    await clearAbsenceForMember(userId);
    router.refresh();
    setClearing(false);
  }

  const today = new Date().toISOString().slice(0, 10);

  // ── Résumé si absence en cours ──
  if (hasAbsence && !editing) {
    const startFmt = new Date(absenceStart!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const endFmt = new Date(absenceEnd!).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

    return (
      <div className="space-y-3">
        <div className={cn(
          "rounded px-3 py-2.5 border text-sm",
          active
            ? "bg-amber-500/5 border-amber-500/30 text-amber-300"
            : "bg-blue-500/5 border-blue-500/30 text-blue-300",
        )}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1">
            {active ? "En pause" : "Absence programmée"}
          </p>
          <p className="text-xs">{startFmt} → {endFmt}</p>
          {absenceReason && <p className="text-xs mt-1 italic opacity-80">{absenceReason}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(true)}
            className="px-3 py-1 rounded text-xs font-semibold border border-gold/40 text-gold hover:bg-gold/10 transition-all">
            Modifier
          </button>
          <button type="button" onClick={handleClear} disabled={clearing}
            className="px-3 py-1 rounded text-xs font-semibold border border-red-light/40 text-red-light hover:bg-red-light/10 transition-all disabled:opacity-50">
            {clearing ? "…" : "Retirer"}
          </button>
        </div>
      </div>
    );
  }

  // ── Formulaire ──
  return (
    <div className="space-y-3">
      {!editing ? (
        <button type="button" onClick={() => setEditing(true)}
          className="w-full px-3 py-2 rounded text-xs font-semibold border border-dashed border-border text-text-muted hover:border-gold/40 hover:text-gold transition-all">
          Déclarer une absence
        </button>
      ) : (
        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-text-muted text-xs mb-1">Début</label>
              <input type="date" name="start" defaultValue={toInputDate(absenceStart) || today} min={today} required
                className="w-full rounded px-2 py-1.5 text-xs bg-bg-deep border border-border text-text-primary focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />
            </div>
            <div>
              <label className="block text-text-muted text-xs mb-1">Fin</label>
              <input type="date" name="end" defaultValue={toInputDate(absenceEnd)} min={today} required
                className="w-full rounded px-2 py-1.5 text-xs bg-bg-deep border border-border text-text-primary focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />
            </div>
          </div>
          <input type="text" name="reason" maxLength={120} defaultValue={absenceReason ?? ""}
            placeholder="Motif (optionnel)"
            className="w-full rounded px-2 py-1.5 text-xs bg-bg-deep border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />

          {state.error && <p className="text-red-light text-xs">{state.error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={isPending}
              className={cn("px-3 py-1 rounded text-xs font-semibold border transition-all",
                isPending ? "border-gold/20 text-gold/40 cursor-wait" : "border-gold/40 text-gold hover:bg-gold/10")}>
              {isPending ? "…" : "Enregistrer"}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="px-3 py-1 rounded text-xs text-text-muted hover:text-text-secondary transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
