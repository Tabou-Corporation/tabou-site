"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";
import { writeAuditLog } from "@/lib/audit";

/** Archiver une transaction (soft-delete — masquee des vues membres) */
export async function archiveTransaction(transactionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifie." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "director")) return { success: false, error: "Acces reserve aux directeurs." };

  const tx = await prisma.marketTransaction.findUnique({ where: { id: transactionId } });
  if (!tx) return { success: false, error: "Transaction introuvable." };

  if (tx.archivedAt) return { success: false, error: "Transaction deja archivee." };

  await prisma.marketTransaction.update({
    where: { id: transactionId },
    data: { archivedAt: new Date() },
  });

  writeAuditLog({
    actorId: session.user.id,
    actorName: session.user.name,
    action: "market_transaction",
    meta: { transactionId, action: "archived", title: tx.listingTitle },
  });

  revalidatePath("/staff/admin/transactions");
  revalidatePath("/membre/marche");
  return { success: true };
}

/** Restaurer une transaction archivee */
export async function restoreTransaction(transactionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifie." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "director")) return { success: false, error: "Acces reserve aux directeurs." };

  await prisma.marketTransaction.update({
    where: { id: transactionId },
    data: { archivedAt: null },
  });

  revalidatePath("/staff/admin/transactions");
  revalidatePath("/membre/marche");
  return { success: true };
}

/** Supprimer definitivement une transaction (hard-delete, irreversible) */
export async function deleteTransaction(transactionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifie." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "admin")) return { success: false, error: "Acces reserve a l'administrateur." };

  const tx = await prisma.marketTransaction.findUnique({ where: { id: transactionId } });
  if (!tx) return { success: false, error: "Transaction introuvable." };

  await prisma.marketTransaction.delete({ where: { id: transactionId } });

  writeAuditLog({
    actorId: session.user.id,
    actorName: session.user.name,
    action: "market_transaction",
    meta: { transactionId, action: "deleted", title: tx.listingTitle, finalPrice: tx.finalPrice },
  });

  revalidatePath("/staff/admin/transactions");
  revalidatePath("/membre/marche");
  return { success: true };
}
