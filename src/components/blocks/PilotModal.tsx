"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Gamepad2, Languages, ExternalLink, Swords, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CORPORATIONS } from "@/lib/constants/corporations";
import { ROLE_LABELS, DOMAIN_LABELS } from "@/lib/constants/labels";
import { parseSpecialties } from "@/types/roles";
import { SecurityStatusBadge } from "@/components/ui/SecurityStatusBadge";
import { parseProfileExtra, getActivities, ACTIVITY_LABEL, LANGUAGE_LABEL } from "@/lib/profile-extra";
import type { PilotData } from "./PilotCard";
import type { Language } from "@/lib/profile-extra";

interface Props {
  pilot: PilotData | null;
  onClose: () => void;
}

export function PilotModal({ pilot, onClose }: Props) {
  // Fermer avec Escape
  useEffect(() => {
    if (!pilot) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pilot, onClose]);

  // Bloquer le scroll body
  useEffect(() => {
    if (pilot) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [pilot]);

  const extra = parseProfileExtra(pilot?.profileExtra);
  const isUZ = pilot?.corporationId === CORPORATIONS.urbanZone.id
    || (!pilot?.corporationId && pilot?.role === "member_uz");
  const corp = isUZ ? CORPORATIONS.urbanZone : CORPORATIONS.tabou;
  const highRank = pilot ? ["officer", "director", "ceo", "admin"].includes(pilot.role) : false;
  const activities = pilot ? getActivities(extra) : [];
  const zkillUrl = pilot?.eveCharacterId
    ? `https://zkillboard.com/character/${pilot.eveCharacterId}/`
    : null;

  return (
    <AnimatePresence mode="wait">
        {pilot && (
          <>
            {/* ── Backdrop ── */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
              onClick={onClose}
              aria-hidden
            />

            {/* ── Panel holographique ── */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md",
                "bg-bg-deep/95 border border-gold/10 overflow-hidden",
                "shadow-[0_0_40px_rgba(240,176,48,0.06),0_0_80px_rgba(0,0,0,0.5)]",
                "border-l-2",
                highRank ? "border-l-gold" : "border-l-gold/30"
              )}
              role="dialog"
              aria-modal
              aria-label={pilot.name ?? "Fiche pilote"}
            >
              {/* Scanline overlay */}
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                <motion.div
                  className="w-full h-[1px]"
                  style={{ background: "linear-gradient(to right, transparent, rgba(240,176,48,0.12), transparent)" }}
                  initial={{ y: "-100%" }}
                  animate={{ y: "calc(100vh + 100%)" }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Bouton fermer */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-30 text-text-muted hover:text-gold transition-colors p-1.5 bg-bg-deep/60 backdrop-blur-sm border border-border-subtle hover:border-gold/30"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>

              {/* ═══ EN-TÊTE : Portrait + Identité ═══ */}
              <div className="flex items-start gap-4 p-4 pb-3">
                {/* Portrait avec glow */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="relative flex-shrink-0"
                >
                  <div className={cn(
                    "w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] overflow-hidden bg-bg-elevated",
                    "ring-2 ring-gold/25",
                    "shadow-[0_0_24px_rgba(240,176,48,0.1)]",
                    // Coin coupé sci-fi
                    "[clip-path:polygon(0_0,100%_0,100%_85%,85%_100%,0_100%)]"
                  )}>
                    {pilot.image ? (
                      <Image
                        src={pilot.image}
                        alt={pilot.name ?? "Portrait"}
                        fill
                        className="object-cover object-top"
                        sizes="120px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-text-muted text-4xl font-display font-bold">
                          {(pilot.name ?? "?")[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Corp logo badge */}
                  <div className="absolute -bottom-1 -right-1 bg-bg-deep border border-gold/20 p-0.5">
                    <Image
                      src={corp.logoUrl(32)}
                      alt={corp.name}
                      width={20}
                      height={20}
                      className="rounded-sm"
                      unoptimized
                    />
                  </div>
                </motion.div>

                {/* Identité */}
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12, duration: 0.3 }}
                  className="flex-1 min-w-0 pt-1"
                >
                  <h2 className="font-display font-bold text-xl text-text-primary leading-tight truncate">
                    {pilot.name ?? "Pilote inconnu"}
                  </h2>

                  {/* Rôle / Spécialités */}
                  <p className={cn(
                    "text-xs font-semibold tracking-widest uppercase mt-1",
                    highRank ? "text-gold" : "text-text-muted"
                  )}>
                    {(() => {
                      const domains = parseSpecialties(pilot.specialties);
                      return domains.length > 0
                        ? domains.map((d) => DOMAIN_LABELS[d] ?? d).join(" · ")
                        : ROLE_LABELS[pilot.role] ?? pilot.role;
                    })()}
                  </p>

                  {/* Corporation */}
                  <p className="text-text-muted text-[11px] mt-1.5 tracking-wide">
                    {corp.name} <span className="text-gold/40">[{corp.ticker}]</span>
                  </p>

                  {/* Security Status */}
                  {pilot.securityStatus !== null && pilot.securityStatus !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 rounded-full bg-bg-elevated overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pilot.securityStatus >= 0 ? "bg-[#7dd3fc]" :
                            pilot.securityStatus >= -2 ? "bg-amber-400" :
                            pilot.securityStatus >= -5 ? "bg-orange-500" : "bg-red-500"
                          )}
                          style={{ width: `${Math.max(5, ((pilot.securityStatus + 10) / 15) * 100)}%` }}
                        />
                      </div>
                      <SecurityStatusBadge value={pilot.securityStatus} />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* ═══ SÉPARATEUR HOLO ═══ */}
              <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

              {/* ═══ MINI-CARTES STATS ═══ */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.3 }}
                className="grid grid-cols-3 gap-2 px-4 py-3"
              >
                {/* Activité principale */}
                <div className="bg-bg-elevated/40 border border-gold/8 px-3 py-2.5 text-center hover:border-gold/20 transition-colors">
                  <Gamepad2 size={14} className="text-gold/50 mx-auto mb-1" />
                  <p className="text-text-primary text-xs font-semibold truncate">
                    {activities[0] ? (ACTIVITY_LABEL[activities[0]] ?? activities[0]) : "—"}
                  </p>
                  <p className="text-text-muted text-[9px] uppercase tracking-wider mt-0.5">Activité</p>
                </div>

                {/* Timezone */}
                <div className="bg-bg-elevated/40 border border-gold/8 px-3 py-2.5 text-center hover:border-gold/20 transition-colors">
                  <Clock size={14} className="text-gold/50 mx-auto mb-1" />
                  <p className="text-text-primary text-xs font-semibold truncate">
                    {extra.timezone ? extra.timezone.replace(/\s*\(.*\)/, "") : "—"}
                  </p>
                  <p className="text-text-muted text-[9px] uppercase tracking-wider mt-0.5">Timezone</p>
                </div>

                {/* Langues */}
                <div className="bg-bg-elevated/40 border border-gold/8 px-3 py-2.5 text-center hover:border-gold/20 transition-colors">
                  <Languages size={14} className="text-gold/50 mx-auto mb-1" />
                  <p className="text-text-primary text-xs font-semibold truncate">
                    {(extra.languages?.length ?? 0) > 0
                      ? extra.languages!.map((l) => (LANGUAGE_LABEL[l as Language] ?? l)).join(" · ")
                      : "—"}
                  </p>
                  <p className="text-text-muted text-[9px] uppercase tracking-wider mt-0.5">Langues</p>
                </div>
              </motion.div>

              {/* ═══ SÉPARATEUR ═══ */}
              <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />

              {/* ═══ CORPS : Bio + Infos ═══ */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22, duration: 0.3 }}
                className="px-4 py-3 space-y-3"
              >
                {/* Bio */}
                {pilot.bio ? (
                  <div className="border-l-2 border-gold/25 pl-3">
                    <p className="text-text-muted text-xs leading-relaxed italic">
                      {pilot.bio}
                    </p>
                  </div>
                ) : (
                  <p className="text-border text-xs italic">Aucune présentation.</p>
                )}

                {/* Activités secondaires */}
                {activities.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Swords size={12} className="text-gold/40 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                      {activities.slice(1).map((a) => (
                        <span
                          key={a}
                          className="px-1.5 py-0.5 bg-gold/5 border border-gold/10 text-text-secondary text-[10px] font-medium"
                        >
                          {ACTIVITY_LABEL[a] ?? a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Membre depuis */}
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-gold/40 flex-shrink-0" />
                  <span className="text-text-muted text-[11px]">
                    Membre depuis le {new Date(pilot.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                </div>
              </motion.div>

              {/* ═══ FOOTER ═══ */}
              {zkillUrl && (
                <>
                  <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
                  <div className="px-4 py-3">
                    <a
                      href={zkillUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5",
                        "border border-gold/20 hover:border-gold/40",
                        "text-gold/70 hover:text-gold text-xs font-medium",
                        "transition-all duration-200 hover:bg-gold/5"
                      )}
                    >
                      <ExternalLink size={12} />
                      Voir sur zKillboard
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
  );
}
