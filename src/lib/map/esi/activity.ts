/**
 * ESI /universe/system_kills/ et /universe/system_jumps/ — agrégés 1h.
 * Met à jour MapSystemActivity, avec moyenne mobile 24h.
 */

import { prisma } from "@/lib/db";
import { SDE_SYSTEM_IDS } from "@/lib/map/sde";
import { esiFetch } from "./cache";
import { recordAutoEvent } from "@/lib/map/events";

interface EsiKills { system_id: number; ship_kills: number; npc_kills: number; pod_kills: number }
interface EsiJumps { system_id: number; ship_jumps: number }

const URL_KILLS = "https://esi.evetech.net/latest/universe/system_kills/";
const URL_JUMPS = "https://esi.evetech.net/latest/universe/system_jumps/";

/** Lissage exponentiel — α=0.05 ≈ fenêtre 20 cycles (~10h à 30min). */
const ALPHA = 0.05;

export async function ingestSystemActivity(): Promise<{ ok: boolean; updated: number; spikes: number; error?: string }> {
  const [kills, jumps] = await Promise.all([
    esiFetch<EsiKills[]>(URL_KILLS, 3600),
    esiFetch<EsiJumps[]>(URL_JUMPS, 3600),
  ]);

  if (!kills.data || !jumps.data) {
    return {
      ok: false,
      updated: 0,
      spikes: 0,
      ...(kills.error !== undefined || jumps.error !== undefined
        ? { error: kills.error ?? jumps.error ?? "missing data" }
        : {}),
    };
  }

  const interesting = new Set(SDE_SYSTEM_IDS);
  const killsBy = new Map(kills.data.filter((k) => interesting.has(k.system_id)).map((k) => [k.system_id, k]));
  const jumpsBy = new Map(jumps.data.filter((j) => interesting.has(j.system_id)).map((j) => [j.system_id, j]));

  const existing = await prisma.mapSystemActivity.findMany({
    where: { systemId: { in: [...interesting] } },
  });
  const byId = new Map(existing.map((a) => [a.systemId, a]));

  let updated = 0;
  let spikes = 0;
  const now = new Date();

  for (const systemId of interesting) {
    const k = killsBy.get(systemId);
    const j = jumpsBy.get(systemId);
    const shipKills = k?.ship_kills ?? 0;
    const npcKills = k?.npc_kills ?? 0;
    const podKills = k?.pod_kills ?? 0;
    const shipJumps = j?.ship_jumps ?? 0;

    const prev = byId.get(systemId);
    const newAvgKills = prev ? prev.shipKillsAvg24h * (1 - ALPHA) + shipKills * ALPHA : shipKills;
    const newAvgJumps = prev ? prev.shipJumpsAvg24h * (1 - ALPHA) + shipJumps * ALPHA : shipJumps;

    // Spike : > 3× la moyenne ET > 5 kills absolus.
    if (prev && shipKills >= 5 && prev.shipKillsAvg24h > 0 && shipKills > prev.shipKillsAvg24h * 3) {
      spikes += 1;
      await recordAutoEvent({
        kind: "activity_spike",
        systemId,
        severity: "warn",
        title: `Pic d'activité (${shipKills} kills/h)`,
        meta: { shipKills, baseline: prev.shipKillsAvg24h },
        occurredAt: now,
      });
    }

    await prisma.mapSystemActivity.upsert({
      where: { systemId },
      create: {
        systemId,
        shipKills,
        npcKills,
        podKills,
        shipJumps,
        shipKillsAvg24h: newAvgKills,
        shipJumpsAvg24h: newAvgJumps,
      },
      update: {
        shipKills,
        npcKills,
        podKills,
        shipJumps,
        shipKillsAvg24h: newAvgKills,
        shipJumpsAvg24h: newAvgJumps,
      },
    });
    updated += 1;
  }

  return { ok: true, updated, spikes };
}
