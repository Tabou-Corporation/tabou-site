// ─── CMS Site Content — Defaults ──────────────────────────────────────────────
// Valeurs par défaut issues des fichiers de contenu statiques.
// Servent de fallback si la base de données ne contient pas encore la page.

import type {
  HomeContent,
  CorporationContent,
  RecruitmentContent,
  FaqItem,
  ActivityItem,
  ContactContent,
  ContentByPage,
} from "./types";

export const DEFAULT_HOME: HomeContent = {
  hero: {
    eyebrow: "Corporation EVE Online",
    headline: "L'excellence\nsans compromis.",
    subheadline:
      "Tabou opère en nul-sec depuis des années. Nous ne cherchons pas des corps — nous cherchons des pilotes qui savent pourquoi ils volent.",
    backgroundImage: "/images/hero-bg.jpg",
  },
  intro: {
    eyebrow: "Qui sommes-nous",
    headline: "Une corporation taillée pour le jeu de haut niveau.",
    body: [
      "Tabou est une corporation EVE Online fondée sur un principe simple : jouer sérieusement, sans se prendre au sérieux. Nous opérons principalement en espace nul-sec, avec une culture orientée résultats, discrétion et efficacité collective.",
      "Nos membres sont des adultes qui comprennent que le meilleur contenu d'EVE se construit sur la confiance mutuelle, la communication directe et l'absence de drama inutile.",
    ],
  },
  stats: [
    { label: "Années d'existence", value: "8+" },
    { label: "Membres actifs", value: "40+" },
    { label: "Systèmes maîtrisés", value: "12" },
    { label: "Kills cette année", value: "2 400+" },
  ],
  why: {
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
  },
  activitiesPreview: {
    headline: "Ce que nous faisons",
    description:
      "Du PvP nul-sec à l'industrie stratégique, en passant par les opérations d'exploration — le spectre est large, l'engagement est réel.",
  },
  recruitmentTeaser: {
    eyebrow: "Recrutement ouvert",
    headline: "Vous correspondez au profil ?",
    body: "Nous recherchons des pilotes avec de l'expérience, une attitude constructive et l'envie de contribuer à quelque chose de durable.",
  },
};

export const DEFAULT_CORPORATION: CorporationContent = {
  intro: {
    eyebrow: "La Corporation",
    headline: "Tabou, en clair.",
    body: [
      "Tabou n'est pas une corporation de passage. Nous sommes un groupe de joueurs qui se connaissent, qui se font confiance et qui jouent ensemble depuis des années. L'objectif n'est pas de grossir — c'est de maintenir un niveau de jeu et de cohésion qui rend chaque session valable.",
      "Nous opérons principalement en nul-sec. Notre présence est discrète, notre réputation est sérieuse.",
    ],
  },
  values: {
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
  },
  expectations: {
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
  },
};

