import NextAuth from "next-auth";
import type { OAuthConfig } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/types/roles";

interface EVECharacterProfile {
  CharacterID: number;
  CharacterName: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
}

/**
 * Provider EVE Online SSO (OAuth2 v2).
 *
 * Documentation : https://docs.esi.evetech.net/docs/sso/
 * Enregistrement : https://developers.eveonline.com/
 *
 * Callback URL à déclarer dans le portail CCP :
 *   Dev  : http://localhost:3000/api/auth/callback/eveonline
 *   Prod : https://votre-domaine.fr/api/auth/callback/eveonline
 */
function createEVEProvider(): OAuthConfig<EVECharacterProfile> {
  return {
    id: "eveonline",
    name: "EVE Online",
    type: "oauth",
    clientId: process.env.EVE_CLIENT_ID ?? "",
    clientSecret: process.env.EVE_CLIENT_SECRET ?? "",
    authorization: {
      url: "https://login.eveonline.com/v2/oauth/authorize",
      params: { scope: "publicData" },
    },
    token: "https://login.eveonline.com/v2/oauth/token",
    userinfo: {
      async request({ tokens }: { tokens: { access_token?: string } }) {
        const res = await fetch("https://esi.evetech.net/verify/", {
          headers: {
            Authorization: `Bearer ${tokens.access_token ?? ""}`,
          },
        });
        if (!res.ok) throw new Error("EVE SSO verify failed");
        return res.json() as Promise<EVECharacterProfile>;
      },
    },
    profile(profile) {
      return {
        id: String(profile.CharacterID),
        name: profile.CharacterName,
        email: null,
        image: `https://images.evetech.net/characters/${profile.CharacterID}/portrait?size=256`,
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
     * Injecte id et role depuis la DB dans l'objet session.
     * Accessible via useSession() côté client et auth() côté serveur.
     */
    session({ session, user }) {
      const dbUser = user as { id: string; role?: string | null };
      return {
        ...session,
        user: {
          ...session.user,
          id: dbUser.id,
          role: ((dbUser.role ?? "candidate") as UserRole),
        },
      };
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
