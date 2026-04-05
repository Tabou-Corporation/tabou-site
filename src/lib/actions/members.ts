"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinRole, ROLE_LEVEL, ALL_DOMAINS } from "@/types/roles";
import type { UserRole, OfficerDomain } from "@/types/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit";

const ALLOWED_ROLES: UserRole[] = ["candidate", "member_uz", "member", "officer", "director", "ceo", "admin"];

/** Utilisée avec useActionState depuis le client */
export async function changeUserRoleAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const targetUserId  = formData.get("userId") as string;
  const newRole       = formData.get("role")   as string;
  // Domaines : checkboxes multiples
  const rawDomains = formData.getAll("domains") as string[];
  const domains = rawDomains.filter((d) => ALL_DOMAINS.includes(d as OfficerDomain));
  return changeUserRole(targetUserId, newRole, domains);
}

export async function changeUserRole(
  targetUserId: string,
  newRole: string,
  domains: string[] = [],
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const actorRole = (session.user.role ?? "candidate") as UserRole;
  if (!hasMinRole(actorRole, "director")) return { error: "Accès refusé." };
  if (!ALLOWED_ROLES.includes(newRole as UserRole)) return { error: "Rôle invalide." };
  if (targetUserId === session.user.id) return { error: "Vous ne pouvez pas modifier votre propre rôle." };

  // Récupérer la cible
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { error: "Utilisateur introuvable." };

  const targetRole = (target.role ?? "candidate") as UserRole;
  const targetLevel = ROLE_LEVEL[targetRole] ?? 0;
  const actorLevel = ROLE_LEVEL[actorRole] ?? 0;
  const newRoleLevel = ROLE_LEVEL[newRole as UserRole] ?? 0;

  // On ne peut modifier que quelqu'un de rang STRICTEMENT inférieur
  if (targetLevel >= actorLevel) {
    return { error: "Vous ne pouvez pas modifier le rôle d'un pair ou supérieur." };
  }

  // Le nouveau rôle doit être STRICTEMENT inférieur au niveau de l'acteur
  if (newRoleLevel >= actorLevel) {
    return { error: "Vous ne pouvez pas attribuer un rôle supérieur ou égal au vôtre." };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      role: newRole,
      // Domaines : on les conserve pour officer, on les efface pour les autres rôles
      specialties: newRole === "officer" && domains.length > 0
        ? JSON.stringify(domains)
        : null,
    },
  });

  writeAuditLog({
    actorId:   session.user.id,
    actorName: session.user.name,
    action:    "role_change",
    meta: {
      targetUserId,
      targetName: target.name,
      from: targetRole,
      to:   newRole,
      ...(domains.length > 0 ? { domains } : {}),
    },
  });

  revalidatePath("/staff/membres");
  revalidatePath(`/staff/membres/${targetUserId}`);
  revalidatePath("/membre");

  return { success: true };
}