export const DEFAULT_RECRUITMENT: RecruitmentContent = {
  intro: {
    eyebrow: "Recrutement",
    headline: "On ne recrute pas\npour remplir des rangs.",
    body: "Tabou est une corporation à effectifs maîtrisés. Chaque recrutement est une décision réfléchie. Si vous lisez ceci, c'est que vous avez déjà compris que nous ne sommes pas n'importe quelle corp.",
  },
  wantedProfiles: [
    {
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
  ],
  notAdaptedProfiles: [
    {
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
      title: "Le grand débutant",
      description:
        "Nous respectons les nouveaux joueurs, mais nous n'avons pas les ressources pour un encadrement intensif. SP minimale requise.",
      traits: [
        "< 15M SP sans spécialisation claire",
        "Aucune expérience nul-sec",
        "Pas de connaissance des mécaniques de fleet basiques",
      ],
    },
  ],
  requirements: {
    headline: "Prérequis",
    items: [
      "Compte EVE Online actif (Omega obligatoire)",
      "Minimum 20M SP (exceptions possibles selon profil)",
      "Microphone fonctionnel et présence Discord",
      "Disponibilité EU TZ (souplesse possible)",
      "Casque / Discord pour les fleets",
      "Lecture de la doctrine corps avant candidature",
    ],
  },
  steps: [
    {
      number: 1,
      title: "Prise de contact",
      description:
        "Rejoignez notre Discord et ouvrez un ticket de recrutement, ou contactez directement un officier en jeu. Présentez-vous brièvement : SP, expérience, disponibilité, ce que vous cherchez.",
      duration: "Immédiat",
    },
    {
      number: 2,
      title: "Entretien Discord",
      description:
        "Un officier vous contacte pour un échange vocal de 15-20 minutes. Pas de test, pas de QCM. Une conversation directe pour voir si le fit est mutuel.",
      duration: "1 à 3 jours",
    },
    {
      number: 3,
      title: "Période d'essai",
      description:
        "Si l'entretien est positif, vous intégrez Tabou avec le rang candidat. Période de 2-4 semaines pour valider l'engagement mutuel et la cohésion.",
      duration: "2 à 4 semaines",
    },
    {
      number: 4,
      title: "Intégration complète",
      description:
        "Après la période d'essai et validation collective, vous devenez membre à part entière. Accès complet aux ressources, aux systèmes et aux opérations.",
      duration: "Définitif",
    },
  ],
};

export const DEFAULT_FAQ: FaqItem[] = [
  {
    id: "faq-recrutement-1",
    category: "Recrutement",
    question: "Est-ce que le recrutement est ouvert ?",
    answer:
      "Oui, le recrutement est actuellement ouvert pour des profils sélectionnés. Nous recrutons en continu, mais nous acceptons peu. Consultez la page Recrutement pour connaître les profils recherchés.",
  },
  {
    id: "faq-recrutement-2",
    category: "Recrutement",
    question: "Quel est le minimum de SP requis ?",
    answer:
      "Nous demandons généralement 20M SP minimum, mais ce n'est pas une règle absolue. Un profil de 15M SP très spécialisé et maîtrisé peut passer. L'expérience compte autant que les chiffres.",
  },
  {
    id: "faq-recrutement-3",
    category: "Recrutement",
    question: "Est-ce que je dois parler français ?",
    answer:
      "Tabou est une corporation francophone. Le français est la langue principale sur Discord et en fleet. Une compréhension basique est suffisante si vous êtes bilingue, mais les fleets se font en français.",
  },
  {
    id: "faq-recrutement-4",
    category: "Recrutement",
    question: "J'ai peu d'expérience en nul-sec. Puis-je quand même postuler ?",
    answer:
      "Si vous avez les SP, la volonté d'apprendre et un comportement mature, oui. Nous n'attendons pas des pilotes parfaits, mais des pilotes honnêtes sur leurs limites et disposés à progresser.",
  },
  {
    id: "faq-corp-1",
    category: "Vie en corporation",
    question: "Y a-t-il un quota d'activité obligatoire ?",
    answer:
      "Non, il n'y a pas de quota de connexion ou de kill par semaine. Ce que nous attendons, c'est une présence cohérente dans le temps et une communication ouverte si vous devez vous absenter.",
  },
  {
    id: "faq-corp-2",
    category: "Vie en corporation",
    question: "Est-ce qu'il y a un SRP (remplacement de ships) ?",
    answer:
      "Oui. Le SRP est actif pour les ships perdus en fleet officielle suivant la doctrine. Les pertes hors doctrine ou solo ne sont pas couvertes sauf exception décidée par les officiers.",
  },
  {
    id: "faq-corp-3",
    category: "Vie en corporation",
    question: "Comment se passe le déménagement vers le homeworld ?",
    answer:
      "Nous aidons à l'intégration logistique via notre réseau de jump freighter et de couloirs WH. Les détails sont fournis lors de l'intégration. Prévoyez 1-2 semaines pour finaliser le déménagement.",
  },
  {
    id: "faq-corp-4",
    category: "Vie en corporation",
    question: "Est-ce que je peux avoir des comptes alts ?",
    answer:
      "Oui, les alts sont les bienvenus. Nous demandons à les déclarer aux officiers lors de l'intégration pour des raisons de sécurité corp (OPSEC). Les alts industriels / scan sont particulièrement valorisés.",
  },
  {
    id: "faq-jeu-1",
    category: "Jeu & Mécanique",
    question: "Quelle est votre timezone principale ?",
    answer:
      "Nous sommes principalement actifs en EU TZ (18h00-23h00 CET/CEST). Nous avons quelques membres US TZ mais la masse critique est européenne.",
  },
  {
    id: "faq-jeu-2",
    category: "Jeu & Mécanique",
    question: "Avez-vous une doctrine imposée ?",
    answer:
      "Oui. Pour les fleets officielles, nous avons des doctrines définies pour garantir la cohésion et la lisibilité en combat. Les ships de doctrine sont accessibles via la corp ou fabriqués en interne. Le fitting solo est libre.",
  },
  {
    id: "faq-jeu-3",
    category: "Jeu & Mécanique",
    question: "Est-ce que vous faites du wormhole ?",
    answer:
      "Nous utilisons les wormholes comme vecteurs d'accès et d'exploration, pas comme résidence principale. Des membres pratiquent l'exploration WH solo. Des opérations blops passent régulièrement par des chaînes WH.",
  },
  {
    id: "faq-jeu-4",
    category: "Jeu & Mécanique",
    question: "Est-ce que Tabou fait partie d'une alliance ?",
    answer:
      "Nous opérons soit de façon indépendante soit via des arrangements avec des alliances partenaires selon la période. L'état actuel est communiqué lors de l'entretien de recrutement.",
  },
  {
    id: "faq-start-1",
    category: "Par où commencer",
    question: "Comment postuler ?",
    answer:
      "Rejoignez notre Discord, ouvrez un ticket de recrutement et présentez-vous. Un officier vous répondra sous 48h. Vous pouvez aussi contacter directement un officier en jeu.",
  },
  {
    id: "faq-start-2",
    category: "Par où commencer",
    question: "Je ne suis pas encore sûr de vouloir postuler. Je peux juste regarder ?",
    answer:
      "Oui. Le Discord est ouvert. Vous pouvez rejoindre, observer, poser des questions sans aucun engagement. Nous préférons un candidat qui prend le temps de comprendre qui nous sommes.",
  },
];

export const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "small-gang-pvp",
    name: "Small Gang PvP",
    category: "pvp",
    icon: "Crosshair",
    description:
      "Groupes de 5 à 15 pilotes, doctrine adaptée, engagement ciblé. La base de notre activité quotidienne en nul-sec.",
    tags: ["Nul-sec", "Flotte", "Doctrine"],
  },
  {
    id: "blops",
    name: "Black Ops",
    category: "pvp",
    icon: "Eye",
    description:
      "Cyno furtif, déploiement chirurgical, élimination de cibles à haute valeur. Réservé aux membres confirmés.",
    tags: ["Blops", "Furtif", "Haute valeur"],
  },
  {
    id: "roaming",
    name: "Roaming",
    category: "pvp",
    icon: "Navigation",
    description:
      "Sorties offensives dans les systèmes adjacents. Chercher le combat, documenter l'espace, évaluer les menaces.",
    tags: ["Offensif", "Nul-sec", "Roam"],
  },
  {
    id: "structure-warfare",
    name: "Structure Warfare",
    category: "pvp",
    icon: "Shield",
    description:
      "Anchoring, défense et destruction de structures. Participation aux opérations d'alliance selon les priorités stratégiques.",
    tags: ["Alliance", "Stratégique", "Structure"],
  },
  {
    id: "escalations",
    name: "Escalations & Anoms",
    category: "pve",
    icon: "Zap",
    description:
      "Anomalies nul-sec et escalades complexes. Revenus optimisés, risque géré, rotation organisée entre membres.",
    tags: ["Revenus", "Nul-sec", "PvE"],
  },
  {
    id: "incursions",
    name: "Incursions",
    category: "pve",
    icon: "Target",
    description:
      "Incursions Sansha coordinées. Participation selon disponibilité, isk/heure optimal.",
    tags: ["Incursion", "Sansha", "ISK"],
  },
  {
    id: "relic-data",
    name: "Exploration Relic / Data",
    category: "exploration",
    icon: "Compass",
    description:
      "Sites reliques et données en nul-sec et wormhole. Revenus variables, jeu en solo ou en duo discret.",
    tags: ["Exploration", "Solo", "Wormhole"],
  },
  {
    id: "wormhole-diving",
    name: "Wormhole Diving",
    category: "exploration",
    icon: "Globe",
    description:
      "Plongée dans les wormholes pour reconnaissance, pillage ou accès furtif. Risque élevé, récompense proportionnelle.",
    tags: ["WH", "Furtif", "Reconnaissance"],
  },
  {
    id: "production",
    name: "Production & Doctrine",
    category: "industry",
    icon: "Factory",
    description:
      "Fabrication des ships de doctrine, munitions, modules — contribution directe à la logistique opérationnelle.",
    tags: ["Industrie", "Doctrine", "Logistique"],
  },
  {
    id: "trade",
    name: "Commerce & Arbitrage",
    category: "industry",
    icon: "TrendingUp",
    description:
      "Achats en marché, arbitrage entre hubs, financement de la corp. Activité secondaire valorisée.",
    tags: ["Commerce", "ISK", "Marché"],
  },
  {
    id: "alliance-ops",
    name: "Opérations d'Alliance",
    category: "collective",
    icon: "Users",
    description:
      "Participation aux stratops et campagnes d'alliance. Présence attendue lors des appels prioritaires.",
    tags: ["Alliance", "Stratop", "Corp"],
  },
  {
    id: "intel-scanning",
    name: "Renseignement & Scan",
    category: "collective",
    icon: "Radio",
    description:
      "Surveillance des couloirs d'entrée, reporting d'activité hostile, scan de chaînes. Rôle essentiel souvent sous-estimé.",
    tags: ["Intel", "Scan", "Support"],
  },
];

