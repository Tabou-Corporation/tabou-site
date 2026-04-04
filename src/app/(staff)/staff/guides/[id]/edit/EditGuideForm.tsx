"use client";

import { useActionState } from "react";
import { updateGuide } from "@/lib/actions/content";
import { Button } from "@/components/ui/Button";

const inputClass = [
  "w-full bg-bg-elevated border rounded px-3 py-2.5",
  "text-text-primary text-sm placeholder:text-text-muted",
  "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
  "transition-colors duration-150",
].join(" ");

const CATEGORIES = [
  { value: "general",   label: "Général" },
  { value: "pvp",       label: "PvP" },
  { value: "logistics", label: "Logistique" },
  { value: "fits",      label: "Fits" },
  { value: "other",     label: "Autre" },
];

interface Props {
  id: string;
  defaultTitle: string;
  defaultCategory: string;
  defaultContent: string;
}

export function EditGuideForm({ id, defaultTitle, defaultCategory, defaultContent }: Props) {
  const boundAction = updateGuide.bind(null, id);
  const [state, action, pending] = useActionState(boundAction, {});

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-text-secondary text-sm font-medium">Titre</label>
          <input
            name="title"
            type="text"
            required
            defaultValue={defaultTitle}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-text-secondary text-sm font-medium">Catégorie</label>
          <select name="category" defaultValue={defaultCategory} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-text-secondary text-sm font-medium">Contenu</label>
        <textarea
          name="content"
          required
          rows={16}
          defaultValue={defaultContent}
          className={`${inputClass} resize-y min-h-[300px] font-mono text-xs`}
        />
      </div>

      {state.error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Sauvegarde…" : "Sauvegarder"}
      </Button>
    </form>
  );
}
