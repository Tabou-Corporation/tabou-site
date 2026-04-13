"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";

// ── Types ────────────────────────────────────────────────────────────────────

interface ActionResult {
  success?: boolean;
  error?: string;
}

const VALID_CATEGORIES = [
  "general", "pvp", "pve", "industry", "exploration",
];

const LIMITS = {
  term: 50,
  literal: 100,
  definition: 300,
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireMember() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "member_uz")) redirect("/membre");
  return session.user;
}

async function requireOfficer() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(role, "officer")) redirect("/membre");
  return session.user;
}

// ── Proposer un terme (membre) — visible immédiatement ──────────────────────

export async function proposeTerm(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireMember();

  const term = (formData.get("term") as string | null)?.trim() ?? "";
  const literal = (formData.get("literal") as string | null)?.trim() || null;
  const definition = (formData.get("definition") as string | null)?.trim() ?? "";
  const category = (formData.get("category") as string | null) ?? "general";

  if (!term) return { error: "Le terme est requis." };
  if (term.length > LIMITS.term) return { error: `Le terme ne peut pas dépasser ${LIMITS.term} caractères.` };
  if (literal && literal.length > LIMITS.literal) return { error: `La description littérale ne peut pas dépasser ${LIMITS.literal} caractères.` };
  if (!definition) return { error: "La définition est requise." };
  if (definition.length > LIMITS.definition) return { error: `La définition ne peut pas dépasser ${LIMITS.definition} caractères.` };
  if (!VALID_CATEGORIES.includes(category)) return { error: "Catégorie invalide." };

  // Check for duplicate term+category
  const existing = await prisma.glossaryTerm.findUnique({
    where: { term_category: { term: term.toUpperCase(), category } },
  });
  if (existing) return { error: "Ce terme existe déjà dans cette catégorie." };

  await prisma.glossaryTerm.create({
    data: {
      term: term.toUpperCase(),
      literal,
      definition,
      category,
      authorId: user.id!,
    },
  });

  revalidatePath("/membre/lexique");
  revalidatePath("/staff/lexique");
  return { success: true };
}

// ── Modifier un terme (officier) ─────────────────────────────────────────────

export async function updateTerm(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireOfficer();

  const id = formData.get("id") as string | null;
  const term = (formData.get("term") as string | null)?.trim() ?? "";
  const literal = (formData.get("literal") as string | null)?.trim() || null;
  const definition = (formData.get("definition") as string | null)?.trim() ?? "";
  const category = (formData.get("category") as string | null) ?? "general";

  if (!id) return { error: "Terme introuvable." };
  if (!term) return { error: "Le terme est requis." };
  if (term.length > LIMITS.term) return { error: `Max ${LIMITS.term} caractères.` };
  if (literal && literal.length > LIMITS.literal) return { error: `Max ${LIMITS.literal} caractères.` };
  if (!definition) return { error: "La définition est requise." };
  if (definition.length > LIMITS.definition) return { error: `Max ${LIMITS.definition} caractères.` };
  if (!VALID_CATEGORIES.includes(category)) return { error: "Catégorie invalide." };

  try {
    await prisma.glossaryTerm.update({
      where: { id },
      data: { term: term.toUpperCase(), literal, definition, category },
    });
    revalidatePath("/membre/lexique");
    revalidatePath("/staff/lexique");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

// ── Supprimer un terme (officier) ────────────────────────────────────────────

export async function deleteTerm(id: string): Promise<ActionResult> {
  await requireOfficer();
  try {
    await prisma.glossaryTerm.delete({ where: { id } });
    revalidatePath("/membre/lexique");
    revalidatePath("/staff/lexique");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la suppression." };
  }
}
