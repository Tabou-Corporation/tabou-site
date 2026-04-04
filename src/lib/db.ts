import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma Client.
 *
 * En développement, Next.js recharge les modules à chaque modification (HMR).
 * Sans ce pattern, chaque rechargement créerait une nouvelle connexion à la DB,
 * ce qui épuise rapidement le pool de connexions Neon.
 *
 * En production, l'instance est créée une seule fois au démarrage.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
