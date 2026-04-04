"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ZKILL_CONFIG } from "@/lib/zkillboard/config";
import type { KillDisplayEntry } from "@/lib/zkillboard/types";

interface KillFeedProps {
  /** Kills initiaux (chargés côté serveur pour éviter le flash vide) */
  initialKills: KillDisplayEntry[];
}

export function KillFeed({ initialKills }: KillFeedProps) {
  const [kills, setKills] = useState<KillDisplayEntry[]>(initialKills);
  const [newId, setNewId] = useState<number | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch("/api/kills");
        if (!res.ok) return;
        const data: KillDisplayEntry[] = await res.json();
        setKills((prev) => {
          if (data[0]?.id !== prev[0]?.id) setNewId(data[0]?.id ?? null);
          return data;
        });
      } catch {
        // silencieux — on garde les données précédentes
      }
    };

    const timer = setInterval(refresh, ZKILL_CONFIG.refreshInterval);
    return () => clearInterval(timer);
  }, []);

  // Retire le flash gold après 1.5s
  useEffect(() => {
    if (newId === null) return;
    const t = setTimeout(() => setNewId(null), 1500);
    return () => clearTimeout(t);
  }, [newId]);

  if (kills.length === 0) return null;

  return (
    <div className={cn(
      "hidden lg:flex flex-col",
      "w-[220px]",
      "bg-bg-deep/80 backdrop-blur-sm",
      "border-l-2 border-gold/30",
      "overflow-hidden",
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gold/20">
        <span className="text-gold text-2xs font-semibold tracking-extra-wide uppercase">
          Kills récents
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-light animate-pulse" />
          <span className="text-red-light text-2xs font-semibold tracking-widest uppercase">
            Live
          </span>
        </span>
      </div>

      {/* Liste */}
      <div className="flex flex-col divide-y divide-gold/10">
        {kills.map((kill, i) => (
          <Link
            key={kill.id}
            href={kill.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 group",
              "transition-colors duration-[180ms]",
              "hover:bg-gold/5",
              kill.id === newId && "animate-fade-in-fast bg-gold/10",
              // stagger à l'entrée : chaque ligne décalée
              i === 0 && "animate-fade-in [animation-delay:0ms]",
              i === 1 && "animate-fade-in [animation-delay:80ms]",
              i === 2 && "animate-fade-in [animation-delay:160ms]",
              i === 3 && "animate-fade-in [animation-delay:240ms]",
              i === 4 && "animate-fade-in [animation-delay:320ms]",
            )}
          >
            {/* Icône ship EVE */}
            <div className="flex-shrink-0 w-8 h-8 rounded-sm overflow-hidden border border-gold/20 bg-bg-elevated">
              <Image
                src={`https://images.evetech.net/types/${kill.shipTypeId}/render?size=32`}
                alt={kill.shipName}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-xs font-display font-semibold truncate group-hover:text-gold transition-colors">
                {kill.shipName}
              </p>
              <p className="text-text-muted text-2xs truncate">
                {kill.victimName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-gold text-2xs font-semibold">
                  ◆ {kill.iskValue}
                </span>
                <span className="text-text-muted text-2xs">·</span>
                <span className="text-text-muted text-2xs">
                  {kill.timeAgo}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <Link
        href={`${ZKILL_CONFIG.baseUrl}/corporation/${ZKILL_CONFIG.corpId}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 px-3 py-2 border-t border-gold/20 text-text-muted text-2xs hover:text-gold transition-colors group"
      >
        Voir tous les kills
        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
      </Link>
    </div>
  );
}
