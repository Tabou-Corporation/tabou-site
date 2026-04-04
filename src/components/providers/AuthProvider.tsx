"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Wrapper client pour le SessionProvider Next-Auth.
 * Permet aux composants client (MainNav, etc.) d'accéder à la session
 * via le hook useSession().
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
