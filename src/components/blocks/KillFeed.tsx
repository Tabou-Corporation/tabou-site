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

const ITEM_HEIGHT = 68; // px — hauteur d'un kill dans la liste
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
      "w-[210px]",
      "bg-bg-deep/85 backdrop-blur-sm",
      "border-r border-r-gold/20 border-t border-t-gold/10 border-b border-b-gold/10",
      "border-l-2 border-l-gold/50",
    )}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/15">
        <span className="text-gold text-2xs font-bold tracking-extra-wide uppercase">
          Kills récents
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-light animate-pulse" />
          <span className="text-red-light text-2xs font-bold tracking-widest uppercase">Live</span>
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
                "flex items-center gap-2.5 px-3 group",
                "hover:bg-gold/5 transition-colors duration-150",
                "border-b border-gold/10 last:border-0",
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {/* Icône ship */}
              <div className="flex-shrink-0 w-9 h-9 rounded-sm overflow-hidden border border-gold/20 bg-bg-elevated">
                <Image
                  src={`https://images.evetech.net/types/${kill.shipTypeId}/render?size=64`}
                  alt={kill.shipName}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-xs font-display font-semibold truncate group-hover:text-gold transition-colors">
                  {kill.shipName}
                </p>
                <p className="text-text-muted text-2xs truncate leading-tight">
                  {kill.victimName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-gold text-2xs font-bold">◆ {kill.iskValue}</span>
                  <span className="text-border text-2xs">·</span>
                  <span className="text-text-muted text-2xs">{kill.timeAgo}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Indicateur de progression ──────────────────────────────── */}
      <div className="flex items-center justify-center gap-1 py-1.5 border-t border-gold/15">
        {kills.map((_, i) => (
          <span
            key={i}
            className={cn(
              "block rounded-full transition-all duration-300",
              i === offset % kills.length
                ? "w-3 h-1 bg-gold"
                : "w-1 h-1 bg-gold/25"
            )}
          />
        ))}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <Link
        href={`${ZKILL_CONFIG.baseUrl}/corporation/${ZKILL_CONFIG.corpId}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 px-3 py-2 border-t border-gold/15 text-text-muted text-2xs hover:text-gold transition-colors group"
      >
        Tous les kills
        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
      </Link>
    </div>
  );
}
