/**
 * ─── ZKILLBOARD — Types ───────────────────────────────────────────────────────
 */

/** Réponse brute de l'API zkillboard /kills/corporationID/{id}/ */
export interface ZkillApiEntry {
  killmail_id: number;
  zkb: {
    hash: string;
    totalValue: number;
    url: string;
    npc: boolean;
    solo: boolean;
  };
}

/** Format affiché dans le widget (pré-formaté) */
export interface KillDisplayEntry {
  id: number;
  shipName: string;
  shipTypeId: number;
  victimName: string;
  iskValue: string;   // ex: "450 M" | "1.2 B"
  timeAgo: string;    // ex: "2 min" | "1 h"
  url: string;
}
