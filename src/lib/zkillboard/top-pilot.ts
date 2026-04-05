/**
 * ─── TOP PILOTE — depuis les stats zkillboard ────────────────────────────────
 * All-time : /api/stats/corporationID/{id}/  → topLists[type=character]
 * Ce mois  : /api/kills/corporationID/{id}/year/{Y}/month/{M}/
 *            + ESI killmails → agrégation kills par pilote de la corpo
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
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5_000) }
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

/** Retourne le top 3 des pilotes de la corpo pour le mois courant.
 *  Utilise le même endpoint stats zkillboard mais filtré year/month. */
export async function fetchTopPilotsPodium(): Promise<TopPilot[]> {
  try {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    const res = await fetch(
      `${ZKILL_CONFIG.apiUrl}/stats/corporationID/${ZKILL_CONFIG.corpId}/?year=${year}&month=${month}`,
      { next: { revalidate: 1800 }, signal: AbortSignal.timeout(5_000) }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const topChars = (data.topLists as { type: string; values: { characterID: number; characterName: string; kills: number }[] }[])
      ?.find((l) => l.type === "character")
      ?.values
      ?.slice(0, 3);

    if (!topChars?.length) return [];

    return topChars.map((c) => ({
      characterId: c.characterID,
      name:        c.characterName,
      kills:       c.kills,
      portraitUrl: `https://images.evetech.net/characters/${c.characterID}/portrait?size=128`,
      zkillUrl:    `${ZKILL_CONFIG.baseUrl}/character/${c.characterID}/`,
    }));
  } catch {
    return [];
  }
}
