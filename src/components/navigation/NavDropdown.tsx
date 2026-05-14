"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "@/types/navigation";

/**
 * NavDropdown — dropdown mega-menu pour la navigation desktop.
 * Ouverture au hover (desktop) + au clic (accessibilité clavier/tactile).
 * L'item `featured` reçoit un traitement visuel premium avec teaser live
 * (fetch lazy : uniquement à la 1re ouverture du menu).
 */

interface TeaserData {
  characterId: number;
  characterName: string | null;
  kills: number;
}

export function NavDropdown({ label, items }: { label: string; items: NavItem[] }) {
  const children = items;
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Un enfant actif → le groupe est "actif"
  const groupActive = children.some(
    (c) => c.href && c.href !== "/" && pathname.startsWith(c.href),
  );

  // Teaser Hall of Fame — fetch lazy à la 1re ouverture
  const [teaser, setTeaser] = useState<TeaserData | null>(null);
  const teaserFetched = useRef(false);
  const featured = children.find((c) => c.featured);

  const loadTeaser = useCallback(() => {
    if (teaserFetched.current || !featured) return;
    teaserFetched.current = true;
    fetch("/api/map/stats/corp")
      .then((r) => r.json())
      .then((d: { entries?: TeaserData[] }) => {
        if (d.entries && d.entries.length > 0) setTeaser(d.entries[0] ?? null);
      })
      .catch(() => { /* silent — le fallback statique reste affiché */ });
  }, [featured]);

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
    loadTeaser();
  }
  function handleLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  // Fermeture au clic extérieur + Échap
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const regular = children.filter((c) => !c.featured);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); loadTeaser(); }}
        aria-expanded={open}
        className={cn(
          "relative flex items-center gap-1 text-sm sm:text-lg font-medium tracking-wide transition-colors duration-[180ms]",
          "after:absolute after:bottom-[-2px] after:left-0 after:h-px after:w-full",
          "after:transition-transform after:duration-[180ms] after:origin-left",
          groupActive || open
            ? "text-gold after:bg-gold after:scale-x-100"
            : "text-text-secondary hover:text-text-primary after:bg-gold/60 after:scale-x-0 hover:after:scale-x-100",
        )}
      >
        {label}
        <ChevronDown
          size={15}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* Panneau dropdown */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[360px]",
          "transition-all duration-200 ease-out",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none",
        )}
      >
        <div className="bg-bg-deep/98 backdrop-blur-md border border-border rounded-lg shadow-panel-lg overflow-hidden">
          {/* Items réguliers */}
          <div className="p-2">
            {regular.map((c) => {
              const active = c.href && pathname.startsWith(c.href) && c.href !== "/";
              return (
                <Link
                  key={c.href}
                  href={c.href ?? "#"}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-2.5 transition-colors group/item",
                    active ? "bg-gold/10" : "hover:bg-bg-elevated",
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-semibold transition-colors",
                      active ? "text-gold" : "text-text-primary group-hover/item:text-gold",
                    )}
                  >
                    {c.label}
                  </span>
                  {c.description && (
                    <span className="block text-xs text-text-muted mt-0.5 leading-snug">
                      {c.description}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Item featured — Hall of Fame avec teaser live */}
          {featured && (
            <Link
              href={featured.href ?? "#"}
              onClick={() => setOpen(false)}
              className="group/feat block relative overflow-hidden border-t border-gold/20 bg-gradient-to-br from-gold/10 via-amber-950/20 to-transparent px-4 py-3.5 hover:from-gold/15 transition-colors"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(230,194,101,0.18) 0%, transparent 70%)",
                }}
              />
              <div className="relative flex items-center gap-3">
                {teaser ? (
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://images.evetech.net/characters/${teaser.characterId}/portrait?size=64`}
                      alt=""
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full ring-2 ring-gold/50 bg-bg-deep"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-gold text-bg-deep rounded-full p-0.5">
                      <Trophy size={9} />
                    </span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gold/10 ring-2 ring-gold/40 flex items-center justify-center shrink-0">
                    <Trophy size={16} className="text-gold" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gold">
                    {featured.label}
                  </span>
                  {teaser ? (
                    <span className="block text-xs text-text-secondary truncate">
                      🥇 <strong className="text-text-primary">{teaser.characterName ?? "—"}</strong>
                      <span className="text-text-muted"> · </span>
                      <span className="text-emerald-400">{teaser.kills.toLocaleString("fr-FR")} kills</span>
                    </span>
                  ) : (
                    <span className="block text-xs text-text-muted truncate">
                      {featured.description ?? "Classement all-time"}
                    </span>
                  )}
                </div>
                <span className="text-gold/50 group-hover/feat:text-gold group-hover/feat:translate-x-0.5 transition-all text-sm">
                  →
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
