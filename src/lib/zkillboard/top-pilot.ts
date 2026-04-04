/**
 * ─── TOP PILOTE — depuis les stats zkillboard ────────────────────────────────
 * Endpoint : /api/stats/corporationID/{id}/
 * Le topLists[type=character] donne le classement général des pilotes.
 */

import { ZKILL_CONFIG } from "./config";

export interface TopPilot {
  characterId: number;
  name: string;
  kills: number;
  portraitUrl: string;
  zkillUrl: string;
}

export async function fetchTopPilot(): Promise<TopPilot | null> {
  try {
    const res = await fetch(
      `${ZKILL_CONFIG.apiUrl}/stats/corporationID/${ZKILL_CONFIG.corpId}/`,
      { next: { revalidate: 3600 } } // recalcul zkill toutes les heures max
    );
    if (!res.ok) return null;

    const data = await res.json();
    const topChars = (data.topLists as { type: string; values: { characterID: number; characterName: string; kills: number }[] }[])
      ?.find((l) => l.type === "character")
      ?.values;

    const top = topChars?.[0];
    if (!top) return null;

    return {
      characterId: top.characterID,
      name:        top.characterName,
      kills:       top.kills,
      portraitUrl: `https://images.evetech.net/characters/${top.characterID}/portrait?size=128`,
      zkillUrl:    `${ZKILL_CONFIG.baseUrl}/character/${top.characterID}/`,
    };
  } catch {
    return null;
  }
}
