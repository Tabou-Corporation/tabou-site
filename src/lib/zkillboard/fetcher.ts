/**
 * ─── ZKILLBOARD — Fetcher ─────────────────────────────────────────────────────
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  POUR BRANCHER L'API RÉELLE :                                    ║
 * ║                                                                  ║
 * ║  1. Remplacer le return MOCK_KILLS ci-dessous par :              ║
 * ║                                                                  ║
 * ║     const res = await fetch(                                     ║
 * ║       `${ZKILL_CONFIG.apiUrl}/kills/corporationID/               ║
 * ║        ${ZKILL_CONFIG.corpId}/`,                                 ║
 * ║       { next: { revalidate: 60 } }                               ║
 * ║     );                                                           ║
 * ║     const data: ZkillEntry[] = await res.json();                 ║
 * ║     return data.slice(0, ZKILL_CONFIG.displayCount);             ║
 * ║                                                                  ║
 * ║  2. Supprimer l'import MOCK_KILLS                                ║
 * ║  C'est tout. Le reste du code ne change pas.                     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { ZKILL_CONFIG } from "./config";
import { MOCK_KILLS } from "./mock";
import type { KillDisplayEntry, ZkillEntry } from "./types";

/** Formate une valeur ISK brute en "450 M" / "1.2 B" / "12 B" */
export function formatIsk(value: number): string {
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    return `${b % 1 === 0 ? b : b.toFixed(1)} B`;
  }
  const m = Math.round(value / 1_000_000);
  return `${m} M`;
}

/** Formate une date ISO en temps relatif court */
export function formatTimeAgo(isoDate: string): string {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60)  return "< 1 min";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

/** Convertit une ZkillEntry brute en KillDisplayEntry */
function toDisplay(entry: ZkillEntry): KillDisplayEntry {
  return {
    id:          entry.killmail_id,
    shipName:    entry.victim.ship_name,
    shipTypeId:  entry.victim.ship_type_id,
    victimName:  entry.victim.character_name,
    iskValue:    formatIsk(entry.zkb.totalValue),
    timeAgo:     formatTimeAgo(entry.killmail_time),
    url:         entry.zkb.url,
  };
}

/**
 * Retourne les derniers kills de la corporation.
 * Actuellement : données fictives.
 * Pour passer en prod : voir les instructions en haut du fichier.
 */
export async function fetchCorpKills(): Promise<KillDisplayEntry[]> {
  // ── MOCK (remplacer par l'appel API réel) ──────────────────────────
  const data: ZkillEntry[] = MOCK_KILLS;
  // ──────────────────────────────────────────────────────────────────

  return data
    .slice(0, ZKILL_CONFIG.displayCount)
    .map(toDisplay);
}
