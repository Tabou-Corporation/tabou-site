import type { StatItem, CTAConfig } from "@/types/content";

export const HOME_HERO = {
  eyebrow: "Corporation EVE Online",
  headline: "L'excellence\nsans compromis.",
  subheadline:
    "Tabou opère en nul-sec depuis des années. Nous ne cherchons pas des corps — nous cherchons des pilotes qui savent pourquoi ils volent.",
  cta: {
    primary: { label: "Postuler", href: "/recrutement", variant: "primary" } satisfies CTAConfig,
    secondary: { label: "En savoir plus", href: "/corporation", variant: "ghost" } satisfies CTAConfig,
  },
} as const;

export const HOME_INTRO = {
  eyebrow: "Qui sommes-nous",
  headline: "Une corporation taillée pour le jeu de haut niveau.",
  body: [
    "Tabou est une corporation EVE Online fondée sur un principe simple : jouer sérieusement, sans se prendre au sérieux. Nous opérons principalement en espace nul-sec, avec une culture orientée résultats, discrétion et efficacité collective.",
    "Nos membres sont des adultes qui comprennent que le meilleur contenu d'EVE se construit sur la confiance mutuelle, la communication directe et l'absence de drama inutile.",
  ],
} as const;

export const HOME_STATS: StatItem[] = [
  { label: "Années d'existence", value: "8+" },
  { label: "Membres actifs", value: "40+" },
  { label: "Systèmes maîtrisés", value: "12" },
  { label: "Kills cette année", value: "2 400+" },
];

export const HOME_WHY = {
  headline: "Pourquoi Tabou",
  items: [
    {
      title: "Contenu de qualité",
      description:
        "Fleets organisées, cibles qualifiées, pas de grind inutile. Nous optimisons chaque opération.",
    },
    {
      title: "Culture adulte",
      description:
        "Pas de hiérarchie décorée, pas de drama. On communique, on décide, on agit.",
    },
    {
      title: "Structure solide",
      description:
        "Logistique opérationnelle, doctrine définie, SRP, guidances pour les nouveaux arrivants.",
    },
    {
      title: "Ambitions claires",
      description:
        "Nous ne prétendons pas être les meilleurs. Nous cherchons à progresser ensemble, continuellement.",
    },
  ],
} as const;

export const HOME_ACTIVITIES_PREVIEW = {
  headline: "Ce que nous faisons",
  description:
    "Du PvP nul-sec à l'industrie stratégique, en passant par les opérations d'exploration — le spectre est large, l'engagement est réel.",
  cta: { label: "Voir toutes les activités", href: "/activites", variant: "ghost" } satisfies CTAConfig,
} as const;

export const HOME_RECRUITMENT_TEASER = {
  eyebrow: "Recrutement ouvert",
  headline: "Vous correspondez au profil ?",
  body: "Nous recherchons des pilotes avec de l'expérience, une attitude constructive et l'envie de contribuer à quelque chose de durable.",
  cta: { label: "Voir le recrutement", href: "/recrutement", variant: "primary" } satisfies CTAConfig,
  discord: { label: "Rejoindre le Discord", href: "https://discord.gg/tabou", variant: "secondary", external: true } satisfies CTAConfig,
} as const;
