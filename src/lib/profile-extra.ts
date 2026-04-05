/**
 * Profil étendu d'un membre — stocké dans User.profileExtra (JSON).
 *
 * Champs :
 *   timezone     : ex. "UTC+2" ou "Europe/Paris"
 *   languages    : ex. ["fr", "en"]
 *   mainActivity : ex. "pvp" | "pve" | "industry" | "exploration" | "other"
 *   alts         : noms de personnages alternatifs
 */

export interface ProfileExtra {
  timezone?:     string;
  languages?:    string[];
  mainActivity?: string;
  alts?:         string[];
}

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

export function parseProfileExtra(raw: string | null | undefined): ProfileExtra {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProfileExtra;
  } catch {
    return {};
  }
}
