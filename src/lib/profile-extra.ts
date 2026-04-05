/**
 * Profil étendu d'un membre — stocké dans User.profileExtra (JSON).
 *
 * Champs :
 *   timezone     : valeur de la liste TIMEZONES (ex. "France (UTC+1/+2)")
 *   languages    : sous-ensemble de ["fr", "en"]
 *   mainActivity : "pvp" | "pve" | "industry" | "exploration" | "logistics" | "other"
 */

export interface ProfileExtra {
  timezone?:     string;
  languages?:    string[];
  mainActivity?: string;
}

// ─── Activités ────────────────────────────────────────────────────────────────

export const ACTIVITIES: { value: string; label: string }[] = [
  { value: "pvp",         label: "PvP" },
  { value: "pve",         label: "PvE / Ratting" },
  { value: "industry",    label: "Industrie / Mining" },
  { value: "exploration", label: "Exploration" },
  { value: "logistics",   label: "Logistique" },
  { value: "other",       label: "Autre" },
];

export const ACTIVITY_LABEL: Record<string, string> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.value, a.label])
);

// ─── Langues (FR / EN uniquement) ────────────────────────────────────────────

export const VALID_LANGUAGES = ["fr", "en"] as const;
export type Language = typeof VALID_LANGUAGES[number];

export const LANGUAGE_LABEL: Record<Language, string> = {
  fr: "Français",
  en: "English",
};

// ─── Fuseaux horaires ─────────────────────────────────────────────────────────

export interface TimezoneOption {
  value: string;
  label: string;
}

export interface TimezoneGroup {
  group: string;
  options: TimezoneOption[];
}

export const TIMEZONE_GROUPS: TimezoneGroup[] = [
  {
    group: "🇫🇷 Francophone",
    options: [
      { value: "France (UTC+1/+2)",          label: "France" },
      { value: "Belgique (UTC+1/+2)",         label: "Belgique" },
      { value: "Suisse (UTC+1/+2)",           label: "Suisse" },
      { value: "Luxembourg (UTC+1/+2)",       label: "Luxembourg" },
      { value: "Canada — Québec (UTC-5/-4)",  label: "Canada — Québec" },
      { value: "Maroc (UTC+0/+1)",            label: "Maroc" },
      { value: "Algérie (UTC+1)",             label: "Algérie" },
      { value: "Tunisie (UTC+1)",             label: "Tunisie" },
      { value: "Sénégal (UTC+0)",             label: "Sénégal" },
    ],
  },
  {
    group: "🌍 Europe",
    options: [
      { value: "Royaume-Uni (UTC+0/+1)",   label: "Royaume-Uni" },
      { value: "Allemagne (UTC+1/+2)",     label: "Allemagne" },
      { value: "Espagne (UTC+1/+2)",       label: "Espagne" },
      { value: "Italie (UTC+1/+2)",        label: "Italie" },
      { value: "Pays-Bas (UTC+1/+2)",      label: "Pays-Bas" },
      { value: "Suède (UTC+1/+2)",         label: "Suède" },
      { value: "Finlande (UTC+2/+3)",      label: "Finlande" },
      { value: "Pologne (UTC+1/+2)",       label: "Pologne" },
      { value: "Roumanie (UTC+2/+3)",      label: "Roumanie" },
      { value: "Russie — Moscou (UTC+3)",  label: "Russie — Moscou" },
    ],
  },
  {
    group: "🌎 Amériques",
    options: [
      { value: "USA — Est (UTC-5/-4)",       label: "USA — Est" },
      { value: "USA — Centre (UTC-6/-5)",    label: "USA — Centre" },
      { value: "USA — Montagne (UTC-7/-6)",  label: "USA — Montagne" },
      { value: "USA — Ouest (UTC-8/-7)",     label: "USA — Ouest" },
      { value: "Canada — Ontario (UTC-5/-4)",label: "Canada — Ontario" },
      { value: "Canada — Ouest (UTC-8/-7)",  label: "Canada — Ouest" },
      { value: "Brésil (UTC-3)",             label: "Brésil" },
      { value: "Argentine (UTC-3)",          label: "Argentine" },
    ],
  },
  {
    group: "🌏 Asie-Pacifique",
    options: [
      { value: "Émirats arabes (UTC+4)",          label: "Émirats arabes" },
      { value: "Inde (UTC+5:30)",                 label: "Inde" },
      { value: "Chine / Singapour (UTC+8)",       label: "Chine / Singapour" },
      { value: "Japon / Corée (UTC+9)",           label: "Japon / Corée" },
      { value: "Australie — Est (UTC+10/+11)",    label: "Australie — Est" },
      { value: "Nouvelle-Zélande (UTC+12/+13)",   label: "Nouvelle-Zélande" },
    ],
  },
];

// Toutes les valeurs valides (pour validation côté serveur)
export const VALID_TIMEZONES = new Set(
  TIMEZONE_GROUPS.flatMap((g) => g.options.map((o) => o.value))
);

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseProfileExtra(raw: string | null | undefined): ProfileExtra {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProfileExtra;
  } catch {
    return {};
  }
}
