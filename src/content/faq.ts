/**
 * FAQ de la corporation.
 *
 * Source de données : src/content/data/faq.json
 * Éditable sans connaissance TypeScript.
 * Validation automatique via Zod au build (src/modules/content/loader.ts).
 */

import { loadFAQ } from "@/modules/content/loader";
import type { FAQItem } from "@/types/content";

export const FAQ_META = {
  title: "FAQ — Tabou",
  description:
    "Réponses aux questions fréquentes sur la corporation Tabou, le recrutement, la vie en nul-sec et les exigences de jeu.",
};

/** Données chargées et validées depuis faq.json */
export const FAQ_ITEMS: FAQItem[] = loadFAQ();

export const FAQ_CATEGORIES: string[] = [
  ...new Set(FAQ_ITEMS.map((item) => item.category)),
];
