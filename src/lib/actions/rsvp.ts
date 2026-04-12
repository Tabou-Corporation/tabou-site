"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/roles";
import type { ActionResult } from "@/types/actions";
import { getDiscordConfig } from "@/lib/site-content/loader";

export type RsvpStatus = "GOING" | "MAYBE" | "NOT_GOING";

const VALID_RSVP_STATUSES: RsvpStatus[] = ["GOING", "MAYBE", "NOT_GOING"];

export async function rsvpEvent(eventId: string, status: RsvpStatus): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");

  if (!VALID_RSVP_STATUSES.includes(status)) {
    return { success: false, error: "Statut de participation invalide." };
  }

  try {
    await prisma.eventParticipation.upsert({
      where: { userId_eventId: { userId: session.user.id, eventId } },
      update: { status },
      create: { userId: session.user.id, eventId, status },
    });

    revalidatePath("/membre/calendrier");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'enregistrement de votre participation." };
  }
}

export async function cancelRsvp(eventId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    await prisma.eventParticipation.deleteMany({
      where: { userId: session.user.id, eventId },
    });

    revalidatePath("/membre/calendrier");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'annulation de la participation." };
  }
}

/**
 * Envoie une notification Discord pour un événement.
 * Nécessite DISCORD_WEBHOOK_URL dans les variables d'environnement.
 * Backend complet — à connecter via un bouton dans /staff/calendrier/[id].
 */
export async function notifyDiscordEvent(eventId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié." };

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) return { error: "Accès refusé." };

  // Résolution : DB (admin) en priorité, puis variable d'environnement
  const discordConfig = await getDiscordConfig().catch(() => null);
  const webhookUrl =
    discordConfig?.calendarWebhookUrl?.trim() ||
    process.env.DISCORD_WEBHOOK_URL ||
    "";
  if (!webhookUrl) return { error: "Webhook Discord non configuré (aucune URL dans l'admin ni en variable d'environnement)." };

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    include: { _count: { select: { participations: true } } },
  });
  if (!event) return { error: "Événement introuvable." };

  const TYPE_LABELS: Record<string, string> = {
    op: "Opération", training: "Formation", social: "Event social", other: "Autre",
  };

  const siteUrl = process.env.NEXTAUTH_URL ?? "https://tabou-eve.fr";
  const eventUrl = `${siteUrl}/membre/calendrier`;

  /** Formate une date avec heure EVE (UTC) + heure FR (Europe/Paris) */
  function fmtTime(date: Date, opts?: { includeDate?: boolean }): string {
    const includeDate = opts?.includeDate ?? true;
    const datePart = includeDate
      ? date.toLocaleDateString("fr-FR", {
          weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
        }) + "\n"
      : "";
    const eveTime = date.toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit", timeZone: "UTC",
    });
    const frTime = date.toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
    });
    return `${datePart}🕐 ${eveTime} (EVE/UTC)\n🇫🇷 ${frTime} (heure FR)`;
  }

  const payload = {
    content: "@everyone",
    embeds: [{
      title: `📅 ${event.title}`,
      description: event.description ?? "",
      color: 0xF0B030,
      fields: [
        { name: "Type", value: TYPE_LABELS[event.type] ?? event.type, inline: true },
        { name: "📆 Début", value: fmtTime(event.startAt), inline: false },
        ...(event.endAt ? [{
          name: "🏁 Fin",
          value: fmtTime(event.endAt, { includeDate: false }),
          inline: true,
        }] : []),
      ],
      footer: { text: "Tabou Corporation — Les horaires EVE correspondent à l'heure UTC" },
      url: eventUrl,
    }],
    components: [{
      type: 1,
      components: [{
        type: 2,
        style: 5,
        label: "📅 Voir l'événement & s'inscrire",
        url: eventUrl,
      }],
    }],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: `Discord a retourné ${res.status}.` };
    return {};
  } catch {
    return { error: "Impossible de contacter Discord." };
  }
}
