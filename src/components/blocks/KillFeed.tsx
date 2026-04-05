"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ZKILL_CONFIG } from "@/lib/zkillboard/config";
import type { KillDisplayEntry } from "@/lib/zkillboard/types";

interface KillFeedProps {
  initialKills: KillDisplayEntry[];
}

const ITEM_HEIGHT = 84; // px — hauteur d'un kill dans la liste
const VISIBLE     = 3;  // nombre de kills visibles simultanément
const SCROLL_MS   = 2800; // durée entre chaque défilement

export function KillFeed({ initialKills }: KillFeedProps) {
  const [kills, setKills] = useState<KillDisplayEntry[]>(initialKills);
  const [offset, setOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Scroll automatique ────────────────────────────────────────────
  useEffect(() => {
    if (kills.length <= VISIBLE) return;

    intervalRef.current = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setOffset((prev) => (prev + 1) % kills.length);
        setTransitioning(false);
      }, 350);
    }, SCROLL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [kills.length]);

  // ── Polling API ───────────────────────────────────────────────────
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch("/api/kills");
        if (res.ok) setKills(await res.json());
      } catch { /* silencieux */ }
    };
    const t = setInterval(refresh, ZKILL_CONFIG.refreshInterval);
    return () => clearInterval(t);
  }, []);

  if (kills.length === 0) return null;

  // Items cycliques : on retranche depuis offset pour faire défiler
  const visible = Array.from({ length: Math.min(VISIBLE, kills.length) }, (_, i) =>
    kills[(offset + i) % kills.length]
  ).filter((k): k is KillDisplayEntry => k !== undefined);

  return (
    <div className={cn(
      "hidden lg:flex flex-col",
      "w-[260px]",
      "border-l-2 border-l-gold/50",
    )}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-gold/50 text-xs font-bold tracking-extra-wide uppercase">
          Kills récents
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-light animate-pulse" />
          <span className="text-red-light text-xs font-bold tracking-widest uppercase">Live</span>
        </span>
      </div>

      {/* ── Liste défilante ────────────────────────────────────────── */}
      <div
        className="overflow-hidden"
        style={{ height: ITEM_HEIGHT * VISIBLE }}
      >
        <div
          className={cn(
            "flex flex-col",
            transitioning ? "opacity-0 -translate-y-1 transition-all duration-300" : "opacity-100 translate-y-0 transition-all duration-300"
          )}
        >
          {visible.map((kill, i) => (
            <Link
              key={`${kill.id}-${i}`}
              href={kill.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 px-4 group",
                "hover:bg-white/[0.03] transition-colors duration-150",
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {/* Icône ship */}
              <div className="flex-shrink-0 w-12 h-12 rounded-sm overflow-hidden border border-gold/20 bg-bg-elevated">
                <Image
                  src={`https://images.evetech.net/types/${kill.shipTypeId}/render?size=64`}
                  alt={kill.shipName}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-display font-semibold truncate group-hover:text-gold transition-colors">
                  {kill.shipName}
                </p>
                <p className="text-text-muted text-xs truncate leading-tight">
                  {kill.victimName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-gold text-xs font-bold">◆ {kill.iskValue}</span>
                  <span className="text-border text-xs">·</span>
                  <span className="text-text-muted text-xs">{kill.timeAgo}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <Link
        href={`${ZKILL_CONFIG.baseUrl}/corporation/${ZKILL_CONFIG.corpId}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-4 pt-2 text-text-muted/60 text-xs hover:text-gold transition-colors group"
      >
        Tous les kills
        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
      </Link>
    </div>
  );
}
