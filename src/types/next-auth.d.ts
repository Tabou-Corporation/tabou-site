import type { DefaultSession } from "next-auth";
import type { UserRole } from "./roles";

/**
 * Extension des types Auth.js pour inclure le rôle Tabou et la spécialité officer.
 *
 * Permet d'accéder à `session.user.role`, `session.user.id` et `session.user.specialty`
 * depuis n'importe quel composant server ou client.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      specialty?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole | undefined;
    specialty?: string | null | undefined;
  }
}
