"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Gamepad2, Languages } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CORPORATIONS } from "@/lib/constants/corporations";
import { ROLE_LABELS, DOMAIN_LABELS } from "@/lib/constants/labels";
import { parseSpecialties } from "@/types/roles";
import { SecurityStatusBadge } from "@/components/ui/SecurityStatusBadge";
import { parseProfileExtra, ACTIVITY_LABEL, LANGUAGE_LABEL } from "@/lib/profile-extra";
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

  // Bloquer le scroll body quand la modale est ouverte
  useEffect(() => {
    if (pilot) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [pilot]);

  const extra = parseProfileExtra(pilot?.profileExtra);
  const corp = pilot?.corporationId === CORPORATIONS.urbanZone.id
    ? CORPORATIONS.urbanZone
    : CORPORATIONS.tabou;
  const highRank = pilot ? ["officer", "director", "ceo", "admin"].includes(pilot.role) : false;

  return (
    <AnimatePresence>
      {pilot && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-sm",
              "bg-bg-deep border border-border-subtle overflow-hidden",
              "border-l-2",
              highRank ? "border-l-gold" : "border-l-border-subtle"
            )}
            role="dialog"
            aria-modal
            aria-label={pilot.name ?? "Fiche pilote"}
          >
            {/* Bouton fermer */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 text-text-muted hover:text-text-primary transition-colors p-1"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            {/* Portrait + gradient */}
            <div className="relative w-full aspect-[3/2] bg-bg-elevated overflow-hidden">
              {pilot.image ? (
                <Image
                  src={pilot.image}
                  alt={pilot.name ?? "Portrait"}
                  fill
                  className="object-cover object-top"
                  unoptimized
                  sizes="384px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-text-muted text-5xl font-display font-bold">
                    {(pilot.name ?? "?")[0]}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/30 to-transparent" />

              {/* Corp logo */}
              <div className="absolute bottom-3 right-3">
                <Image
                  src={corp.logoUrl(64)}
                  alt={corp.name}
                  width={28}
                  height={28}
                  className="rounded-sm opacity-70"
                  unoptimized
                />
              </div>

              {/* Nom + rôle */}
              <div className="absolute bottom-3 left-4">
                <p className="font-display font-bold text-lg text-text-primary leading-tight">
                  {pilot.name ?? "Pilote inconnu"}
                </p>
                <p className={cn(
                  "text-xs font-semibold tracking-widest uppercase mt-0.5",
                  highRank ? "text-gold" : "text-text-muted"
                )}>
                  {(() => {
                    const domains = parseSpecialties(pilot.specialties);
                    return domains.length > 0
                      ? domains.map((d) => DOMAIN_LABELS[d] ?? d).join(" / ")
                      : ROLE_LABELS[pilot.role] ?? pilot.role;
                  })()}
                </p>
              </div>
            </div>

            {/* Corps de la modale */}
            <div className="px-4 py-4 space-y-4">
              {/* Security status */}
              {pilot.securityStatus !== null && pilot.securityStatus !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-xs">Statut de sécu.</span>
                  <SecurityStatusBadge value={pilot.securityStatus} />
                </div>
              )}

              {/* Bio */}
              {pilot.bio && (
                <p className="text-text-muted text-xs leading-relaxed italic border-l-2 border-gold/20 pl-3">
                  {pilot.bio}
                </p>
              )}

              {/* Infos profil étendu */}
              {(extra.timezone || extra.mainActivity || extra.secondaryActivity || (extra.languages?.length ?? 0) > 0) && (
                <div className="space-y-2.5 pt-1 border-t border-border-subtle">
                  {extra.timezone && (
                    <div className="flex items-center gap-2.5">
                      <Clock size={13} className="text-gold/60 flex-shrink-0" />
                      <span className="text-text-secondary text-xs">{extra.timezone}</span>
                    </div>
                  )}

                  {(extra.mainActivity || extra.secondaryActivity) && (
                    <div className="flex items-start gap-2.5">
                      <Gamepad2 size={13} className="text-gold/60 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        {extra.mainActivity && (
                          <p className="text-text-secondary text-xs">
                            {ACTIVITY_LABEL[extra.mainActivity] ?? extra.mainActivity}
                          </p>
                        )}
                        {extra.secondaryActivity && (
                          <p className="text-text-muted text-xs">
                            {ACTIVITY_LABEL[extra.secondaryActivity] ?? extra.secondaryActivity}
                            <span className="text-[10px] opacity-60 ml-1">sec.</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {(extra.languages?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-2.5">
                      <Languages size={13} className="text-gold/60 flex-shrink-0" />
                      <div className="flex gap-1.5">
                        {extra.languages!.map((l) => (
                          <span
                            key={l}
                            className="px-1.5 py-0.5 rounded bg-gold/5 border border-gold/15 text-text-secondary text-[11px] font-semibold uppercase"
                          >
                            {LANGUAGE_LABEL[l as Language] ?? l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Membre depuis */}
              <p className="text-text-muted text-[11px] border-t border-border-subtle pt-3">
                Membre depuis le {new Date(pilot.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
