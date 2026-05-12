/**
 * Intégration zKillboard — récupère les killmails récents d'un système et les
 * enrichit via ESI (détails du kill + noms d'alliances/ships).
 *
 * zKill rate-limit : User-Agent obligatoire (identifiant l'app), ≤ 1 req/sec
 * agrégé. Nos appels sont cachés via `esiFetch` (DB), donc en pratique on tape
 * zKill au plus 1 fois / système / 5min.
 *
 * ESI killmails : immuables → cache 24h. Names : cache 1h.
 */

import { esiFetch } from "@/lib/map/esi/cache";

const ZK_USER_AGENT =
  process.env.ESI_USER_AGENT ?? "Tabou-ProvidencePulse/1.0 (+https://tabou.fr/map)";

interface ZkillItem {
  killmail_id: number;
  zkb: {
    hash: string;
    totalValue: number;
    points: number;
    npc: boolean;
    solo: boolean;
  };
}

interface EsiKillmail {
  killmail_id: number;
  killmail_time: string;
  solar_system_id: number;
  victim: {
    alliance_id?: number;
    corporation_id?: number;
    character_id?: number;
    ship_type_id: number;
    damage_taken: number;
  };
  attackers: Array<{
    alliance_id?: number;
    corporation_id?: number;
    character_id?: number;
    ship_type_id?: number;
    damage_done: number;
    final_blow: boolean;
  }>;
}

export interface KillSummary {
  killId: number;
  killTime: string;
  victim: {
    shipTypeId: number;
    shipName: string;
    allianceId: number | null;
    allianceName: string | null;
  };
  attackers: {
    count: number;
    primaryAllianceId: number | null;
    primaryAllianceName: string | null;
  };
  totalValue: number;
  npc: boolean;
  solo: boolean;
  zkillUrl: string;
}

/** Fetch + enrich kills récents pour un système (1h, top 10). */
export async function getRecentKillsForSystem(
  systemId: number,
  pastSeconds = 3600,
  limit = 10,
): Promise<{ kills: KillSummary[]; fromCache: boolean; error?: string }> {
  // 1. Liste zKill (cache 5min — zKill propose pas de Expires header propre).
  const zkUrl = `https://zkillboard.com/api/kills/systemID/${systemId}/pastSeconds/${pastSeconds}/`;
  const list = await esiFetch<ZkillItem[]>(zkUrl, 300);
  if (!list.data) {
    return { kills: [], fromCache: false, ...(list.error ? { error: list.error } : {}) };
  }
  if (list.data.length === 0) return { kills: [], fromCache: list.fromCache };

  // 2. Top N killmails — fetch ESI (cache 24h, killmails immuables).
  const top = list.data.slice(0, limit);
  const kmResults = await Promise.all(
    top.map((it) => {
      const url = `https://esi.evetech.net/latest/killmails/${it.killmail_id}/${it.zkb.hash}/`;
      return esiFetch<EsiKillmail>(url, 86400).then((r) => ({ zk: it, km: r.data }));
    }),
  );
  const enriched = kmResults.filter((r): r is { zk: ZkillItem; km: EsiKillmail } => r.km != null);

  // 3. Collect IDs à résoudre (alliances + ships).
  const idsToResolve = new Set<number>();
  const primaryAttacker = new Map<number, number | null>(); // killId → primary alliance_id
  for (const { km } of enriched) {
    if (km.victim.alliance_id) idsToResolve.add(km.victim.alliance_id);
    idsToResolve.add(km.victim.ship_type_id);
    // Compte les attackers par alliance pour identifier le "primaire"
    const byAlliance = new Map<number, number>();
    for (const a of km.attackers) {
      if (a.alliance_id) byAlliance.set(a.alliance_id, (byAlliance.get(a.alliance_id) ?? 0) + 1);
    }
    let primary: number | null = null;
    let max = 0;
    for (const [aid, cnt] of byAlliance) {
      if (cnt > max) { max = cnt; primary = aid; }
    }
    // Tiebreaker : alliance du final blow si pas de majorité claire
    if (primary == null) {
      const fb = km.attackers.find((a) => a.final_blow);
      primary = fb?.alliance_id ?? null;
    }
    if (primary) idsToResolve.add(primary);
    primaryAttacker.set(km.killmail_id, primary);
  }

  // 4. Résolution des noms via ESI POST /universe/names/
  const names = await resolveNames([...idsToResolve]);

  // 5. Assemblage final
  const kills: KillSummary[] = enriched.map(({ zk, km }) => {
    const primary = primaryAttacker.get(km.killmail_id) ?? null;
    return {
      killId: km.killmail_id,
      killTime: km.killmail_time,
      victim: {
        shipTypeId: km.victim.ship_type_id,
        shipName: names.get(km.victim.ship_type_id) ?? `Ship #${km.victim.ship_type_id}`,
        allianceId: km.victim.alliance_id ?? null,
        allianceName: km.victim.alliance_id ? names.get(km.victim.alliance_id) ?? null : null,
      },
      attackers: {
        count: km.attackers.length,
        primaryAllianceId: primary,
        primaryAllianceName: primary ? names.get(primary) ?? null : null,
      },
      totalValue: zk.zkb.totalValue,
      npc: zk.zkb.npc,
      solo: zk.zkb.solo,
      zkillUrl: `https://zkillboard.com/kill/${km.killmail_id}/`,
    };
  });

  return { kills, fromCache: list.fromCache };
}

/** Résout des IDs (alliances, ships, corps) → nom via POST /universe/names/. */
async function resolveNames(ids: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (ids.length === 0) return map;

  // POST limité à 1000 IDs ; on est largement en dessous (max ~30 ici).
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
    /* names décoratifs — on continue avec IDs si la résolution échoue */
  }
  return map;
}
