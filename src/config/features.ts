/**
 * Feature flags – contrôle les modules activés par version.
 *
 * Convention : toujours false en V0/V1 pour tout ce qui n'est pas encore implémenté.
 * Activer progressivement à chaque version via cette config centrale.
 *
 * En production, ces flags pourront être surchargés par des variables d'environnement (V4+).
 */
export const FEATURES = {
  // ── V0/V1 actifs ────────────────────────────────────────────────────────
  publicSite: true,

  // ── V1.1 : contenu administrable léger ────────────────────────────────
  contentAdmin: true,

  // ── V2 : Authentification + espace membre ─────────────────────────────
  auth: true,
  memberArea: true,
  eveSSO: true,

  // ── V3 : Pipeline de recrutement ──────────────────────────────────────
  recruitmentPipeline: true,
  applicationForm: true,      // formulaire de candidature réel
  recruiterDashboard: true,

  // ── V4 : Hub membre ───────────────────────────────────────────────────
  memberGuides: false,
  memberCalendar: false,
  memberDirectory: false,
  announcements: false,

  // ── V5 : Backoffice officier/admin ────────────────────────────────────
  adminPanel: false,
  officerTools: false,
  permissionsManager: false,

  // ── V6 : Intégrations EVE ─────────────────────────────────────────────
  eveKillboard: false,
  eveFleetTracker: false,
  eveAssets: false,
  discordBot: false,
  eveEsi: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Vérifie si une feature est activée.
 * Point d'entrée unique pour les feature flags dans le code.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
