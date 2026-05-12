/**
 * ESI /sovereignty/campaigns/ — campagnes de souveraineté actives.
 * Expires ~5min.
 */

import { prisma } from "@/lib/db";
import { SDE_SYSTEM_IDS } from "@/lib/map/sde";
import { esiFetch } from "./cache";
import { recordAutoEvent } from "@/lib/map/events";

interface EsiCampaign {
  campaign_id: number;
  solar_system_id: number;
  event_type: string;
  start_time: string;
  defender_id?: number;
  attackers_score?: number;
  defender_score?: number;
}

const URL = "https://esi.evetech.net/latest/sovereignty/campaigns/";

export async function ingestSovCampaigns(): Promise<{ ok: boolean; updated: number; ended: number; error?: string }> {
  const result = await esiFetch<EsiCampaign[]>(URL, 300);
  if (!result.data) {
    return { ok: false, updated: 0, ended: 0, ...(result.error !== undefined ? { error: result.error } : {}) };
  }

  const interesting = new Set(SDE_SYSTEM_IDS);
  const filtered = result.data.filter((c) => interesting.has(c.solar_system_id));

  const existing = await prisma.mapCampaignSnapshot.findMany();
  const existingIds = new Set(existing.map((c) => c.campaignId));
  const seen = new Set<number>();

  let updated = 0;
  const now = new Date();

  for (const c of filtered) {
    seen.add(c.campaign_id);

    if (!existingIds.has(c.campaign_id)) {
      await recordAutoEvent({
        kind: "campaign_started",
        systemId: c.solar_system_id,
        severity: "alert",
        title: `Campagne ${c.event_type === "ihub_defense" ? "IHUB" : "TCU"} engagée`,
        meta: { campaignId: c.campaign_id, defenderId: c.defender_id },
        occurredAt: now,
      });
    }

    await prisma.mapCampaignSnapshot.upsert({
      where: { campaignId: c.campaign_id },
      create: {
        campaignId: c.campaign_id,
        systemId: c.solar_system_id,
        eventType: c.event_type,
        startTime: new Date(c.start_time),
        defenderId: c.defender_id ?? null,
        attackersScore: c.attackers_score ?? null,
        defenderScore: c.defender_score ?? null,
      },
      update: {
        systemId: c.solar_system_id,
        eventType: c.event_type,
        startTime: new Date(c.start_time),
        defenderId: c.defender_id ?? null,
        attackersScore: c.attackers_score ?? null,
        defenderScore: c.defender_score ?? null,
      },
    });
    updated += 1;
  }

  // Campagnes disparues = terminées.
  const ended = existing.filter((c) => !seen.has(c.campaignId));
  for (const c of ended) {
    await recordAutoEvent({
      kind: "campaign_ended",
      systemId: c.systemId,
      severity: "info",
      title: `Campagne ${c.eventType === "ihub_defense" ? "IHUB" : "TCU"} terminée`,
      meta: { campaignId: c.campaignId },
      occurredAt: now,
    });
  }
  if (ended.length > 0) {
    await prisma.mapCampaignSnapshot.deleteMany({
      where: { campaignId: { in: ended.map((c) => c.campaignId) } },
    });
  }

  return { ok: true, updated, ended: ended.length };
}
