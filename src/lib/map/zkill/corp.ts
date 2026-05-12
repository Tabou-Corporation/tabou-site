/**
 * zKillboard — kills + losses pour une corporation sur une fenêtre temporelle.
 * Réutilise le pipeline de cache + enrichissement ESI déjà mis en place pour
 * les kills par système.
 *
 * Endpoint zKill :
 *   /api/kills/corporationID/{id}/pastSeconds/{n}/  → kills réalisés par la corp
 *   /api/losses/corporationID/{id}/pastSeconds/{n}/ → losses subis par la corp
 */

import { esiFetch } from "@/lib/map/esi/cache";
import { SDE_SYSTEMS } from "@/lib/map/sde";

// Systèmes "cœur" Providence + Catch — on filtre les kills corp ici pour ne pas
// noyer le panneau Activité corp avec les kills hors de notre zone (highsec
// roams, autres régions, etc.).
const CORE_SYSTEM_IDS = new Set<number>(
  SDE_SYSTEMS.filter((s) => s.inRegion).map((s) => s.systemId),
);

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

export interface CorpKillEntry {
  killId: number;
  killTime: string;
  side: "kill" | "loss";
  /** Corporation Tabou/UZ impliquée (l'une des `targetCorpIds`) */
  involvedCorpId: number;
  /** Pilote Tabou/UZ "principal" : victime (loss) ou final blow / first attacker (kill) — pour l'affichage chronologique */
  pilot: {
    characterId: number | null;
    characterName: string | null;
    shipTypeId: number | null;
  };
  /**
   * TOUS les pilotes Tabou/UZ présents sur ce killmail (attackers ou victime).
   * Utilisé pour l'agrégation par pilote : chaque participant gagne +1.
   */
  participants: Array<{
    characterId: number;
    characterName: string | null;
    shipTypeId: number | null;
    corpId: number;
  }>;
  /** Vaisseau "central" du killmail : si loss = victime, si kill = victime aussi */
  ship: {
    typeId: number;
    name: string;
  };
  victim: {
    allianceId: number | null;
    allianceName: string | null;
    corporationId: number | null;
  };
  solarSystemId: number;
  totalValue: number;
  attackerCount: number;
  zkillUrl: string;
}

/**
 * Récupère kills + losses pour une liste de corps sur le mois courant + le mois
 * précédent (pour avoir une fenêtre glissante ~30j même en début de mois).
 * Enrichit chaque killmail via ESI. Retourne une liste chronologique.
 *
 * NB : zKill limite `pastSeconds` à 7j max, d'où l'usage des endpoints
 * `year/{Y}/month/{M}/`.
 */
