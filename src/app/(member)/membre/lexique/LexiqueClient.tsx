"use client";

import { useState, useMemo, useActionState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Search, Plus, X, BookOpenText } from "lucide-react";
import { proposeTerm } from "@/lib/actions/glossary";

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

interface Props {
  terms: Term[];
}

export function LexiqueClient({ terms }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, formAction, pending] = useActionState(proposeTerm, {});

  const wasSuccess = formState.success;

  const filtered = useMemo(() => {
    let result = terms;

    if (activeCategory) {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          (t.literal?.toLowerCase().includes(q) ?? false) ||
          t.definition.toLowerCase().includes(q)
      );
    }

    return result;
  }, [terms, search, activeCategory]);

  // Group by category for display
  const grouped = useMemo(() => {
    const map = new Map<string, Term[]>();
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    const sorted = new Map<string, Term[]>();
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) sorted.set(cat, map.get(cat)!);
    }
    for (const [cat, items] of map) {
      if (!sorted.has(cat)) sorted.set(cat, items);
    }
    return sorted;
  }, [filtered]);

  // Category counts for tabs
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of terms) {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    }
    return counts;
  }, [terms]);

  return (
    <div className="space-y-6">
      {/* Search + Propose button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Rechercher un terme, une abréviation ou une définition…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-elevated border border-border rounded pl-9 pr-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
          />
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <><X size={14} /> Annuler</> : <><Plus size={14} /> Proposer un terme</>}
        </Button>
      </div>

      {/* Propose form */}
      {showForm && (
        <Card accent>
          <CardBody>
            {wasSuccess ? (
              <div className="text-center py-2">
                <p className="text-green-400 text-sm font-medium">
                  Terme ajouté au lexique !
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-text-muted text-xs mt-2 hover:text-text-secondary transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form action={formAction} className="space-y-3">
                <p className="text-text-secondary text-sm font-medium">
                  Proposer un nouveau terme
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-text-muted text-xs">
                      Terme / Abréviation <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="term"
                      type="text"
                      required
                      maxLength={50}
                      placeholder='FC, SRP, Broadcast…'
                      className="w-full bg-bg-deep border border-border rounded px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-text-muted text-xs">
                      Signification <span className="text-text-muted/60">(optionnel)</span>
                    </label>
                    <input
                      name="literal"
                      type="text"
                      maxLength={100}
                      placeholder='Fleet Commander, Ship Replacement Program…'
                      className="w-full bg-bg-deep border border-border rounded px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-text-muted text-xs">
                    Définition courte <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="definition"
                    type="text"
                    required
                    maxLength={300}
                    placeholder="Le joueur qui dirige la flotte et donne les ordres tactiques…"
                    className="w-full bg-bg-deep border border-border rounded px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
                  />
                </div>
                <div className="flex items-end gap-3">
                  <div className="space-y-1">
                    <label className="text-text-muted text-xs">Catégorie</label>
                    <select
                      name="category"
                      defaultValue="general"
                      className="bg-bg-deep border border-border rounded px-3 py-2 text-text-primary text-sm focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
                    >
                      {CATEGORY_ORDER.map((cat) => (
                        <option key={cat} value={cat}>
                          {GLOSSARY_CATEGORIES[cat]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" size="sm" disabled={pending}>
                    {pending ? <><Spinner /> Envoi…</> : "Ajouter au lexique"}
                  </Button>
                </div>
                {formState.error && (
                  <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-1.5">
                    {formState.error}
                  </p>
                )}
              </form>
            )}
          </CardBody>
        </Card>
      )}

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeCategory === null
              ? "bg-gold/20 text-gold border border-gold/30"
              : "bg-bg-elevated text-text-muted border border-border hover:text-text-secondary hover:border-border"
          }`}
        >
          Tous ({terms.length})
        </button>
        {CATEGORY_ORDER.map((cat) => {
          const count = categoryCounts[cat] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "bg-bg-elevated text-text-muted border border-border hover:text-text-secondary"
              }`}
            >
              {GLOSSARY_CATEGORIES[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Terms display */}
      {filtered.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <BookOpenText size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted text-sm">
              {search ? "Aucun terme ne correspond à votre recherche." : "Aucun terme dans le lexique pour le moment."}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([category, items]) => (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((t) => (
                  <Card key={t.id}>
                    <CardBody className="py-3 px-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-gold font-semibold text-sm font-mono tracking-wide">
                          {t.term}
                        </span>
                        {t.literal && (
                          <span className="text-text-muted text-xs italic truncate">
                            {t.literal}
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-xs leading-relaxed">
                        {t.definition}
                      </p>
                      <p className="text-text-muted text-2xs mt-2">
                        par {t.authorName}
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
