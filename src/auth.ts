import NextAuth from "next-auth";
import type { OAuthConfig } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { CORPORATIONS } from "@/lib/constants/corporations";
import type { UserRole } from "@/types/roles";

/**
 * Payload du JWT access_token EVE SSO v2.
 *
 * Le endpoint /verify/ d'ESI est déprécié et renvoie du HTML.
 * On décode le JWT directement pour extraire les infos du personnage.
 */
interface EVEJwtPayload {
  sub: string;   // "CHARACTER:EVE:2116159723"
  name: string;  // Nom du personnage
  owner: string; // Character owner hash
  exp: number;
  iss: string;   // "login.eveonline.com"
  [key: string]: unknown;
}

/**
 * Provider EVE Online SSO (OAuth2 v2 — JWT tokens).
 *
 * Callback URL à déclarer dans le portail CCP :
 *   Dev  : http://localhost:3000/api/auth/callback/eveonline
 *   Prod : https://tabou-eve.fr/api/auth/callback/eveonline
 */
function createEVEProvider(): OAuthConfig<EVEJwtPayload> {
  return {
    id: "eveonline",
    name: "EVE Online",
    type: "oauth",
    clientId: process.env.EVE_CLIENT_ID ?? "",
    clientSecret: process.env.EVE_CLIENT_SECRET ?? "",
    checks: ["state"],
    authorization: {
      url: "https://login.eveonline.com/v2/oauth/authorize",
      params: { scope: "publicData" },
    },
    token: "https://login.eveonline.com/v2/oauth/token",

    // Décode le JWT access_token au lieu d'appeler le verify endpoint (déprécié)
    userinfo: {
      url: "https://login.eveonline.com/oauth/verify",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async request({ tokens }: { tokens: any }) {
        try {
          const jwt = String(tokens.access_token);
          const parts = jwt.split(".");
          const payload = JSON.parse(
            Buffer.from(parts[1] ?? "", "base64").toString()
          ) as EVEJwtPayload;
          return payload;
        } catch {
          return null;
        }
      },
    },

    profile(profile) {
      // profile.sub = "CHARACTER:EVE:2116159723"
      const characterId = profile.sub.split(":")[2] ?? "0";
      return {
        id: characterId,
        name: profile.name,
        email: null,
        image: `https://images.evetech.net/characters/${characterId}/portrait?size=256`,
      };
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [createEVEProvider()],

  // Sessions stockées en base via PrismaAdapter
  session: { strategy: "database" },

  callbacks: {
    /**
     * Synchronise nom + image EVE à chaque connexion.
     * Filet de sécurité si le PrismaAdapter ne propage pas le nom.
     */
    async signIn({ user, profile, account }) {
      if (account?.provider !== "eveonline" || !user.id) return true;

      const raw = profile as Record<string, unknown> | undefined;
      const name = (raw?.name as string) ?? null;
      const sub = (raw?.sub as string) ?? "";
      const characterId = sub.split(":")[2];
      const image = characterId
        ? `https://images.evetech.net/characters/${characterId}/portrait?size=256`
        : undefined;

      // Récupère la corporation EVE actuelle via ESI public
      let corporationId: number | undefined;
      let securityStatus: number | undefined;
      if (characterId) {
        try {
          const esiRes = await fetch(
            `https://esi.evetech.net/latest/characters/${characterId}/`,
            { next: { revalidate: 3600 } }
          );
          if (esiRes.ok) {
            const esiData = await esiRes.json() as { corporation_id?: number; security_status?: number };
            if (esiData.corporation_id) corporationId = esiData.corporation_id;
            if (typeof esiData.security_status === "number") securityStatus = esiData.security_status;
          }
        } catch (err) {
          console.error("[auth] ESI indisponible lors du login de", characterId, err);
        }
      }

      // Détermine le rôle automatique selon la corporation ESI
      let autoRole: UserRole | undefined;
      if (corporationId) {
        const currentUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        }).catch(() => null);
        const currentRole = (currentUser?.role ?? "candidate") as UserRole;

        const inTabou = corporationId === CORPORATIONS.tabou.id;
        const inUZ    = corporationId === CORPORATIONS.urbanZone.id;
        const inCorp  = inTabou || inUZ;

        if (inCorp && currentRole === "candidate") {
          // Premier login corpo → promouvoir
          autoRole = inUZ ? "member_uz" : "member";
        } else if (!inCorp && ["member_uz", "member", "officer"].includes(currentRole)) {
          // Éjecté de la corpo → suspendre
          autoRole = "suspended";
        }
      }

      if (name && user.id) {
        const data = {
          name,
          ...(image ? { image } : {}),
          ...(corporationId ? { corporationId } : {}),
          ...(securityStatus !== undefined ? { securityStatus } : {}),
          ...(autoRole ? { role: autoRole } : {}),
        };
        try {
          await prisma.user.upsert({
            where: { id: user.id },
            update: data,
            create: {
              id: user.id,
              ...data,
              ...(autoRole ? {} : { role: "candidate" }),
            },
          });
        } catch (err) {
          console.error("[auth] upsert user failed", user.id, err);
        }
      }

      return true;
    },

    /**
     * Injecte id, role et specialties depuis la DB dans l'objet session.
     */
    session({ session, user }) {
      const dbUser = user as { id: string; role?: string | null; specialties?: string | null };
      return {
        ...session,
        user: {
          ...session.user,
          id: dbUser.id,
          role: (dbUser.role ?? "candidate") as UserRole,
          specialties: dbUser.specialties ?? null,
        },
      };
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
