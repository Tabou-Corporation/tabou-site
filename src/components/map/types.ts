/** Types partagés client — miroirs des réponses /api/map/*. */

import type { SdeSystem } from "@/lib/map/sde";
import type { TensionBreakdown, TensionLevel } from "@/lib/map/tension";

export interface MapSystemDTO {
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
  oldestSnapshotAt: string | null;
}

export interface MapStateDTO {
  systems: MapSystemDTO[];
  generatedAt: string;
  health: {
    oldestExpiresAt: string | null;
    newestFetchedAt: string | null;
    sources: Record<string, { fetchedAt: string | null; expiresAt: string | null; lastStatus: number | null }>;
  };
}

export interface MapEventDTO {
  id: string;
  source: "auto" | "manual";
  kind: string;
  systemId: number | null;
  severity: "info" | "warn" | "alert";
  title: string;
  body: string | null;
  meta: unknown | null;
  authorId: string | null;
  occurredAt: string;
  createdAt: string;
}
