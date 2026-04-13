"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { CORPORATIONS } from "@/lib/constants/corporations";
import { PilotCard } from "./PilotCard";
import { PilotModal } from "./PilotModal";
import { cn } from "@/lib/utils/cn";
import type { PilotData } from "./PilotCard";

import { Pause } from "lucide-react";

const ROLE_ORDER: Record<string, number> = {
  ceo: 0, director: 1, officer: 2, admin: 3, member: 4, member_uz: 5, candidate: 6,
};

function isMemberAbsent(m: PilotData): boolean {
  if (!m.absenceStart || !m.absenceEnd) return false;
  const now = Date.now();
  return new Date(m.absenceStart).getTime() <= now && now <= new Date(m.absenceEnd).getTime();
}

interface PilotGridProps {
  members: PilotData[];
  /** Si false, les cartes ne sont pas cliquables et la modale est désactivée */
  interactive?: boolean;
}

type Tab = "tabou" | "uz" | "pause";

export function PilotGrid({ members, interactive = true }: PilotGridProps) {
  const [activeTab,    setActiveTab]    = useState<Tab>("tabou");
  const [selectedPilot, setSelectedPilot] = useState<PilotData | null>(null);
  const openPilot  = useCallback((p: PilotData) => setSelectedPilot(p), []);
  const closePilot = useCallback(() => setSelectedPilot(null), []);

  // Membres en pause (absents maintenant)
  const pauseMembers = useMemo(
    () => members.filter(isMemberAbsent).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    [members],
  );
  const pauseIds = useMemo(() => new Set(pauseMembers.map((m) => m.id)), [pauseMembers]);

  // Membres actifs (non absents)
  const activeMembers = useMemo(() => members.filter((m) => !pauseIds.has(m.id)), [members, pauseIds]);

  // UZ = corporationId UZ OU rôle member_uz (couvre rôle forcé manuellement)
  const uzMembers = useMemo(
    () =>
      activeMembers
        .filter((m) =>
          m.corporationId === CORPORATIONS.urbanZone.id ||
          m.role === "member_uz"
        )
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || (a.name ?? "").localeCompare(b.name ?? "")),
    [activeMembers]
  );

  // Tabou = tout le monde actif SAUF ceux déjà dans l'onglet UZ
  const uzIds = useMemo(() => new Set(uzMembers.map((m) => m.id)), [uzMembers]);
  const tabouMembers = useMemo(
    () =>
      activeMembers
        .filter((m) => !uzIds.has(m.id))
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)),
    [activeMembers, uzIds]
  );

  const displayed = activeTab === "tabou" ? tabouMembers : activeTab === "uz" ? uzMembers : pauseMembers;

  type Corp = { name: string; logoUrl: (size?: 32 | 64 | 128 | 256 | 512) => string };
  const tabs: { id: Tab; corp?: Corp; count: number; label?: string }[] = [
    { id: "tabou", corp: CORPORATIONS.tabou,     count: tabouMembers.length },
    { id: "uz",    corp: CORPORATIONS.urbanZone, count: uzMembers.length },
    ...(pauseMembers.length > 0 ? [{ id: "pause" as Tab, label: "En pause", count: pauseMembers.length }] : []),
  ];

  return (
    <div className="relative">
      {/* ── Tabs ── */}
      <div className="flex items-end gap-0 border-b border-border-subtle mb-8">
        {tabs.map(({ id, corp, count, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "relative flex items-center gap-2.5 px-5 py-3 text-sm font-semibold transition-colors duration-150",
              activeTab === id
                ? id === "pause" ? "text-amber-400" : "text-gold"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {corp ? (
              <Image
                src={corp.logoUrl(32)}
                alt={corp.name}
                width={20}
                height={20}
                className={cn(
                  "rounded-sm transition-opacity",
                  activeTab === id ? "opacity-100" : "opacity-40"
                )}
              />
            ) : (
              <Pause size={16} className={cn(
                "transition-opacity",
                activeTab === id ? "opacity-100" : "opacity-40"
              )} />
            )}
            <span className="font-display tracking-wide">{label ?? corp?.name}</span>
            <span className={cn(
              "text-xs font-normal tabular-nums",
              activeTab === id ? (id === "pause" ? "text-amber-400/60" : "text-gold/60") : "text-border"
            )}>
              {count}
            </span>

            {/* Underline active */}
            {activeTab === id && (
              <motion.div
                layoutId="tab-underline"
                className={cn("absolute bottom-0 left-0 right-0 h-0.5", id === "pause" ? "bg-amber-400" : "bg-gold")}
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
              {activeTab === "pause"
                ? "Aucun pilote en pause pour le moment."
                : "Aucun pilote dans cette corporation pour le moment."}
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
