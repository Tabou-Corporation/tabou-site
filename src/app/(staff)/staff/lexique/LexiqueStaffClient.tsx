"use client";

import { useState, useActionState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Pencil, Trash2 } from "lucide-react";
import { deleteTerm, updateTerm } from "@/lib/actions/glossary";
import { useRouter } from "next/navigation";

const GLOSSARY_CATEGORIES: Record<string, string> = {
  general: "Général",
  pvp: "PVP",
  pve: "PVE",
  industry: "Industrie",
  exploration: "Exploration",
};

const CATEGORY_ORDER = ["general", "pvp", "pve", "industry", "exploration"];

interface Term {
  id: string;
  term: string;
  literal: string | null;
  definition: string;
  category: string;
  authorName: string;
  createdAt: string;
}

export function LexiqueStaffClient({ terms }: { terms: Term[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, editAction, editPending] = useActionState(updateTerm, {});

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce terme définitivement ?")) return;
    await deleteTerm(id);
    router.refresh();
  }

  // Group by category
  const grouped = new Map<string, Term[]>();
  for (const t of terms) {
    if (!grouped.has(t.category)) grouped.set(t.category, []);
    grouped.get(t.category)!.push(t);
  }
  const sortedGroups: [string, Term[]][] = [];
  for (const cat of CATEGORY_ORDER) {
    if (grouped.has(cat)) sortedGroups.push([cat, grouped.get(cat)!]);
  }
  for (const [cat, items] of grouped) {
    if (!CATEGORY_ORDER.includes(cat)) sortedGroups.push([cat, items]);
  }

  function renderTermRow(t: Term) {
    const isEditing = editingId === t.id;

    if (isEditing) {
      return (
        <Card key={t.id} accent>
          <CardBody className="py-3 px-4">
            <form
              action={(formData) => {
                editAction(formData);
                setEditingId(null);
                router.refresh();
              }}
              className="space-y-2"
            >
              <input type="hidden" name="id" value={t.id} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  name="term"
                  defaultValue={t.term}
                  required
                  maxLength={50}
                  placeholder="Terme"
                  className="bg-bg-deep border border-border rounded px-2 py-1.5 text-text-primary text-sm focus:border-gold/60 focus:outline-none"
                />
                <input
                  name="literal"
                  defaultValue={t.literal ?? ""}
                  maxLength={100}
                  placeholder="Signification (ex: Fleet Commander)"
                  className="bg-bg-deep border border-border rounded px-2 py-1.5 text-text-primary text-sm focus:border-gold/60 focus:outline-none"
                />
              </div>
              <input
                name="definition"
                defaultValue={t.definition}
                required
                maxLength={300}
                placeholder="Définition"
                className="w-full bg-bg-deep border border-border rounded px-2 py-1.5 text-text-primary text-sm focus:border-gold/60 focus:outline-none"
              />
              <div className="flex items-end gap-2">
                <select
                  name="category"
                  defaultValue={t.category}
                  className="bg-bg-deep border border-border rounded px-2 py-1.5 text-text-primary text-sm focus:border-gold/60 focus:outline-none"
                >
                  {CATEGORY_ORDER.map((cat) => (
                    <option key={cat} value={cat}>
                      {GLOSSARY_CATEGORIES[cat]}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={editPending}>
                  {editPending ? <Spinner /> : "Enregistrer"}
                </Button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-text-muted text-xs hover:text-text-secondary transition-colors"
                >
                  Annuler
                </button>
              </div>
              {editState.error && (
                <p className="text-red-400 text-xs">{editState.error}</p>
              )}
            </form>
          </CardBody>
        </Card>
      );
    }

    return (
      <Card key={t.id}>
        <CardBody className="py-3 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-gold font-semibold text-sm font-mono tracking-wide">
                  {t.term}
                </span>
                {t.literal && (
                  <span className="text-text-muted text-xs italic">
                    {t.literal}
                  </span>
                )}
              </div>
              <p className="text-text-secondary text-xs leading-relaxed">
                {t.definition}
              </p>
              <p className="text-text-muted text-2xs mt-1">
                par {t.authorName} · {new Date(t.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingId(t.id)}
                title="Modifier"
                className="p-1.5 rounded text-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                title="Supprimer"
                className="p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {sortedGroups.map(([category, items]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="gold" className="text-2xs">
              {GLOSSARY_CATEGORIES[category] ?? category}
            </Badge>
            <span className="text-text-muted/40 text-xs">
              {items.length} terme{items.length > 1 ? "s" : ""}
            </span>
            <div className="flex-1 border-t border-border/50" />
          </div>
          <div className="space-y-2">
            {items.map(renderTermRow)}
          </div>
        </div>
      ))}

      {terms.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8">
          Aucun terme dans le lexique pour le moment.
        </p>
      )}
    </div>
  );
}
