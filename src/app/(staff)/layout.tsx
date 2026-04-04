/**
 * Zone STAFF — Placeholder V3/V5
 *
 * Cette zone sera activée progressivement :
 *   V3 : pipeline recrutement (recruteurs)
 *   V5 : backoffice complet (officiers/admins)
 *
 * Routes prévues :
 *   /staff/candidatures       → Gestion des candidatures (V3)
 *   /staff/candidatures/[id]  → Détail candidature (V3)
 *   /staff/membres            → Gestion des membres (V5)
 *   /staff/permissions        → Gestion des rôles (V5)
 *   /staff/admin              → Configuration globale (V5)
 *
 * Sécurité :
 *   - /staff/candidatures : role >= "recruiter"
 *   - /staff/membres : role >= "officer"
 *   - /staff/admin : role = "admin" uniquement
 *   - Protection par middleware Next.js côté serveur
 *
 * Feature flags : FEATURES.recruitmentPipeline, FEATURES.adminPanel, FEATURES.officerTools
 */

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // V5+ : sidebar staff avec navigation contextuelle selon le rôle
  return (
    <div className="min-h-screen bg-bg-deep">
      <main>{children}</main>
    </div>
  );
}
