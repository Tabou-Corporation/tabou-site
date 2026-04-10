import { prisma } from "@/lib/db";

export type AuditAction =
  | "role_change"
  | "application_status"
  | "application_notes"
  | "application_withdraw"
  | "corp_sync_role_change"
  | "corp_sync_corp_update"
  | "buyback_status";

interface AuditParams {
  actorId: string;
  actorName?: string | null | undefined;
  action: AuditAction;
  meta?: Record<string, unknown>;
}

/**
 * Enregistre une action sensible dans la table audit_logs.
 * Fire-and-forget : ne bloque jamais l'action principale en cas d'erreur.
 */
export function writeAuditLog(params: AuditParams): void {
  prisma.auditLog
    .create({
      data: {
        actorId:   params.actorId,
        actorName: params.actorName ?? null,
        action:    params.action,
        meta:      params.meta ? JSON.stringify(params.meta) : null,
      },
    })
    .catch((err) => {
      console.error("[audit] Échec d'écriture du log :", params.action, err);
    });
}
