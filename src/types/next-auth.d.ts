import type { DefaultSession } from "next-auth";
import type { UserRole } from "./roles";

/**
 * Extension des types Auth.js pour inclure le rôle Tabou.
 *
 * Permet d'accéder à `session.user.role` et `session.user.id`
 * depuis n'importe quel composant server ou client.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole | undefined;
  }
}
