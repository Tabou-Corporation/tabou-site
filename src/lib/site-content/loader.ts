// ─── CMS Site Content — Loader ──────────────────────────────────────────────
// Lit la table site_content depuis Neon/Postgres.
// Si la ligne n'existe pas, retourne les defaults statiques.
// Utilise unstable_cache pour la mise en cache ISR avec revalidation par tag.

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { DEFAULTS } from "./defaults";
import type { ContentByPage, PageKey } from "./types";

/** Tag commun pour tout le contenu éditorial */
export const SITE_CONTENT_TAG = "site-content";

/** Deep merge simple : override écrase les feuilles, les tableaux sont remplacés */
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

async function fetchPageContent<K extends PageKey>(page: K): Promise<ContentByPage[K]> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { page } });
    if (!row) return DEFAULTS[page];
    const parsed = JSON.parse(row.content) as Partial<ContentByPage[K]>;
    return deepMerge(DEFAULTS[page], parsed);
  } catch {
    return DEFAULTS[page];
  }
}

// Wrappers mis en cache par page avec tag pour invalidation fine
export const getHomeContent = unstable_cache(
  () => fetchPageContent("home"),
  ["site-content-home"],
  { tags: [SITE_CONTENT_TAG, "site-content-home"] }
);

export const getCorporationContent = unstable_cache(
  () => fetchPageContent("corporation"),
  ["site-content-corporation"],
  { tags: [SITE_CONTENT_TAG, "site-content-corporation"] }
);

export const getRecruitmentContent = unstable_cache(
  () => fetchPageContent("recruitment"),
  ["site-content-recruitment"],
  { tags: [SITE_CONTENT_TAG, "site-content-recruitment"] }
);

export const getFaqContent = unstable_cache(
  () => fetchPageContent("faq"),
  ["site-content-faq"],
  { tags: [SITE_CONTENT_TAG, "site-content-faq"] }
);

export const getActivitiesContent = unstable_cache(
  () => fetchPageContent("activities"),
  ["site-content-activities"],
  { tags: [SITE_CONTENT_TAG, "site-content-activities"] }
);

export const getContactContent = unstable_cache(
  () => fetchPageContent("contact"),
  ["site-content-contact"],
  { tags: [SITE_CONTENT_TAG, "site-content-contact"] }
);

/** Pour la page admin : lecture directe sans cache */
export async function getRawPageContent<K extends PageKey>(
  page: K
): Promise<ContentByPage[K]> {
  return fetchPageContent(page);
}
