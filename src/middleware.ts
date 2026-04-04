import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de protection des routes — Edge Runtime compatible.
 *
 * Vérifie la présence du cookie de session next-auth sans importer Prisma.
 * La vérification de rôle fine est assurée par les layouts serveur (auth()).
 *
 * Règles :
 *   /membre/* → session requise
 *   /staff/*  → session requise (rôle vérifié dans le layout)
 *   /auth/*   → toujours accessible
 */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Cookie de session next-auth (HTTP en dev, HTTPS en prod)
  const sessionToken =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");

  const isLoggedIn = !!sessionToken;

  // ── Routes membres (/membre) ───────────────────────────────────────────────
  if (pathname.startsWith("/membre")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Routes staff (/staff) ──────────────────────────────────────────────────
  if (pathname.startsWith("/staff")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/membre/:path*", "/staff/:path*"],
};
