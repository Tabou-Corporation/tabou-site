/**
 * zKillboard — stats all-time pour une ou plusieurs corporations.
 *
 * Endpoint zKill :
 *   /api/stats/corporationID/{id}/  → stats complètes
 *
 * Données exposées par cette lib (fusionnées entre N corps) :
 *   - entries        : classement pilotes par kills (topAllTime.character)
 *   - totals         : par corp (ships destroyed/lost, ISK destroyed/lost)
 *   - biggestKill    : le killmail le plus cher all-time (topIskKills #0)
 *   - heatmap        : 24×7 activité PvP (matrice + agrégat horaire)
 *   - shipClasses    : distribution kills/ISK par classe de vaisseau (groups)
 *   - topShips       : top vaisseaux les plus joués (topAllTime.ship)
 *   - soloStats      : kills/ISK solo, ratios, taille moyenne de gang
 */

import { esiFetch } from "@/lib/map/esi/cache";

const ZK_USER_AGENT =
  process.env.ESI_USER_AGENT ?? "Tabou-ProvidencePulse/1.0 (+https://tabou.fr/map)";

/* ────────────────── Types raw zKill ────────────────── */

interface ZkillStatsRaw {
  topAllTime?: Array<{ type: string; data: Array<{ characterID?: number; kills?: number; shipTypeID?: number }> }>;
  topIskKills?: number[];
  shipsDestroyed?: number;
  shipsLost?: number;
  iskDestroyed?: number;
  iskLost?: number;
  soloKills?: number;
  soloLosses?: number;
  shipsDestroyedSolo?: number;
  iskDestroyedSolo?: number;
  soloRatio?: number;
  dangerRatio?: number;
  gangRatio?: number;
  avgGangSize?: number;
  activity?: { max?: number } & Record<string, Record<string, number> | number>;
  groups?: Record<string, {
    groupID: number;
    shipsLost?: number;
    shipsDestroyed?: number;
    iskLost?: number;
    iskDestroyed?: number;
  }>;
}

interface ZkillKillDetail {
  killmail_id?: number;
  zkb?: {
    hash?: string;
    totalValue?: number;
    points?: number;
  };
}

interface EsiKillmail {
  killmail_id: number;
  killmail_time: string;
  solar_system_id: number;
  victim: {
    character_id?: number;
    corporation_id?: number;
    alliance_id?: number;
    ship_type_id: number;
  };
  attackers: Array<{
    character_id?: number;
    ship_type_id?: number;
    final_blow: boolean;
    corporation_id?: number;
    alliance_id?: number;
  }>;
}

/* ────────────────── Types exposés ────────────────── */

