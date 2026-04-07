"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { CORPORATIONS } from "@/lib/constants/corporations";
import { PilotCard } from "./PilotCard";
import { PilotModal } from "./PilotModal";
import { cn } from "@/lib/utils/cn";
import type { PilotData } from "./PilotCard";

const ROLE_ORDER: Record<string, number> = {
  ceo: 0, director: 1, officer: 2, admin: 3, member: 4, member_uz: 5, candidate: 6,
};

interface PilotGridProps {
  members: PilotData[];
  /** Si false, les cartes ne sont pas cliquables et la modale est désactivée */
  interactive?: boolean;
}

type Tab = "tabou" | "uz";

export function PilotGrid({ members, interactive = true }: PilotGridProps) {
  const [activeTab,    setActiveTab]    = useState<Tab>("tabou");
  const [selectedPilot, setSelectedPilot] = useState<PilotData | null>(null);
  const openPilot  = useCallback((p: PilotData) => setSelectedPilot(p), []);
  const closePilot = useCallback(() => setSelectedPilot(null), []);

  const tabouMembers = useMemo(
    () =>
      members
        // On se base uniquement sur corporationId — fallback Tabou si non renseigné
        // (les officers/directors UZ ont toujours corporationId via ESI sync)
        .filter((m) =>
          m.corporationId === CORPORATIONS.tabou.id ||
          (!m.corporationId && m.role !== "member_uz" && m.role !== "officer" && m.role !== "director" && m.role !== "ceo" && m.role !== "admin")
        )
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)),
    [members]
  );

  const uzMembers = useMemo(
    () =>
      members
        .filter((m) =>
          m.corporationId === CORPORATIONS.urbanZone.id ||
          (!m.corporationId && m.role === "member_uz")
        )
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || (a.name ?? "").localeCompare(b.name ?? "")),
    [members]
  );

  const displayed = activeTab === "tabou" ? tabouMembers : uzMembers;

  type Corp = { name: string; logoUrl: (size?: 32 | 64 | 128 | 256 | 512) => string };
  const tabs: { id: Tab; corp: Corp; count: number }[] = [
    { id: "tabou", corp: CORPORATIONS.tabou,     count: tabouMembers.length },
    { id: "uz",    corp: CORPORATIONS.urbanZone, count: uzMembers.length },
  ];

  return (
    <div className="relative">
      {/* ── Tabs ── */}
      <div className="flex items-end gap-0 border-b border-border-subtle mb-8">
        {tabs.map(({ id, corp, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "relative flex items-center gap-2.5 px-5 py-3 text-sm font-semibold transition-colors duration-150",
              activeTab === id
                ? "text-gold"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <Image
              src={corp.logoUrl(32)}
              alt={corp.name}
              width={20}
              height={20}
              className={cn(
                "rounded-sm transition-opacity",
                activeTab === id ? "opacity-100" : "opacity-40"
              )}
              unoptimized
            />
            <span className="font-display tracking-wide">{corp.name}</span>
            <span className={cn(
              "text-xs font-normal tabular-nums",
              activeTab === id ? "text-gold/60" : "text-border"
            )}>
              {count}
            </span>

            {/* Underline active */}
            {activeTab === id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Grille ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {displayed.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-sm">
              Aucun pilote dans cette corporation pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {displayed.map((pilot, i) => (
                <PilotCard
                  key={pilot.id}
                  pilot={pilot}
                  index={i}
                  {...(interactive ? { onClick: () => openPilot(pilot) } : {})}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modale pilote (uniquement en mode interactif) */}
      {interactive && <PilotModal pilot={selectedPilot} onClose={closePilot} />}
    </div>
  );
}
