/**
 * ─── TOP PILOTE — agrégation depuis les killmails bruts ─────────────────────
 * All-time : /api/stats/corporationID/{id}/  → topLists[type=character]
 * Ce mois  : /api/kills/corporationID/{id}/year/{Y}/month/{M}/
 *            + ESI killmails → on compte les kills par pilote de la corpo
 *
 * L'endpoint /stats/ avec filtre year/month est peu fiable (counts en retard).
 * On récupère donc les killmails bruts et on agrège nous-mêmes.
 */

import { ZKILL_CONFIG } from "./config";
import type { ZkillApiEntry } from "./types";

const ESI = "https://esi.evetech.net/latest";

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
 *  Récupère les killmails bruts via zKill + ESI et compte par attaquant. */
export async function fetchTopPilotsPodium(): Promise<TopPilot[]> {
  try {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    // ── 1. Récupérer tous les kills du mois depuis zKillboard ──────────
    const zkillRes = await fetch(
      `${ZKILL_CONFIG.apiUrl}/kills/corporationID/${ZKILL_CONFIG.corpId}/year/${year}/month/${month}/`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(8_000) }
    );
    if (!zkillRes.ok) return [];
    const zkillData: ZkillApiEntry[] = await zkillRes.json();
    if (!zkillData.length) return [];

    // ── 2. Récupérer les détails ESI de chaque killmail (en parallèle) ─
    const killmails = await Promise.all(
      zkillData.map(async (entry) => {
        try {
          const r = await fetch(
            `${ESI}/killmails/${entry.killmail_id}/${entry.zkb.hash}/`,
            { next: { revalidate: 86400 * 30 }, signal: AbortSignal.timeout(5_000) }
          );
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      })
    );

    // ── 3. Compter les kills par attaquant membre de la corpo ──────────
    const killsByChar = new Map<number, number>();

    for (const km of killmails) {
      if (!km?.attackers) continue;
      // Dédupliquer : un pilote ne compte qu'une fois par killmail
      const seen = new Set<number>();
      for (const atk of km.attackers) {
        if (
          atk.corporation_id === ZKILL_CONFIG.corpId &&
          atk.character_id &&
          !seen.has(atk.character_id)
        ) {
          seen.add(atk.character_id);
          killsByChar.set(atk.character_id, (killsByChar.get(atk.character_id) ?? 0) + 1);
        }
      }
    }

    if (!killsByChar.size) return [];

    // ── 4. Trier et prendre le top 3 ──────────────────────────────────
    const top3 = [...killsByChar.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // ── 5. Résoudre les noms via ESI ──────────────────────────────────
    const charIds = top3.map(([id]) => id);
    let nameMap: Record<number, string> = {};
    try {
      const namesRes = await fetch(`${ESI}/universe/names/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(charIds),
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(5_000),
      });
      if (namesRes.ok) {
        const arr: { id: number; name: string }[] = await namesRes.json();
        nameMap = Object.fromEntries(arr.map((n) => [n.id, n.name]));
      }
    } catch { /* fallback noms inconnus */ }

    return top3.map(([charId, kills]) => ({
      characterId: charId,
      name:        nameMap[charId] ?? "Pilote inconnu",
      kills,
      portraitUrl: `https://images.evetech.net/characters/${charId}/portrait?size=128`,
      zkillUrl:    `${ZKILL_CONFIG.baseUrl}/character/${charId}/`,
    }));
  } catch {
    return [];
  }
}
