import type { CTAConfig } from "@/types/content";

export const CORPORATION_META = {
  title: "La Corporation — Tabou",
  description:
    "Découvrez qui est Tabou, notre culture, notre philosophie de jeu et ce que nous attendons de nos membres.",
};

export const CORPORATION_INTRO = {
  eyebrow: "La Corporation",
  headline: "Tabou, en clair.",
  body: [
    "Tabou n'est pas une corporation de passage. Nous sommes un groupe de joueurs qui se connaissent, qui se font confiance et qui jouent ensemble depuis des années. L'objectif n'est pas de grossir — c'est de maintenir un niveau de jeu et de cohésion qui rend chaque session valable.",
    "Nous opérons principalement en nul-sec. Notre présence est discrète, notre réputation est sérieuse.",
  ],
} as const;

export const CORPORATION_VALUES = {
  headline: "Notre philosophie",
  items: [
    {
      title: "Efficacité avant tout",
      description:
        "Nous préférons dix pilotes disciplinés à cent joueurs désorganisés. Chaque opération est préparée, chaque membre sait son rôle.",
    },
    {
      title: "Communication directe",
      description:
        "Pas de diplomatie de couloir. Les problèmes se règlent frontalement, avec respect, et sans traîner. Drama = sortie.",
    },
    {
      title: "Contribution réelle",
      description:
        "Chaque membre apporte quelque chose : présence, expertise, logistique, renseignement. Pas de touristes.",
    },
    {
      title: "Progression continue",
      description:
        "On analyse les pertes, on améliore les doctrines, on partage les connaissances. L'équipe progresse ensemble.",
    },
  ],
} as const;

export const CORPORATION_EXPECTATIONS = {
  fromUs: {
    headline: "Ce que vous pouvez attendre de nous",
    items: [
      "Fleets organisées et régulières (PvP, exploitation, opérations spéciales)",
      "Logistique corp : doctrine fournie, SRP (Ship Replacement Program) actif",
      "Accès aux systèmes sécurisés et aux ressources nul-sec",
      "Encadrement pour les membres qui arrivent en nul-sec",
      "Communication ouverte avec les officiers",
      "Un environnement stable, adulte et sans toxicité",
    ],
  },
  fromYou: {
    headline: "Ce que nous attendons de vous",
    items: [
      "Expérience EVE solide (nul-sec ou disposé à apprendre rapidement)",
      "Présence régulière — pas de quota rigide, mais une contribution visible",
      "Lecture des mails corp et présence sur Discord",
      "Respect de la doctrine en opération",
      "Capacité à voler en fleet sans supervision constante",
      "Attitude constructive et maturité communicationnelle",
    ],
  },
} as const;

export const CORPORATION_CTA: CTAConfig = {
  label: "Postuler à Tabou",
  href: "/recrutement",
  variant: "primary",
};
