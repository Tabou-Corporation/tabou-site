"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types/actions";
import { writeAuditLog } from "@/lib/audit";
import { appraiseItems } from "@/lib/janice";
import { getSettingsContent } from "@/lib/site-content/loader";
import {
  notifyBuybackSubmitted,
  notifyBuybackStatusChange,
} from "@/lib/discord-notify";

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Durée maximale d'une demande de buyback (14 jours) */
const MAX_EXPIRY_DAYS = 14;
/** Nombre max de demandes PENDING par utilisateur */
const MAX_PENDING_PER_USER = 3;
/** Taille max du paste brut (caractères) */
const MAX_PASTE_LENGTH = 10_000;

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppraisalFormState = {
  error?: string;
  success?: boolean;
  appraisal?: {
    items: Array<{
      typeId: number;
      name: string;
      quantity: number;
      jitaBuy: number;
      totalBuy: number;
    }>;
    totalBuyPrice: number;
    totalBuyback: number;
    buybackRate: number;
    failures: string[];
  };
};

export type SubmitBuybackState = {
  error?: string;
  success?: boolean;
};

// ─── Estimer la valeur (appel Janice, pas de sauvegarde DB) ──────────────────

export async function estimateBuyback(
  _prevState: AppraisalFormState,
  formData: FormData
): Promise<AppraisalFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member")) return { error: "Accès réservé aux membres." };

  const rawPaste = (formData.get("rawPaste") as string | null)?.trim() ?? "";
  if (!rawPaste) return { error: "Colle tes items depuis EVE (un par ligne)." };
  if (rawPaste.length > MAX_PASTE_LENGTH) {
    return { error: `Le texte ne peut pas dépasser ${MAX_PASTE_LENGTH} caractères.` };
  }

  try {
    const settings = await getSettingsContent();
    const rate = (settings.buybackRate ?? 90) / 100;

    const result = await appraiseItems(rawPaste);

    if (result.items.length === 0) {
      return { error: "Aucun item reconnu. Vérifie le format du copier-coller EVE." };
    }

    return {
      success: true,
      appraisal: {
        items: result.items.map((i) => ({
          typeId: i.typeId,
          name: i.name,
          quantity: i.quantity,
          jitaBuy: i.jitaBuy,
          totalBuy: i.totalBuy,
        })),
        totalBuyPrice: result.totalBuyPrice,
        totalBuyback: result.totalBuyPrice * rate,
        buybackRate: rate,
        failures: result.failures,
      },
    };
  } catch (err) {
    console.error("[buyback] Erreur estimation :", err);
    return { error: "Erreur lors de l'estimation. Réessaie dans quelques instants." };
  }
}

// ─── Soumettre une demande de buyback ────────────────────────────────────────

export async function submitBuyback(
  _prevState: SubmitBuybackState,
  formData: FormData
): Promise<SubmitBuybackState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member")) return { error: "Accès réservé aux membres." };

  const rawPaste     = (formData.get("rawPaste") as string | null)?.trim() ?? "";
  const itemsJson    = (formData.get("items") as string | null) ?? "[]";
  const totalJitaBuy = parseFloat(formData.get("totalJitaBuy") as string ?? "0");
  const buybackRate  = parseFloat(formData.get("buybackRate") as string ?? "0");
  const totalBuyback = parseFloat(formData.get("totalBuyback") as string ?? "0");

  if (!rawPaste) return { error: "Données manquantes." };
  if (totalJitaBuy <= 0 || totalBuyback <= 0) return { error: "Valeurs invalides." };

  // Vérifier le nombre de demandes en cours
  const pendingCount = await prisma.buybackRequest.count({
    where: { userId: session.user.id, status: "PENDING" },
  });
  if (pendingCount >= MAX_PENDING_PER_USER) {
    return { error: `Tu as déjà ${MAX_PENDING_PER_USER} demandes en attente. Attends qu'elles soient traitées.` };
  }

  // Compter les items
  let items: unknown[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Données d'items invalides." };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + MAX_EXPIRY_DAYS);

  try {
    const request = await prisma.buybackRequest.create({
      data: {
        userId: session.user.id,
        rawPaste,
        items: itemsJson,
        itemCount: Array.isArray(items) ? items.length : 0,
        totalJitaBuy,
        buybackRate,
        totalBuyback,
        expiresAt,
      },
    });

    notifyBuybackSubmitted({
      requestId: request.id,
      sellerName: session.user.name ?? null,
      totalBuyback,
      itemCount: Array.isArray(items) ? items.length : 0,
      buybackRate,
    });

    revalidatePath("/membre/buyback");
    revalidatePath("/staff/buyback");
    return { success: true };
  } catch (err) {
    console.error("[buyback] Erreur soumission :", err);
    return { error: "Erreur lors de la soumission." };
  }
}

// ─── Staff : mettre à jour le statut d'une demande ──────────────────────────

export async function updateBuybackStatus(
  id: string,
  status: "ACCEPTED" | "PAID" | "REJECTED",
  reviewNote?: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");

  const VALID = ["ACCEPTED", "PAID", "REJECTED"] as const;
  if (!VALID.includes(status)) {
    return { success: false, error: "Statut invalide." };
  }

  try {
    const request = await prisma.buybackRequest.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });
    if (!request) return { success: false, error: "Demande introuvable." };

    // Vérifier expiration
    if (request.status === "PENDING" && request.expiresAt < new Date()) {
      await prisma.buybackRequest.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
      revalidatePath("/staff/buyback");
      revalidatePath(`/staff/buyback/${id}`);
      return { success: false, error: "Cette demande a expiré." };
    }

    await prisma.buybackRequest.update({
      where: { id },
      data: {
        status,
        reviewerId: session.user.id,
        reviewNote: reviewNote?.trim() || null,
      },
    });

    notifyBuybackStatusChange({
      requestId: id,
      sellerName: request.user.name ?? null,
      reviewerName: session.user.name ?? null,
      totalBuyback: request.totalBuyback,
      status,
      reviewNote: reviewNote ?? null,
    });

    writeAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "buyback_status",
      meta: {
        buybackId: id,
        sellerId: request.userId,
        from: request.status,
        to: status,
        totalBuyback: request.totalBuyback,
      },
    });

    revalidatePath("/staff/buyback");
    revalidatePath(`/staff/buyback/${id}`);
    revalidatePath("/membre/buyback");

    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}

// ─── Membre : annuler sa propre demande (PENDING uniquement) ────────────────

export async function cancelBuyback(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    const request = await prisma.buybackRequest.findUnique({ where: { id } });
    if (!request) return { success: false, error: "Demande introuvable." };
    if (request.userId !== session.user.id) {
      return { success: false, error: "Cette demande ne vous appartient pas." };
    }
    if (request.status !== "PENDING") {
      return { success: false, error: "Seule une demande en attente peut être annulée." };
    }

    await prisma.buybackRequest.delete({ where: { id } });

    revalidatePath("/membre/buyback");
    revalidatePath("/staff/buyback");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'annulation." };
  }
}

// ─── Expirer automatiquement les demandes dépassées ─────────────────────────

export async function expireBuybackRequests(): Promise<number> {
  const result = await prisma.buybackRequest.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}
