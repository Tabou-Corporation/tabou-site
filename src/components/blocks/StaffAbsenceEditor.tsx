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

type Mode = "preset" | "custom" | "indefinite" | null;

function toInputDate(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function isAbsenceActive(start: string | null, end: string | null): boolean {
  if (!start) return false;
  const now = Date.now();
  const s = new Date(start).getTime();
  if (end) return s <= now && now <= new Date(end).getTime();
  return s <= now;
}

function detectMode(start: string | null, end: string | null): Mode {
  if (!start) return null;
  if (!end) return "indefinite";
  return "custom";
}

const PRESETS = [
  { label: "1 mois", months: 1 },
  { label: "2 mois", months: 2 },
  { label: "3 mois", months: 3 },
] as const;

export function StaffAbsenceEditor({ userId, absenceStart, absenceEnd, absenceReason }: StaffAbsenceEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [mode, setMode] = useState<Mode>(detectMode(absenceStart, absenceEnd));
  const active = isAbsenceActive(absenceStart, absenceEnd);
  const hasAbsence = !!absenceStart && (absenceEnd ? new Date(absenceEnd).getTime() >= Date.now() : true);
  const isIndefinite = !!absenceStart && !absenceEnd;

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

  function handlePreset(months: number) {
    const form = document.getElementById(`staff-absence-form-${userId}`) as HTMLFormElement | null;
    if (!form) return;
    const startInput = form.elements.namedItem("start") as HTMLInputElement;
    const endInput = form.elements.namedItem("end") as HTMLInputElement;
    const today = new Date().toISOString().slice(0, 10);
    if (startInput) startInput.value = today;
    if (endInput) endInput.value = addMonths(months);
    setMode("preset");
  }

  const today = new Date().toISOString().slice(0, 10);

  // ── Résumé si absence en cours ──
  if (hasAbsence && !editing) {
    const startFmt = new Date(absenceStart!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const endFmt = absenceEnd
      ? new Date(absenceEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
      : null;

    return (
      <div className="space-y-3">
        <div className={cn(
          "rounded px-3 py-2.5 border text-sm",
          active
            ? "bg-amber-500/5 border-amber-500/30 text-amber-300"
            : "bg-blue-500/5 border-blue-500/30 text-blue-300",
        )}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1">
            {active ? (isIndefinite ? "En pause — indéterminée" : "En pause") : "Absence programmée"}
          </p>
          <p className="text-xs">
            {endFmt ? `${startFmt} → ${endFmt}` : `Depuis le ${startFmt} — retour non défini`}
          </p>
          {absenceReason && <p className="text-xs mt-1 italic opacity-80">{absenceReason}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setMode(detectMode(absenceStart, absenceEnd)); setEditing(true); }}
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
        <button type="button" onClick={() => { setMode(null); setEditing(true); }}
          className="w-full px-3 py-2 rounded text-xs font-semibold border border-dashed border-border text-text-muted hover:border-gold/40 hover:text-gold transition-all">
          Déclarer une absence
        </button>
      ) : (
        <div className="space-y-3">
          {/* Sélecteur de mode */}
          <div className="flex flex-wrap gap-1">
            {PRESETS.map(({ label, months }) => (
              <button key={months} type="button" onClick={() => handlePreset(months)}
                className={cn("px-2 py-1 rounded text-[11px] font-semibold border transition-all",
                  mode === "preset" ? "border-gold/40 text-gold bg-gold/5" : "border-border text-text-muted hover:border-gold/30")}>
                {label}
              </button>
            ))}
            <button type="button" onClick={() => setMode("custom")}
              className={cn("px-2 py-1 rounded text-[11px] font-semibold border transition-all",
                mode === "custom" ? "border-gold/40 text-gold bg-gold/5" : "border-border text-text-muted hover:border-gold/30")}>
              Dates
            </button>
            <button type="button" onClick={() => setMode("indefinite")}
              className={cn("px-2 py-1 rounded text-[11px] font-semibold border transition-all",
                mode === "indefinite" ? "border-amber-500/40 text-amber-400 bg-amber-500/5" : "border-border text-text-muted hover:border-amber-500/30")}>
              Indét.
            </button>
          </div>

          {mode && (
            <form id={`staff-absence-form-${userId}`} action={formAction} className="space-y-2">
              {mode === "indefinite" ? (
                <div>
                  <label className="block text-text-muted text-xs mb-1">Début</label>
                  <input type="date" name="start" defaultValue={toInputDate(absenceStart) || today} min={today} required
                    className="w-full rounded px-2 py-1.5 text-xs bg-bg-deep border border-border text-text-primary focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />
                  <input type="hidden" name="end" value="indefinite" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-text-muted text-xs mb-1">Début</label>
                    <input type="date" name="start" defaultValue={mode === "preset" ? today : (toInputDate(absenceStart) || today)} min={today} required
                      className="w-full rounded px-2 py-1.5 text-xs bg-bg-deep border border-border text-text-primary focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />
                  </div>
                  <div>
                    <label className="block text-text-muted text-xs mb-1">Fin</label>
                    <input type="date" name="end" defaultValue={mode === "preset" ? addMonths(1) : toInputDate(absenceEnd)} min={today} required
                      className="w-full rounded px-2 py-1.5 text-xs bg-bg-deep border border-border text-text-primary focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />
                  </div>
                </div>
              )}

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
      )}
    </div>
  );
}
