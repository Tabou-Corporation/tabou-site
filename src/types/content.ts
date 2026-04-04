import type { ContentVisibility } from "./roles";

/**
 * Métadonnées SEO communes à toutes les pages.
 */
export interface PageMeta {
  title: string;
  description: string;
  /** Chemin relatif de l'image OG (dans /public) – optionnel */
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * Un bloc de contenu générique avec visibilité conditionnelle.
 * Permet de préparer le rendu conditionnel par rôle.
 */
export interface ContentBlock {
  id: string;
  visibility?: ContentVisibility;
}

/**
 * Activité de la corporation.
 */
export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;
  /** Icône lucide-react */
  icon: string;
  tags?: string[] | undefined;
}

export type ActivityCategory =
  | "pvp"
  | "pve"
  | "exploration"
  | "industry"
  | "collective";

/**
 * Étape du pipeline de recrutement.
 */
export interface RecruitmentStep {
  number: number;
  title: string;
  description: string;
  duration?: string | undefined;
}

/**
 * Question/réponse FAQ.
 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * Statistique affichée sur la homepage ou la page corporation.
 */
export interface StatItem {
  label: string;
  value: string;
  unit?: string;
}

/**
 * Profil de pilote (recrutement).
 */
export interface PilotProfile {
  title: string;
  description: string;
  traits: string[];
  type: "wanted" | "not-adapted";
}

/**
 * Entrée de type CTA.
 */
export interface CTAConfig {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
}
