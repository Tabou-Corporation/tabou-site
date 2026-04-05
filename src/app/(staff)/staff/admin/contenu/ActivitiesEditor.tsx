"use client";

import { useActionState, useState } from "react";
import { saveSiteContentAction } from "@/lib/actions/site-content";
import { useRefreshOnSuccess } from "@/lib/hooks/useRefreshOnSuccess";
import { Field, TextareaField, StringListField, SaveBar } from "./EditorFields";
import type { ActivityItem } from "@/lib/site-content/types";

const inputCls =
  "w-full bg-bg-elevated border border-border rounded px-3 py-2 text-text-primary text-sm focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 placeholder:text-text-muted";
const labelCls = "block text-text-muted text-xs uppercase tracking-wide font-semibold mb-1";

const CATEGORIES = [
  { value: "pvp", label: "PvP" },
  { value: "pve", label: "PvE" },
  { value: "exploration", label: "Exploration" },
  { value: "industry", label: "Industrie & Économie" },
  { value: "collective", label: "Collectif" },
];

function ActivityEditor({
  activity,
  index,
  onChange,
  onRemove,
}: {
  activity: ActivityItem;
  index: number;
  onChange: (a: ActivityItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 p-4 bg-bg-elevated/40 border border-border rounded-md">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-xs font-semibold">{activity.name || `Activité ${index + 1}`}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400/70 hover:text-red-400 text-xs"
        >
          Supprimer
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Nom"
          value={activity.name}
          onChange={(v) => onChange({ ...activity, name: v })}
        />
        <div>
          <label className={labelCls}>Catégorie</label>
          <select
            className={inputCls}
            value={activity.category}
            onChange={(e) => onChange({ ...activity, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Icône Lucide"
          value={activity.icon}
          onChange={(v) => onChange({ ...activity, icon: v })}
          placeholder="ex: Crosshair"
        />
        <Field
          label="ID (slug)"
          value={activity.id}
          onChange={(v) => onChange({ ...activity, id: v })}
        />
      </div>
      <TextareaField
        label="Description"
        value={activity.description}
        onChange={(v) => onChange({ ...activity, description: v })}
        rows={2}
      />
      <StringListField
        label="Tags"
        value={activity.tags}
        onChange={(v) => onChange({ ...activity, tags: v })}
        addLabel="+ Ajouter un tag"
      />
    </div>
  );
}

export function ActivitiesEditor({ initialContent }: { initialContent: ActivityItem[] }) {
  const [state, formAction, pending] = useActionState(saveSiteContentAction, {});
  useRefreshOnSuccess(state.success);
  const [activities, setActivities] = useState<ActivityItem[]>(initialContent);

  const byCategory = CATEGORIES.map((cat) => ({
    ...cat,
    items: activities
      .map((a, globalIndex) => ({ activity: a, globalIndex }))
      .filter(({ activity }) => activity.category === cat.value),
  }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="page" value="activities" />
      <input type="hidden" name="content" value={JSON.stringify(activities)} />

      {byCategory.map(({ value, label, items }) => (
        <div key={value} className="space-y-3">
          <h3 className="font-display font-semibold text-sm text-gold/80 border-b border-border pb-2">
            {label}
          </h3>
          {items.map(({ activity, globalIndex }) => (
            <ActivityEditor
              key={activity.id}
              activity={activity}
              index={globalIndex}
              onChange={(updated) => {
                const next = [...activities];
                next[globalIndex] = updated;
                setActivities(next);
              }}
              onRemove={() => setActivities(activities.filter((_, j) => j !== globalIndex))}
            />
          ))}
        </div>
      ))}

      <div className="border border-dashed border-border rounded-md p-4">
        <button
          type="button"
          onClick={() =>
            setActivities([
              ...activities,
              {
                id: `activity-${Date.now()}`,
                name: "",
                category: "pvp",
                icon: "Star",
                description: "",
                tags: [],
              },
            ])
          }
          className="text-gold/70 hover:text-gold text-sm font-medium"
        >
          + Ajouter une activité
        </button>
      </div>

      <SaveBar pending={pending} success={state.success} error={state.error} />
    </form>
  );
}
