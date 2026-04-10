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
import { notifyNewListing, notifyNewOffer } from "@/lib/discord-notify";

// ─── Constantes ──────────────────────────────────────────────────────────────

const MAX_EXPIRY_DAYS = 14;
const MAX_OPEN_PER_USER = 5;
const MAX_PASTE_LENGTH = 10_000;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 500;

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
    failures: string[];
  };
};

export type ListingFormState = {
  error?: string;
  success?: boolean;
  listingId?: string;
};

// ─── Estimer la valeur (appel Fuzzwork, pas de sauvegarde DB) ────────────────

export async function estimateItems(
  _prevState: AppraisalFormState,
  formData: FormData
): Promise<AppraisalFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) return { error: "Accès réservé aux membres." };

  const rawPaste = (formData.get("rawPaste") as string | null)?.trim() ?? "";
  if (!rawPaste) return { error: "Colle tes items depuis EVE (un par ligne)." };
  if (rawPaste.length > MAX_PASTE_LENGTH) {
    return { error: `Le texte ne peut pas dépasser ${MAX_PASTE_LENGTH} caractères.` };
  }

  try {
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
        failures: result.failures,
      },
    };
  } catch (err) {
    console.error("[market] Erreur estimation :", err);
    return { error: "Erreur lors de l'estimation. Réessaie dans quelques instants." };
  }
}

// ─── Créer une annonce ───────────────────────────────────────────────────────

export async function createListing(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) return { error: "Accès réservé aux membres." };

  const type        = formData.get("type") as string ?? "SELL";
  const title       = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const location    = (formData.get("location") as string | null)?.trim() || null;
  const rawPaste    = (formData.get("rawPaste") as string | null)?.trim() || null;
  const itemsJson  = (formData.get("items") as string | null) ?? "[]";
  const totalJitaBuy = parseFloat(formData.get("totalJitaBuy") as string ?? "0") || null;
  const askingPriceRaw = formData.get("askingPrice") as string | null;
  const askingRateRaw  = formData.get("askingRate") as string | null;

  // Validation
  const VALID_TYPES = ["SELL", "BUY", "EXCHANGE"] as const;
  if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return { error: "Type d'annonce invalide." };
  }
  if (!title) return { error: "Le titre est requis." };
  if (title.length > MAX_TITLE_LENGTH) return { error: `Le titre ne peut pas dépasser ${MAX_TITLE_LENGTH} caractères.` };
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.` };
  }

  const askingPrice = askingPriceRaw ? parseFloat(askingPriceRaw) : null;
  const askingRate  = askingRateRaw ? parseInt(askingRateRaw, 10) : null;

  if (askingPrice !== null && askingPrice < 0) return { error: "Le prix ne peut pas être négatif." };
  if (askingRate !== null && (askingRate < 1 || askingRate > 200)) {
    return { error: "Le taux doit être entre 1% et 200%." };
  }

  // Limiter les annonces ouvertes
  const openCount = await prisma.marketListing.count({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (openCount >= MAX_OPEN_PER_USER) {
    return { error: `Tu as déjà ${MAX_OPEN_PER_USER} annonces en cours. Ferme-en une avant d'en créer une nouvelle.` };
  }

  let items: unknown[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    items = [];
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + MAX_EXPIRY_DAYS);

  try {
    const listing = await prisma.marketListing.create({
      data: {
        userId: session.user.id,
        type: type as "SELL" | "BUY" | "EXCHANGE",
        title,
        description,
        location,
        rawPaste,
        items: Array.isArray(items) && items.length > 0 ? itemsJson : null,
        itemCount: Array.isArray(items) ? items.length : 0,
        totalJitaBuy,
        askingPrice,
        askingRate,
        expiresAt,
      },
    });

    notifyNewListing({
      listingId: listing.id,
      title,
      type,
      authorName: session.user.name ?? null,
      askingPrice,
      itemCount: Array.isArray(items) ? items.length : 0,
    });

    revalidatePath("/membre/marche");
    return { success: true, listingId: listing.id };
  } catch (err) {
    console.error("[market] Erreur création :", err);
    return { error: "Erreur lors de la création de l'annonce." };
  }
}

// ─── Faire une offre ─────────────────────────────────────────────────────────

