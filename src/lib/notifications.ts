/**
 * Notifications in-app — création fire-and-forget.
 *
 * Chaque helper crée une entrée dans la table `notifications`.
 * La notification est lue dans le layout membre (badge sidebar)
 * et sur la page /membre/notifications.
 */

import { prisma } from "@/lib/db";

// ── Types ──────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "offer_received"    // Le propriétaire reçoit une offre
  | "offer_accepted"    // L'offreur apprend que son offre est acceptée
  | "offer_rejected"    // L'offreur apprend que son offre est refusée
  | "listing_sold"      // Le propriétaire confirme la vente
  | "listing_expired";  // Le propriétaire apprend que son annonce a expiré

// ── Helper générique ───────────────────────────────────────────────────────────

async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        href: params.href ?? null,
      },
    });
  } catch (err) {
    // Fire-and-forget : ne bloque jamais l'action principale
    console.error("[notification] Erreur création :", err);
  }
}

// ── Helpers spécifiques ────────────────────────────────────────────────────────

/** Nouvelle offre reçue sur une annonce */
export function notifyOfferReceived(params: {
  listingOwnerId: string;
  listingTitle: string;
  offerAuthorName: string | null;
  listingId: string;
  offerPrice: number | null;
}) {
  const priceStr = params.offerPrice
    ? ` — ${formatISK(params.offerPrice)}`
    : "";
  return createNotification({
    userId: params.listingOwnerId,
    type: "offer_received",
    title: `Nouvelle offre sur "${params.listingTitle}"`,
    body: `${params.offerAuthorName ?? "Un membre"} a fait une offre${priceStr}.`,
    href: `/membre/marche/${params.listingId}`,
  });
}

/** Offre acceptée — notifier l'acheteur */
export function notifyOfferAccepted(params: {
  offerAuthorId: string;
  listingTitle: string;
  listingId: string;
}) {
  return createNotification({
    userId: params.offerAuthorId,
    type: "offer_accepted",
    title: `Offre acceptee sur "${params.listingTitle}"`,
    body: "Ton offre a ete acceptee ! Contacte le vendeur en jeu pour finaliser l'echange.",
    href: `/membre/marche/${params.listingId}`,
  });
}

/** Offre refusée — notifier l'offreur (refus individuel ou auto lors d'accept d'une autre) */
export function notifyOfferRejected(params: {
  offerAuthorId: string;
  listingTitle: string;
  listingId: string;
  reason?: string;
}) {
  return createNotification({
    userId: params.offerAuthorId,
    type: "offer_rejected",
    title: `Offre declinee sur "${params.listingTitle}"`,
    body: params.reason ?? "Ton offre n'a pas ete retenue.",
    href: `/membre/marche/${params.listingId}`,
  });
}

/** Annonce vendue — confirmation au vendeur */
export function notifyListingSold(params: {
  sellerId: string;
  listingTitle: string;
  listingId: string;
  buyerName: string | null;
  finalPrice: number | null;
}) {
  const priceStr = params.finalPrice ? ` pour ${formatISK(params.finalPrice)}` : "";
  return createNotification({
    userId: params.sellerId,
    type: "listing_sold",
    title: `"${params.listingTitle}" vendu !`,
    body: `${params.buyerName ?? "Un membre"} a finalise l'achat${priceStr}.`,
    href: `/membre/marche/${params.listingId}`,
  });
}

/** Annonce expirée */
export function notifyListingExpired(params: {
  ownerId: string;
  listingTitle: string;
  listingId: string;
}) {
  return createNotification({
    userId: params.ownerId,
    type: "listing_expired",
    title: `"${params.listingTitle}" a expire`,
    body: "Ton annonce a depasse les 14 jours et a ete fermee automatiquement.",
    href: `/membre/marche/${params.listingId}`,
  });
}

// ── Batch creation ────────────────────────────────────────────────────────────

/** Crée plusieurs notifications en une seule requête (fire-and-forget). */
export async function createNotificationsBatch(
  items: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    href?: string;
  }>
): Promise<void> {
  if (items.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: items.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        href: n.href ?? null,
      })),
    });
  } catch (err) {
    console.error("[notification] Erreur batch :", err);
  }
}

// ── Formatage ISK (copie légère du helper) ──────────────────────────────────

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B ISK`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ISK`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ISK`;
  return `${Math.round(amount)} ISK`;
}
