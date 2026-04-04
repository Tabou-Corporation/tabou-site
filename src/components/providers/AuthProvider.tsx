"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

/**
 * Wrapper client pour le SessionProvider Next-Auth v5.
 * Accepte la session pré-résolue côté serveur pour éviter
 * un aller-retour réseau initial (qui laisse useSession() à null).
 */
export function AuthProvider({
  children,
  session = null,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
