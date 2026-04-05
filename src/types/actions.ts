/**
 * Type de retour unifié pour les Server Actions qui ne redirigent pas.
 * Permet un feedback d'erreur cohérent côté client.
 */
export type ActionResult =
  | { success: true }
  | { success: false; error: string };
