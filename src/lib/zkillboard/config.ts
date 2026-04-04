/**
 * ─── ZKILLBOARD — Configuration ───────────────────────────────────────────────
 *
 * C'est ici que tout se configure.
 * Quand tu veux brancher l'API réelle, modifie uniquement ce fichier
 * + fetcher.ts (voir les instructions dedans).
 */

export const ZKILL_CONFIG = {
  /** ID EVE de la corporation Tabou */
  corpId: 98809880,

  /** Nombre de kills affichés dans le widget */
  displayCount: 5,

  /** Intervalle de rafraîchissement en ms (60s) */
  refreshInterval: 60_000,

  /** URL de base de l'API zkillboard */
  apiUrl: "https://zkillboard.com/api",

  /** URL de base zkillboard pour les liens */
  baseUrl: "https://zkillboard.com",
} as const;
