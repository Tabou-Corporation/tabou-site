/**
 * Helpers d'écriture pour la table MapEvent (auto et manual).
 * Les workers ESI appellent recordAutoEvent ; l'API admin appelle createManualEvent.
 */

import { prisma } from "@/lib/db";

export interface AutoEventInput {
  kind: "sov_change" | "structure_reinforced" | "structure_vulnerable"
      | "campaign_started" | "campaign_ended" | "activity_spike";
  systemId?: number | null;
  severity?: "info" | "warn" | "alert";
  title: string;
  body?: string;
  meta?: Record<string, unknown>;
  occurredAt: Date;
}

export async function recordAutoEvent(input: AutoEventInput): Promise<void> {
  await prisma.mapEvent.create({
    data: {
      source: "auto",
      kind: input.kind,
      systemId: input.systemId ?? null,
      severity: input.severity ?? "info",
      title: input.title.slice(0, 200),
      body: input.body ?? null,
      meta: input.meta ? JSON.stringify(input.meta) : null,
      occurredAt: input.occurredAt,
    },
  });
}

export interface ManualEventInput {
  authorId: string;
  systemId?: number | null;
  severity?: "info" | "warn" | "alert";
  title: string;
  body?: string;
  occurredAt?: Date;
}

export async function createManualEvent(input: ManualEventInput) {
  return prisma.mapEvent.create({
    data: {
      source: "manual",
      kind: "manual",
      systemId: input.systemId ?? null,
      severity: input.severity ?? "info",
      title: input.title.slice(0, 200),
      body: input.body ?? null,
      authorId: input.authorId,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}