export interface HallOfFameEntry {
  characterId: number;
  characterName: string | null;
  kills: number;
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

export interface BiggestKill {
  killId: number;
  totalValue: number;
  killTime: string;
  solarSystemId: number;
  victimShipTypeId: number;
  victimShipName: string | null;
  victimCharacterId: number | null;
  victimCharacterName: string | null;
  victimCorpId: number | null;
  finalBlowCharacterId: number | null;
  finalBlowCharacterName: string | null;
  finalBlowCorpId: number | null;
  zkillUrl: string;
}

export interface HeatmapData {
  /** Matrice 7 jours × 24h (jour 0 = lundi UTC chez zKill). */
  matrix: number[][];
  /** Agrégat par heure (24 valeurs) — somme sur tous les jours. */
  byHour: number[];
  /** Pic max (toutes cellules confondues). */
  max: number;
  /** Heure de pic et nombre de kills à cette heure. */
  peakHour: { hour: number; count: number };
}

export interface ShipClassRow {
  /** Catégorie large (Frégate / Croiseur / Battleship / Capital / ...). */
  category: string;
  shipsDestroyed: number;
  shipsLost: number;
  iskDestroyed: number;
}

export interface TopShipEntry {
  shipTypeId: number;
  shipName: string | null;
  kills: number;
}

export interface SoloStats {
  soloKills: number;
  iskDestroyedSolo: number;
  soloRatio: number;
  dangerRatio: number;
  avgGangSize: number;
}

export interface HallOfFamePayload {
  entries: HallOfFameEntry[];
  totals: HallOfFameCorpTotal[];
  biggestKill: BiggestKill | null;
  heatmap: HeatmapData;
  shipClasses: ShipClassRow[];
  topShips: TopShipEntry[];
  soloStats: SoloStats;
  fromCache: boolean;
}

/* ────────────────── Mapping invGroupID → catégorie ────────────────── */
// Catégories larges pour lisibilité. Les groupes non listés tombent dans "Autres".
const SHIP_CATEGORY: Record<number, string> = {
  // Frégates et dérivées
  25: "Frégates", 237: "Frégates", 324: "Frégates", 830: "Frégates",
  831: "Frégates", 834: "Frégates", 893: "Frégates",
  // Destroyers
  420: "Destroyers", 541: "Destroyers", 1305: "Destroyers",
  // Croiseurs et dérivées (HACs, Logi, Recons, T3C, HIC, EAS)
  26: "Croiseurs", 358: "Croiseurs", 832: "Croiseurs", 833: "Croiseurs",
  894: "Croiseurs", 906: "Croiseurs", 963: "Croiseurs",
  // Battlecruisers
  419: "Battlecruisers", 540: "Battlecruisers", 1201: "Battlecruisers",
  // Battleships + Marauders + Black Ops
  27: "Battleships", 900: "Battleships", 898: "Battleships",
  // Capitaux (Dread, Carrier, FAX, Super, Titan)
  485: "Capitaux", 547: "Capitaux", 659: "Capitaux", 30: "Capitaux",
  1538: "Capitaux",
  // Capsule
  29: "Capsules",
  // Industriels / freighters / mining
  28: "Industriels", 463: "Industriels", 513: "Industriels", 543: "Industriels",
  902: "Industriels", 941: "Industriels", 1202: "Industriels", 1283: "Industriels",
  // Structures (citadels, IHUB...)
  1657: "Structures", 1404: "Structures", 1406: "Structures", 1408: "Structures",
  1972: "Structures", 2016: "Structures", 365: "Structures",
};

/* ────────────────── Fetch principal ────────────────── */

export async function getHallOfFame(
  corpIds: number[],
  limit = 50,
): Promise<HallOfFamePayload> {
  let anyCache = false;
  const totals: HallOfFameCorpTotal[] = [];
  const byPilot = new Map<number, { kills: number; corpIds: Set<number> }>();

  // Agrégats globaux pour les sections additionnelles
  let bestKillId = 0;
  let bestKillValueHint = 0; // hint provisoire (pas garanti par stats raw)
  const heatAcc: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  const shipCatAcc = new Map<string, ShipClassRow>();
  const shipKills = new Map<number, number>();
  let soloKills = 0;
  let soloLossesAgg = 0;
  let iskDestroyedSolo = 0;
  let shipsDestroyedTotal = 0;
  let gangSizeWeightedSum = 0;
  let gangSizeWeight = 0;
  let topIskKillIds: number[] = [];

  for (const corpId of corpIds) {
    const url = `https://zkillboard.com/api/stats/corporationID/${corpId}/`;
    const res = await esiFetch<ZkillStatsRaw>(url, 6 * 3600);
    if (res.fromCache) anyCache = true;
    const stats = res.data;
    if (!stats) continue;

    // 1. Classement pilotes
    const chars =
      stats.topAllTime?.find((t) => t.type === "character")?.data ?? [];
    for (const c of chars) {
      if (!c.characterID || typeof c.kills !== "number") continue;
      const prev = byPilot.get(c.characterID) ?? { kills: 0, corpIds: new Set<number>() };
      prev.kills += c.kills;
      prev.corpIds.add(corpId);
      byPilot.set(c.characterID, prev);
    }

    // 2. Top ships joués
    const ships = stats.topAllTime?.find((t) => t.type === "ship")?.data ?? [];
    for (const s of ships) {
      if (!s.shipTypeID || typeof s.kills !== "number") continue;
      shipKills.set(s.shipTypeID, (shipKills.get(s.shipTypeID) ?? 0) + s.kills);
    }

    // 3. Totaux corp
    totals.push({
      corpId,
      shipsDestroyed: stats.shipsDestroyed ?? 0,
      shipsLost: stats.shipsLost ?? 0,
      iskDestroyed: stats.iskDestroyed ?? 0,
      iskLost: stats.iskLost ?? 0,
      pilotCount: chars.length,
    });
    shipsDestroyedTotal += stats.shipsDestroyed ?? 0;

    // 4. Heatmap activité — somme cellule par cellule
    if (stats.activity) {
      for (let d = 0; d < 7; d++) {
        const day = stats.activity[String(d)];
        if (typeof day !== "object" || day === null) continue;
        for (let h = 0; h < 24; h++) {
          const v = day[String(h)];
          if (typeof v === "number") heatAcc[d]![h] = (heatAcc[d]![h] ?? 0) + v;
        }
      }
    }

    // 5. Ship classes (groups)
    if (stats.groups) {
      for (const g of Object.values(stats.groups)) {
        const cat = SHIP_CATEGORY[g.groupID] ?? "Autres";
        const prev = shipCatAcc.get(cat) ?? {
          category: cat, shipsDestroyed: 0, shipsLost: 0, iskDestroyed: 0,
        };
        prev.shipsDestroyed += g.shipsDestroyed ?? 0;
        prev.shipsLost += g.shipsLost ?? 0;
        prev.iskDestroyed += g.iskDestroyed ?? 0;
        shipCatAcc.set(cat, prev);
      }
    }

    // 6. Solo stats
    soloKills += stats.soloKills ?? 0;
    soloLossesAgg += stats.soloLosses ?? 0;
    iskDestroyedSolo += stats.iskDestroyedSolo ?? 0;
    // Gang size : moyenne pondérée par les kills de la corp
    if (typeof stats.avgGangSize === "number" && (stats.shipsDestroyed ?? 0) > 0) {
      gangSizeWeightedSum += stats.avgGangSize * (stats.shipsDestroyed ?? 0);
      gangSizeWeight += stats.shipsDestroyed ?? 0;
    }

    // 7. Top kills (cher) — on collecte tous les IDs et on prendra le premier
    if (Array.isArray(stats.topIskKills)) {
      topIskKillIds = topIskKillIds.concat(stats.topIskKills);
    }
  }

  // ─── Classement pilotes (tri + limite + résolution noms) ───
  const ranked = [...byPilot.entries()]
    .map(([id, v]) => ({ characterId: id, kills: v.kills, corpIds: [...v.corpIds] }))
    .sort((a, b) => b.kills - a.kills)
    .slice(0, limit);

  // ─── Biggest kill : enrichit le premier de topIskKills via ESI killmail ───
  let biggestKill: BiggestKill | null = null;
  // On choisit le killID le plus "récent" dans topIskKills (ID croissant = plus récent dans EVE)
  // mais ce qui compte c'est la valeur. zKill ordonne déjà topIskKills par totalValue desc.
  if (topIskKillIds.length > 0) {
    // On essaie en séquence jusqu'à en trouver un dont l'ESI répond
    for (const kid of topIskKillIds.slice(0, 5)) {
      const detail = await fetchKillmailDetail(kid);
      if (detail) {
        biggestKill = detail;
        bestKillId = detail.killId;
        bestKillValueHint = detail.totalValue;
        break;
      }
    }
  }
  void bestKillId;
  void bestKillValueHint;

  // ─── Heatmap byHour + peak ───
  const byHour = Array.from({ length: 24 }, () => 0);
  let max = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = heatAcc[d]![h] ?? 0;
      byHour[h] = (byHour[h] ?? 0) + v;
      if (v > max) max = v;
    }
  }
  let peakHour = { hour: 0, count: 0 };
  for (let h = 0; h < 24; h++) {
    if ((byHour[h] ?? 0) > peakHour.count) peakHour = { hour: h, count: byHour[h] ?? 0 };
  }

  // ─── Ship classes (tri par kills desc) ───
  const orderedCategories = ["Frégates", "Destroyers", "Croiseurs", "Battlecruisers", "Battleships", "Capitaux", "Industriels", "Capsules", "Structures", "Autres"];
  const shipClasses = [...shipCatAcc.values()].sort((a, b) => {
    // Tri par ordre canonique, puis kills desc
    const ia = orderedCategories.indexOf(a.category);
    const ib = orderedCategories.indexOf(b.category);
    if (ia !== ib) return ia - ib;
    return b.shipsDestroyed - a.shipsDestroyed;
  });

  // ─── Top ships (résolution noms ESI) ───
  const topShipIds = [...shipKills.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([id]) => id);

  // ─── Résolution noms ESI pour pilotes + ships ───
  const toResolve = new Set<number>();
  ranked.forEach((r) => toResolve.add(r.characterId));
  topShipIds.forEach((id) => toResolve.add(id));
  if (biggestKill?.victimShipTypeId) toResolve.add(biggestKill.victimShipTypeId);
  if (biggestKill?.victimCharacterId) toResolve.add(biggestKill.victimCharacterId);
  if (biggestKill?.finalBlowCharacterId) toResolve.add(biggestKill.finalBlowCharacterId);

  const names = await resolveNames([...toResolve]);

  const entries: HallOfFameEntry[] = ranked.map((r) => ({
    characterId: r.characterId,
    characterName: names.get(r.characterId) ?? null,
    kills: r.kills,
    corpIds: r.corpIds,
  }));

  const topShips: TopShipEntry[] = topShipIds.map((id) => ({
    shipTypeId: id,
    shipName: names.get(id) ?? null,
    kills: shipKills.get(id) ?? 0,
  }));

  if (biggestKill) {
    biggestKill.victimShipName = names.get(biggestKill.victimShipTypeId) ?? null;
    if (biggestKill.victimCharacterId) {
      biggestKill.victimCharacterName = names.get(biggestKill.victimCharacterId) ?? null;
    }
    if (biggestKill.finalBlowCharacterId) {
      biggestKill.finalBlowCharacterName = names.get(biggestKill.finalBlowCharacterId) ?? null;
    }
  }

  const avgGangSize = gangSizeWeight > 0 ? gangSizeWeightedSum / gangSizeWeight : 0;
  const soloRatio = shipsDestroyedTotal > 0 ? (soloKills / shipsDestroyedTotal) * 100 : 0;
  const dangerRatio = (soloKills + soloLossesAgg) > 0
    ? (soloKills / (soloKills + soloLossesAgg)) * 100
    : 0;

  return {
    entries,
    totals,
    biggestKill,
    heatmap: { matrix: heatAcc, byHour, max, peakHour },
    shipClasses,
    topShips,
    soloStats: {
      soloKills,
      iskDestroyedSolo,
      soloRatio,
      dangerRatio,
      avgGangSize,
    },
    fromCache: anyCache,
  };
}

