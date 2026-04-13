"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { setAbsence, clearAbsence } from "@/lib/actions/absence";
import type { AbsenceState } from "@/lib/actions/absence";

interface AbsenceEditorProps {
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

function isFuture(start: string | null): boolean {
  if (!start) return false;
  return new Date(start).getTime() > Date.now();
}

export function AbsenceEditor({ absenceStart, absenceEnd, absenceReason }: AbsenceEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const active = isActive(absenceStart, absenceEnd);
  const future = isFuture(absenceStart);
  const hasAbsence = !!(absenceStart && absenceEnd);

  const [state, formAction, isPending] = useActionState<AbsenceState, FormData>(
    async (prev, formData) => {
      const result = await setAbsence(prev, formData);
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
    await clearAbsence();
    router.refresh();
    setClearing(false);
  }

  // ── Affichage résumé (pas en édition) ──
  if (hasAbsence && !editing) {
    const startFmt = new Date(absenceStart).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    const endFmt = new Date(absenceEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

    return (
      <div className="space-y-3">
        <div className={cn(
          "rounded px-3 py-3 border text-sm",
          active
            ? "bg-amber-500/5 border-amber-500/30 text-amber-300"
            : future
            ? "bg-blue-500/5 border-blue-500/30 text-blue-300"
            : "bg-bg-elevated border-border text-text-muted",
        )}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wide">
              {active ? "En pause" : future ? "Absence programmée" : "Absence passée"}
            </span>
          </div>
          <p className="text-xs">
            Du <span className="font-semibold">{startFmt}</span> au <span className="font-semibold">{endFmt}</span>
          </p>
          {absenceReason && (
            <p className="text-xs mt-1 italic opacity-80">{absenceReason}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded text-xs font-semibold border border-gold/40 text-gold hover:border-gold hover:bg-gold/10 transition-all"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing}
            className="px-3 py-1.5 rounded text-xs font-semibold border border-red-light/40 text-red-light hover:border-red-light hover:bg-red-light/10 transition-all disabled:opacity-50"
          >
            {clearing ? "Suppression…" : "Annuler l'absence"}
          </button>
        </div>
      </div>
    );
  }

  // ── Formulaire (création / édition) ──
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      {!editing && !hasAbsence && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full px-3 py-2.5 rounded text-xs font-semibold border border-dashed border-border text-text-muted hover:border-gold/40 hover:text-gold transition-all"
        >
          Déclarer une absence
        </button>
      )}

      {editing && (
        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-muted text-xs mb-1">Début</label>
              <input
                type="date"
                name="start"
                defaultValue={toInputDate(absenceStart) || today}
                min={today}
                required
                className="w-full rounded px-2.5 py-2 text-sm bg-bg-deep border border-border text-text-primary focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="block text-text-muted text-xs mb-1">Fin</label>
              <input
                type="date"
                name="end"
                defaultValue={toInputDate(absenceEnd)}
                min={today}
                required
                className="w-full rounded px-2.5 py-2 text-sm bg-bg-deep border border-border text-text-primary focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-text-muted text-xs mb-1">Motif <span className="opacity-50">(optionnel)</span></label>
            <input
              type="text"
              name="reason"
              maxLength={120}
              defaultValue={absenceReason ?? ""}
              placeholder="Ex : vacances, déménagement…"
              className="w-full rounded px-2.5 py-2 text-sm bg-bg-deep border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {state.error && (
            <p className="text-red-light text-xs">{state.error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "px-4 py-1.5 rounded text-xs font-semibold border transition-all",
                isPending
                  ? "border-gold/20 text-gold/40 cursor-wait"
                  : "border-gold/40 text-gold hover:border-gold hover:bg-gold/10 active:scale-95",
              )}
            >
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
