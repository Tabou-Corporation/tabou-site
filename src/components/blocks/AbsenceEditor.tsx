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
  return s <= now; // indéterminé = actif tant que start est passé
}

function isFuture(start: string | null): boolean {
  if (!start) return false;
  return new Date(start).getTime() > Date.now();
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

export function AbsenceEditor({ absenceStart, absenceEnd, absenceReason }: AbsenceEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [mode, setMode] = useState<Mode>(detectMode(absenceStart, absenceEnd));
  const active = isAbsenceActive(absenceStart, absenceEnd);
  const future = isFuture(absenceStart);
  const hasAbsence = !!absenceStart;
  const isIndefinite = hasAbsence && !absenceEnd;

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

  function handlePreset(months: number) {
    const form = document.getElementById("absence-form") as HTMLFormElement | null;
    if (!form) return;
    const startInput = form.elements.namedItem("start") as HTMLInputElement;
    const endInput = form.elements.namedItem("end") as HTMLInputElement;
    const today = new Date().toISOString().slice(0, 10);
    if (startInput) startInput.value = today;
    if (endInput) endInput.value = addMonths(months);
    setMode("preset");
  }

  // ── Affichage résumé (pas en édition) ──
  if (hasAbsence && !editing) {
    const startFmt = new Date(absenceStart).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    const endFmt = absenceEnd
      ? new Date(absenceEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
      : null;

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
              {active
                ? (isIndefinite ? "En pause — durée indéterminée" : "En pause")
                : future
                ? "Absence programmée"
                : "Absence passée"}
            </span>
          </div>
          <p className="text-xs">
            {endFmt ? (
              <>Du <span className="font-semibold">{startFmt}</span> au <span className="font-semibold">{endFmt}</span></>
            ) : (
              <>Depuis le <span className="font-semibold">{startFmt}</span> — <span className="italic">retour non défini</span></>
            )}
          </p>
          {absenceReason && (
            <p className="text-xs mt-1 italic opacity-80">{absenceReason}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setMode(detectMode(absenceStart, absenceEnd)); setEditing(true); }}
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
          onClick={() => { setMode(null); setEditing(true); }}
          className="w-full px-3 py-2.5 rounded text-xs font-semibold border border-dashed border-border text-text-muted hover:border-gold/40 hover:text-gold transition-all"
        >
          Déclarer une absence
        </button>
      )}

      {editing && (
        <div className="space-y-3">
          {/* Sélecteur de mode */}
          <div className="space-y-2">
            <p className="text-text-muted text-xs font-medium">Durée de l&apos;absence</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(({ label, months }) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => handlePreset(months)}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs font-semibold border transition-all",
                    mode === "preset"
                      ? "border-gold/40 text-gold bg-gold/5"
                      : "border-border text-text-muted hover:border-gold/30 hover:text-text-secondary",
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-semibold border transition-all",
                  mode === "custom"
                    ? "border-gold/40 text-gold bg-gold/5"
                    : "border-border text-text-muted hover:border-gold/30 hover:text-text-secondary",
                )}
              >
                Dates précises
              </button>
              <button
                type="button"
                onClick={() => setMode("indefinite")}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-semibold border transition-all",
                  mode === "indefinite"
                    ? "border-amber-500/40 text-amber-400 bg-amber-500/5"
                    : "border-border text-text-muted hover:border-amber-500/30 hover:text-text-secondary",
                )}
              >
                Indéterminée
              </button>
            </div>
          </div>

          {/* Formulaire — visible dès qu'un mode est choisi */}
          {mode && (
            <form id="absence-form" action={formAction} className="space-y-3">
              {mode === "custom" ? (
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
              ) : mode === "preset" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-muted text-xs mb-1">Début</label>
                    <input
                      type="date"
                      name="start"
                      defaultValue={today}
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
                      defaultValue={addMonths(1)}
                      min={today}
                      required
                      className="w-full rounded px-2.5 py-2 text-sm bg-bg-deep border border-border text-text-primary focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
                    />
                  </div>
                </div>
              ) : (
                /* Indéterminé — juste la date de début */
                <div>
                  <label className="block text-text-muted text-xs mb-1">Début de l&apos;absence</label>
                  <input
                    type="date"
                    name="start"
                    defaultValue={toInputDate(absenceStart) || today}
                    min={today}
                    required
                    className="w-full rounded px-2.5 py-2 text-sm bg-bg-deep border border-border text-text-primary focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
                  />
                  <input type="hidden" name="end" value="indefinite" />
                  <p className="text-amber-400/70 text-xs mt-1.5 italic">
                    La date de retour n&apos;est pas définie. Vous pourrez mettre fin à l&apos;absence à tout moment.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-text-muted text-xs mb-1">Motif <span className="opacity-50">(optionnel)</span></label>
                <input
                  type="text"
                  name="reason"
                  maxLength={120}
                  defaultValue={absenceReason ?? ""}
                  placeholder="Ex : vacances, déménagement, pause gaming…"
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
      )}
    </div>
  );
}
