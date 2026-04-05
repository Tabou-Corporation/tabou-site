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

  // Timezone — valeur de la liste (ou vide)
  const timezone     = (formData.get("timezone")     as string | null)?.trim() || "";
  const mainActivity = (formData.get("mainActivity") as string | null)?.trim() || "";

  // Langues — checkboxes (plusieurs valeurs possibles)
  const langs = formData.getAll("languages") as string[];

  // Validations
  if (timezone && !VALID_TIMEZONES.has(timezone)) {
    return { success: false, error: "Fuseau horaire invalide." };
  }
  if (mainActivity && !VALID_ACTIVITIES.includes(mainActivity)) {
    return { success: false, error: "Activité principale invalide." };
  }
  const languages = langs.filter((l): l is string =>
    VALID_LANGUAGES.includes(l as "fr" | "en")
  );

  // Construire le profil étendu (omettre les champs vides — exactOptionalPropertyTypes)
  const extra: ProfileExtra = {
    ...(timezone      ? { timezone }     : {}),
    ...(mainActivity  ? { mainActivity } : {}),
    ...(languages.length > 0 ? { languages } : {}),
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { profileExtra: JSON.stringify(extra) },
  });

  revalidatePath("/membre/profil");
  revalidatePath("/membre/annuaire");
  return { success: true };
}
