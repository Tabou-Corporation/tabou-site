"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageRecruitment } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ApplicationFormState = {
  error?: string;
  success?: boolean;
};

// ─── Candidat : soumettre une candidature ─────────────────────────────────────

export async function submitApplication(
  _prevState: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié." };

  const discordHandle = (formData.get("discordHandle") as string | null)?.trim() ?? "";
  const availability  = (formData.get("availability")  as string | null)?.trim() || null;
  const motivation    = (formData.get("motivation")     as string | null)?.trim() ?? "";
  const spCountRaw    =  formData.get("spCount") as string | null;

  if (!discordHandle) return { error: "Le pseudo Discord est requis." };
  if (!motivation)    return { error: "La motivation est requise." };

  const spCount = spCountRaw ? parseInt(spCountRaw, 10) : null;
  if (spCountRaw && (isNaN(spCount!) || spCount! < 0)) {
    return { error: "Skillpoints invalides." };
  }

  // Vérifier si candidature active déjà en cours
  const existing = await prisma.application.findFirst({
    where: { userId: session.user.id, status: { not: "REJECTED" } },
  });
  if (existing) return { error: "Vous avez déjà une candidature en cours." };

  await prisma.application.create({
    data: {
      userId: session.user.id,
      discordHandle,
      availability,
      motivation,
      spCount,
    },
  });

  revalidatePath("/membre");
  revalidatePath("/membre/candidature");
  revalidatePath("/staff/candidatures");

  return { success: true };
}

// ─── Recruteur : mettre à jour le statut ──────────────────────────────────────

export async function updateApplicationStatus(
  id: string,
  status: "PENDING" | "INTERVIEW" | "ACCEPTED" | "REJECTED"
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!canManageRecruitment(role, session.user.specialty)) redirect("/membre");

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) return;

  await prisma.application.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedBy: session.user.name ?? session.user.id,
    },
  });

  // Accepté → promouvoir le candidat en membre
  if (status === "ACCEPTED") {
    await prisma.user.update({
      where: { id: application.userId },
      data:  { role: "member" },
    });
  }

  revalidatePath("/staff/candidatures");
  revalidatePath(`/staff/candidatures/${id}`);
  revalidatePath("/membre");
}

// ─── Recruteur : prendre en charge + planifier entretien ──────────────────────

export async function takeChargeApplication(
  id: string,
  formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!canManageRecruitment(role, session.user.specialty)) redirect("/membre");

  const interviewAtRaw = (formData.get("interviewAt") as string | null)?.trim();
  const interviewAt    = interviewAtRaw ? new Date(interviewAtRaw) : null;

  await prisma.application.update({
    where: { id },
    data: {
      status:      "INTERVIEW",
      interviewAt: interviewAt ?? null,
      reviewedAt:  new Date(),
      reviewedBy:  session.user.name ?? session.user.id,
    },
  });

  revalidatePath("/staff/candidatures");
  revalidatePath(`/staff/candidatures/${id}`);
  revalidatePath("/membre/candidature");
}

// ─── Recruteur : sauvegarder les notes internes ───────────────────────────────

export async function saveApplicationNotes(
  id: string,
  notes: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!canManageRecruitment(role, session.user.specialty)) redirect("/membre");

  await prisma.application.update({
    where: { id },
    data:  { notes: notes.trim() || null },
  });

  revalidatePath(`/staff/candidatures/${id}`);
}
