"use client";

import { useActionState, useState } from "react";
import { saveProfileExtra } from "@/lib/actions/profile-extra";
import type { ProfileExtraState } from "@/lib/actions/profile-extra";
import { ACTIVITIES } from "@/lib/profile-extra";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import type { ProfileExtra } from "@/lib/profile-extra";

interface Props {
  initial: ProfileExtra;
}

export function ProfileExtraEditor({ initial }: Props) {
  const [state, formAction, pending] = useActionState<ProfileExtraState, FormData>(saveProfileExtra, {});

  const [timezone,     setTimezone]     = useState(initial.timezone     ?? "");
  const [mainActivity, setMainActivity] = useState(initial.mainActivity ?? "");
  const [alts,         setAlts]         = useState((initial.alts         ?? []).join(", "));
  const [languages,    setLanguages]    = useState((initial.languages    ?? []).join(", "));

  return (
    <form action={formAction} className="space-y-4">
      {/* Timezone */}
      <div>
        <label className="block text-text-muted text-xs font-medium mb-1">
          Fuseau horaire
        </label>
        <input
          name="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="ex. UTC+2, Europe/Paris, EVE Time…"
          maxLength={50}
          className={cn(
            "w-full bg-bg-elevated border rounded px-3 py-2",
            "text-text-primary text-sm",
            "border-border focus:border-gold/60 focus:outline-none transition-colors"
          )}
        />
      </div>

      {/* Activité principale */}
      <div>
        <label className="block text-text-muted text-xs font-medium mb-1">
          Activité principale
        </label>
        <select
          name="mainActivity"
          value={mainActivity}
          onChange={(e) => setMainActivity(e.target.value)}
          className={cn(
            "w-full bg-bg-elevated border rounded px-3 py-2",
            "text-text-secondary text-sm",
            "border-border focus:border-gold/60 focus:outline-none transition-colors"
          )}
        >
          <option value="">— Non renseignée —</option>
          {ACTIVITIES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      {/* Langues */}
      <div>
        <label className="block text-text-muted text-xs font-medium mb-1">
          Langues parlées{" "}
          <span className="font-normal text-text-muted/70">(séparées par des virgules)</span>
        </label>
        <input
          name="languages"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          placeholder="ex. fr, en, de"
          className={cn(
            "w-full bg-bg-elevated border rounded px-3 py-2",
            "text-text-primary text-sm",
            "border-border focus:border-gold/60 focus:outline-none transition-colors"
          )}
        />
      </div>

      {/* Alts */}
      <div>
        <label className="block text-text-muted text-xs font-medium mb-1">
          Personnages alternatifs{" "}
          <span className="font-normal text-text-muted/70">(séparés par des virgules, max 10)</span>
        </label>
        <input
          name="alts"
          value={alts}
          onChange={(e) => setAlts(e.target.value)}
          placeholder="ex. Alt Miner, Scout Caldari"
          className={cn(
            "w-full bg-bg-elevated border rounded px-3 py-2",
            "text-text-primary text-sm",
            "border-border focus:border-gold/60 focus:outline-none transition-colors"
          )}
        />
        <p className="text-text-muted text-[11px] mt-1">
          Visibles dans votre fiche de candidature et par les officiers.
        </p>
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors",
            "bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {pending && <Spinner />}
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.success && (
          <span className="text-gold text-xs">Profil mis à jour.</span>
        )}
        {state.error && (
          <span className="text-red-400 text-xs">{state.error}</span>
        )}
      </div>
    </form>
  );
}
