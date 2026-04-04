/**
 * ─── ZKILLBOARD — Types ───────────────────────────────────────────────────────
 *
 * Structure calquée sur la réponse réelle de l'API zkillboard.
 * https://zkillboard.com/api/kills/corporationID/{id}/
 */

export interface ZkillEntry {
  killmail_id: number;
  killmail_time: string;          // ISO 8601 : "2024-04-04T18:32:00Z"
  victim: {
    character_id: number;
    character_name: string;       // récupéré via ESI (non fourni par zkill)
    corporation_id: number;
    ship_type_id: number;
    ship_name: string;            // récupéré via ESI (non fourni par zkill)
  };
  zkb: {
    totalValue: number;           // ISK brut, ex: 450_000_000
    hash: string;
    url: string;                  // lien direct vers le kill
  };
}

/** Format affiché dans le widget (pré-formaté) */
export interface KillDisplayEntry {
  id: number;
  shipName: string;
  shipTypeId: number;
  victimName: string;
  iskValue: string;               // ex: "450 M" | "1.2 B"
  timeAgo: string;                // ex: "2 min" | "1 h"
  url: string;
}
