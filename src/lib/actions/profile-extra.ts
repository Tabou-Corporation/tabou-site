"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { VALID_TIMEZONES } from "@/lib/profile-extra";

const VALID_ACTIVITIES = ["pvp", "pve", "industry", "exploration", "logistics", "other"] as const;

// ── Schema Zod strict ──────────────────────────────────────────────────────

const profileExtraSchema = z.object({
  timezone: z.string().refine((v) => !v || VALID_TIMEZONES.has(v), {
    message: "Fuseau horaire invalide.",
  }).optional(),
  activities: z.array(z.enum(VALID_ACTIVITIES)).max(6).optional(),
  languages: z.array(z.enum(["fr", "en"])).max(2).optional(),
}).strict();

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProfileExtraState {
  error?:   string;
  success?: boolean;
}

// ── Action ─────────────────────────────────────────────────────────────────

export async function saveProfileExtra(
  _prev: ProfileExtraState,
  formData: FormData
): Promise<ProfileExtraState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Extraire les donnees du formulaire
  const timezone = (formData.get("timezone") as string | null)?.trim() || undefined;
  const rawActivities = formData.getAll("activities") as string[];
  const rawLanguages = formData.getAll("languages") as string[];

  // Valider avec Zod
  const result = profileExtraSchema.safeParse({
    ...(timezone ? { timezone } : {}),
    ...(rawActivities.length ? { activities: rawActivities } : {}),
    ...(rawLanguages.length ? { languages: rawLanguages } : {}),
  });

  if (!result.success) {
    const firstError = result.error.errors[0]?.message ?? "Donnees invalides.";
    return { success: false, error: firstError };
  }

  // Construire le profil valide (enlever les champs vides)
  const extra: Record<string, unknown> = {};
  if (result.data.timezone) extra.timezone = result.data.timezone;
  if (result.data.activities?.length) extra.activities = result.data.activities;
  if (result.data.languages?.length) extra.languages = result.data.languages;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { profileExtra: JSON.stringify(extra) },
  });

  revalidatePath("/membre/profil");
  revalidatePath("/membre/annuaire");
  return { success: true };
}