export async function makeOffer(
  listingId: string,
  price: number | null,
  message: string | null
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) return { success: false, error: "Accès réservé aux membres." };

  if (message && message.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: `Le message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères.` };
  }
  if (!price && !message) {
    return { success: false, error: "Propose un prix ou écris un message." };
  }

  const listing = await prisma.marketListing.findUnique({
    where: { id: listingId },
    include: { user: { select: { name: true } } },
  });
  if (!listing) return { success: false, error: "Annonce introuvable." };
  if (listing.status !== "OPEN") return { success: false, error: "Cette annonce n'est plus ouverte." };
  if (listing.userId === session.user.id) return { success: false, error: "Tu ne peux pas faire une offre sur ta propre annonce." };

  // Vérifier expiration
  if (listing.expiresAt < new Date()) {
    await prisma.marketListing.update({ where: { id: listingId }, data: { status: "EXPIRED" } });
    return { success: false, error: "Cette annonce a expiré." };
  }

  try {
    await prisma.marketOffer.create({
      data: {
        listingId,
        userId: session.user.id,
        price,
        message: message?.trim() || null,
      },
    });

    notifyNewOffer({
      listingId,
      listingTitle: listing.title,
      offerAuthorName: session.user.name ?? null,
      listingAuthorName: listing.user.name ?? null,
      price,
    });

    revalidatePath(`/membre/marche/${listingId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'envoi de l'offre." };
  }
}

// ─── Accepter / Refuser une offre (par le propriétaire de l'annonce) ────────

export async function respondToOffer(
  offerId: string,
  action: "ACCEPTED" | "REJECTED"
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const offer = await prisma.marketOffer.findUnique({
    where: { id: offerId },
    include: { listing: { select: { id: true, userId: true, title: true } } },
  });
  if (!offer) return { success: false, error: "Offre introuvable." };
  if (offer.listing.userId !== session.user.id) {
    return { success: false, error: "Seul le propriétaire de l'annonce peut répondre aux offres." };
  }
  if (offer.status !== "PENDING") return { success: false, error: "Cette offre a déjà été traitée." };

  try {
    if (action === "ACCEPTED") {
      // Accepter cette offre + fermer l'annonce + rejeter les autres offres
      await prisma.$transaction([
        prisma.marketOffer.update({
          where: { id: offerId },
          data: { status: "ACCEPTED" },
        }),
        prisma.marketOffer.updateMany({
          where: { listingId: offer.listingId, id: { not: offerId }, status: "PENDING" },
          data: { status: "REJECTED" },
        }),
        prisma.marketListing.update({
          where: { id: offer.listingId },
          data: { status: "SOLD" },
        }),
      ]);
    } else {
      await prisma.marketOffer.update({
        where: { id: offerId },
        data: { status: "REJECTED" },
      });
    }

    writeAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "market_offer",
      meta: { offerId, listingId: offer.listingId, action },
    });

    revalidatePath(`/membre/marche/${offer.listingId}`);
    revalidatePath("/membre/marche");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du traitement." };
  }
}

// ─── Retirer une offre (par l'auteur de l'offre) ─────────────────────────────

export async function withdrawOffer(offerId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const offer = await prisma.marketOffer.findUnique({ where: { id: offerId } });
  if (!offer) return { success: false, error: "Offre introuvable." };
  if (offer.userId !== session.user.id) return { success: false, error: "Ce n'est pas ton offre." };
  if (offer.status !== "PENDING") return { success: false, error: "Cette offre n'est plus en attente." };

  await prisma.marketOffer.update({ where: { id: offerId }, data: { status: "WITHDRAWN" } });
  revalidatePath(`/membre/marche/${offer.listingId}`);
  return { success: true };
}

// ─── Fermer son annonce ──────────────────────────────────────────────────────

export async function closeListing(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const listing = await prisma.marketListing.findUnique({ where: { id } });
  if (!listing) return { success: false, error: "Annonce introuvable." };
  if (listing.userId !== session.user.id) {
    // Les officiers peuvent aussi fermer
    const role = (session.user.role ?? "candidate") as UserRole;
    if (!hasMinRole(role, "officer")) return { success: false, error: "Ce n'est pas ton annonce." };
  }
  if (listing.status !== "OPEN") return { success: false, error: "Annonce déjà fermée." };

  await prisma.$transaction([
    prisma.marketListing.update({ where: { id }, data: { status: "CLOSED" } }),
    prisma.marketOffer.updateMany({
      where: { listingId: id, status: "PENDING" },
      data: { status: "REJECTED" },
    }),
  ]);

  revalidatePath("/membre/marche");
  revalidatePath(`/membre/marche/${id}`);
  return { success: true };
}

// ─── Expirer automatiquement les annonces dépassées ─────────────────────────

export async function expireListings(): Promise<number> {
  const result = await prisma.marketListing.updateMany({
    where: {
      status: "OPEN",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}
