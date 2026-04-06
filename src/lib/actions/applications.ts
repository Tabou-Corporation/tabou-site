"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageRecruitment, parseSpecialties } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types/actions";
import { writeAuditLog } from "@/lib/audit";
import {
  notifyNewApplication,
  notifyInterviewScheduled,
  notifyApplicationAccepted,
} from "@/lib/discord-recruitment";

// ─── Limites de longueur ──────────────────────────────────────────────────────
const LIMITS = {
  discordHandle: 100,
  availability:  200,
  motivation:   2000,
  notes:        2000,
} as const;

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
  if (discordHandle.length > LIMITS.discordHandle)
    return { error: `Le pseudo Discord ne peut pas dépasser ${LIMITS.discordHandle} caractères.` };
  if (!motivation) return { error: "La motivation est requise." };
  if (motivation.length > LIMITS.motivation)
    return { error: `La motivation ne peut pas dépasser ${LIMITS.motivation} caractères.` };
  if (availability && availability.length > LIMITS.availability)
    return { error: `Les disponibilités ne peuvent pas dépasser ${LIMITS.availability} caractères.` };

  const spCount = spCountRaw ? parseInt(spCountRaw, 10) : null;
  if (spCountRaw && (isNaN(spCount!) || spCount! < 0)) {
    return { error: "Skillpoints invalides." };
  }

  // Vérifier et créer dans une transaction pour éviter les doublons (race condition)
  let application;
  try {
    application = await prisma.$transaction(async (tx) => {
      const existing = await tx.application.findFirst({
        where: { userId: session.user.id, status: { not: "REJECTED" } },
      });
      if (existing) throw new Error("DUPLICATE");

      return tx.application.create({
        data: {
          userId: session.user.id,
          discordHandle,
          availability,
          motivation,
          spCount,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE") {
      return { error: "Vous avez déjà une candidature en cours." };
    }
    return { error: "Erreur lors de la soumission." };
  }

  notifyNewApplication({
    applicationId: application.id,
    candidateName: session.user.name ?? null,
    discordHandle,
    spCount,
    availability,
    motivation,
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
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!canManageRecruitment(role, parseSpecialties(session.user.specialties))) redirect("/membre");

  const VALID_STATUSES = ["PENDING", "INTERVIEW", "ACCEPTED", "REJECTED"] as const;
  if (!VALID_STATUSES.includes(status)) {
    return { success: false, error: "Statut invalide." };
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });
    if (!application) return { success: false, error: "Candidature introuvable." };

    // Transaction atomique : mise à jour candidature + promotion si acceptée
    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedBy: session.user.name ?? session.user.id,
        },
      });

      if (status === "ACCEPTED") {
        await tx.user.update({
          where: { id: application.userId },
          data:  { role: "member" },
        });
      }
    });

    // Notification Discord (fire-and-forget, hors transaction)
    if (status === "ACCEPTED") {
      notifyApplicationAccepted({
        applicationId: id,
        candidateName: application.user.name ?? null,
        recruiterName: session.user.name ?? null,
      });
    }

    writeAuditLog({
      actorId:   session.user.id,
      actorName: session.user.name,
      action:    "application_status",
      meta: {
        applicationId: id,
        candidateId:   application.userId,
        from: application.status,
        to:   status,
      },
    });

    revalidatePath("/staff/candidatures");
    revalidatePath(`/staff/candidatures/${id}`);
    revalidatePath("/membre");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour du statut." };
  }
}

// ─── Recruteur : prendre en charge + planifier entretien ──────────────────────

export async function takeChargeApplication(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!canManageRecruitment(role, parseSpecialties(session.user.specialties))) redirect("/membre");

  const interviewAtRaw = (formData.get("interviewAt") as string | null)?.trim();
  const interviewAt    = interviewAtRaw ? new Date(interviewAtRaw) : null;

  if (interviewAt && isNaN(interviewAt.getTime())) {
    return { success: false, error: "Date d'entretien invalide." };
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });

    await prisma.application.update({
      where: { id },
      data: {
        status:       "INTERVIEW",
        interviewAt:  interviewAt ?? null,
        reviewedAt:   new Date(),
        reviewedBy:   session.user.name ?? session.user.id,
        assignedToId: session.user.id,
      },
    });

    notifyInterviewScheduled({
      applicationId: id,
      candidateName: application?.user.name ?? null,
      recruiterName: session.user.name ?? null,
      interviewAt:   interviewAt ?? null,
    });

    revalidatePath("/staff/candidatures");
    revalidatePath(`/staff/candidatures/${id}`);
    revalidatePath("/membre/candidature");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la prise en charge." };
  }
}

// ─── Candidat : retirer sa candidature ───────────────────────────────────────

export async function withdrawApplication(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    // Ne supprimer que si en attente ou en entretien (pas si accepté)
    await prisma.application.deleteMany({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING", "INTERVIEW"] },
      },
    });

    writeAuditLog({
      actorId:   session.user.id,
      actorName: session.user.name,
      action:    "application_withdraw",
      meta: { userId: session.user.id },
    });

    revalidatePath("/membre");
    revalidatePath("/membre/candidature");
    revalidatePath("/staff/candidatures");
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors du retrait de la candidature." };
  }
}

// ─── Recruteur : assigner / se désassigner ────────────────────────────────────

export async function assignApplication(
  id: string,
  assignedToId: string | null
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!canManageRecruitment(role, parseSpecialties(session.user.specialties))) redirect("/membre");

  // Vérifier que la cible a bien un rôle recruteur (officer+) — évite l'assignation à un simple membre/candidat
  if (assignedToId !== null) {
    const target = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { role: true },
    });
    const RECRUITER_ROLES = ["officer", "director", "ceo", "admin"];
    if (!target || !RECRUITER_ROLES.includes(target.role)) {
      return { success: false, error: "L'utilisateur ciblé n'a pas le rôle requis pour être recruteur." };
    }
  }

  try {
    await prisma.application.update({
      where: { id },
      data: { assignedToId },
    });
    revalidatePath("/staff/candidatures");
    revalidatePath(`/staff/candidatures/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de l'assignation." };
  }
}

// ─── Recruteur : sauvegarder les notes internes ───────────────────────────────

export async function saveApplicationNotes(
  id: string,
  notes: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user.role ?? "candidate") as UserRole;
  if (!canManageRecruitment(role, parseSpecialties(session.user.specialties))) redirect("/membre");

  const trimmed = notes.trim();
  if (trimmed.length > LIMITS.notes) {
    return { success: false, error: `Les notes ne peuvent pas dépasser ${LIMITS.notes} caractères.` };
  }

  try {
    await prisma.application.update({
      where: { id },
      data:  { notes: trimmed || null },
    });

    revalidatePath(`/staff/candidatures/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la sauvegarde des notes." };
  }
}
