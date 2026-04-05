"use client";

import { useActionState, useState } from "react";
import { saveProfileExtra } from "@/lib/actions/profile-extra";
import type { ProfileExtraState } from "@/lib/actions/profile-extra";
import { ACTIVITIES, TIMEZONE_GROUPS, VALID_LANGUAGES, LANGUAGE_LABEL } from "@/lib/profile-extra";
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
  // Langues : FR par défaut si rien n'est encore renseigné
  const [languages, setLanguages] = useState<Set<string>>(
    () => new Set((initial.languages?.length ? initial.languages : ["fr"]))
  );

  function toggleLanguage(lang: string) {
    setLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Fuseau horaire */}
      <div>
        <label className="block text-text-muted text-xs font-medium mb-1">
          Fuseau horaire
        </label>
        <select
          name="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className={cn(
            "w-full bg-bg-elevated border rounded px-3 py-2",
            "text-text-secondary text-sm",
            "border-border focus:border-gold/60 focus:outline-none transition-colors"
          )}
        >
          <option value="">— Non renseigné —</option>
          {TIMEZONE_GROUPS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
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

      {/* Langues — checkboxes FR / EN */}
      <div>
        <p className="block text-text-muted text-xs font-medium mb-2">
          Langues parlées
        </p>
        <div className="flex items-center gap-4">
          {VALID_LANGUAGES.map((lang) => {
            const checked = languages.has(lang);
            return (
              <label key={lang} className="flex items-center gap-2 cursor-pointer select-none">
                {/* Checkboxes envoyées dans le FormData */}
                <input
                  type="checkbox"
                  name="languages"
                  value={lang}
                  checked={checked}
                  onChange={() => toggleLanguage(lang)}
                  className="w-4 h-4 rounded border-border bg-bg-elevated accent-[#c9a227] cursor-pointer"
                />
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  checked ? "text-text-primary" : "text-text-muted"
                )}>
                  {LANGUAGE_LABEL[lang]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 pt-1">
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
