import NextAuth from "next-auth";
import type { OAuthConfig } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { CORPORATIONS } from "@/lib/constants/corporations";
import { fetchCharacterInfo } from "@/lib/esi/fetch-character";
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

// ── Helpers auto-role ──────────────────────────────────────────────────────

const PROTECTED_ROLES: UserRole[] = ["director", "ceo", "admin"];

/**
 * Calcule le rôle automatique selon la corporation ESI et le rôle actuel.
 * Retourne undefined si aucun changement n'est nécessaire.
 */
async function computeAutoRole(
  userId: string,
  currentRole: UserRole,
  corporationId: number,
): Promise<UserRole | undefined> {
  if (PROTECTED_ROLES.includes(currentRole)) return undefined;

  const inTabou = corporationId === CORPORATIONS.tabou.id;
  const inUZ    = corporationId === CORPORATIONS.urbanZone.id;
  const inCorp  = inTabou || inUZ;

  if (inCorp && (currentRole === "candidate" || currentRole === "suspended")) {
    return inUZ ? "member_uz" : "member";
  }
  if (inCorp && currentRole === "member" && inUZ) return "member_uz";
  if (inCorp && currentRole === "member_uz" && inTabou) return "member";

  if (!inCorp && ["member_uz", "member", "officer"].includes(currentRole)) {
    // Grace period 24h : l'ESI peut mettre du temps à propager un changement de corp
    const recentAcceptance = await prisma.application.findFirst({
      where: {
        userId,
        status: "ACCEPTED",
        reviewedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }).catch(() => null);
    if (!recentAcceptance) return "suspended";
  }

  return undefined;
}

// ── NextAuth config ───────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [createEVEProvider()],

  // Sessions stockées en base via PrismaAdapter
  session: { strategy: "database" },

  callbacks: {
    /**
     * Synchronise données EVE à chaque connexion pour les UTILISATEURS EXISTANTS.
     *
     * ⚠️  Pour les NOUVEAUX utilisateurs, ce callback se déclenche AVANT que
     * PrismaAdapter ne crée le record en base. L'update échouerait.
     * → Les nouveaux users sont gérés par events.signIn (ci-dessous).
     */
    async signIn({ user, profile, account }) {
      if (account?.provider !== "eveonline" || !user.id) return true;

      // Vérifie si l'utilisateur existe déjà en base
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, corporationId: true },
      }).catch(() => null);

      if (!currentUser) {
        // Nouveau user → PrismaAdapter le créera après ce callback.
        // events.signIn appliquera les données ESI et l'auto-role.
        return true;
      }

      // ── Utilisateur existant (retour de connexion) ──────────────────

      const raw = profile as Record<string, unknown> | undefined;
      const name = (raw?.name as string) ?? null;
      const sub = (raw?.sub as string) ?? "";
      const characterId = sub.split(":")[2];
      const image = characterId
        ? `https://images.evetech.net/characters/${characterId}/portrait?size=256`
        : undefined;

      const esiInfo = characterId ? await fetchCharacterInfo(characterId) : null;
      const corporationId = esiInfo?.corporationId;
      const securityStatus = esiInfo?.securityStatus;

      // Fallback DB si ESI échoue
      const effectiveCorpId = corporationId ?? currentUser.corporationId;
      const currentRole = currentUser.role as UserRole;

      const autoRole = effectiveCorpId
        ? await computeAutoRole(user.id, currentRole, effectiveCorpId)
        : undefined;

      if (name) {
        const data = {
          name,
          ...(image ? { image } : {}),
          ...(characterId ? { eveCharacterId: characterId } : {}),
          ...(corporationId ? { corporationId } : {}),
          ...(securityStatus !== undefined ? { securityStatus } : {}),
          ...(autoRole ? { role: autoRole } : {}),
        };
        try {
          await prisma.user.update({
            where: { id: user.id },
            data,
          });
        } catch (err) {
          // Unique constraint sur eveCharacterId → doublon PrismaAdapter → fusion
          const isUniqueViolation =
            err instanceof Error && err.message.includes("Unique constraint");
          if (isUniqueViolation && characterId) {
            console.warn(`[auth] doublon détecté pour character ${characterId}, fusion…`);
            try {
              const existing = await prisma.user.findUnique({
                where: { eveCharacterId: characterId },
              });
              if (existing && existing.id !== user.id) {
                await prisma.user.delete({ where: { id: user.id } });
                await prisma.user.update({
                  where: { id: existing.id },
                  data: {
                    name,
                    ...(image ? { image } : {}),
                    ...(corporationId ? { corporationId } : {}),
                    ...(securityStatus !== undefined ? { securityStatus } : {}),
                    ...(autoRole ? { role: autoRole } : {}),
                  },
                });
              }
            } catch (mergeErr) {
              console.error("[auth] fusion doublon échouée", mergeErr);
            }
          } else {
            console.error("[auth] update user failed", user.id, err);
          }
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

  events: {
    /**
     * Applique les données ESI et l'auto-role pour les NOUVEAUX utilisateurs.
     *
     * Cet event se déclenche APRÈS que PrismaAdapter a créé le user + account.
     * C'est le seul endroit fiable pour mettre à jour un nouveau user car le
     * callbacks.signIn se déclenche AVANT la création du record.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "eveonline" || !user.id) return;

      const userId = user.id;

      try {
        // Vérifie si l'utilisateur a déjà ses données EVE (géré par callbacks.signIn)
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { eveCharacterId: true, corporationId: true, role: true },
        });
        if (!dbUser) return;
        if (dbUser.eveCharacterId) return; // Déjà traité par callbacks.signIn

        // ── Nouveau user : appliquer données ESI + auto-role ──────────

        const raw = profile as Record<string, unknown> | undefined;
        const sub = ((raw?.sub as string) ?? "");
        const characterId = sub.split(":")[2];
        if (!characterId) return;

        console.log(`[auth] events.signIn — nouveau user ${user.name ?? characterId}, appel ESI…`);

        const esiInfo = await fetchCharacterInfo(characterId);
        const corporationId = esiInfo?.corporationId;

        const data: Record<string, unknown> = {
          eveCharacterId: characterId,
          ...(corporationId ? { corporationId } : {}),
          ...(esiInfo?.securityStatus !== undefined ? { securityStatus: esiInfo.securityStatus } : {}),
        };

        // Auto-role
        if (corporationId) {
          const currentRole = (dbUser.role ?? "candidate") as UserRole;
          const autoRole = await computeAutoRole(userId, currentRole, corporationId);
          if (autoRole) {
            data.role = autoRole;
          }
        }

        await prisma.user.update({
          where: { id: userId },
          data,
        });

        console.log(
          `[auth] events.signIn — ${user.name ?? characterId} : ` +
          `corp=${corporationId}, role=${data.role ?? dbUser.role ?? "candidate"}`,
        );
      } catch (err) {
        // Unique constraint sur eveCharacterId → un ancien record existe
        const isUniqueViolation =
          err instanceof Error && err.message.includes("Unique constraint");
        if (isUniqueViolation) {
          const raw = profile as Record<string, unknown> | undefined;
          const characterId = ((raw?.sub as string) ?? "").split(":")[2];
          console.warn(`[auth] events.signIn — doublon eveCharacterId ${characterId}, fusion…`);
          try {
            if (characterId) {
              const existing = await prisma.user.findUnique({
                where: { eveCharacterId: characterId },
              });
              if (existing && existing.id !== userId) {
                // Migrer sessions + accounts vers le vrai user
                await prisma.session.updateMany({
                  where: { userId },
                  data: { userId: existing.id },
                });
                await prisma.account.updateMany({
                  where: { userId },
                  data: { userId: existing.id },
                });
                await prisma.user.delete({ where: { id: userId } });
              }
            }
          } catch (mergeErr) {
            console.error("[auth] events.signIn fusion échouée", mergeErr);
          }
        } else {
          console.error("[auth] events.signIn failed", err);
        }
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