export async function getCorpKillsAndLosses(
  corpIds: number[],
  _unusedPastSeconds = 0,
  limitPerCorp = 300,
): Promise<{ entries: CorpKillEntry[]; fromCache: boolean }> {
  void _unusedPastSeconds;
  const allItems: Array<{ corpId: number; side: "kill" | "loss"; zk: ZkillItem }> = [];
  let anyCache = false;

  // Mois courant + précédent (UTC, format zKill : month 1-12)
  const now = new Date();
  const yNow = now.getUTCFullYear();
  const mNow = now.getUTCMonth() + 1;
  const prevDate = new Date(Date.UTC(yNow, mNow - 2, 1));
  const yPrev = prevDate.getUTCFullYear();
  const mPrev = prevDate.getUTCMonth() + 1;
  const periods: Array<[number, number]> = [
    [yPrev, mPrev],
    [yNow, mNow],
  ];

  // 1. Liste des killmails (kills + losses) par corp × période.
  for (const corpId of corpIds) {
    for (const side of ["kills", "losses"] as const) {
      for (const [y, m] of periods) {
        const url = `https://zkillboard.com/api/${side}/corporationID/${corpId}/year/${y}/month/${m}/`;
        const res = await esiFetch<unknown>(url, 600);
        if (res.fromCache) anyCache = true;
        if (!res.data || !Array.isArray(res.data)) continue;
        const items = res.data as ZkillItem[];
        for (const zk of items.slice(0, limitPerCorp)) {
          allItems.push({ corpId, side: side === "kills" ? "kill" : "loss", zk });
        }
      }
    }
  }

  if (allItems.length === 0) return { entries: [], fromCache: anyCache };

  // 2. Dédup (même killmail peut apparaître pour deux corps si elles ont fight ensemble)
  const dedup = new Map<number, typeof allItems[number]>();
  for (const it of allItems) {
    // On garde la première occurrence ; si un kill apparaît côté "kill" pour Tabou
    // ET côté "loss" pour UZ (très rare scénario), on garde "kill" (mieux que loss).
    const prev = dedup.get(it.zk.killmail_id);
    if (!prev || (prev.side === "loss" && it.side === "kill")) dedup.set(it.zk.killmail_id, it);
  }
  const uniqueItems = [...dedup.values()];

  // 3. Fetch ESI killmail détaillé (cache 24h, immuable).
  // ⚠️ Batches de 20 + 1 retry pour éviter timeouts / rate-limit en parallèle massif.
  const BATCH = 20;
  const enriched: Array<typeof uniqueItems[number] & { km: EsiKillmail | null }> = [];
  for (let i = 0; i < uniqueItems.length; i += BATCH) {
    const slice = uniqueItems.slice(i, i + BATCH);
    const batch = await Promise.all(
      slice.map(async (it) => {
        const url = `https://esi.evetech.net/latest/killmails/${it.zk.killmail_id}/${it.zk.zkb.hash}/`;
        let r = await esiFetch<EsiKillmail>(url, 86400);
        // Retry une fois si le fetch a échoué (timeout, 5xx transitoire).
        if (r.data == null) {
          await new Promise((res) => setTimeout(res, 200));
          r = await esiFetch<EsiKillmail>(url, 86400);
        }
        return { ...it, km: r.data };
      }),
    );
    enriched.push(...batch);
  }
  // Filtrage : on garde seulement les killmails qui se sont produits dans nos
  // régions cœur (Providence + Catch).
  const valid = enriched.filter(
    (e): e is typeof e & { km: EsiKillmail } =>
      e.km != null && CORE_SYSTEM_IDS.has(e.km.solar_system_id),
  );

  // Toutes les corps cibles (pour identifier les participants Tabou/UZ dans n'importe quel killmail)
  const targetCorps = new Set<number>(corpIds);

  // 4a. Identifier le pilote "principal" pour l'affichage chronologique (final blow Tabou/UZ ou victime).
  const pilotByKill = new Map<number, { characterId: number | null; shipTypeId: number | null }>();
  // 4a-bis. Identifier TOUS les pilotes Tabou/UZ impliqués pour l'agrégation par pilote.
  const participantsByKill = new Map<number, Array<{ characterId: number; shipTypeId: number | null; corpId: number }>>();

  for (const e of valid) {
    let pilotChar: number | null = null;
    let pilotShip: number | null = null;
    const participants: Array<{ characterId: number; shipTypeId: number | null; corpId: number }> = [];

    if (e.side === "loss") {
      pilotChar = e.km.victim.character_id ?? null;
      pilotShip = e.km.victim.ship_type_id;
      if (e.km.victim.character_id && e.km.victim.corporation_id && targetCorps.has(e.km.victim.corporation_id)) {
        participants.push({
          characterId: e.km.victim.character_id,
          shipTypeId: e.km.victim.ship_type_id,
          corpId: e.km.victim.corporation_id,
        });
      }
    } else {
      const ours = e.km.attackers.filter((a) => a.corporation_id && targetCorps.has(a.corporation_id));
      const final = ours.find((a) => a.final_blow) ?? ours[0];
      pilotChar = final?.character_id ?? null;
      pilotShip = final?.ship_type_id ?? null;
      // Tous les pilotes Tabou/UZ qui ont contribué au kill
      for (const a of ours) {
        if (a.character_id && a.corporation_id) {
          participants.push({
            characterId: a.character_id,
            shipTypeId: a.ship_type_id ?? null,
            corpId: a.corporation_id,
          });
        }
      }
    }
    pilotByKill.set(e.km.killmail_id, { characterId: pilotChar, shipTypeId: pilotShip });
    participantsByKill.set(e.km.killmail_id, participants);
  }

  // 4b. Collect IDs à résoudre (ships + alliances + tous les pilotes Tabou/UZ).
  const toResolve = new Set<number>();
  for (const e of valid) {
    toResolve.add(e.km.victim.ship_type_id);
    if (e.km.victim.alliance_id) toResolve.add(e.km.victim.alliance_id);
    const p = pilotByKill.get(e.km.killmail_id);
    if (p?.characterId) toResolve.add(p.characterId);
    if (p?.shipTypeId) toResolve.add(p.shipTypeId);
    const parts = participantsByKill.get(e.km.killmail_id) ?? [];
    for (const part of parts) {
      toResolve.add(part.characterId);
      if (part.shipTypeId) toResolve.add(part.shipTypeId);
    }
  }
  const names = await resolveNames([...toResolve]);

  // 5. Assemblage final
  const entries: CorpKillEntry[] = valid.map((e) => {
    const p = pilotByKill.get(e.km.killmail_id) ?? { characterId: null, shipTypeId: null };
    const parts = participantsByKill.get(e.km.killmail_id) ?? [];
    return {
      killId: e.km.killmail_id,
      killTime: e.km.killmail_time,
      side: e.side,
      involvedCorpId: e.corpId,
      pilot: {
        characterId: p.characterId,
        characterName: p.characterId ? names.get(p.characterId) ?? null : null,
        shipTypeId: p.shipTypeId,
      },
      participants: parts.map((part) => ({
        characterId: part.characterId,
        characterName: names.get(part.characterId) ?? null,
        shipTypeId: part.shipTypeId,
        corpId: part.corpId,
      })),
      ship: {
        typeId: e.km.victim.ship_type_id,
        name: names.get(e.km.victim.ship_type_id) ?? `Ship #${e.km.victim.ship_type_id}`,
      },
      victim: {
        allianceId: e.km.victim.alliance_id ?? null,
        allianceName: e.km.victim.alliance_id ? names.get(e.km.victim.alliance_id) ?? null : null,
        corporationId: e.km.victim.corporation_id ?? null,
      },
      solarSystemId: e.km.solar_system_id,
      totalValue: e.zk.zkb.totalValue,
      attackerCount: e.km.attackers.length,
      zkillUrl: `https://zkillboard.com/kill/${e.km.killmail_id}/`,
    };
  });

  // Tri chronologique desc
  entries.sort((a, b) => new Date(b.killTime).getTime() - new Date(a.killTime).getTime());

  return { entries, fromCache: anyCache };
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
    /* names décoratifs */
  }
  return map;
}
