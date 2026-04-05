import type { DefaultSession } from "next-auth";
import type { UserRole } from "./roles";

/**
 * Extension des types Auth.js pour inclure le rôle Tabou et les domaines officer.
 *
 * Permet d'accéder à `session.user.role`, `session.user.id` et `session.user.specialties`
 * depuis n'importe quel composant server ou client.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      /** JSON array string, e.g. '["pvp","recruitment"]' */
      specialties?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole | undefined;
    specialties?: string | null | undefined;
  }
}
