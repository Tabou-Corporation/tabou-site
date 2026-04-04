/**
 * Guards d'accès — helpers pour les composants server.
 *
 * Ces fonctions sont des utilitaires côté serveur.
 * La vraie sécurité est dans middleware.ts (Edge) et les layouts server.
 * Ces guards servent à conditionner le rendu (cacher des éléments, rediriger).
 *
 * Usage dans un Server Component :
 *   const session = await auth()
 *   const role = getSessionRole(session)
 *   if (!hasMinRole(role, "member")) redirect("/login")
 */

import type { Session } from "next-auth";
import type { UserRole } from "@/types/roles";
import { hasMinRole } from "@/types/roles";

/**
 * Extrait le rôle depuis la session Auth.js.
 * Retourne "candidate" si pas de session.
 */
export function getSessionRole(session: Session | null): UserRole {
  return (session?.user?.role ?? "candidate") as UserRole;
}

/**
 * Retourne true si l'utilisateur est authentifié.
 */
export function isAuthenticated(session: Session | null): boolean {
  return !!session?.user;
}

/**
 * Retourne true si le rôle de la session permet l'accès.
 */
export function canAccess(session: Session | null, requiredRole: UserRole): boolean {
  const role = getSessionRole(session);
  return hasMinRole(role, requiredRole);
}

/**
 * Guard de route — retourne la URL de redirection si accès refusé, null sinon.
 * Utilisé dans les layouts server pour double-protection (après middleware).
 */
export function routeGuard(
  session: Session | null,
  requiredRole: UserRole,
  redirectTo = "/login"
): string | null {
  if (!canAccess(session, requiredRole)) return redirectTo;
  return null;
}

// Conservé pour rétrocompatibilité et usage futur (V5 permissions granulaires)
export { hasMinRole, canManageRecruitment, canCreateGuideCategory, canCreateContent, canView } from "@/types/roles";
export type { UserRole, OfficerSpecialty, ContentVisibility } from "@/types/roles";
