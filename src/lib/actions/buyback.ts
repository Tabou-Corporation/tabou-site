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
import {
  notifyOfferReceived,
  notifyOfferAccepted,
  notifyOfferRejected,
  notifyListingSold,
  createNotificationsBatch,
} from "@/lib/notifications";

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
  if (!session?.user?.id) return { error: "Non authentifie." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) return { error: "Acces reserve aux membres." };

  const rawPaste = (formData.get("rawPaste") as string | null)?.trim() ?? "";
  if (!rawPaste) return { error: "Colle tes items depuis EVE (un par ligne)." };
  if (rawPaste.length > MAX_PASTE_LENGTH) {
    return { error: `Le texte ne peut pas depasser ${MAX_PASTE_LENGTH} caracteres.` };
  }

  try {
    const result = await appraiseItems(rawPaste);

    if (result.items.length === 0) {
      return { error: "Aucun item reconnu. Verifie le format du copier-coller EVE." };
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
    return { error: "Erreur lors de l'estimation. Reessaie dans quelques instants." };
  }
}

// ─── Creer une annonce ───────────────────────────────────────────────────────

export async function createListing(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifie." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) return { error: "Acces reserve aux membres." };

  const type        = formData.get("type") as string ?? "SELL";
  const title       = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const location    = (formData.get("location") as string | null)?.trim() || null;
  const rawPaste    = (formData.get("rawPaste") as string | null)?.trim() || null;
  const itemsJson   = (formData.get("items") as string | null) ?? "[]";
  const totalJitaBuy = parseFloat(formData.get("totalJitaBuy") as string ?? "0") || null;
  const askingPriceRaw = formData.get("askingPrice") as string | null;
  const askingRateRaw  = formData.get("askingRate") as string | null;

  // Validation
  const VALID_TYPES = ["SELL", "BUY", "EXCHANGE"] as const;
  if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return { error: "Type d'annonce invalide." };
  }
  if (!title) return { error: "Le titre est requis." };
  if (title.length > MAX_TITLE_LENGTH) return { error: `Le titre ne peut pas depasser ${MAX_TITLE_LENGTH} caracteres.` };
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `La description ne peut pas depasser ${MAX_DESCRIPTION_LENGTH} caracteres.` };
  }

  const askingPrice = askingPriceRaw ? parseFloat(askingPriceRaw) : null;
  const askingRate  = askingRateRaw ? parseInt(askingRateRaw, 10) : null;

  if (askingPrice !== null && askingPrice < 0) return { error: "Le prix ne peut pas etre negatif." };
  if (askingRate !== null && (askingRate < 1 || askingRate > 200)) {
    return { error: "Le taux doit etre entre 1% et 200%." };
  }

  // Limiter les annonces ouvertes
  const openCount = await prisma.marketListing.count({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (openCount >= MAX_OPEN_PER_USER) {
    return { error: `Tu as deja ${MAX_OPEN_PER_USER} annonces en cours. Ferme-en une avant d'en creer une nouvelle.` };
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

    // Discord (fire-and-forget)
    notifyNewListing({
      listingId: listing.id,
      title,
      type,
      authorName: session.user.name ?? null,
      askingPrice,
      itemCount: Array.isArray(items) ? items.length : 0,
      description,
      location,
      totalJitaBuy,
      askingRate,
      expiresAt,
    });

    writeAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "market_listing",
      meta: { listingId: listing.id, type, title },
    });

    revalidatePath("/membre/marche");
    revalidatePath("/membre");
    return { success: true, listingId: listing.id };
  } catch (err) {
    console.error("[market] Erreur creation :", err);
    return { error: "Erreur lors de la creation de l'annonce." };
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
  if (!hasMinRole(role, "member_uz")) return { success: false, error: "Acces reserve aux membres." };

  if (message && message.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: `Le message ne peut pas depasser ${MAX_MESSAGE_LENGTH} caracteres.` };
  }
  if (!price && !message) {
    return { success: false, error: "Propose un prix ou ecris un message." };
  }

  const listing = await prisma.marketListing.findUnique({
    where: { id: listingId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!listing) return { success: false, error: "Annonce introuvable." };
  if (listing.status !== "OPEN") return { success: false, error: "Cette annonce n'est plus ouverte." };
  if (listing.userId === session.user.id) return { success: false, error: "Tu ne peux pas faire une offre sur ta propre annonce." };

  // Verifier expiration
  if (listing.expiresAt < new Date()) {
    await prisma.marketListing.update({ where: { id: listingId }, data: { status: "EXPIRED" } });
    return { success: false, error: "Cette annonce a expire." };
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

    // Discord (fire-and-forget)
    notifyNewOffer({
      listingId,
      listingTitle: listing.title,
      offerAuthorName: session.user.name ?? null,
      listingAuthorName: listing.user.name ?? null,
      price,
      message: message?.trim() || null,
      listingAskingPrice: listing.askingPrice,
      itemCount: listing.itemCount,
    });

    // In-app notification au proprietaire
    notifyOfferReceived({
      listingOwnerId: listing.userId,
      listingTitle: listing.title,
      offerAuthorName: session.user.name ?? null,
      listingId,
      offerPrice: price,
    });

    revalidatePath(`/membre/marche/${listingId}`);
    revalidatePath("/membre/marche");
    revalidatePath("/membre");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'envoi de l'offre." };
  }
}

// ─── Accepter / Refuser une offre (par le proprietaire de l'annonce) ────────

export async function respondToOffer(
  offerId: string,
  action: "ACCEPTED" | "REJECTED"
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const offer = await prisma.marketOffer.findUnique({
    where: { id: offerId },
    include: {
      listing: {
        select: {
          id: true, userId: true, title: true, type: true,
          itemCount: true, location: true,
        },
      },
      user: { select: { id: true, name: true } },
    },
  });
  if (!offer) return { success: false, error: "Offre introuvable." };
  if (offer.listing.userId !== session.user.id) {
    return { success: false, error: "Seul le proprietaire de l'annonce peut repondre aux offres." };
  }
  if (offer.status !== "PENDING") return { success: false, error: "Cette offre a deja ete traitee." };

  try {
    if (action === "ACCEPTED") {
      // Recuperer les autres offres PENDING pour les notifier
      const otherOffers = await prisma.marketOffer.findMany({
        where: { listingId: offer.listingId, id: { not: offerId }, status: "PENDING" },
        select: { userId: true },
      });

      // Transaction atomique : accepter + rejeter les autres + vendre + creer transaction
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
        prisma.marketTransaction.create({
          data: {
            listingId: offer.listingId,
            offerId: offer.id,
            sellerId: offer.listing.userId,
            buyerId: offer.userId,
            listingTitle: offer.listing.title,
            listingType: offer.listing.type,
            finalPrice: offer.price,
            itemCount: offer.listing.itemCount,
            location: offer.listing.location,
          },
        }),
      ]);

      // Notifications in-app (fire-and-forget)
      notifyOfferAccepted({
        offerAuthorId: offer.userId,
        listingTitle: offer.listing.title,
        listingId: offer.listingId,
      });

      notifyListingSold({
        sellerId: offer.listing.userId,
        listingTitle: offer.listing.title,
        listingId: offer.listingId,
        buyerName: offer.user.name,
        finalPrice: offer.price,
      });

      // Notifier les autres offreurs rejetes (batch)
      if (otherOffers.length > 0) {
        createNotificationsBatch(
          otherOffers.map((other) => ({
            userId: other.userId,
            type: "offer_rejected" as const,
            title: `Offre declinee sur "${offer.listing.title}"`,
            body: "Une autre offre a ete acceptee.",
            href: `/membre/marche/${offer.listingId}`,
          }))
        );
      }
    } else {
      // Refus individuel
      await prisma.marketOffer.update({
        where: { id: offerId },
        data: { status: "REJECTED" },
      });

      notifyOfferRejected({
        offerAuthorId: offer.userId,
        listingTitle: offer.listing.title,
        listingId: offer.listingId,
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
    revalidatePath("/membre");
    return { success: true };
  } catch (err) {
    console.error("[market] Erreur traitement offre :", err);
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
  revalidatePath("/membre/marche");
  return { success: true };
}

// ─── Fermer son annonce ──────────────────────────────────────────────────────

export async function closeListing(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const listing = await prisma.marketListing.findUnique({
    where: { id },
    include: {
      offers: {
        where: { status: "PENDING" },
        select: { userId: true },
      },
    },
  });
  if (!listing) return { success: false, error: "Annonce introuvable." };
  if (listing.userId !== session.user.id) {
    const role = (session.user.role ?? "candidate") as UserRole;
    if (!hasMinRole(role, "officer")) return { success: false, error: "Ce n'est pas ton annonce." };
  }
  if (listing.status !== "OPEN") return { success: false, error: "Annonce deja fermee." };

  await prisma.$transaction([
    prisma.marketListing.update({ where: { id }, data: { status: "CLOSED" } }),
    prisma.marketOffer.updateMany({
      where: { listingId: id, status: "PENDING" },
      data: { status: "REJECTED" },
    }),
  ]);

  // Notifier les offreurs en attente que leurs offres sont rejetees (batch)
  if (listing.offers.length > 0) {
    createNotificationsBatch(
      listing.offers.map((offer) => ({
        userId: offer.userId,
        type: "offer_rejected" as const,
        title: `Offre declinee sur "${listing.title}"`,
        body: "L'annonce a ete fermee par le proprietaire.",
        href: `/membre/marche/${id}`,
      }))
    );
  }

  revalidatePath("/membre/marche");
  revalidatePath(`/membre/marche/${id}`);
  revalidatePath("/membre");
  return { success: true };
}

// ─── Expirer automatiquement les annonces depassees ─────────────────────────

export async function expireListings(): Promise<number> {
  // Recuperer les annonces a expirer avec leurs offres pending
  const toExpire = await prisma.marketListing.findMany({
    where: { status: "OPEN", expiresAt: { lt: new Date() } },
    select: {
      id: true,
      title: true,
      userId: true,
      offers: {
        where: { status: "PENDING" },
        select: { userId: true },
      },
    },
  });

  if (toExpire.length === 0) return 0;

  // Expirer en batch
  await prisma.$transaction([
    prisma.marketListing.updateMany({
      where: {
        status: "OPEN",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    }),
    prisma.marketOffer.updateMany({
      where: {
        listing: { status: "OPEN", expiresAt: { lt: new Date() } },
        status: "PENDING",
      },
      data: { status: "REJECTED" },
    }),
  ]);

  // Notifications (fire-and-forget, batch)
  const batchNotifs: Array<{
    userId: string;
    type: "listing_expired" | "offer_rejected";
    title: string;
    body: string;
    href: string;
  }> = [];

  for (const listing of toExpire) {
    batchNotifs.push({
      userId: listing.userId,
      type: "listing_expired",
      title: `"${listing.title}" a expire`,
      body: "Ton annonce a depasse les 14 jours et a ete fermee automatiquement.",
      href: `/membre/marche/${listing.id}`,
    });
    for (const offer of listing.offers) {
      batchNotifs.push({
        userId: offer.userId,
        type: "offer_rejected",
        title: `Offre declinee sur "${listing.title}"`,
        body: "L'annonce a expire.",
        href: `/membre/marche/${listing.id}`,
      });
    }
  }

  if (batchNotifs.length > 0) {
    createNotificationsBatch(batchNotifs);
  }

  return toExpire.length;
}
