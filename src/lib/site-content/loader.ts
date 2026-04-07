// ─── CMS Site Content — Loader ──────────────────────────────────────────────
// Lit la table site_content depuis Neon/Postgres.
// Si la ligne n'existe pas, retourne les defaults statiques.
//
// Stratégie de cache :
//   - cache() de React : déduplication intra-request
//   - revalidatePath() après save : ISR via Next.js
//   Les pages publiques deviennent dynamiques (acceptable pour un site corp).

import { cache } from "react";
import { prisma } from "@/lib/db";
import { DEFAULTS } from "./defaults";
import type { ContentByPage, PageKey } from "./types";

/** Tag commun pour les revalidations (utilisé dans l'action save) */
export const SITE_CONTENT_TAG = "site-content";

/** Deep merge : les tableaux sont remplacés, les objets sont mergés en profondeur */
function deepMerge<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : base) as T;
  }
  if (typeof base === "object" && typeof override === "object") {
    const result = { ...base } as Record<string, unknown>;
    for (const key of Object.keys(override as object)) {
      result[key] = deepMerge(
        (base as Record<string, unknown>)[key],
        (override as Record<string, unknown>)[key]
      );
    }
    return result as T;
  }
  return (override ?? base) as T;
}

/** Lecture brute (sans cache React) — pour la page admin */
export async function getRawPageContent<K extends PageKey>(
  page: K
): Promise<ContentByPage[K]> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { page } });
    if (!row) return DEFAULTS[page];
    const parsed = JSON.parse(row.content) as Partial<ContentByPage[K]>;
    return deepMerge(DEFAULTS[page], parsed);
  } catch (e) {
    console.error(`[site-content] Erreur lors du chargement de la page "${page}" :`, e);
    return DEFAULTS[page];
  }
}

/** Lecture avec déduplication intra-request (cache React) */
const fetchContent = cache(getRawPageContent);

export const getHomeContent        = () => fetchContent("home");
export const getCorporationContent = () => fetchContent("corporation");
export const getRecruitmentContent = () => fetchContent("recruitment");
export const getFaqContent         = () => fetchContent("faq");
export const getActivitiesContent  = () => fetchContent("activities");
export const getContactContent     = () => fetchContent("contact");
export const getDiscordConfig      = () => fetchContent("discord");
export const getSettingsContent    = () => fetchContent("settings");
