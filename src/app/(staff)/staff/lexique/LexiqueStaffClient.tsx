"use client";

import { useState, useActionState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Check, Pencil, Trash2 } from "lucide-react";
import { approveTerm, deleteTerm, updateTerm } from "@/lib/actions/glossary";
import { useRouter } from "next/navigation";

const GLOSSARY_CATEGORIES: Record<string, string> = {
  general: "Général",
  pvp: "PVP",
  pve: "PVE",
  industry: "Industrie",
  exploration: "Exploration",
  diplomacy: "Diplomatie",
};

const CATEGORY_ORDER = ["general", "pvp", "pve", "industry", "exploration", "diplomacy"];

interface Term {
  id: string;
  term: string;
  definition: string;
  category: string;
  approved: boolean;
  authorName: string;
  createdAt: string;
}

export function LexiqueStaffClient({ terms }: { terms: Term[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, editAction, editPending] = useActionState(updateTerm, {});

  const pending = terms.filter((t) => !t.approved);
  const approved = terms.filter((t) => t.approved);

  async function handleApprove(id: string) {
    await approveTerm(id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce terme définitivement ?")) return;
    await deleteTerm(id);
    router.refresh();
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  name="term"
                  defaultValue={t.term}
                  required
                  maxLength={50}
                  className="bg-bg-deep border border-border rounded px-2 py-1.5 text-text-primary text-sm focus:border-gold/60 focus:outline-none"
                />
                <input
                  name="definition"
                  defaultValue={t.definition}
                  required
                  maxLength={300}
                  className="sm:col-span-2 bg-bg-deep border border-border rounded px-2 py-1.5 text-text-primary text-sm focus:border-gold/60 focus:outline-none"
                />
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
              </div>
              <div className="flex gap-2">
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
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-gold font-semibold text-sm font-mono tracking-wide">
                  {t.term}
                </span>
                <Badge
                  variant={t.approved ? "muted" : "gold"}
                  className="text-2xs"
                >
                  {t.approved ? GLOSSARY_CATEGORIES[t.category] ?? t.category : "En attente"}
                </Badge>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed">
                {t.definition}
              </p>
              <p className="text-text-muted text-2xs mt-1">
                par {t.authorName} · {new Date(t.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!t.approved && (
                <button
                  type="button"
                  onClick={() => handleApprove(t.id)}
                  title="Approuver"
                  className="p-1.5 rounded text-green-400 hover:bg-green-400/10 transition-colors"
                >
                  <Check size={14} />
                </button>
              )}
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
      {/* Pending terms */}
      {pending.length > 0 && (
        <div>
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-extra-wide mb-3">
            En attente de validation ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map(renderTermRow)}
          </div>
        </div>
      )}

      {/* Approved terms */}
      <div>
        <p className="text-text-muted text-xs font-semibold uppercase tracking-extra-wide mb-3">
          Termes validés ({approved.length})
        </p>
        {approved.length === 0 ? (
          <p className="text-text-muted text-sm">Aucun terme validé pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {approved.map(renderTermRow)}
          </div>
        )}
      </div>
    </div>
  );
}
