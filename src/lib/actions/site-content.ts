"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole, parseSpecialties, canEditActivityCategory } from "@/types/roles";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types/roles";
import type { PageKey } from "@/lib/site-content/types";

const VALID_PAGES: PageKey[] = [
  "home",
  "corporation",
  "recruitment",
  "faq",
  "activities",
  "contact",
  "discord",
];

/** Pages éditables uniquement par les director+ */
const DIRECTOR_ONLY_PAGES: PageKey[] = [
  "home", "corporation", "recruitment", "faq", "contact", "discord",
];

/** Chemin public correspondant à chaque clé de page */
const PAGE_PATHS: Record<PageKey, string> = {
  home:        "/",
  corporation: "/corporation",
  recruitment: "/recrutement",
  faq:         "/faq",
  activities:  "/activites",
  contact:     "/contact",
  discord:     "/staff/admin/contenu",
};

export interface SaveContentState {
  error?: string;
  success?: boolean;
  page?: string;
}

export async function saveSiteContentAction(
  _prev: SaveContentState,
  formData: FormData
): Promise<SaveContentState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié." };

  const role = (session.user.role ?? "candidate") as UserRole;
  const page = formData.get("page") as string;

  if (!VALID_PAGES.includes(page as PageKey)) {
    return { error: "Page invalide." };
  }

  // Director-only pages
  if (DIRECTOR_ONLY_PAGES.includes(page as PageKey)) {
    if (!hasMinRole(role, "director")) return { error: "Accès réservé aux directeurs et supérieurs." };
  }
  // Activities page: officer with matching domain OR director+
  else if (page === "activities") {
    if (!hasMinRole(role, "officer")) return { error: "Accès réservé aux officiers et supérieurs." };
    // Fine-grained check happens per-category in the editor — here we just check officer+
  }
  else {
    if (!hasMinRole(role, "director")) return { error: "Accès réservé aux directeurs et supérieurs." };
  }

  const content = formData.get("content") as string;
  if (!content) return { error: "Contenu manquant." };

  // Valider que le contenu est bien du JSON
  try {
    JSON.parse(content);
  } catch {
    return { error: "Format JSON invalide." };
  }

  // For activities page, validate that officer can only modify categories they own
  if (page === "activities" && !hasMinRole(role, "director")) {
    const domains = parseSpecialties(session.user.specialties);
    const newActivities = JSON.parse(content);

    // Load existing activities
    const existing = await prisma.siteContent.findUnique({ where: { page: "activities" } });
    const existingActivities = existing ? JSON.parse(existing.content) : [];

    // Check each activity: if the category changed or it's new, officer must own it
    if (Array.isArray(newActivities)) {
      for (const activity of newActivities) {
        if (activity.category && !canEditActivityCategory(role, domains, activity.category)) {
          return { error: `Vous n'avez pas accès à la catégorie "${activity.category}".` };
        }
      }
      // Also check that existing activities in non-owned categories weren't removed
      if (Array.isArray(existingActivities)) {
        for (const existing of existingActivities) {
          if (!canEditActivityCategory(role, domains, existing.category)) {
            // Officer doesn't own this category — it must still be present in the new data
            const stillPresent = newActivities.some(
              (a: { id: string }) => a.id === existing.id
            );
            if (!stillPresent) {
              return { error: `Vous ne pouvez pas supprimer des activités de la catégorie "${existing.category}".` };
            }
          }
        }
      }
    }
  }

  await prisma.siteContent.upsert({
    where: { page },
    update: {
      content,
      updatedBy: session.user.id,
    },
    create: {
      page,
      content,
      updatedBy: session.user.id,
    },
  });

  // Invalider le cache HTML de la page publique concernée
  revalidatePath(PAGE_PATHS[page as PageKey]);
  // Toujours revalider la home (layout, nav, stats)
  revalidatePath("/");

  return { success: true, page };
}
