"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole, canCreateGuideCategory, canCreateInDomain, parseSpecialties } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types/actions";

// ─── Limites de longueur ──────────────────────────────────────────────────────
const LIMITS = {
  title:       200,
  content:   10000,
  description: 500,
} as const;

const VALID_CONTENT_DOMAINS = ["general", "pvp", "pve", "industry", "exploration", "diplomacy"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Vérifie que l'utilisateur est officer+ et retourne son profil. */
async function requireOfficer() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");
  const domains = parseSpecialties(session.user.specialties);
  return { ...session.user, role, domains };
}

/** Vérifie que l'utilisateur peut créer un guide dans cette catégorie */
async function requireGuideAccess(category: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  const domains = parseSpecialties(session.user.specialties);
  if (!canCreateGuideCategory(role, domains, category)) redirect("/membre");
  return { ...session.user, role, domains };
}

// ─── Annonces ─────────────────────────────────────────────────────────────────

export type ContentFormState = { error?: string; success?: boolean };

export async function createAnnouncement(
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  const user = await requireOfficer();
  const title   = (formData.get("title")   as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";
  const domain  = (formData.get("domain")  as string | null)?.trim() || "general";
  const pinned  = formData.get("pinned") === "on";

  if (!title) return { error: "Le titre est requis." };
  if (title.length > LIMITS.title) return { error: `Le titre ne peut pas dépasser ${LIMITS.title} caractères.` };
  if (!content) return { error: "Le contenu est requis." };
  if (content.length > LIMITS.content) return { error: `Le contenu ne peut pas dépasser ${LIMITS.content} caractères.` };
  if (!VALID_CONTENT_DOMAINS.includes(domain)) return { error: "Domaine invalide." };
  if (!canCreateInDomain(user.role, user.domains, domain)) {
    return { error: "Vous n'avez pas accès à ce domaine." };
  }

  await prisma.announcement.create({
    data: { title, content, domain, pinned, authorId: user.id! },
  });

  revalidatePath("/membre");
  revalidatePath("/membre/annonces");
  redirect("/membre/annonces");
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  await requireOfficer();
  try {
    await prisma.announcement.delete({ where: { id } });
    revalidatePath("/membre");
    revalidatePath("/membre/annonces");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de l'annonce." };
  }
}

// ─── Guides ───────────────────────────────────────────────────────────────────

export async function createGuide(
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  const category = (formData.get("category") as string | null) ?? "general";
  const user = await requireGuideAccess(category);
  const title   = (formData.get("title")   as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";

  if (!title) return { error: "Le titre est requis." };
  if (title.length > LIMITS.title) return { error: `Le titre ne peut pas dépasser ${LIMITS.title} caractères.` };
  if (!content) return { error: "Le contenu est requis." };
  if (content.length > LIMITS.content) return { error: `Le contenu ne peut pas dépasser ${LIMITS.content} caractères.` };

  const guide = await prisma.guide.create({
    data: { title, category, content, authorId: user.id! },
  });

  revalidatePath("/membre/guides");
  redirect(`/membre/guides/${guide.id}`);
}

export async function updateGuide(
  id: string,
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  const category = (formData.get("category") as string | null) ?? "general";
  await requireGuideAccess(category);
  const title   = (formData.get("title")   as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";

  if (!title) return { error: "Le titre est requis." };
  if (title.length > LIMITS.title) return { error: `Le titre ne peut pas dépasser ${LIMITS.title} caractères.` };
  if (!content) return { error: "Le contenu est requis." };
  if (content.length > LIMITS.content) return { error: `Le contenu ne peut pas dépasser ${LIMITS.content} caractères.` };

  await prisma.guide.update({
    where: { id },
    data: { title, category, content },
  });

  revalidatePath("/membre/guides");
  revalidatePath(`/membre/guides/${id}`);
  redirect(`/membre/guides/${id}`);
}

export async function deleteGuide(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");
  try {
    await prisma.guide.delete({ where: { id } });
    revalidatePath("/membre/guides");
  } catch {
    return { success: false, error: "Erreur lors de la suppression du guide." };
  }
  redirect("/membre/guides");
}

// ─── Calendrier ───────────────────────────────────────────────────────────────

export async function createCalendarEvent(
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  const user = await requireOfficer();
  const title       = (formData.get("title")       as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const type        = (formData.get("type")        as string | null) ?? "op";
  const domain      = (formData.get("domain")      as string | null)?.trim() || "general";

  if (!["op", "training", "social", "other"].includes(type)) return { error: "Type d'événement invalide." };
  if (!VALID_CONTENT_DOMAINS.includes(domain)) return { error: "Domaine invalide." };
  if (!canCreateInDomain(user.role, user.domains, domain)) {
    return { error: "Vous n'avez pas accès à ce domaine." };
  }

  const startAtRaw         = formData.get("startAt")         as string | null;
  const endAtRaw           = formData.get("endAt")           as string | null;
  const recurrence         = (formData.get("recurrence")     as string | null) ?? "none";
  const recurrenceEndAtRaw = formData.get("recurrenceEndAt") as string | null;

  if (!title) return { error: "Le titre est requis." };
  if (title.length > LIMITS.title) return { error: `Le titre ne peut pas dépasser ${LIMITS.title} caractères.` };
  if (description && description.length > LIMITS.description)
    return { error: `La description ne peut pas dépasser ${LIMITS.description} caractères.` };
  if (!startAtRaw) return { error: "La date de début est requise." };

  const startAt = new Date(startAtRaw);
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  if (isNaN(startAt.getTime())) return { error: "Date de début invalide." };
  if (endAt && isNaN(endAt.getTime())) return { error: "Date de fin invalide." };
  if (endAt && endAt <= startAt) return { error: "La date de fin doit être après la date de début." };

  if (!["none", "weekly", "biweekly", "monthly"].includes(recurrence)) {
    return { error: "Récurrence invalide." };
  }

  const recurrenceEndAt = recurrenceEndAtRaw ? new Date(recurrenceEndAtRaw) : null;
  if (recurrence !== "none" && !recurrenceEndAt) {
    return { error: "Une date de fin est requise pour les événements récurrents." };
  }

  await prisma.calendarEvent.create({
    data: {
      title,
      description,
      type,
      domain,
      startAt,
      ...(endAt ? { endAt } : {}),
      recurrence,
      ...(recurrenceEndAt ? { recurrenceEndAt } : {}),
      authorId: user.id!,
    },
  });

  revalidatePath("/membre/calendrier");
  redirect("/membre/calendrier");
}

export async function updateCalendarEvent(
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  await requireOfficer();

  const id          = formData.get("id") as string | null;
  const title       = (formData.get("title")       as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const type        = (formData.get("type")        as string | null) ?? "op";
  const domain      = (formData.get("domain")      as string | null)?.trim() || "general";

  if (!id) return { error: "Événement introuvable." };
  if (!["op", "training", "social", "other"].includes(type)) return { error: "Type d'événement invalide." };

  const startAtRaw         = formData.get("startAt")         as string | null;
  const endAtRaw           = formData.get("endAt")           as string | null;
  const recurrence         = (formData.get("recurrence")     as string | null) ?? "none";
  const recurrenceEndAtRaw = formData.get("recurrenceEndAt") as string | null;

  if (!title) return { error: "Le titre est requis." };
  if (title.length > LIMITS.title) return { error: `Le titre ne peut pas dépasser ${LIMITS.title} caractères.` };
  if (description && description.length > LIMITS.description)
    return { error: `La description ne peut pas dépasser ${LIMITS.description} caractères.` };
  if (!startAtRaw) return { error: "La date de début est requise." };

  const startAt = new Date(startAtRaw);
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  if (isNaN(startAt.getTime())) return { error: "Date de début invalide." };
  if (endAt && isNaN(endAt.getTime())) return { error: "Date de fin invalide." };
  if (endAt && endAt <= startAt) return { error: "La date de fin doit être après la date de début." };

  if (!["none", "weekly", "biweekly", "monthly"].includes(recurrence)) {
    return { error: "Récurrence invalide." };
  }

  const recurrenceEndAt = recurrenceEndAtRaw ? new Date(recurrenceEndAtRaw) : null;
  if (recurrence !== "none" && !recurrenceEndAt) {
    return { error: "Une date de fin est requise pour les événements récurrents." };
  }

  await prisma.calendarEvent.update({
    where: { id },
    data: {
      title,
      description,
      type,
      domain,
      startAt,
      endAt:           endAt ?? null,
      recurrence,
      recurrenceEndAt: recurrenceEndAt ?? null,
    },
  });

  revalidatePath("/membre/calendrier");
  redirect("/membre/calendrier");
}

export async function deleteCalendarEvent(id: string): Promise<ActionResult> {
  await requireOfficer();
  try {
    await prisma.calendarEvent.delete({ where: { id } });
    revalidatePath("/membre/calendrier");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la suppression de l'événement." };
  }
}
