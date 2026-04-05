"use client";

import { useActionState, useState } from "react";
import { saveSiteContentAction } from "@/lib/actions/site-content";
import { useRefreshOnSuccess } from "@/lib/hooks/useRefreshOnSuccess";
import { Field, TextareaField, SaveBar } from "./EditorFields";
import type { FaqItem } from "@/lib/site-content/types";

const inputCls =
  "w-full bg-bg-elevated border border-border rounded px-3 py-2 text-text-primary text-sm focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 placeholder:text-text-muted";
const labelCls = "block text-text-muted text-xs uppercase tracking-wide font-semibold mb-1";

function FaqItemEditor({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: FaqItem;
  index: number;
  onChange: (item: FaqItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 p-4 bg-bg-elevated/40 border border-border rounded-md">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-xs font-semibold">#{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400/70 hover:text-red-400 text-xs"
        >
          Supprimer
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Catégorie</label>
          <input
            type="text"
            className={inputCls}
            value={item.category}
            onChange={(e) => onChange({ ...item, category: e.target.value })}
            placeholder="ex: Recrutement"
          />
        </div>
        <div>
          <label className={labelCls}>ID (ne pas modifier)</label>
          <input
            type="text"
            className={`${inputCls} opacity-50`}
            value={item.id}
            onChange={(e) => onChange({ ...item, id: e.target.value })}
          />
        </div>
      </div>
      <Field
        label="Question"
        value={item.question}
        onChange={(v) => onChange({ ...item, question: v })}
      />
      <TextareaField
        label="Réponse"
        value={item.answer}
        onChange={(v) => onChange({ ...item, answer: v })}
        rows={4}
      />
    </div>
  );
}

export function FaqEditor({ initialContent }: { initialContent: FaqItem[] }) {
  const [state, formAction, pending] = useActionState(saveSiteContentAction, {});
  useRefreshOnSuccess(state.success);
  const [items, setItems] = useState<FaqItem[]>(initialContent);

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="page" value="faq" />
      <input type="hidden" name="content" value={JSON.stringify(items)} />

      {/* Group by category for display */}
      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h3 className="font-display font-semibold text-sm text-gold/80 border-b border-border pb-2">
            {category}
          </h3>
          {items
            .map((item, globalIndex) => ({ item, globalIndex }))
            .filter(({ item }) => item.category === category)
            .map(({ item, globalIndex }) => (
              <FaqItemEditor
                key={item.id}
                item={item}
                index={globalIndex}
                onChange={(updated) => {
                  const next = [...items];
                  next[globalIndex] = updated;
                  setItems(next);
                }}
                onRemove={() => setItems(items.filter((_, j) => j !== globalIndex))}
              />
            ))}
        </div>
      ))}

      <div className="border border-dashed border-border rounded-md p-4">
        <button
          type="button"
          onClick={() =>
            setItems([
              ...items,
              {
                id: `faq-new-${Date.now()}`,
                category: "Recrutement",
                question: "",
                answer: "",
              },
            ])
          }
          className="text-gold/70 hover:text-gold text-sm font-medium"
        >
          + Ajouter une question
        </button>
      </div>

      <SaveBar pending={pending} success={state.success} error={state.error} />
    </form>
  );
}
