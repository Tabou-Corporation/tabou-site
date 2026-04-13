"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/types/roles";
import { writeAuditLog } from "@/lib/audit";
import type { UserRole } from "@/types/roles";

// ── Schema Zod ────────────────────────────────────────────────────────────

const absenceSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
  reason: z.string().max(120).optional(),
}).refine((d) => d.end > d.start, {
  message: "La date de fin doit être après la date de début.",
});

// ── Types ─────────────────────────────────────────────────────────────────

export interface AbsenceState {
  error?: string;
  success?: boolean;
}

// ── Déclarer / modifier son absence ───────────────────────────────────────

export async function setAbsence(
  _prev: AbsenceState,
  formData: FormData,
): Promise<AbsenceState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const result = absenceSchema.safeParse({
    start: formData.get("start"),
    end: formData.get("end"),
    reason: (formData.get("reason") as string | null)?.trim() || undefined,
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Données invalides." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      absenceStart: result.data.start,
      absenceEnd: result.data.end,
      absenceReason: result.data.reason ?? null,
    },
  });

  revalidatePath("/membre/profil");
  revalidatePath("/membre/annuaire");
  return { success: true };
}

// ── Annuler son absence ───────────────────────────────────────────────────

export async function clearAbsence(): Promise<AbsenceState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { absenceStart: null, absenceEnd: null, absenceReason: null },
  });

  revalidatePath("/membre/profil");
  revalidatePath("/membre/annuaire");
  return { success: true };
}

// ── Staff : déclarer l'absence d'un autre membre ─────────────────────────

export async function setAbsenceForMember(
  _prev: AbsenceState,
  formData: FormData,
): Promise<AbsenceState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const actorRole = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(actorRole, "director")) {
    return { error: "Permissions insuffisantes." };
  }

  const targetUserId = formData.get("userId") as string;
  if (!targetUserId) return { error: "Membre introuvable." };

  const result = absenceSchema.safeParse({
    start: formData.get("start"),
    end: formData.get("end"),
    reason: (formData.get("reason") as string | null)?.trim() || undefined,
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Données invalides." };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      absenceStart: result.data.start,
      absenceEnd: result.data.end,
      absenceReason: result.data.reason ?? null,
    },
  });

  writeAuditLog({
    actorId: session.user.id,
    actorName: session.user.name,
    action: "absence_set",
    meta: {
      targetUserId,
      start: result.data.start.toISOString(),
      end: result.data.end.toISOString(),
      reason: result.data.reason,
    },
  });

  revalidatePath(`/staff/membres/${targetUserId}`);
  revalidatePath("/membre/annuaire");
  return { success: true };
}

// ── Staff : annuler l'absence d'un autre membre ──────────────────────────

export async function clearAbsenceForMember(
  targetUserId: string,
): Promise<AbsenceState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const actorRole = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(actorRole, "director")) {
    return { error: "Permissions insuffisantes." };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { absenceStart: null, absenceEnd: null, absenceReason: null },
  });

  writeAuditLog({
    actorId: session.user.id,
    actorName: session.user.name,
    action: "absence_clear",
    meta: { targetUserId },
  });

  revalidatePath(`/staff/membres/${targetUserId}`);
  revalidatePath("/membre/annuaire");
  return { success: true };
}
