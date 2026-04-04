/**
 * Corporations EVE Online liées à Tabou
 * Les logos sont servis directement par l'API EVE Images.
 *
 * Format :  https://images.evetech.net/corporations/<corp_id>/logo?size=<px>
 * Tailles disponibles : 32 | 64 | 128 | 256 | 512
 */

export const CORPORATIONS = {
  tabou: {
    id: 98809880,
    name: "Tabou",
    ticker: "TABU",
    logo: "https://images.evetech.net/corporations/98809880/logo",
    logoUrl: (size: 32 | 64 | 128 | 256 | 512 = 64) =>
      `https://images.evetech.net/corporations/98809880/logo?size=${size}`,
  },
  urbanZone: {
    id: 98215397,
    name: "Urban Zone",
    ticker: "UZ",
    logo: "https://images.evetech.net/corporations/98215397/logo",
    logoUrl: (size: 32 | 64 | 128 | 256 | 512 = 64) =>
      `https://images.evetech.net/corporations/98215397/logo?size=${size}`,
  },
} as const;

/** Raccourcis directs */
export const TABOU_LOGO      = CORPORATIONS.tabou.logo;
export const URBAN_ZONE_LOGO = CORPORATIONS.urbanZone.logo;
