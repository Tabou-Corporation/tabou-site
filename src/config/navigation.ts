import type { NavigationConfig } from "@/types/navigation";

/**
 * Configuration centrale de la navigation.
 *
 * Principe : la navigation publique est déclarée ici.
 * En V2+, les zones member/staff auront leurs propres entrées,
 * filtrées dynamiquement par le hook useNavigation(role).
 */
export const NAVIGATION: NavigationConfig = {
  main: [
    {
      label: "La Corporation",
      href: "/corporation",
      visibility: "public",
    },
    {
      label: "Activités",
      href: "/activites",
      visibility: "public",
    },
    {
      label: "Recrutement",
      href: "/recrutement",
      visibility: "public",
    },
    {
      label: "FAQ",
      href: "/faq",
      visibility: "public",
    },
    {
      label: "Contact",
      href: "/contact",
      visibility: "public",
    },
    // ── V2 ───────────────────────────────────────────────────────────────
    { label: "Espace Membre", href: "/membre", visibility: "candidate" },
    // ── Futures (V3+) ────────────────────────────────────────────────────
    // { label: "Candidatures", href: "/staff/candidatures", visibility: "recruiter" },
    // { label: "Backoffice", href: "/staff/admin", visibility: "officer" },
  ],

  utility: [
    {
      label: "Discord",
      href: "https://discord.gg/tabou",
      external: true,
      visibility: "public",
    },
    { label: "Connexion", href: "/login", visibility: "public" }, // V2
  ],

  footer: [
    {
      id: "corporation",
      label: "Corporation",
      items: [
        { label: "La Corporation", href: "/corporation" },
        { label: "Activités", href: "/activites" },
        { label: "Recrutement", href: "/recrutement" },
      ],
    },
    {
      id: "ressources",
      label: "Ressources",
      items: [
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
        { label: "Discord", href: "https://discord.gg/tabou", external: true },
      ],
    },
    {
      id: "legal",
      label: "Légal",
      items: [
        // { label: "Mentions légales", href: "/mentions-legales" }, // à activer si nécessaire
      ],
    },
  ],
} as const;
