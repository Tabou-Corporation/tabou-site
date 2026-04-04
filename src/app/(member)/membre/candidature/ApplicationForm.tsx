"use client";

import { useActionState } from "react";
import { submitApplication, type ApplicationFormState } from "@/lib/actions/applications";
import { Button } from "@/components/ui/Button";

const initialState: ApplicationFormState = {};

export function ApplicationForm() {
  const [state, formAction, pending] = useActionState(submitApplication, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gold/5 p-6 text-center space-y-2">
        <p className="text-gold font-display font-semibold text-lg">Candidature envoyée !</p>
        <p className="text-text-secondary text-sm leading-relaxed">
          Votre candidature a bien été soumise. Un recruteur la traitera prochainement
          et vous contactera sur Discord.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Skillpoints */}
      <div className="space-y-1.5">
        <label htmlFor="spCount" className="block text-text-secondary text-sm font-medium">
          Skillpoints <span className="text-text-muted font-normal">(optionnel)</span>
        </label>
        <input
          id="spCount"
          name="spCount"
          type="number"
          min={0}
          placeholder="ex: 85000000"
          className={[
            "w-full bg-bg-elevated border rounded px-3 py-2.5",
            "text-text-primary text-sm placeholder:text-text-muted",
            "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
            "transition-colors duration-150",
          ].join(" ")}
        />
        <p className="text-text-muted text-xs">
          Retrouvez vos SP dans le jeu via le menu Character Sheet.
        </p>
      </div>

      {/* Motivation */}
      <div className="space-y-1.5">
        <label htmlFor="motivation" className="block text-text-secondary text-sm font-medium">
          Motivation <span className="text-red-400 text-xs">*</span>
        </label>
        <textarea
          id="motivation"
          name="motivation"
          required
          minLength={100}
          rows={8}
          placeholder="Présentez-vous, vos objectifs dans EVE, pourquoi vous souhaitez rejoindre Tabou, votre expérience en PvP nullsec..."
          className={[
            "w-full bg-bg-elevated border rounded px-3 py-2.5 resize-y min-h-[160px]",
            "text-text-primary text-sm placeholder:text-text-muted",
            "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
            "transition-colors duration-150",
          ].join(" ")}
        />
        <p className="text-text-muted text-xs">Minimum 100 caractères.</p>
      </div>

      {/* Erreur */}
      {state.error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Envoi en cours…" : "Soumettre ma candidature"}
      </Button>
    </form>
  );
}
