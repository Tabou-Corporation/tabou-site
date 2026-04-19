/**
 * ─── ZKILLBOARD — Configuration ───────────────────────────────────────────────
 *
 * C'est ici que tout se configure.
 * Quand tu veux brancher l'API réelle, modifie uniquement ce fichier
 * + fetcher.ts (voir les instructions dedans).
 */

export interface CorpConfig {
  /** ID EVE de la corporation */
  id: number;
  /** Nom court affiché dans le header du widget */
  shortName: string;
  /** Ticker affiché en uppercase (court) */
  ticker: string;
}

export const CORPS = {
  tabou: {
    id: 98809880,
    shortName: "Tabou",
    ticker: "TABOU",
  },
  urbanZone: {
    id: 98215397,
    shortName: "Urban Zone",
    ticker: "U.Z",
  },
} as const satisfies Record<string, CorpConfig>;

export type CorpKey = keyof typeof CORPS;

export const ZKILL_CONFIG = {
  /** ID EVE de la corporation Tabou (gardé pour compat ailleurs) */
  corpId: CORPS.tabou.id,

  /** Nombre de kills affichés dans le widget (par corpo) */
  displayCount: 5,

  /** Intervalle de rafraîchissement en ms (60s) */
  refreshInterval: 60_000,

  /** URL de base de l'API zkillboard */
  apiUrl: "https://zkillboard.com/api",

  /** URL de base zkillboard pour les liens */
  baseUrl: "https://zkillboard.com",
} as const;
