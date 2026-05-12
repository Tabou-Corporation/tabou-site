/**
 * Agrégateur — assemble pour chaque système l'état affichable :
 *  - layout (SDE)
 *  - sov (alliance/corp)
 *  - activity (kills/jumps)
 *  - structures (count, reinforced, vulnerable)
 *  - campaigns (active)
 *  - score de tension calculé
 *  - âge du snapshot le plus ancien (pour SourceHealth)
 */

import { prisma } from "@/lib/db";
import { SDE, type SdeSystem } from "@/lib/map/sde";
import { computeTension, levelForScore, type TensionBreakdown, type TensionLevel } from "@/lib/map/tension";

export interface MapSystemState {
  system: SdeSystem;
  sov: { allianceId: number | null; corporationId: number | null; factionId: number | null } | null;
  activity: {
    shipKills: number;
    npcKills: number;
    podKills: number;
    shipJumps: number;
    shipKillsAvg24h: number;
    shipJumpsAvg24h: number;
  } | null;
  structures: { total: number; reinforced: number; vulnerable: number };
  activeCampaigns: number;
  recentSovChange: boolean;
  tension: TensionBreakdown;
  level: TensionLevel;
  /** ISO du snapshot le plus ancien parmi sov/activity/structures/campaigns pour ce système. */
  oldestSnapshotAt: string | null;
}

