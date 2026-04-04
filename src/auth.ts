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
    checks: ["state"],
    authorization: {
      url: "https://login.eveonline.com/v2/oauth/authorize",
      params: { scope: "publicData" },
    },
    token: "https://login.eveonline.com/v2/oauth/token",
    userinfo: "https://esi.evetech.net/verify/",
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
     * Callback signIn — synchronise le nom EVE à chaque connexion.
     *
     * PrismaAdapter ne propage pas toujours le champ `name` depuis
     * le profil OAuth quand `email` est null (cas EVE SSO).
     * On force la mise à jour ici, après que l'adapter ait créé le user.
     */
    async signIn({ user, profile, account }) {
      if (account?.provider !== "eveonline" || !user.id) return true;

      // profile peut être le profil brut (CharacterName) ou transformé (name)
      const raw = profile as Record<string, unknown> | undefined;
      const name =
        (raw?.CharacterName as string) ??
        (raw?.name as string) ??
        null;

      const charId = raw?.CharacterID as number | undefined;
      const image = charId
        ? `https://images.evetech.net/characters/${charId}/portrait?size=256`
        : (user.image ?? undefined);

      if (name) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              name,
              ...(image ? { image } : {}),
            },
          });
        } catch {
          // Silently ignore if user doesn't exist yet (edge case)
        }
      }

      return true;
    },

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
