/**
 * Validation des variables d'environnement critiques au démarrage.
 * Lance une erreur explicite plutôt qu'un crash cryptique en runtime.
 * Importé dans db.ts pour s'exécuter dès le premier accès à la DB.
 */

const REQUIRED = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "EVE_CLIENT_ID",
  "EVE_CLIENT_SECRET",
] as const;

// Côté serveur uniquement — les env vars ne sont pas disponibles côté client
if (typeof window === "undefined") {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[env] Variables d'environnement manquantes :\n${missing
        .map((k) => `  ✗ ${k}`)
        .join("\n")}\n\nCopie .env.example → .env.local et renseigne ces valeurs.`
    );
  }
}
