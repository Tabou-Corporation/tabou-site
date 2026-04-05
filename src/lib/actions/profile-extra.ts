"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { VALID_LANGUAGES, VALID_TIMEZONES } from "@/lib/profile-extra";
import type { ProfileExtra } from "@/lib/profile-extra";

const VALID_ACTIVITIES = ["pvp", "pve", "industry", "exploration", "logistics", "other"];

export interface ProfileExtraState {
  error?:   string;
  success?: boolean;
}

export async function saveProfileExtra(
  _prev: ProfileExtraState,
  formData: FormData
): Promise<ProfileExtraState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Timezone
  const timezone = (formData.get("timezone") as string | null)?.trim() || "";

  // Activités — liste ordonnée (plusieurs valeurs, dans l'ordre d'envoi)
  const rawActivities = formData.getAll("activities") as string[];
  const activities = rawActivities.filter((a) => VALID_ACTIVITIES.includes(a));

  // Langues — checkboxes
  const langs = formData.getAll("languages") as string[];

  // Validations
  if (timezone && !VALID_TIMEZONES.has(timezone)) {
    return { success: false, error: "Fuseau horaire invalide." };
  }
  const languages = langs.filter((l): l is string =>
    VALID_LANGUAGES.includes(l as "fr" | "en")
  );

  // Construire le profil étendu
  const extra: ProfileExtra = {
    ...(timezone           ? { timezone }    : {}),
    ...(activities.length  ? { activities }  : {}),
    ...(languages.length   ? { languages }   : {}),
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { profileExtra: JSON.stringify(extra) },
  });

  revalidatePath("/membre/profil");
  revalidatePath("/membre/annuaire");
  return { success: true };
}
