"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
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
  if (!hasMinRole(role, "director")) return { error: "Accès réservé aux directeurs et supérieurs." };

  const page = formData.get("page") as string;
  if (!VALID_PAGES.includes(page as PageKey)) {
    return { error: "Page invalide." };
  }

  const content = formData.get("content") as string;
  if (!content) return { error: "Contenu manquant." };

  // Valider que le contenu est bien du JSON
  try {
    JSON.parse(content);
  } catch {
    return { error: "Format JSON invalide." };
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
