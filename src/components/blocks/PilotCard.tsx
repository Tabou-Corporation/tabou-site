"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { CORPORATIONS } from "@/lib/constants/corporations";

const ROLE_LABELS: Record<string, string> = {
  candidate:  "Candidat",
  member_uz:  "Urban Zone",
  member:     "Membre",
  officer:    "Officier",
  director:   "Directeur",
  ceo:        "CEO",
  admin:      "Administrateur",
};

const SPECIALTY_LABELS: Record<string, string> = {
  pvp:           "PvP",
  pve:           "PvE",
  industry:      "Industrie",
  exploration:   "Exploration",
  communication: "Communication",
  recruitment:   "Recrutement",
};

export interface PilotData {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  specialty: string | null;
  bio: string | null;
  corporationId: number | null;
  createdAt: Date;
}

const isHighRank = (role: string) =>
  ["officer", "director", "ceo", "admin"].includes(role);

export function PilotCard({ pilot, index }: { pilot: PilotData; index: number }) {
  const corp = pilot.corporationId === CORPORATIONS.urbanZone.id
    ? CORPORATIONS.urbanZone
    : CORPORATIONS.tabou;
  const highRank = isHighRank(pilot.role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.055,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative flex flex-col overflow-hidden",
        "bg-bg-deep border border-border-subtle",
        "border-l-2 transition-colors duration-200",
        highRank
          ? "border-l-gold hover:border-l-gold hover:border-border"
          : "border-l-border-subtle hover:border-l-gold/50 hover:border-border"
      )}
    >
      {/* Scan-line effect au hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(240,176,48,0.015) 2px, rgba(240,176,48,0.015) 4px)",
          }}
        />
      </motion.div>

      {/* Portrait — carré, pleine largeur */}
      <div className="relative w-full aspect-square bg-bg-elevated overflow-hidden">
        {pilot.image ? (
          <Image
            src={pilot.image}
            alt={pilot.name ?? "Pilote"}
            fill
            className="object-cover object-top grayscale-[15%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-text-muted text-4xl font-display font-bold">
              {(pilot.name ?? "?")[0]}
            </span>
          </div>
        )}

        {/* Badge haut-rang */}
        {highRank && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-bg-deep/80 backdrop-blur-sm border border-gold/40 text-gold text-[10px] font-bold px-1.5 py-0.5 tracking-wider uppercase">
              {ROLE_LABELS[pilot.role]}
            </span>
          </div>
        )}

        {/* Gradient bas du portrait → info card */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg-deep to-transparent" />
      </div>

      {/* Infos */}
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1.5">
        {/* Nom */}
        <p className="font-display font-bold text-sm text-text-primary leading-tight truncate group-hover:text-gold transition-colors duration-200">
          {pilot.name ?? "Pilote inconnu"}
        </p>

        {/* Rôle + corp logo */}
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            "text-2xs font-semibold tracking-widest uppercase",
            highRank ? "text-gold/80" : "text-text-muted"
          )}>
            {pilot.specialty
              ? SPECIALTY_LABELS[pilot.specialty] ?? pilot.specialty
              : ROLE_LABELS[pilot.role] ?? pilot.role}
          </span>
          <Image
            src={corp.logoUrl(32)}
            alt={corp.name}
            width={16}
            height={16}
            className="rounded-sm opacity-50 group-hover:opacity-80 transition-opacity"
            unoptimized
          />
        </div>

        {/* Séparateur tactique */}
        <div className="w-full h-px bg-border-subtle group-hover:bg-gold/20 transition-colors duration-300" />

        {/* Bio */}
        <p className={cn(
          "text-2xs leading-relaxed flex-1",
          pilot.bio ? "text-text-muted italic" : "text-border italic"
        )}>
          {pilot.bio ?? "Aucune présentation."}
        </p>
      </div>
    </motion.div>
  );
}
