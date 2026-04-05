"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProfileExtra } from "@/lib/profile-extra";

const MAX_ALT_LENGTH    = 50;
const MAX_ALTS          = 10;
const MAX_TIMEZONE      = 50;
const MAX_LANGUAGES     = 10;
const VALID_ACTIVITIES  = ["pvp", "pve", "industry", "exploration", "logistics", "other"];

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

  const timezoneRaw  = (formData.get("timezone")     as string | null)?.trim().slice(0, MAX_TIMEZONE) || "";
  const mainActivity = (formData.get("mainActivity") as string | null)?.trim() || "";
  const altsRaw      = (formData.get("alts")         as string | null)?.trim() || "";
  const langsRaw     = (formData.get("languages")    as string | null)?.trim() || "";

  if (mainActivity && !VALID_ACTIVITIES.includes(mainActivity)) {
    return { success: false, error: "Activité principale invalide." };
  }

  const alts = altsRaw
    ? altsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_ALTS)
        .map((s) => s.slice(0, MAX_ALT_LENGTH))
    : [];

  const languages = langsRaw
    ? langsRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, MAX_LANGUAGES)
    : [];

  // Construire le profil étendu en omettant les champs vides (exactOptionalPropertyTypes)
  const extra: ProfileExtra = {
    ...(timezoneRaw  ? { timezone:     timezoneRaw  } : {}),
    ...(mainActivity ? { mainActivity: mainActivity } : {}),
    ...(alts.length  > 0 ? { alts }      : {}),
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
