import type { ContentVisibility } from "./roles";

/**
 * Entrée de navigation.
 * Supporte la visibilité conditionnelle par rôle dès V0.
 */
export interface NavItem {
  label: string;
  /** Optionnel pour un groupe pur (dropdown sans page propre). */
  href?: string;
  /** Si vrai, le lien est actif uniquement en correspondance exacte */
  exact?: boolean;
  /** Visibilité minimale requise. Défaut: "public" */
  visibility?: ContentVisibility;
  /** Sous-items pour dropdown */
  children?: NavItem[];
  /** Badge contextuel (ex: "Nouveau", "Beta") */
  badge?: string;
  /** Lien externe (ouvre dans un nouvel onglet) */
  external?: boolean;
  /** Description courte affichée dans le dropdown mega-menu */
  description?: string;
  /** Item mis en avant dans le dropdown (traitement visuel spécial) */
  featured?: boolean;
}

/**
 * Groupe de navigation par zone (public, member, staff).
 */
export interface NavGroup {
  id: string;
  label?: string;
  items: NavItem[];
}

/**
 * Configuration complète de la navigation.
 * La navigation active est sélectionnée en fonction du rôle.
 */
export interface NavigationConfig {
  main: NavItem[];
  /** Liens utilitaires (discord, etc.) */
  utility: NavItem[];
  /** Navigation pied de page */
  footer: NavGroup[];
}
