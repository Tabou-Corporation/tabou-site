/* eslint-disable no-console */
/**
 * Synchronisation périodique des corporations EVE.
 *
 * Interroge l'ESI pour chaque membre actif, détecte les changements
 * de corporation et ajuste les rôles automatiquement.
 *
 * Règles de sécurité :
 *  - Si ESI ne répond pas → on ne touche à RIEN pour cet utilisateur
 *  - Si 5+ échecs consécutifs → on aborte (ESI probablement down)
 *  - Les rôles director/ceo/admin ne sont JAMAIS modifiés automatiquement
 *  - Chaque changement est tracé dans les logs d'audit
 */

import { prisma } from "@/lib/db";
import { fetchCharacterInfo } from "@/lib/esi/fetch-character";
import { writeAuditLog } from "@/lib/audit";
import { CORPORATIONS } from "@/lib/constants/corporations";
import type { UserRole } from "@/types/roles";

// ── Configuration ────────────────────────────────────────────────────────────

const BATCH_SIZE           = 10;
const BATCH_DELAY_MS       = 200;
const MAX_CONSECUTIVE_FAIL = 5;

const TABOU_ID = CORPORATIONS.tabou.id;
const UZ_ID    = CORPORATIONS.urbanZone.id;

// ── Types ────────────────────────────────────────────────────────────────────

interface SyncChange {
  userId: string;
  name: string | null;
  oldCorpId: number | null;
  newCorpId: number;
  oldRole: string;
  newRole: string;
}

export interface SyncResult {
  total: number;
  checked: number;
  skipped: number;
  updated: number;
  errors: number;
  aborted: boolean;
  changes: SyncChange[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Détermine le nouveau rôle selon le changement de corporation. */
function computeNewRole(
  currentRole: UserRole,
  newCorpId: number,
): UserRole | null {
  const inTabou = newCorpId === TABOU_ID;
  const inUZ    = newCorpId === UZ_ID;
  const inCorp  = inTabou || inUZ;

  // Rôles hauts : jamais modifiés automatiquement
  if (["director", "ceo", "admin"].includes(currentRole)) return null;

  // Officer qui switch Tabou ↔ UZ : garde officer, on met juste à jour corporationId
  if (currentRole === "officer" && inCorp) return null;

  // Officer qui quitte les deux corps → suspended
  if (currentRole === "officer" && !inCorp) return "suspended";

  // Membre qui change de corp
  if (currentRole === "member" && inUZ)   return "member_uz";
  if (currentRole === "member_uz" && inTabou) return "member";

  // Membre qui quitte les deux corps → suspended
  if ((currentRole === "member" || currentRole === "member_uz") && !inCorp) return "suspended";

  // Candidate ou suspended qui est dans une corp → promouvoir
  if ((currentRole === "candidate" || currentRole === "suspended") && inCorp) {
    return inUZ ? "member_uz" : "member";
  }

  return null;
}

// ── Sync principal ───────────────────────────────────────────────────────────

export async function syncAllCorporations(): Promise<SyncResult> {
  const result: SyncResult = {
    total: 0, checked: 0, skipped: 0, updated: 0, errors: 0,
    aborted: false, changes: [],
  };

  // Récupère tous les membres actifs avec leur EVE character ID
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["member_uz", "member", "officer", "director", "ceo", "admin"],
      },
    },
    select: {
      id: true,
      name: true,
      role: true,
      corporationId: true,
      accounts: {
        where: { provider: "eveonline" },
        select: { providerAccountId: true },
        take: 1,
      },
    },
  });

  result.total = users.length;

  let consecutiveFails = 0;

  // Traiter par batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (user) => {
        const characterId = user.accounts[0]?.providerAccountId;
        if (!characterId) {
          result.skipped++;
          return;
        }

        const esiInfo = await fetchCharacterInfo(characterId);

        // ESI ne répond pas → on ne touche à RIEN
        if (!esiInfo) {
          consecutiveFails++;
          result.skipped++;

          if (consecutiveFails >= MAX_CONSECUTIVE_FAIL) {
            console.warn(
              `[corp-sync] ${MAX_CONSECUTIVE_FAIL} échecs ESI consécutifs — arrêt anticipé`,
            );
            result.aborted = true;
          }
          return;
        }

        // ESI a répondu → reset compteur d'échecs
        consecutiveFails = 0;
        result.checked++;

        // Pas de changement de corporation
        if (esiInfo.corporationId === user.corporationId) {
          // Mise à jour du securityStatus seulement
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { securityStatus: esiInfo.securityStatus },
            });
          } catch {
            // Non bloquant
          }
          return;
        }

        // Changement de corporation détecté
        const currentRole = user.role as UserRole;
        let newRole = computeNewRole(currentRole, esiInfo.corporationId);

        // Grace period : si la suspension vient d'une acceptation récente (<24h),
        // l'ESI n'a probablement pas encore propagé le changement de corp.
        if (newRole === "suspended") {
          const recentAcceptance = await prisma.application.findFirst({
            where: {
              userId: user.id,
              status: "ACCEPTED",
              reviewedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          }).catch(() => null);
          if (recentAcceptance) {
            console.log(
              `[corp-sync] ⏳ ${user.name} : suspension ignorée (acceptation < 24h, ESI pas à jour)`,
            );
            newRole = null; // On ne suspend pas, on attend
          }
        }

        const updateData: Record<string, unknown> = {
          corporationId: esiInfo.corporationId,
          securityStatus: esiInfo.securityStatus,
        };

        if (newRole) {
          updateData.role = newRole;
          // Si suspended, on retire les spécialités
          if (newRole === "suspended") {
            updateData.specialties = null;
          }
        }

        try {
          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          result.updated++;

          const change: SyncChange = {
            userId: user.id,
            name: user.name,
            oldCorpId: user.corporationId,
            newCorpId: esiInfo.corporationId,
            oldRole: currentRole,
            newRole: newRole ?? currentRole,
          };
          result.changes.push(change);

          // Audit log
          writeAuditLog({
            actorId: "SYSTEM_SYNC",
            actorName: "Corporation Sync",
            action: newRole ? "corp_sync_role_change" : "corp_sync_corp_update",
            meta: {
              userId: user.id,
              userName: user.name,
              oldCorpId: user.corporationId,
              newCorpId: esiInfo.corporationId,
              oldRole: currentRole,
              newRole: newRole ?? currentRole,
            },
          });

          // Warning spécial si un haut gradé change de corp
          if (["director", "ceo", "admin"].includes(currentRole)) {
            console.warn(
              `[corp-sync] ⚠️ ${user.name} (${currentRole}) a changé de corp : ${user.corporationId} → ${esiInfo.corporationId}`,
            );
          }
        } catch (err) {
          result.errors++;
          console.error(`[corp-sync] Erreur update ${user.name} :`, err);
        }
      }),
    );

    // Vérifier si on doit aborter
    if (result.aborted) break;

    // Ignorer les résultats void
    void batchResults;

    // Délai entre les batches (sauf le dernier)
    if (i + BATCH_SIZE < users.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(
    `[corp-sync] Terminé — ${result.checked}/${result.total} vérifiés, ${result.updated} mis à jour, ${result.skipped} ignorés, ${result.errors} erreurs${result.aborted ? " (ABORTÉ)" : ""}`,
  );

  return result;
}
