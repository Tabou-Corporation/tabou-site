"use client";

import { useActionState } from "react";
import { useSession } from "next-auth/react";
import { updateGuide } from "@/lib/actions/content";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getAllowedGuideCategories, parseSpecialties } from "@/types/roles";
import { CATEGORY_LABELS } from "@/lib/constants/labels";
import type { UserRole } from "@/types/roles";

const inputClass = [
  "w-full bg-bg-elevated border rounded px-3 py-2.5",
  "text-text-primary text-sm placeholder:text-text-muted",
  "border-border focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40",
  "transition-colors duration-150",
].join(" ");

interface Props {
  id: string;
  defaultTitle: string;
  defaultCategory: string;
  defaultContent: string;
}

export function EditGuideForm({ id, defaultTitle, defaultCategory, defaultContent }: Props) {
  const boundAction = updateGuide.bind(null, id);
  const [state, action, pending] = useActionState(boundAction, {});
  const { data: session } = useSession();

  const role = (session?.user?.role ?? "candidate") as UserRole;
  const domains = parseSpecialties(session?.user?.specialties);
  const allowedCategories = getAllowedGuideCategories(role, domains);

  // Ensure the current category is included even if not in the allowed list
  const categories = allowedCategories.includes(defaultCategory)
    ? allowedCategories
    : [defaultCategory, ...allowedCategories];

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-text-secondary text-sm font-medium">
            Titre <span className="text-red-400 text-xs">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            defaultValue={defaultTitle}
            placeholder="Titre du guide"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-text-secondary text-sm font-medium">
            Catégorie
          </label>
          <select name="category" defaultValue={defaultCategory} className={inputClass}>
            {categories.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-text-secondary text-sm font-medium">
          Contenu <span className="text-red-400 text-xs">*</span>
        </label>
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
        {pending ? <><Spinner />Sauvegarde…</> : "Sauvegarder"}
      </Button>
    </form>
  );
}
