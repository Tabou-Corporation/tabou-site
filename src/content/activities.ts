/**
 * Activités de la corporation.
 *
 * Source de données : src/content/data/activities.json
 * Éditable sans connaissance TypeScript.
 * Validation automatique via Zod au build (src/modules/content/loader.ts).
 */

import { loadActivities } from "@/modules/content/loader";
import type { Activity, ActivityCategory, CTAConfig } from "@/types/content";

export const ACTIVITIES_META = {
  title: "Activités — Tabou",
  description:
    "PvP nul-sec, opérations PvE, exploration, industrie stratégique — découvrez l'éventail des activités proposées par la corporation Tabou.",
};

export const ACTIVITIES_INTRO = {
  eyebrow: "Activités",
  headline: "Un spectre large.\nUn engagement réel.",
  body: "Tabou n'est pas une corporation mono-activité. Nous couvrons l'essentiel du contenu de fin de jeu, avec une dominante PvP et une base logistique solide.",
} as const;

/** Données chargées et validées depuis activities.json */
export const ACTIVITIES: Activity[] = loadActivities();

export const ACTIVITIES_BY_CATEGORY: Record<ActivityCategory, Activity[]> = {
  pvp: ACTIVITIES.filter((a) => a.category === "pvp"),
  pve: ACTIVITIES.filter((a) => a.category === "pve"),
  exploration: ACTIVITIES.filter((a) => a.category === "exploration"),
  industry: ACTIVITIES.filter((a) => a.category === "industry"),
  collective: ACTIVITIES.filter((a) => a.category === "collective"),
};

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  pvp: "PvP",
  pve: "PvE",
  exploration: "Exploration",
  industry: "Industrie & Économie",
  collective: "Collectif",
};

export const ACTIVITIES_CTA: CTAConfig = {
  label: "Rejoindre Tabou",
  href: "/recrutement",
  variant: "primary",
};
