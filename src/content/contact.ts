export const CONTACT_META = {
  title: "Contact — Tabou",
  description:
    "Contactez la corporation Tabou via Discord ou en jeu. Recrutement, questions générales ou partenariats.",
};

export const CONTACT_INTRO = {
  eyebrow: "Contact",
  headline: "On vous répond.",
  body: "Discord est notre canal principal. Nous ne sommes pas une hotline — mais nous lisons, et nous répondons sous 24 à 48h.",
} as const;

export const CONTACT_CHANNELS = [
  {
    id: "discord",
    title: "Discord",
    description:
      "Le moyen le plus rapide. Rejoignez notre serveur et ouvrez un ticket ou envoyez un message direct à un officier.",
    detail: "Réponse habituelle sous 24h",
    cta: {
      label: "Rejoindre le Discord",
      href: "https://discord.gg/tabou",
      external: true,
    },
  },
  {
    id: "recruitment",
    title: "Recrutement",
    description:
      "Pour une candidature, utilisez le canal de recrutement Discord. Consultez d'abord la page recrutement pour vérifier si votre profil correspond.",
    detail: "Ticket de recrutement sur Discord",
    cta: {
      label: "Voir le recrutement",
      href: "/recrutement",
      external: false,
    },
  },
  {
    id: "ingame",
    title: "En jeu",
    description:
      "Vous pouvez contacter directement les officiers de Tabou via les messages privés EVE Online. Cherchez le ticker [TABOU] en jeu.",
    detail: "Réponse sous 48h",
    cta: null,
  },
] as const;

export const CONTACT_FORM_NOTE =
  "Le formulaire de contact direct sera disponible dans une prochaine version. En attendant, Discord reste le canal préférentiel.";

export const CONTACT_AVAILABILITY = {
  label: "Disponibilité",
  detail: "Officers actifs en EU TZ — 18h00 à 23h00 CET/CEST",
} as const;
