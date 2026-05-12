/**
 * ESI /sovereignty/structures/ — TCU et IHUB sov.
 * Expires ~30min. Tableau de structures avec fenêtre de vulnérabilité.
 */

import { prisma } from "@/lib/db";
import { SDE_SYSTEM_IDS } from "@/lib/map/sde";
import { esiFetch } from "./cache";
import { recordAutoEvent } from "@/lib/map/events";

interface EsiStructure {
  structure_id: number;
  solar_system_id: number;
  alliance_id?: number;
  structure_type_id: number;
  vulnerable_start_time?: string;
  vulnerable_end_time?: string;
  vulnerability_occupancy_level?: number;
}

const URL = "https://esi.evetech.net/latest/sovereignty/structures/";

export async function ingestSovStructures(): Promise<{ ok: boolean; updated: number; error?: string }> {
  const result = await esiFetch<EsiStructure[]>(URL, 1800);
  if (!result.data) {
    return { ok: false, updated: 0, ...(result.error !== undefined ? { error: result.error } : {}) };
  }

  const interesting = new Set(SDE_SYSTEM_IDS);
  const filtered = result.data.filter((s) => interesting.has(s.solar_system_id));

  const existing = await prisma.mapStructureSnapshot.findMany({
    where: { systemId: { in: [...interesting] } },
  });
  const byId = new Map(existing.map((s) => [s.structureId, s]));
  const seen = new Set<bigint>();

  let updated = 0;
  const now = new Date();

  for (const s of filtered) {
    const id = BigInt(s.structure_id);
    seen.add(id);
    const prev = byId.get(id);

    const vulnStart = s.vulnerable_start_time ? new Date(s.vulnerable_start_time) : null;
    const vulnEnd = s.vulnerable_end_time ? new Date(s.vulnerable_end_time) : null;

    // Détection FIABLE d'un reinforce : `vulnerable_start_time` saute de >25h
    // par rapport au snapshot précédent. La fenêtre de vulnérabilité quotidienne
    // d'une structure avance d'~23h par jour ; un reinforce timer la pousse de
    // +24h à +48h supplémentaires d'un coup. Sans `prev` on ne peut pas trancher
    // → on ne génère pas d'event au premier seed.
    const REINFORCE_JUMP_MS = 25 * 3600 * 1000;
    if (prev?.vulnerableStartUtc && vulnStart) {
      const deltaMs = vulnStart.getTime() - prev.vulnerableStartUtc.getTime();
      if (deltaMs > REINFORCE_JUMP_MS) {
        await recordAutoEvent({
          kind: "structure_reinforced",
          systemId: s.solar_system_id,
          severity: "alert",
          title: `Structure reinforced`,
          meta: {
            structureId: s.structure_id,
            typeId: s.structure_type_id,
            vulnerableStart: vulnStart.toISOString(),
            previousVulnerableStart: prev.vulnerableStartUtc.toISOString(),
            deltaHours: Math.round(deltaMs / 3600000),
          },
          occurredAt: now,
        });
      }
    }

    // L'event `structure_vulnerable` était généré à chaque fenêtre quotidienne →
    // 1 event/structure/jour de pur bruit. On le supprime : être dans sa fenêtre
    // quotidienne est l'état NORMAL d'une structure sov, pas un événement.
    // Seul `structure_reinforced` (vraie attaque) reste alertant.

    await prisma.mapStructureSnapshot.upsert({
      where: { structureId: id },
      create: {
        structureId: id,
        systemId: s.solar_system_id,
        allianceId: s.alliance_id ?? null,
        structureTypeId: s.structure_type_id,
        vulnerableStartUtc: vulnStart,
        vulnerableEndUtc: vulnEnd,
        vulnerabilityOccupancyLevel: s.vulnerability_occupancy_level ?? null,
      },
      update: {
        systemId: s.solar_system_id,
        allianceId: s.alliance_id ?? null,
        structureTypeId: s.structure_type_id,
        vulnerableStartUtc: vulnStart,
        vulnerableEndUtc: vulnEnd,
        vulnerabilityOccupancyLevel: s.vulnerability_occupancy_level ?? null,
      },
    });
    updated += 1;
  }

  // Cleanup : structures disparues de l'ESI (détruites).
  const stale = existing.filter((s) => !seen.has(s.structureId));
  if (stale.length > 0) {
    await prisma.mapStructureSnapshot.deleteMany({
      where: { structureId: { in: stale.map((s) => s.structureId) } },
    });
  }

  return { ok: true, updated };
}