/* ────────────────── Helpers ────────────────── */

async function fetchKillmailDetail(killId: number): Promise<BiggestKill | null> {
  // 1. zKill detail pour récupérer le hash + totalValue
  const zkUrl = `https://zkillboard.com/api/killID/${killId}/`;
  const zk = await esiFetch<ZkillKillDetail[]>(zkUrl, 86400);
  const first = Array.isArray(zk.data) ? zk.data[0] : null;
  if (!first || !first.zkb?.hash) return null;

  // 2. ESI killmail pour les détails (vaisseau, système, attackers)
  const esiUrl = `https://esi.evetech.net/latest/killmails/${killId}/${first.zkb.hash}/`;
  const esi = await esiFetch<EsiKillmail>(esiUrl, 86400);
  if (!esi.data) return null;

  const km = esi.data;
  const finalBlow = km.attackers.find((a) => a.final_blow) ?? km.attackers[0] ?? null;

  return {
    killId,
    totalValue: first.zkb.totalValue ?? 0,
    killTime: km.killmail_time,
    solarSystemId: km.solar_system_id,
    victimShipTypeId: km.victim.ship_type_id,
    victimShipName: null, // résolu plus tard
    victimCharacterId: km.victim.character_id ?? null,
    victimCharacterName: null,
    victimCorpId: km.victim.corporation_id ?? null,
    finalBlowCharacterId: finalBlow?.character_id ?? null,
    finalBlowCharacterName: null,
    finalBlowCorpId: finalBlow?.corporation_id ?? null,
    zkillUrl: `https://zkillboard.com/kill/${killId}/`,
  };
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
