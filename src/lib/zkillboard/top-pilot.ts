/**
 * ─── TOP PILOTE — agrégation depuis les killmails bruts ─────────────────────
 * All-time : /api/stats/corporationID/{id}/  → topLists[type=character]
 * Ce mois  : /api/kills/corporationID/{id}/year/{Y}/month/{M}/
 *            + ESI killmails → on compte les kills par pilote (multi-corp)
 *
 * L'endpoint /stats/ avec filtre year/month est peu fiable (counts en retard).
 * On récupère donc les killmails bruts et on agrège nous-mêmes.
 */

import { CORPS, ZKILL_CONFIG } from "./config";
import type { ZkillApiEntry } from "./types";

const ESI = "https://esi.evetech.net/latest";

export interface TopPilot {
  characterId: number;
  name: string;
  kills: number;
  portraitUrl: string;
  zkillUrl: string;
  /** Corpo principale du pilote (celle où il a le plus de kills sur la période) */
  corpId: number;
  corpShortName: string;
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
      corpId:      ZKILL_CONFIG.corpId,
      corpShortName: CORPS.tabou.shortName,
    };
  } catch {
    return null;
  }
}

/** Récupère et parse les killmails du mois courant pour une corpo. */
async function fetchMonthlyKillmails(corpId: number): Promise<unknown[]> {
  try {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    const zkillRes = await fetch(
      `${ZKILL_CONFIG.apiUrl}/kills/corporationID/${corpId}/year/${year}/month/${month}/`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(8_000) }
    );
    if (!zkillRes.ok) return [];
    const zkillData: ZkillApiEntry[] = await zkillRes.json();
    if (!zkillData.length) return [];

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
    return killmails.filter(Boolean);
  } catch {
    return [];
  }
}

/** Top 3 pilotes du mois sur l'ensemble des corpos passées (Tabou + Urban Zone par défaut).
 *  Un pilote n'est compté qu'une fois par killmail, même s'il apparaît dans plusieurs corps.
 *  La corpo "principale" affichée est celle où il a marqué le plus de kills. */
export async function fetchTopPilotsPodium(
  corpIds: number[] = [CORPS.tabou.id, CORPS.urbanZone.id]
): Promise<TopPilot[]> {
  try {
    const corpIdSet = new Set(corpIds);

    // ── 1. Récupérer les killmails du mois pour chaque corpo (en parallèle) ─
    const allKillmails = (await Promise.all(corpIds.map(fetchMonthlyKillmails))).flat();
    if (!allKillmails.length) return [];

    // ── 2. Dédupliquer par killmail_id (un kill peut apparaître côté Tabou ET Urban) ─
    const uniqueKillmails = new Map<number, { attackers: { corporation_id?: number; character_id?: number }[] }>();
    for (const km of allKillmails) {
      const k = km as { killmail_id: number; attackers: { corporation_id?: number; character_id?: number }[] };
      if (!k?.killmail_id || !k.attackers) continue;
      if (!uniqueKillmails.has(k.killmail_id)) uniqueKillmails.set(k.killmail_id, k);
    }

    // ── 3. Compter les kills par attaquant membre d'une des corpos ─────
    /** charId → total kills */
    const totalByChar = new Map<number, number>();
    /** charId → corpId → kills (pour déterminer la corpo principale) */
    const corpByChar = new Map<number, Map<number, number>>();

    for (const km of uniqueKillmails.values()) {
      const seen = new Set<number>();
      for (const atk of km.attackers) {
        if (
          atk.corporation_id !== undefined &&
          corpIdSet.has(atk.corporation_id) &&
          atk.character_id &&
          !seen.has(atk.character_id)
        ) {
          seen.add(atk.character_id);
          totalByChar.set(atk.character_id, (totalByChar.get(atk.character_id) ?? 0) + 1);
          let perCorp = corpByChar.get(atk.character_id);
          if (!perCorp) {
            perCorp = new Map();
            corpByChar.set(atk.character_id, perCorp);
          }
          perCorp.set(atk.corporation_id, (perCorp.get(atk.corporation_id) ?? 0) + 1);
        }
      }
    }

    if (!totalByChar.size) return [];

    // ── 4. Trier et prendre le top 3 ──────────────────────────────────
    const top3 = [...totalByChar.entries()]
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

    return top3.map(([charId, kills]) => {
      // Corpo principale = celle où le pilote a le plus de kills ce mois
      const perCorp = corpByChar.get(charId);
      const primaryCorpId = perCorp
        ? [...perCorp.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? corpIds[0]!
        : corpIds[0]!;
      const primaryCorp = Object.values(CORPS).find((c) => c.id === primaryCorpId);
      return {
        characterId: charId,
        name:        nameMap[charId] ?? "Pilote inconnu",
        kills,
        portraitUrl: `https://images.evetech.net/characters/${charId}/portrait?size=128`,
        zkillUrl:    `${ZKILL_CONFIG.baseUrl}/character/${charId}/`,
        corpId:      primaryCorpId,
        corpShortName: primaryCorp?.shortName ?? "",
      };
    });
  } catch {
    return [];
  }
}
