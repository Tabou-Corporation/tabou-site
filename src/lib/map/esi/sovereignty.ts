/**
 * ESI /sovereignty/map/ — souveraineté par système.
 * Expires ~1h. Renvoie un tableau de { system_id, alliance_id, corporation_id, faction_id }.
 */

import { prisma } from "@/lib/db";
import { SDE_SYSTEM_IDS } from "@/lib/map/sde";
import { esiFetch } from "./cache";
import { recordAutoEvent } from "@/lib/map/events";

interface EsiSovEntry {
  system_id: number;
  alliance_id?: number;
  corporation_id?: number;
  faction_id?: number;
}

const URL = "https://esi.evetech.net/latest/sovereignty/map/";

export async function ingestSovMap(): Promise<{ ok: boolean; updated: number; changes: number; error?: string }> {
  const result = await esiFetch<EsiSovEntry[]>(URL, 3600);
  if (!result.data) {
    return { ok: false, updated: 0, changes: 0, ...(result.error !== undefined ? { error: result.error } : {}) };
  }

  // On ne garde que les systèmes Providence + adjacents.
  const interesting = new Set(SDE_SYSTEM_IDS);
  const filtered = result.data.filter((e) => interesting.has(e.system_id));

  // Lire l'état actuel pour détecter les changements.
  const existing = await prisma.mapSovSnapshot.findMany({
    where: { systemId: { in: [...interesting] } },
  });
  const byId = new Map(existing.map((s) => [s.systemId, s]));

  let updated = 0;
  let changes = 0;

  for (const entry of filtered) {
    const prev = byId.get(entry.system_id);
    const prevAlliance = prev?.allianceId ?? null;
    const newAlliance = entry.alliance_id ?? null;

    if (prev && prevAlliance !== newAlliance) {
      changes += 1;
      await recordAutoEvent({
        kind: "sov_change",
        systemId: entry.system_id,
        severity: "warn",
        title: `Changement de souveraineté`,
        meta: { fromAllianceId: prevAlliance, toAllianceId: newAlliance },
        occurredAt: new Date(),
      });
    }

    await prisma.mapSovSnapshot.upsert({
      where: { systemId: entry.system_id },
      create: {
        systemId: entry.system_id,
        allianceId: entry.alliance_id ?? null,
        corporationId: entry.corporation_id ?? null,
        factionId: entry.faction_id ?? null,
      },
      update: {
        allianceId: entry.alliance_id ?? null,
        corporationId: entry.corporation_id ?? null,
        factionId: entry.faction_id ?? null,
      },
    });
    updated += 1;
  }

  return { ok: true, updated, changes };
}
