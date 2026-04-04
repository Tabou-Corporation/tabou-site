"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole, ROLE_LEVEL } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ALLOWED_ROLES: UserRole[] = ["candidate", "member", "recruiter", "officer", "admin"];

/** Utilisée avec useActionState depuis le client */
export async function changeUserRoleAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const targetUserId = formData.get("userId") as string;
  const newRole = formData.get("role") as string;
  return changeUserRole(targetUserId, newRole);
}

export async function changeUserRole(
  targetUserId: string,
  newRole: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const actorRole = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(actorRole, "officer")) return { error: "Accès refusé." };
  if (!ALLOWED_ROLES.includes(newRole as UserRole)) return { error: "Rôle invalide." };
  if (targetUserId === session.user.id) return { error: "Vous ne pouvez pas modifier votre propre rôle." };

  // Récupérer la cible
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { error: "Utilisateur introuvable." };

  const targetRole = (target.role ?? "candidate") as UserRole;
  const newRoleLevel = ROLE_LEVEL[newRole as UserRole] ?? 0;

  // Officer ne peut pas gérer quelqu'un de rang >= lui-même
  if (actorRole !== "admin" && ROLE_LEVEL[targetRole] >= ROLE_LEVEL[actorRole]) {
    return { error: "Vous ne pouvez pas modifier le rôle d'un pair ou supérieur." };
  }
  // Officer ne peut pas attribuer un rôle >= le sien (seul admin peut donner admin)
  if (actorRole !== "admin" && newRoleLevel >= ROLE_LEVEL[actorRole]) {
    return { error: "Vous ne pouvez pas attribuer un rôle supérieur ou égal au vôtre." };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  revalidatePath("/staff/membres");
  revalidatePath(`/staff/membres/${targetUserId}`);
  revalidatePath("/membre");

  return {};
}