export const DEFAULT_CONTACT: ContactContent = {
  intro: {
    eyebrow: "Contact",
    headline: "On vous répond.",
    body: "Discord est notre canal principal. Nous ne sommes pas une hotline — mais nous lisons, et nous répondons sous 24 à 48h.",
  },
  channels: [
    {
      id: "discord",
      title: "Discord",
      description:
        "Le moyen le plus rapide. Rejoignez notre serveur et ouvrez un ticket ou envoyez un message direct à un officier.",
      detail: "Réponse habituelle sous 24h",
      ctaLabel: "Rejoindre le Discord",
      ctaHref: "https://discord.gg/tabou",
      ctaExternal: true,
    },
    {
      id: "recruitment",
      title: "Recrutement",
      description:
        "Pour une candidature, utilisez le canal de recrutement Discord. Consultez d'abord la page recrutement pour vérifier si votre profil correspond.",
      detail: "Ticket de recrutement sur Discord",
      ctaLabel: "Voir le recrutement",
      ctaHref: "/recrutement",
      ctaExternal: false,
    },
    {
      id: "ingame",
      title: "En jeu",
      description:
        "Vous pouvez contacter directement les officiers de Tabou via les messages privés EVE Online. Cherchez le ticker [TABOU] en jeu.",
      detail: "Réponse sous 48h",
    },
  ],
  availability: "Officers actifs en EU TZ — 18h00 à 23h00 CET/CEST",
  formNote:
    "Le formulaire de contact direct sera disponible dans une prochaine version. En attendant, Discord reste le canal préférentiel.",
};

export const DEFAULTS: ContentByPage = {
  home: DEFAULT_HOME,
  corporation: DEFAULT_CORPORATION,
  recruitment: DEFAULT_RECRUITMENT,
  faq: DEFAULT_FAQ,
  activities: DEFAULT_ACTIVITIES,
  contact: DEFAULT_CONTACT,
};