export interface MapState {
  systems: MapSystemState[];
  generatedAt: string;
  health: {
    oldestExpiresAt: string | null;
    newestFetchedAt: string | null;
    sources: Record<string, { fetchedAt: string | null; expiresAt: string | null; lastStatus: number | null }>;
  };
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function getMapState(): Promise<MapState> {
  const systemIds = SDE.systems.map((s) => s.systemId);

  const [sovRows, activityRows, structureRows, campaignRows, recentSovEvents, cacheRows] = await Promise.all([
    prisma.mapSovSnapshot.findMany({ where: { systemId: { in: systemIds } } }),
    prisma.mapSystemActivity.findMany({ where: { systemId: { in: systemIds } } }),
    prisma.mapStructureSnapshot.findMany({ where: { systemId: { in: systemIds } } }),
    prisma.mapCampaignSnapshot.findMany({ where: { systemId: { in: systemIds } } }),
    prisma.mapEvent.findMany({
      where: {
        kind: "sov_change",
        systemId: { in: systemIds },
        occurredAt: { gte: new Date(Date.now() - SEVEN_DAYS_MS) },
      },
      select: { systemId: true },
    }),
    prisma.mapEsiCache.findMany(),
  ]);

  const sovBy = new Map(sovRows.map((s) => [s.systemId, s]));
  const actBy = new Map(activityRows.map((a) => [a.systemId, a]));
  const structsBy = new Map<number, typeof structureRows>();
  for (const s of structureRows) {
    const arr = structsBy.get(s.systemId) ?? [];
    arr.push(s);
    structsBy.set(s.systemId, arr);
  }
  const campaignsBy = new Map<number, number>();
  for (const c of campaignRows) {
    campaignsBy.set(c.systemId, (campaignsBy.get(c.systemId) ?? 0) + 1);
  }
  const recentChanges = new Set(recentSovEvents.map((e) => e.systemId).filter((id): id is number => id != null));

  const now = Date.now();
  const systems: MapSystemState[] = SDE.systems.map((sde) => {
    const sov = sovBy.get(sde.systemId) ?? null;
    const act = actBy.get(sde.systemId) ?? null;
    const structs = structsBy.get(sde.systemId) ?? [];
    const total = structs.length;
    // "Truly reinforced" : vulnerable_start_time est > 20h dans le futur. La
    // fenêtre de vulnérabilité QUOTIDIENNE d'une structure sov ne s'affiche
    // jamais à plus de ~23h ; un reinforce timer la pousse de 24-48h
    // supplémentaires. Cette heuristique élimine ~95% des faux positifs
    // (fenêtre quotidienne de demain comptée comme attaque).
    const REINFORCE_MIN_AHEAD_MS = 20 * 3600 * 1000;
    const nowMs = Date.now();
    let reinforced = 0;
    let vulnerable = 0; // informatif uniquement : "actuellement dans fenêtre"
    for (const s of structs) {
      if (!s.vulnerableStartUtc) continue;
      const aheadMs = s.vulnerableStartUtc.getTime() - nowMs;
      if (aheadMs > REINFORCE_MIN_AHEAD_MS) {
        reinforced += 1;
      } else if (s.vulnerableEndUtc && aheadMs <= 0 && s.vulnerableEndUtc.getTime() > nowMs) {
        vulnerable += 1;
      }
    }
    const activeCampaigns = campaignsBy.get(sde.systemId) ?? 0;
    const recentSovChange = recentChanges.has(sde.systemId);

    const ages: number[] = [];
    if (sov) ages.push((now - sov.updatedAt.getTime()) / 60_000);
    if (act) ages.push((now - act.updatedAt.getTime()) / 60_000);
    for (const s of structs) ages.push((now - s.updatedAt.getTime()) / 60_000);
    const oldestAgeMin = ages.length > 0 ? Math.max(...ages) : null;

    const tension = computeTension({
      shipKills1h: act?.shipKills ?? null,
      shipKillsAvg24h: act?.shipKillsAvg24h ?? null,
      npcKills1h: act?.npcKills ?? null,
      shipJumps1h: act?.shipJumps ?? null,
      shipJumpsAvg24h: act?.shipJumpsAvg24h ?? null,
      activeCampaigns,
      // Seul `reinforced` (true reinforce timer >20h ahead) compte pour le score.
      // `vulnerable` (= actuellement dans fenêtre quotidienne) est l'état normal
      // d'une structure sov, pas un signe d'attaque.
      reinforcedStructures: reinforced,
      totalStructures: total,
      recentSovChange,
      oldestSnapshotAgeMin: oldestAgeMin,
    });

    const oldestDate = ages.length > 0
      ? new Date(now - Math.max(...ages) * 60_000).toISOString()
      : null;

    return {
      system: sde,
      sov: sov
        ? { allianceId: sov.allianceId, corporationId: sov.corporationId, factionId: sov.factionId }
        : null,
      activity: act
        ? {
            shipKills: act.shipKills,
            npcKills: act.npcKills,
            podKills: act.podKills,
            shipJumps: act.shipJumps,
            shipKillsAvg24h: act.shipKillsAvg24h,
            shipJumpsAvg24h: act.shipJumpsAvg24h,
          }
        : null,
      structures: { total, reinforced, vulnerable },
      activeCampaigns,
      recentSovChange,
      tension,
      level: levelForScore(tension.score),
      oldestSnapshotAt: oldestDate,
    };
  });

  // Health par source ESI — agrège les URLs paramétrées (/killmails/{id}/{hash}/,
  // /kills/systemID/{id}/pastSeconds/{n}/) sous une seule entrée par "type" de
  // source pour éviter de noyer la SourceHealth UI avec une ligne par killmail.
  const sources: MapState["health"]["sources"] = {};
  function sourceLabel(url: string): string {
    if (url.includes("zkillboard.com/api/kills")) return "zkill/kills";
    if (url.includes("zkillboard.com/api/stats")) return "zkill/stats";
    if (url.includes("/killmails/")) return "esi/killmails";
    return url.split("/").slice(-3, -1).join("/");
  }
  function tally(label: string, c: typeof cacheRows[number]) {
    const prev = sources[label];
    // On garde l'entrée la plus récente (fetchedAt max).
    if (!prev || new Date(prev.fetchedAt!) < c.fetchedAt) {
      sources[label] = {
        fetchedAt: c.fetchedAt.toISOString(),
        expiresAt: c.expiresAt.toISOString(),
        lastStatus: c.lastStatus,
      };
    }
  }
  for (const c of cacheRows) {
    tally(sourceLabel(c.url), c);
  }

  const oldestExpires = cacheRows.length > 0
    ? cacheRows.reduce((a, b) => (a.expiresAt < b.expiresAt ? a : b)).expiresAt
    : null;
  const newestFetched = cacheRows.length > 0
    ? cacheRows.reduce((a, b) => (a.fetchedAt > b.fetchedAt ? a : b)).fetchedAt
    : null;

  return {
    systems,
    generatedAt: new Date().toISOString(),
    health: {
      oldestExpiresAt: oldestExpires?.toISOString() ?? null,
      newestFetchedAt: newestFetched?.toISOString() ?? null,
      sources,
    },
  };
}
