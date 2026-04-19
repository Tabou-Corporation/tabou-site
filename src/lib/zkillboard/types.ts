/**
 * ─── ZKILLBOARD — Types ───────────────────────────────────────────────────────
 */

/** Réponse brute de l'API zkillboard /kills/corporationID/{id}/ */
export interface ZkillApiEntry {
  killmail_id: number;
  zkb: {
    hash: string;
    totalValue: number;
    url?: string;   // pas toujours présent dans la réponse API
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
  killmailTime: string; // ISO brut — sert au merge multi-corp
  url: string;
  /** Corpo qui a scoré le kill — sert à afficher le badge */
  corpId: number;
  corpShortName: string;
}
