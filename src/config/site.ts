/**
 * Configuration centrale du site Tabou.
 * Source de vérité unique pour les métadonnées, liens et identité.
 */
export const SITE_CONFIG = {
  name: "Tabou",
  fullName: "Corporation Tabou",
  tagline: "Compétence, discrétion, efficacité.",
  description:
    "Corporation francophone EVE Online en null-sec, Tabou propose un cadre de jeu collectif, actif et accessible.",
  url: "https://tabou-corp.fr", // à actualiser en production

  /** Liens externes officiels */
  links: {
    discord: "https://discord.gg/tabou", // à remplacer par le vrai lien
    recruitment: "/recrutement",
    zkillboard: "", // V6
    dotlan: "",     // V6
    evewho: "",     // V6
  },

  /** Identité visuelle */
  branding: {
    primaryColor: "#F0B030",
    ticker: "TABOU",
    alliance: null, // à renseigner si applicable
  },

  /** Contact */
  contact: {
    inGame: "Canaux public EVE ou messages privés aux officiers",
    discord: "Le serveur Discord est la voie principale.",
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;
