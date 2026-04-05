"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { saveProfileExtra } from "@/lib/actions/profile-extra";
import type { ProfileExtraState } from "@/lib/actions/profile-extra";
import { useRefreshOnSuccess } from "@/lib/hooks/useRefreshOnSuccess";
import { ACTIVITIES, ACTIVITY_LABEL, TIMEZONE_GROUPS, VALID_LANGUAGES, LANGUAGE_LABEL, getActivities } from "@/lib/profile-extra";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import type { ProfileExtra } from "@/lib/profile-extra";

interface Props {
  initial: ProfileExtra;
}

export function ProfileExtraEditor({ initial }: Props) {
  const [state, dispatch, pending] = useActionState<ProfileExtraState, FormData>(saveProfileExtra, {});
  useRefreshOnSuccess(state.success);

  const [timezone,   setTimezone]   = useState(initial.timezone ?? "");
  const [activities, setActivities] = useState<string[]>(() => getActivities(initial));
  const [actOpen,    setActOpen]    = useState(false);
  const actRef = useRef<HTMLDivElement>(null);
  // Langues : FR par défaut si rien n'est encore renseigné
  const [languages, setLanguages] = useState<Set<string>>(
    () => new Set((initial.languages?.length ? initial.languages : ["fr"]))
  );

  // Ferme le dropdown activités si clic extérieur
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (actRef.current && !actRef.current.contains(e.target as Node)) setActOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Sync state when initial prop changes (router refresh after revalidatePath)
  useEffect(() => {
    setTimezone(initial.timezone ?? "");
    setActivities(getActivities(initial));
    setLanguages(new Set(initial.languages?.length ? initial.languages : ["fr"]));
  }, [initial]);

  function toggleActivity(value: string) {
    setActivities((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Prevent React 19's automatic form reset after server action
    e.preventDefault();
    dispatch(new FormData(e.currentTarget));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      {/* Activités — multi-sélection ordonnée par priorité */}
      <div>
        <label className="block text-text-muted text-xs font-medium mb-1">
          Activités <span className="text-text-muted/60 font-normal">(coche dans l&apos;ordre de priorité)</span>
        </label>

        {/* Dropdown */}
        <div className="relative" ref={actRef}>
          <button
            type="button"
            onClick={() => setActOpen((o) => !o)}
            className={cn(
              "w-full bg-bg-elevated border rounded px-3 py-2",
              "text-text-secondary text-sm flex items-center justify-between",
              "border-border hover:border-gold/40 focus:border-gold/60 focus:outline-none transition-colors"
            )}
          >
            <span className={activities.length === 0 ? "text-text-muted" : ""}>
              {activities.length === 0
                ? "— Sélectionner des activités —"
                : `${activities.length} activité${activities.length > 1 ? "s" : ""} sélectionnée${activities.length > 1 ? "s" : ""}`}
            </span>
            <span className={cn("text-text-muted text-xs transition-transform duration-150", actOpen && "rotate-180 inline-block")}>▼</span>
          </button>

          {actOpen && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-bg-elevated border border-border rounded shadow-xl overflow-hidden">
              {ACTIVITIES.map((a) => {
                const rank = activities.indexOf(a.value);
                const selected = rank !== -1;
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => toggleActivity(a.value)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gold/5 transition-colors text-left"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors",
                      selected ? "bg-gold border-gold text-bg-deep" : "border-border text-transparent"
                    )}>
                      {selected ? rank + 1 : ""}
                    </div>
                    <span className={cn("text-sm", selected ? "text-text-primary font-medium" : "text-text-secondary")}>
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags ordonnés */}
        {activities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activities.map((val, i) => (
              <span key={val} className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/20 rounded px-2 py-0.5 text-xs text-gold">
                <span className="font-bold">{i + 1}.</span>
                {ACTIVITY_LABEL[val]}
                <button
                  type="button"
                  onClick={() => toggleActivity(val)}
                  className="ml-0.5 text-gold/60 hover:text-white transition-colors leading-none"
                  aria-label={`Retirer ${ACTIVITY_LABEL[val]}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Inputs cachés pour le FormData (ordre conservé) */}
        {activities.map((val) => (
          <input key={val} type="hidden" name="activities" value={val} />
        ))}
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
