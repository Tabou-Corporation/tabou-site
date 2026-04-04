/**
 * Recrutement — profils, étapes, prérequis.
 *
 * Étapes de recrutement : src/content/data/recruitment-steps.json
 * Éditable sans connaissance TypeScript.
 *
 * Profils et prérequis : définis ici en TypeScript (contenu plus structuré,
 * moins susceptible d'être modifié fréquemment).
 */

import { loadRecruitmentSteps } from "@/modules/content/loader";
import type { RecruitmentStep, PilotProfile, CTAConfig } from "@/types/content";

export const RECRUITMENT_META = {
  title: "Recrutement — Tabou",
  description:
    "Profils recherchés, prérequis, étapes du recrutement — tout ce que vous devez savoir avant de postuler à la corporation Tabou.",
};

export const RECRUITMENT_INTRO = {
  eyebrow: "Recrutement",
  headline: "On ne recrute pas\npour remplir des rangs.",
  body: "Tabou est une corporation à effectifs maîtrisés. Chaque recrutement est une décision réfléchie. Si vous lisez ceci, c'est que vous avez déjà compris que nous ne sommes pas n'importe quelle corp.",
} as const;

export const WANTED_PROFILES: PilotProfile[] = [
  {
    type: "wanted",
    title: "Le pilote autonome",
    description:
      "Vous savez générer vos propres revenus, vous équiper selon la doctrine, et voler sans avoir besoin d'être guidé à chaque décision.",
    traits: [
      "≥ 30M SP (ou compétences ciblées pertinentes)",
      "Expérience nul-sec ou WH sérieuse",
      "Capacité à voler les ships de doctrine",
      "SRP respecté automatiquement",
    ],
  },
  {
    type: "wanted",
    title: "Le joueur régulier",
    description:
      "Vous jouez plusieurs fois par semaine, vous êtes sur Discord, vous lisez les mails corp. Pas de quota — mais une présence réelle.",
    traits: [
      "Disponibilité régulière (soirs EU TZ de préférence)",
      "Présence Discord active",
      "Participation aux fleets planifiées",
      "Communication proactive si absent",
    ],
  },
  {
    type: "wanted",
    title: "L'apporteur de valeur",
    description:
      "Fabricant, logisticien, scanner, intel — si vous avez une compétence spécialisée qui renforce le groupe, vous avez de la valeur ici.",
    traits: [
      "Compétence industrielle ou logistique avancée",
      "Connaissance des chaînes WH",
      "Expérience intel/scanning",
      "Compréhension de l'économie nul-sec",
    ],
  },
];

export const NOT_ADAPTED_PROFILES: PilotProfile[] = [
  {
    type: "not-adapted",
    title: "Le touriste",
    description:
      "Vous cherchez une corp pour voir, sans vous engager. Tabou n'est pas un point de passage.",
    traits: [
      "Absence prolongée sans communication",
      "Jamais en fleet",
      "Pas de présence Discord",
    ],
  },
  {
    type: "not-adapted",
    title: "Le drama-maker",
    description:
      "Conflits de personnalité, ego fragile, besoin de validation constant. Ce n'est pas notre culture.",
    traits: [
      "Historique de drama dans d'autres corps",
      "Mauvaise gestion des critiques directes",
      "Incapacité à accepter les décisions collectives",
    ],
  },
  {
    type: "not-adapted",
    title: "Le grand débutant",
    description:
      "Nous respectons les nouveaux joueurs, mais nous n'avons pas les ressources pour un encadrement intensif. SP minimale requise.",
    traits: [
      "< 15M SP sans spécialisation claire",
      "Aucune expérience nul-sec",
      "Pas de connaissance des mécaniques de fleet basiques",
    ],
  },
];

/** Étapes chargées et validées depuis recruitment-steps.json */
export const RECRUITMENT_STEPS: RecruitmentStep[] = loadRecruitmentSteps();

export const REQUIREMENTS = {
  headline: "Prérequis",
  items: [
    "Compte EVE Online actif (Omega obligatoire)",
    "Minimum 20M SP (exceptions possibles selon profil)",
    "Microphone fonctionnel et présence Discord",
    "Disponibilité EU TZ (souplesse possible)",
    "Casque / Discord pour les fleets",
    "Lecture de la doctrine corps avant candidature",
  ],
} as const;

export const RECRUITMENT_CTA: CTAConfig = {
  label: "Postuler sur Discord",
  href: "https://discord.gg/tabou",
  variant: "primary",
  external: true,
};

export const RECRUITMENT_DISCORD: CTAConfig = {
  label: "Rejoindre le Discord",
  href: "https://discord.gg/tabou",
  variant: "secondary",
  external: true,
};
