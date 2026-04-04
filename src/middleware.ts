import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_LEVEL } from "@/types/roles";
import type { UserRole } from "@/types/roles";

/**
 * Middleware de protection des routes — s'exécute côté serveur (Edge).
 *
 * C'est ici que réside la vraie sécurité des routes privées.
 * Les guards côté client ne sont que du confort UX — pas de sécurité.
 *
 * Règles :
 *   /membre/* → authentifié + role >= "candidate"
 *   /staff/*  → authentifié + role >= "recruiter"
 *   /auth/*   → toujours accessible
 */
export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const userRole = (session?.user?.role ?? "public") as UserRole;

  // ── Routes membres (/membre) ───────────────────────────────────────────────
  if (pathname.startsWith("/membre")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Doit être au moins candidat
    if (ROLE_LEVEL[userRole] < ROLE_LEVEL["candidate"]) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  // ── Routes staff (/staff) ──────────────────────────────────────────────────
  if (pathname.startsWith("/staff")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Doit être au moins recruteur
    if (ROLE_LEVEL[userRole] < ROLE_LEVEL["recruiter"]) {
      return NextResponse.redirect(new URL("/membre", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/membre/:path*", "/staff/:path*"],
};
