/**
 * Chargeur de contenu avec validation Zod.
 *
 * Lit les fichiers JSON depuis src/content/data/ et valide leur structure.
 * Si un fichier est invalide, une erreur claire est lancée au build.
 *
 * Ajouter un nouveau type de contenu :
 *   1. Définir le schéma dans schemas.ts
 *   2. Créer le fichier JSON dans src/content/data/
 *   3. Exporter une fonction loadXxx() ici
 *   4. Importer et réexporter depuis le fichier .ts correspondant dans src/content/
 */

import type { ActivityData, FAQItemData, RecruitmentStepData } from "./schemas";
import {
  ActivitiesCollectionSchema,
  FAQCollectionSchema,
  RecruitmentStepsCollectionSchema,
} from "./schemas";

import rawActivities from "@/content/data/activities.json";
import rawFAQ from "@/content/data/faq.json";
import rawRecruitmentSteps from "@/content/data/recruitment-steps.json";

export function loadActivities(): ActivityData[] {
  const result = ActivitiesCollectionSchema.safeParse(rawActivities);
  if (!result.success) {
    throw new Error(
      `[content] Fichier invalide : activities.json\n${JSON.stringify(result.error.format(), null, 2)}`
    );
  }
  return result.data;
}

export function loadFAQ(): FAQItemData[] {
  const result = FAQCollectionSchema.safeParse(rawFAQ);
  if (!result.success) {
    throw new Error(
      `[content] Fichier invalide : faq.json\n${JSON.stringify(result.error.format(), null, 2)}`
    );
  }
  return result.data;
}

export function loadRecruitmentSteps(): RecruitmentStepData[] {
  const result = RecruitmentStepsCollectionSchema.safeParse(rawRecruitmentSteps);
  if (!result.success) {
    throw new Error(
      `[content] Fichier invalide : recruitment-steps.json\n${JSON.stringify(result.error.format(), null, 2)}`
    );
  }
  return result.data;
}
