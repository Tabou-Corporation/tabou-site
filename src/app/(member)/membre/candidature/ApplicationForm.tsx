"use client";

import { useActionState } from "react";
import { submitApplication, type ApplicationFormState } from "@/lib/actions/applications";
import { Button } from "@/components/ui/Button";
import { MessageSquare } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

const inputClass = [
  "w-full bg-bg-elevated border rounded px-3 py-2.5",
  "text-text-primary text-sm placeholder:text-text-muted",
  "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
  "transition-colors duration-150",
].join(" ");

const initialState: ApplicationFormState = {};

export function ApplicationForm() {
  const [state, formAction, pending] = useActionState(submitApplication, initialState);

  // ── Confirmation post-soumission ──────────────────────────────────────────
  if (state.success) {
    return (
      <div className="space-y-5">
        <div className="rounded border border-gold/30 bg-gold/5 p-5 space-y-2">
          <p className="text-gold font-display font-semibold text-lg">
            Candidature envoyée ✓
          </p>
          <p className="text-text-secondary text-sm leading-relaxed">
            Ta candidature a bien été soumise et est en attente de traitement.
          </p>
        </div>

        {/* Étape suivante claire */}
        <div className="rounded border border-border bg-bg-elevated p-5 space-y-3">
          <p className="text-text-primary text-sm font-display font-semibold">
            Prochaine étape
          </p>
          <p className="text-text-secondary text-sm leading-relaxed">
            Un recruteur te contactera sur Discord sous <strong className="text-text-primary">48h</strong>.
            Assure-toi d&apos;être présent sur le serveur.
          </p>
          <Button
            as="a"
            href={SITE_CONFIG.links.discord}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="sm"
          >
            <MessageSquare size={14} className="mr-1.5" />
            Rejoindre le Discord
          </Button>
        </div>
      </div>
    );
  }

  // ── Formulaire ────────────────────────────────────────────────────────────
  return (
    <form action={formAction} className="space-y-6">

      {/* Discord handle — requis, en premier */}
      <div className="space-y-1.5">
        <label htmlFor="discordHandle" className="block text-text-secondary text-sm font-medium">
          Pseudo Discord <span className="text-red-400 text-xs">*</span>
        </label>
        <input
          id="discordHandle"
          name="discordHandle"
          type="text"
          required
          placeholder="ex: @tonpseudo"
          className={inputClass}
        />
        <p className="text-text-muted text-xs">
          C&apos;est via Discord qu&apos;un recruteur te contactera pour la suite.
        </p>
      </div>

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
          className={inputClass}
        />
        <p className="text-text-muted text-xs">
          Retrouvez vos SP dans le jeu via le menu Character Sheet.
        </p>
      </div>

      {/* Disponibilités */}
      <div className="space-y-1.5">
        <label htmlFor="availability" className="block text-text-secondary text-sm font-medium">
          Disponibilités <span className="text-text-muted font-normal">(optionnel)</span>
        </label>
        <input
          id="availability"
          name="availability"
          type="text"
          placeholder="ex: EU TZ, soirs en semaine + week-ends"
          className={inputClass}
        />
        <p className="text-text-muted text-xs">
          Timezone, heures de jeu hebdo, contraintes particulières.
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
          rows={8}
          placeholder="Présente-toi, tes objectifs dans EVE, pourquoi Tabou, ton expérience en PvP nullsec…"
          className={`${inputClass} resize-y min-h-[160px]`}
        />
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
