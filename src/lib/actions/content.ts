"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole, canCreateGuideCategory } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Vérifie que l'utilisateur est officer+ (pour annonces/events) */
async function requireContentCreator() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");
  return session.user;
}

/** Vérifie que l'utilisateur peut créer un guide dans cette catégorie */
async function requireGuideAccess(category: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  const specialty = session.user.specialty ?? null;
  if (!canCreateGuideCategory(role, specialty, category)) redirect("/membre");
  return session.user;
}

// ─── Annonces ─────────────────────────────────────────────────────────────────

export type ContentFormState = { error?: string; success?: boolean };

export async function createAnnouncement(
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  const user = await requireContentCreator();
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";
  const pinned = formData.get("pinned") === "on";

  if (!title) return { error: "Le titre est requis." };
  if (!content) return { error: "Le contenu est requis." };

  await prisma.announcement.create({
    data: { title, content, pinned, authorId: user.id! },
  });

  revalidatePath("/membre");
  revalidatePath("/membre/annonces");
  redirect("/membre/annonces");
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await requireContentCreator();
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/membre");
  revalidatePath("/membre/annonces");
}

// ─── Guides ───────────────────────────────────────────────────────────────────

export async function createGuide(
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  const category = (formData.get("category") as string | null) ?? "general";
  const user = await requireGuideAccess(category);
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";

  if (!title) return { error: "Le titre est requis." };
  if (!content) return { error: "Le contenu est requis." };

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
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";

  if (!title) return { error: "Le titre est requis." };
  if (!content) return { error: "Le contenu est requis." };

  await prisma.guide.update({
    where: { id },
    data: { title, category, content },
  });

  revalidatePath("/membre/guides");
  revalidatePath(`/membre/guides/${id}`);
  redirect(`/membre/guides/${id}`);
}

export async function deleteGuide(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");
  await prisma.guide.delete({ where: { id } });
  revalidatePath("/membre/guides");
  redirect("/membre/guides");
}

// ─── Calendrier ───────────────────────────────────────────────────────────────

export async function createCalendarEvent(
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  const user = await requireContentCreator();
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const type = (formData.get("type") as string | null) ?? "op";
  if (!["op", "training", "social", "other"].includes(type)) return { error: "Type d'événement invalide." };
  const startAtRaw = formData.get("startAt") as string | null;
  const endAtRaw = formData.get("endAt") as string | null;

  if (!title) return { error: "Le titre est requis." };
  if (!startAtRaw) return { error: "La date de début est requise." };

  const startAt = new Date(startAtRaw);
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  if (isNaN(startAt.getTime())) return { error: "Date de début invalide." };

  await prisma.calendarEvent.create({
    data: {
      title,
      description,
      type,
      startAt,
      ...(endAt ? { endAt } : {}),
      authorId: user.id!,
    },
  });

  revalidatePath("/membre/calendrier");
  redirect("/membre/calendrier");
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await requireContentCreator();
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/membre/calendrier");
}
