/**
 * zKillboard — stats all-time pour une ou plusieurs corporations.
 *
 * Endpoint zKill :
 *   /api/stats/corporationID/{id}/  → stats complètes (topAllTime, totaux ISK, etc.)
 *
 * Format intéressant :
 *   - topAllTime[type=character].data = [{characterID, kills}, ...]
 *   - shipsDestroyed, shipsLost, iskDestroyed, iskLost = totaux all-time corp
 *
 * On fusionne les classements de plusieurs corps par characterID (un pilote
 * actif dans Tabou puis Urban Zone voit ses kills additionnés) et on enrichit
 * via ESI universe/names pour récupérer le nom et la corp courante.
 */

import { esiFetch } from "@/lib/map/esi/cache";

const ZK_USER_AGENT =
  process.env.ESI_USER_AGENT ?? "Tabou-ProvidencePulse/1.0 (+https://tabou.fr/map)";

interface ZkillStatsRaw {
  topAllTime?: Array<{ type: string; data: Array<{ characterID?: number; kills?: number }> }>;
  shipsDestroyed?: number;
  shipsLost?: number;
  iskDestroyed?: number;
  iskLost?: number;
}

export interface HallOfFameEntry {
  characterId: number;
  characterName: string | null;
  kills: number;
  /** IDs des corps Tabou/UZ dans lesquelles ce pilote apparaît au top all-time. */
  corpIds: number[];
}

export interface HallOfFameCorpTotal {
  corpId: number;
  shipsDestroyed: number;
  shipsLost: number;
  iskDestroyed: number;
  iskLost: number;
  pilotCount: number;
}

export interface HallOfFamePayload {
  entries: HallOfFameEntry[];
  totals: HallOfFameCorpTotal[];
  fromCache: boolean;
}

/**
 * Récupère + fusionne les top all-time de plusieurs corps.
 * Cache zKill : 6h (les stats all-time bougent peu).
 */
export async function getHallOfFame(
  corpIds: number[],
  limit = 50,
): Promise<HallOfFamePayload> {
  let anyCache = false;
  const totals: HallOfFameCorpTotal[] = [];
  const byPilot = new Map<number, { kills: number; corpIds: Set<number> }>();

  for (const corpId of corpIds) {
    const url = `https://zkillboard.com/api/stats/corporationID/${corpId}/`;
    const res = await esiFetch<ZkillStatsRaw>(url, 6 * 3600);
    if (res.fromCache) anyCache = true;
    const stats = res.data;
    if (!stats) continue;

    const chars =
      stats.topAllTime?.find((t) => t.type === "character")?.data ?? [];
    for (const c of chars) {
      if (!c.characterID || typeof c.kills !== "number") continue;
      const prev = byPilot.get(c.characterID) ?? {
        kills: 0,
        corpIds: new Set<number>(),
      };
      prev.kills += c.kills;
      prev.corpIds.add(corpId);
      byPilot.set(c.characterID, prev);
    }

    totals.push({
      corpId,
      shipsDestroyed: stats.shipsDestroyed ?? 0,
      shipsLost: stats.shipsLost ?? 0,
      iskDestroyed: stats.iskDestroyed ?? 0,
      iskLost: stats.iskLost ?? 0,
      pilotCount: chars.length,
    });
  }

  // Tri desc par kills puis limite.
  const ranked = [...byPilot.entries()]
    .map(([id, v]) => ({
      characterId: id,
      kills: v.kills,
      corpIds: [...v.corpIds],
    }))
    .sort((a, b) => b.kills - a.kills)
    .slice(0, limit);

  // Résolution des noms via ESI /universe/names (POST, batch).
  const names = await resolveNames(ranked.map((r) => r.characterId));

  const entries: HallOfFameEntry[] = ranked.map((r) => ({
    characterId: r.characterId,
    characterName: names.get(r.characterId) ?? null,
    kills: r.kills,
    corpIds: r.corpIds,
  }));

  return { entries, totals, fromCache: anyCache };
}

async function resolveNames(ids: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (ids.length === 0) return map;
  try {
    const res = await fetch("https://esi.evetech.net/latest/universe/names/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": ZK_USER_AGENT,
      },
      body: JSON.stringify(ids),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const arr = (await res.json()) as Array<{ id: number; name: string }>;
      for (const n of arr) map.set(n.id, n.name);
    }
  } catch {
    /* noms décoratifs */
  }
  return map;
}
