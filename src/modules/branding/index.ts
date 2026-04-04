/**
 * Module Branding — tokens d'identité visuelle Tabou
 * Source de vérité pour les couleurs, espacements et paramètres graphiques.
 * Miroir du tailwind.config.ts pour usage en JS/TS (ex: graphiques, canvas).
 */

export const BRAND_COLORS = {
  // Fonds
  bgDeep: "#050403",
  bgSurface: "#0D0F12",
  bgElevated: "#15191E",

  // Texte
  textPrimary: "#E8E1D3",
  textSecondary: "#B8AE98",
  textMuted: "#7A7268",

  // Accents
  goldDefault: "#F0B030",
  goldLight: "#F7CC6A",
  goldDark: "#D08F30",
  goldDeep: "#9D6823",

  // Critique
  red: "#900000",
  redLight: "#C00000",

  // Bordures
  border: "#242830",
  borderSubtle: "#1A1E24",
  borderAccent: "#3A3020",
} as const;

export const BRAND_FONTS = {
  display: "Rajdhani, system-ui, sans-serif",
  body: "Barlow, system-ui, sans-serif",
} as const;

export const CORP_INFO = {
  name: "Tabou",
  ticker: "TABOU",
  tagline: "Compétence, discrétion, efficacité.",
  game: "EVE Online",
  timezone: "EU TZ",
  primaryActivity: "Nul-sec PvP",
} as const;
