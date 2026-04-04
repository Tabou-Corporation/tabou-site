/**
 * Module Permissions — V2+
 *
 * Centralise les exports liés aux rôles et à l'accès.
 * Utilisé par les composants et pages pour vérifier les permissions.
 */

export {
  hasMinRole,
  canView,
  ROLE_LEVEL,
} from "@/types/roles";

export type {
  UserRole,
  ContentVisibility,
} from "@/types/roles";

export {
  isAuthenticated,
  canAccess,
  routeGuard,
  getSessionRole,
} from "@/lib/guards";
