/**
 * SDE Providence — données statiques projetées 2D depuis le SDE Fuzzwork.
 * Format compact (newEden-style) :
 *   systems : [[id, name, x, z, security, regionId], ...]
 *   jumps   : [[fromId, toId], ...]
 *   regions : [[id, name, x, z, factionId], ...]
 *   region  : { id, name }
 *
 * Régénérer : `node scripts/build-providence-map.mjs`
 */

import raw from "./providence.json";

interface RawData {
  region: { id: number; name: string };
  /** Régions cœur ("inRegion" = true). Providence + Catch — CVA tient les deux. */
  coreRegionIds?: number[];
  systems: Array<[number, string, number, number, number, number]>;
  jumps: Array<[number, number]>;
  regions: Array<[number, string, number, number, number]>;
  /** Positions pré-calculées par Dagre (npm run map:layout). Utilisées à la place des coordonnées astronomiques. */
  layoutPositions?: Record<string, { x: number; y: number }>;
}

const data = raw as unknown as RawData;
const PROVIDENCE_REGION_ID = data.region.id;
export const CORE_REGION_IDS = new Set<number>(data.coreRegionIds ?? [PROVIDENCE_REGION_ID]);

export interface SdeSystem {
  systemId: number;
  name: string;
  security: number;
  regionId: number;
  /** Coordonnées 2D projetées (échelle ~ ±50 unités, centrées sur Providence). */
  coords: { x: number; y: number };
  inRegion: boolean;
  regionName: string;
}

export interface SdeRegion {
  id: number;
  name: string;
  coords: { x: number; y: number };
  factionId: number;
}

const regionNameById = new Map(data.regions.map(([id, name]) => [id, name]));

const layoutPos = data.layoutPositions ?? {};

export const SDE_SYSTEMS: SdeSystem[] = data.systems.map(([id, name, x, z, sec, regionId]) => {
  const lp = layoutPos[String(id)];
  return {
    systemId: id,
    name,
    security: sec,
    regionId,
    coords: lp ? { x: lp.x, y: lp.y } : { x, y: z },
    inRegion: CORE_REGION_IDS.has(regionId),
    regionName: regionNameById.get(regionId) ?? "Unknown",
  };
});

export const SDE_REGIONS: SdeRegion[] = data.regions.map(([id, name, x, z, factionId]) => ({
  id, name, coords: { x, y: z }, factionId,
}));

export const SDE_JUMPS: Array<[number, number]> = data.jumps as Array<[number, number]>;

export const SDE_BY_ID = new Map<number, SdeSystem>(SDE_SYSTEMS.map((s) => [s.systemId, s]));
export const SDE_SYSTEM_IDS: number[] = SDE_SYSTEMS.map((s) => s.systemId);
export const SDE_IN_REGION_IDS: number[] = SDE_SYSTEMS.filter((s) => s.inRegion).map((s) => s.systemId);

export const SDE = {
  regionId: PROVIDENCE_REGION_ID,
  regionName: data.region.name,
  systems: SDE_SYSTEMS,
  regions: SDE_REGIONS,
} as const;

/** Gates uniques (paires non orientées). */
export function sdeGates(): Array<[number, number]> {
  return SDE_JUMPS;
}
